import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { format } from "https://esm.sh/date-fns@2.30.0";
import { ptBR } from "https://esm.sh/date-fns@2.30.0/locale";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

console.log("Hello from agent-notifications (Resend Integration)!");

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

        const payload = await req.json();
        console.log("Received payload:", payload);

        let appointment = null;
        let notificationType = 'confirmation';

        // Support both Webhook (INSERT) and Direct Call
        if (payload.type === 'INSERT' && payload.table === 'appointments') {
            appointment = payload.record;
        } else if (payload.appointment_id) {
            const { data } = await supabaseClient.from('appointments').select('*').eq('id', payload.appointment_id).single();
            appointment = data;
            notificationType = payload.type || 'confirmation';
        }

        if (!appointment) {
            return new Response(JSON.stringify({ message: "No appointment data found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Logic to detect Review Request
        // If type is explicitly 'review_request' OR inferred (if needed).
        // Since schedule_appointment_reminders sets channels to ['email'], we rely on `type` or we can infer if `type` is generic.
        // Let's assume the scheduler sends `type: 'review_request'` or we update the scheduler to do so (Step 355). 
        // For now, let's support explicit 'review_request'.
        const isReview = payload.type === 'review_request' || (notificationType === 'review_request');

        // 1. Fetch Related Data
        const { data: client } = await supabaseClient.from('clients').select('id, full_name, email, phone').eq('id', appointment.client_id).single();
        const { data: service } = await supabaseClient.from('services').select('name, price, duration_minutes').eq('id', appointment.service_id).single();
        const { data: pro } = await supabaseClient.from('profiles').select('full_name').eq('id', appointment.staff_id).single();
        const { data: tenant } = await supabaseClient.from('saloes').select('nome, id').eq('id', appointment.tenant_id).single();

        if (!client || !client.email) {
            return new Response(JSON.stringify({ message: "Client has no email" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 2. Generate Template
        const APP_URL = "https://agendacasaes.vercel.app";
        let emailHtml = "";
        let subject = "";

        if (isReview) {
            const reviewLink = `${APP_URL}/reviews/${appointment.id}`;
            emailHtml = renderReviewTemplate({
                clientName: client.full_name.split(' ')[0],
                serviceName: service?.name,
                professionalName: pro?.full_name,
                reviewLink
            });
            subject = `⭐ Como foi sua experiência no ${tenant?.nome || 'Salão'}?`;
        } else if (notificationType === 'reschedule') {
            // Reschedule Notification
            emailHtml = renderConfirmationTemplate({
                clientName: client.full_name,
                appointmentDate: format(new Date(appointment.start_time), 'EEEE, d MMMM yyyy', { locale: ptBR }),
                appointmentTime: format(new Date(appointment.start_time), 'HH:mm'),
                serviceName: service?.name || 'Serviço',
                professionalName: pro?.full_name || 'Profissional',
                price: service?.price || 0,
                address: "Rua das Flores, 123 - Centro, São Paulo, SP",
                phone: "(11) 3000-0000",
                tenantName: tenant?.nome || 'Salão',
                // Use generic links or profile link
                confirmLink: `${APP_URL}/appointments/${appointment.id}/confirm`,
                rescheduleLink: `${APP_URL}/appointments/${appointment.id}/reschedule`,
                cancelLink: `${APP_URL}/appointments/${appointment.id}/cancel`
            });
            // Hack: Just change title in template via logic or new template. 
            // Ideally we have a 'renderRescheduleTemplate', but 'Confirmation' is close enough for MVP if we change Subject.
            subject = `🔄 Agendamento Reagendado - ${service?.name || 'Serviço'}`;

        } else if (notificationType === 'cancellation') {
            // Cancellation Notification
            emailHtml = renderCancellationTemplate({
                clientName: client.full_name,
                serviceName: service?.name || 'Serviço',
                appointmentDate: format(new Date(appointment.start_time), 'EEEE, d MMMM', { locale: ptBR }),
                tenantName: tenant?.nome || 'Salão'
            });
            subject = `❌ Agendamento Cancelado - ${service?.name || 'Serviço'}`;

        } else {
            // Default Confirmation
            const confirmLink = `${APP_URL}/appointments/${appointment.id}/confirm`;
            const rescheduleLink = `${APP_URL}/appointments/${appointment.id}/reschedule`;
            const cancelLink = `${APP_URL}/appointments/${appointment.id}/cancel`;

            emailHtml = renderConfirmationTemplate({
                clientName: client.full_name,
                appointmentDate: format(new Date(appointment.start_time), 'EEEE, d MMMM yyyy', { locale: ptBR }),
                appointmentTime: format(new Date(appointment.start_time), 'HH:mm'),
                serviceName: service?.name || 'Serviço',
                professionalName: pro?.full_name || 'Profissional',
                price: service?.price || 0,
                address: "Rua das Flores, 123 - Centro, São Paulo, SP",
                phone: "(11) 3000-0000",
                tenantName: tenant?.nome || 'Salão',
                confirmLink,
                rescheduleLink,
                cancelLink
            });
            subject = `✅ Agendamento Confirmado - ${service?.name || 'Serviço'}`;
        }

        // Determine Channels to send
        const channels = payload.channels || (notificationType === 'confirmation' ? ['email'] : ['email']);
        // ... rest of sending logic ...

        // ... (Keep existing Send logic, just variable substitution) ...
        console.log(`Processing ${isReview ? 'Review Request' : notificationType} for channels:`, channels);

        // 3. Send via Resend (Email)
        let emailResult = null;
        if (channels.includes('email') && RESEND_API_KEY) {
            // ... fetch ...
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${RESEND_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from: "AgendaCasaES <onboarding@resend.dev>",
                    to: [client.email],
                    subject: subject,
                    html: emailHtml
                })
            });
            emailResult = await res.json();
        }

        // ... (Push stub) ...

        // 4. Log
        // ...

        return new Response(JSON.stringify({ success: true, resend: emailResult }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        // ...
    }
});

function renderConfirmationTemplate(data: any) {
    // ... (keep existing) ...
}

function renderReviewTemplate(data: any) {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #8b5cf6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Sua opinião importa!</h1>
        </div>
        <div style="padding: 24px; color: #333; text-align: center;">
            <p style="font-size: 18px;">Olá <strong>${data.clientName}</strong>,</p>
            <p>Esperamos que você tenha gostado do seu atendimento de <strong>${data.serviceName}</strong> com <strong>${data.professionalName}</strong>.</p>
            
            <p style="margin: 24px 0;">Avalie sua experiência para nos ajudar a melhorar:</p>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 0 auto 24px auto; display: inline-block;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Avaliação do Serviço:</p>
                <div style="font-size: 24px; letter-spacing: 5px; color: #fbbf24;">⭐⭐⭐⭐⭐</div>
            </div>

            <br/>

            <a href="${data.reviewLink}" style="display: inline-block; padding: 14px 28px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Avaliar Agora</a>
            
            <p style="margin-top: 32px; color: #666; font-size: 14px;">Levará menos de 1 minuto.</p>
        </div>
    </div>
    `;
}

function renderCancellationTemplate(data: any) {
    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">❌ AGENDAMENTO CANCELADO</h1>
        </div>
        <div style="padding: 24px; color: #333; text-align: center;">
            <p style="font-size: 16px;">Olá <strong>${data.clientName}</strong>,</p>
            <p style="font-size: 16px;">Seu agendamento para <strong>${data.serviceName}</strong> no dia <strong>${data.appointmentDate}</strong> foi cancelado.</p>
            
            <p style="margin: 24px 0; color: #666;">Se você não solicitou este cancelamento, entre em contato conosco imediatamente.</p>
            
            <div style="margin-bottom: 24px;">
                 <p style="margin: 0; color: #666;">${data.tenantName}</p>
            </div>
        </div>
    </div>
    `;
}
