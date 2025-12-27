
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from agent-scheduler!");

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Must use Service Role to access all reminders and update them
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 1. Fetch Due Reminders
        const { data: reminders, error: fetchError } = await supabaseClient
            .from('scheduled_reminders')
            .select('*, appointments(*)')
            .eq('status', 'pending')
            .lte('scheduled_time', new Date().toISOString())
            .limit(50); // Process in batches

        if (fetchError) throw fetchError;

        if (!reminders || reminders.length === 0) {
            return new Response(JSON.stringify({ message: "No pending reminders found." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        console.log(`Processing ${reminders.length} reminders...`);
        const results = [];

        // 2. Process Batch
        for (const reminder of reminders) {
            try {
                // Call agent-notifications for actual sending logic
                // We use invoke if internal, or just fetch logic here. 
                // To keep it modular, let's reuse agent-notifications, OR implement direct logic if agent-notifications only handles 'INSERT' webhook.
                // agent-notifications handles { appointment_id, type }

                // Determine type based on channel/time logic or just pass generic 'reminder'
                // The reminder types map to: T-7 (summary), T-2 (confirm), T-1d (reminder), T-1h (final)
                // We can infer type from columns or just send 'reminder'.

                // Let's call agent-notifications. It handles 'appointment_id' and 'type'.
                const { data: notifData, error: notifError } = await supabaseClient.functions.invoke('agent-notifications', {
                    body: {
                        appointment_id: reminder.appointment_id,
                        type: 'reminder',
                        channels: reminder.channels // agent-notifications should ideally support this
                    }
                });

                if (notifError) throw notifError;

                // Update Status to SENT
                await supabaseClient
                    .from('scheduled_reminders')
                    .update({ status: 'sent', updated_at: new Date().toISOString() })
                    .eq('id', reminder.id);

                results.push({ id: reminder.id, status: 'success' });

            } catch (err: any) {
                console.error(`Failed reminder ${reminder.id}:`, err);

                // Update Status to FAILED
                await supabaseClient
                    .from('scheduled_reminders')
                    .update({ status: 'failed', updated_at: new Date().toISOString() })
                    .eq('id', reminder.id);

                results.push({ id: reminder.id, status: 'failed', error: err.message });
            }
        }

        return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
