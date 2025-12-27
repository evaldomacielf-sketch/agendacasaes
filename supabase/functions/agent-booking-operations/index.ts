
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from agent-booking-operations!");

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
        const action = payload.action;

        if (action === 'reschedule') {
            return await handleReschedule(supabaseClient, payload);
        } else if (action === 'cancel') {
            return await handleCancel(supabaseClient, payload);
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
 * Handle Reschedule Logic
 */
async function handleReschedule(supabase: any, { appointment_id, new_start_time, reason }: any) {
    if (!appointment_id || !new_start_time) throw new Error("Missing required fields");

    // 1. Fetch Appointment & Tenant Settings
    const { data: appointment } = await supabase.from('appointments').select('*, saloes(settings)').eq('id', appointment_id).single();
    if (!appointment) throw new Error("Appointment not found");

    const settings = appointment.saloes?.settings || {};
    const minHours = settings.reschedule_policy?.min_hours_before_reschedule ?? 24;

    // 2. Validate Policy
    const hoursUntil = (new Date(appointment.start_time).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < minHours) {
        throw new Error(`Reagendamento apenas com ${minHours}h de antecedência.`);
    }

    // 3. Check Availability (Simplified - should ideally call agent-scheduling or DB availability check)
    // For MVP/Speed, checking if slot is taken manually here.
    const newStart = new Date(new_start_time);
    const duration = (new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / 60000;
    const newEnd = new Date(newStart.getTime() + duration * 60000);

    const { data: conflicts } = await supabase.from('appointments')
        .select('id')
        .eq('staff_id', appointment.staff_id)
        .neq('id', appointment.id) // Exclude self
        .or(`start_time.lt.${newEnd.toISOString()},end_time.gt.${newStart.toISOString()}`);
    // Logic: (StartA < EndB) and (EndA > StartB)

    // Fix conflict query logic:
    // We want to find checks where:
    // (ExistingStart < NewEnd) AND (ExistingEnd > NewStart)
    const { data: conflictData, error: conflictError } = await supabase.from('appointments')
        .select('id')
        .eq('staff_id', appointment.staff_id)
        .neq('id', appointment.id)
        .neq('status', 'cancelled')
        .lt('start_time', newEnd.toISOString())
        .gt('end_time', newStart.toISOString());

    if (conflictData && conflictData.length > 0) {
        throw new Error("Horário indisponível.");
    }

    // 4. Update Database
    const { error: updateError } = await supabase.from('appointments').update({
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        status: 'scheduled', // Reset status if it was confirmed? Keep as 'scheduled' usually.
        updated_at: new Date().toISOString()
    }).eq('id', appointment_id);

    if (updateError) throw updateError;

    // 5. Trigger Integrations (Async - do not await strictly if we want speed, but good to await for error report)
    // Sync to Google (Update Event)
    await invokeFunction(supabase, 'agent-integrations', {
        action: 'sync_to_google',
        appointment_id: appointment_id
    });

    // Send Notification
    await invokeFunction(supabase, 'agent-notifications', {
        appointment_id: appointment_id,
        type: 'reschedule',
        channels: ['email', 'sms']
    });

    return new Response(JSON.stringify({ success: true, message: "Reagendado com sucesso" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}

/**
 * Handle Cancellation Logic
 */
async function handleCancel(supabase: any, { appointment_id, reason }: any) {
    if (!appointment_id) throw new Error("Missing appointment_id");

    // 1. Fetch Appointment & Tenant Settings
    const { data: appointment } = await supabase.from('appointments').select('*, saloes(settings)').eq('id', appointment_id).single();
    if (!appointment) throw new Error("Appointment not found");

    const settings = appointment.saloes?.settings || {};
    const minHours = settings.reschedule_policy?.min_hours_before_cancel ?? 2;

    // 2. Validate Policy
    const hoursUntil = (new Date(appointment.start_time).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < minHours) {
        throw new Error(`Cancelamento apenas com ${minHours}h de antecedência.`);
    }

    // 3. Update Database
    const { error: updateError } = await supabase.from('appointments').update({
        status: 'cancelled',
        cancel_reason: reason,
        cancelled_at: new Date().toISOString()
    }).eq('id', appointment_id);

    if (updateError) throw updateError;

    // 4. Trigger Integrations
    // Remove from Google
    await invokeFunction(supabase, 'agent-integrations', {
        action: 'remove_from_google',
        appointment_id: appointment_id
    });

    // Send Notification
    await invokeFunction(supabase, 'agent-notifications', {
        appointment_id: appointment_id,
        type: 'cancellation',
        channels: ['email', 'sms']
    });

    return new Response(JSON.stringify({ success: true, message: "Cancelado com sucesso" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}

/**
 * Helper to invoke other Edge Functions
 */
async function invokeFunction(supabase: any, functionName: string, body: any) {
    const { error } = await supabase.functions.invoke(functionName, { body });
    if (error) console.error(`Failed to invoke ${functionName}:`, error);
}
