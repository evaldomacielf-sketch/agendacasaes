
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from agent-integrations (Google Calendar)!");

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

        const url = new URL(req.url); // Use URL to route path if needed, e.g. /webhook vs /sync
        // Supabase Functions are usually single route. We can inspect body 'action' or 'type'.

        const payload = await req.json();
        const action = payload.action || 'sync_to_google';

        if (action === 'sync_to_google') {
            return await syncToGoogleCalendar(supabaseClient, payload.appointment_id);
        } else if (action === 'remove_from_google') {
            return await removeFromGoogleCalendar(supabaseClient, payload.appointment_id);
        } else if (action === 'webhook_google') {
            return await handleGoogleWebhook(supabaseClient, payload);
        }

        return new Response(JSON.stringify({ message: "Unknown action" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});

/**
 * Pushes an Appointment to the Professional's Google Calendar.
 */
async function syncToGoogleCalendar(supabase: any, appointmentId: string) {
    if (!appointmentId) throw new Error("Missing appointmentId");

    // 1. Fetch Data
    const { data: appointment } = await supabase.from('appointments').select('*').eq('id', appointmentId).single();
    if (!appointment) throw new Error("Appointment not found");

    const { data: pro } = await supabase.from('profiles').select('email, google_calendar_id, google_access_token, google_refresh_token').eq('id', appointment.staff_id).single();
    const { data: service } = await supabase.from('services').select('name').eq('id', appointment.service_id).single();
    const { data: client } = await supabase.from('clients').select('full_name, email, phone').eq('id', appointment.client_id).single();

    if (!pro || !pro.google_access_token) {
        return new Response(JSON.stringify({ message: "Professional not connected to Google Calendar", status: 'skipped' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Refresh Token if needed (Simplified check, usually done if 401)
    let accessToken = pro.google_access_token;
    // TODO: Implement refresh logic using google_refresh_token if needed

    // 3. Construct Google Event
    const event = {
        summary: `${service.name} - ${client.full_name}`,
        description: `Cliente: ${client.full_name}\nTelefone: ${client.phone}\nNotas: ${appointment.notes || ''}`,
        start: {
            dateTime: new Date(appointment.start_time).toISOString(),
            timeZone: 'America/Sao_Paulo',
        },
        end: {
            dateTime: new Date(appointment.end_time).toISOString(),
            timeZone: 'America/Sao_Paulo',
        },
        attendees: [
            { email: pro.email, responseStatus: 'accepted' },
            ...(client.email ? [{ email: client.email, responseStatus: 'needsAction' }] : [])
        ],
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 1440 }, // 24h
                { method: 'popup', minutes: 60 }, // 1h
            ],
        },
    };

    // 4. Call Google API
    const calendarId = pro.google_calendar_id || 'primary';
    const googleApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

    const res = await fetch(googleApiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
    });

    if (!res.ok) {
        const errJson = await res.json();
        console.error("Google Calendar API Error:", errJson);
        throw new Error(`Google API Error: ${JSON.stringify(errJson)}`);
    }

    const googleEvent = await res.json();

    // 5. Update Appointment with External ID
    await supabase.from('appointments').update({ google_calendar_event_id: googleEvent.id }).eq('id', appointmentId);

    return new Response(JSON.stringify({ success: true, googleEventId: googleEvent.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}

/**
 * Removes an Appointment from the Professional's Google Calendar.
 */
async function removeFromGoogleCalendar(supabase: any, appointmentId: string) {
    if (!appointmentId) throw new Error("Missing appointmentId");

    // 1. Fetch Data
    const { data: appointment } = await supabase.from('appointments').select('*').eq('id', appointmentId).single();
    if (!appointment) throw new Error("Appointment not found");

    if (!appointment.google_calendar_event_id) {
        return new Response(JSON.stringify({ message: "No Google Event ID to remove", status: 'skipped' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: pro } = await supabase.from('profiles').select('google_calendar_id, google_access_token').eq('id', appointment.staff_id).single();

    if (!pro || !pro.google_access_token) {
        return new Response(JSON.stringify({ message: "Professional not connected", status: 'skipped' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Call Google API (DELETE)
    // Refresh token logic would go here

    const calendarId = pro.google_calendar_id || 'primary';
    const googleApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${appointment.google_calendar_event_id}`;

    const res = await fetch(googleApiUrl, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${pro.google_access_token}`,
        }
    });

    if (!res.ok && res.status !== 404 && res.status !== 410) { // 404/410 means already gone, which is fine
        const errJson = await res.json();
        console.error("Google Calendar Delete Error:", errJson);
        throw new Error(`Google API Error: ${JSON.stringify(errJson)}`);
    }

    // 3. Clear External ID in DB
    await supabase.from('appointments').update({ google_calendar_event_id: null }).eq('id', appointmentId);

    return new Response(JSON.stringify({ success: true, message: "Removed from Google Calendar" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}

/**
 * Handles incoming webhooks from Google (Stub)
 */
async function handleGoogleWebhook(supabase: any, payload: any) {
    console.log("Received Google Webhook:", payload);
    // Logic to sync BACK from Google to DB would go here
    // checking resourceState === 'exists', fetching event, updating DB
    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
