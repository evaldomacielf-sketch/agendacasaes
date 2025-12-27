// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI, getGeminiModel } from "../_shared/vertex-ai.ts";

console.log("Hello from agent-scheduler-ai!");

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { clientId, serviceId, dateRangeStart, dateRangeEnd } = await req.json();

        if (!clientId || !serviceId) {
            throw new Error("Missing clientId or serviceId");
        }

        // 1. Fetch Context Data (Parallel)
        const [clientRes, serviceRes, prosRes, historyRes] = await Promise.all([
            supabaseClient.from('clients').select('full_name').eq('id', clientId).single(),
            supabaseClient.from('services').select('*').eq('id', serviceId).single(),
            supabaseClient.from('profiles').select('id, full_name, working_hours, specialties').eq('role', 'staff').eq('status', 'active'),
            supabaseClient.from('appointments')
                .select('start_time, staff_id')
                .eq('client_id', clientId)
                .order('start_time', { ascending: false })
                .limit(5)
        ]);

        const client = clientRes.data;
        const service = serviceRes.data;
        const professionals = prosRes.data || [];
        const history = historyRes.data || [];

        // Filter Pros by Specialty (if applicable, simple string check)
        const qualifiedPros = professionals.filter((p: any) =>
            !p.specialties || p.specialties.length === 0 || p.specialties.some((s: string) => service.name.toLowerCase().includes(s.toLowerCase())) || p.specialties.includes(service.name)
        );
        const targetPros = qualifiedPros.length > 0 ? qualifiedPros : professionals;

        // Fetch Conflicts for Target Pros in Range
        // Default range: Next 7 days if not provided
        const start = dateRangeStart ? new Date(dateRangeStart) : new Date();
        const end = dateRangeEnd ? new Date(dateRangeEnd) : new Date(new Date().setDate(new Date().getDate() + 7));

        const { data: conflicts } = await supabaseClient
            .from('appointments')
            .select('start_time, end_time, staff_id')
            .in('staff_id', targetPros.map((p: any) => p.id))
            .gte('start_time', start.toISOString())
            .lte('end_time', end.toISOString());

        // 2. Prepare Prompt
        const prompt = `
            You are an expert Appointment Scheduler for a Beauty Salon.
            Your goal is to suggest the Top 3 Best Appointment Slots for a client.
            
            CONTEXT:
            - Client: ${client?.full_name}
            - Service: ${service.name} (${service.duration_minutes} minutes)
            - Search Range: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}
            
            CLIENT HISTORY (Preferences clues):
            ${JSON.stringify(history)}
            
            AVAILABLE PROFESSIONALS & HOURS:
            ${JSON.stringify(targetPros.map((p: any) => ({
            id: p.id,
            name: p.full_name,
            hours: p.working_hours
        })))}
            
            EXISTING APPOINTMENTS (Conflicts):
            ${JSON.stringify(conflicts)}
            
            INSTRUCTIONS:
            1. Analyze client history to identify preferred time of day (Morning/Afternoon) or preferred professional.
            2. Find valid slots for the Service Duration within Working Hours, avoiding Conflicts.
            3. Prioritize slots that match client preferences or maximize salon efficiency (e.g., adjacent to existing bookings).
            4. Return strictly valid JSON array of 3 objects.
            
            OUTPUT FORMAT (JSON ONLY):
            {
                "suggestions": [
                    {
                        "start_time": "ISO_STRING",
                        "professional_id": "UUID",
                        "professional_name": "String",
                        "reason": "Short explanation why this is good"
                    }
                ]
            }
        `;

        // 3. Call Vertex AI via Shared Helper
        const vertex_ai = initVertexAI();
        const model = getGeminiModel(vertex_ai, "gemini-pro");

        const result = await model.generateContent(prompt);
        const responseText = result.response.candidates?.[0].content.parts?.[0].text;

        if (!responseText) {
            throw new Error("AI returned empty response");
        }

        // Clean and Parse
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const suggestions = JSON.parse(cleanJson);

        return new Response(JSON.stringify(suggestions), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Agent Scheduler Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
