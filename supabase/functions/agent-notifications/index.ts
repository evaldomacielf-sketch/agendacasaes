
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI } from "../_shared/vertex-ai.ts";

console.log("Hello from agent-notifications!");

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use Service Role for background triggers
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Parse incoming payload (could be DB Webhook or API call)
        const payload = await req.json();
        console.log("Received payload:", payload);

        // Handle 'INSERT' on 'appointments' from Database Webhook
        // Payload structure usually: { type: 'INSERT', table: 'appointments', record: { ... }, old_record: null }
        let appointment = null;
        let notificationType = 'manual';

        if (payload.type === 'INSERT' && payload.table === 'appointments') {
            appointment = payload.record;
            notificationType = 'confirmation';
        } else if (payload.appointment_id) {
            // Manual test call
            const { data } = await supabaseClient.from('appointments').select('*').eq('id', payload.appointment_id).single();
            appointment = data;
            notificationType = payload.type || 'reminder';
        }

        if (!appointment) {
            return new Response(JSON.stringify({ message: "No appointment data found to process" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 1. Fetch Client & Preferences
        const { data: client, error: clientError } = await supabaseClient
            .from('clients')
            .select('id, full_name, email, phone')
            .eq('id', appointment.client_id)
            .single();

        if (clientError || !client) {
            console.log("Client not found for appointment", appointment.id);
            return new Response(JSON.stringify({ error: "Client not found" }), { status: 400, headers: corsHeaders });
        }

        // Check preferences (Mocking logic since we might not have a profile link for every client yet)
        // In a full system, we'd query 'notification_preferences' joined with client linked profile.
        // For now, default to Email = True if email exists.
        const sendEmail = !!client.email;

        if (!sendEmail) {
            return new Response(JSON.stringify({ message: "No valid channels enabled for client" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 2. Fetch Service & Professional Details for Context
        const { data: service } = await supabaseClient.from('services').select('name, duration_minutes').eq('id', appointment.service_id).single();
        const { data: pro } = await supabaseClient.from('profiles').select('full_name').eq('id', appointment.staff_id).single();
        const { data: tenant } = await supabaseClient.from('saloes').select('nome').eq('id', appointment.tenant_id).single();

        // 3. Generate Content with Vertex AI
        const vertexAI = initVertexAI();
        const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
      You are a friendly receptionist AI for a beauty salon named "${tenant?.nome}".
      Write a short, warm, and professional ${notificationType} message for a client named "${client.full_name}".
      
      Details:
      - Service: ${service?.name}
      - Professional: ${pro?.full_name || 'Our Specialist'}
      - Time: ${new Date(appointment.start_time).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
      
      Requirements:
      - Language: Portuguese (Brazil)
      - Tone: Elegant and welcoming.
      - Output: Return JSON with "subject" and "body" (HTML allowed).
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const content = JSON.parse(text);

        // 4. Send Email via Resend
        let emailResult = null;
        if (RESEND_API_KEY && sendEmail) {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${RESEND_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from: "AgendaCasaES <notifications@resend.dev>", // Replace with verified domain
                    to: [client.email], // In dev, restricted to registered email
                    subject: content.subject,
                    html: content.body
                })
            });
            emailResult = await res.json();
        }

        // 5. Log to Queue (History)
        await supabaseClient.from('notification_queue').insert({
            tenant_id: appointment.tenant_id,
            user_id: null, // Linked to client if user exists
            recipient_email: client.email,
            channel: 'email',
            type: notificationType,
            title: content.subject,
            message: content.body,
            status: emailResult?.id ? 'sent' : 'failed',
            metadata: { appointment_id: appointment.id, resend_id: emailResult?.id }
        });

        return new Response(JSON.stringify({ success: true, channel: 'email', content }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
