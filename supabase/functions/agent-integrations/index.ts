
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from agent-integrations!");

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { action, provider, data } = await req.json(); // e.g., { action: 'sync', provider: 'google_calendar' }

        if (provider === 'google_calendar' && action === 'sync') {
            // 1. Get User Tokens
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) throw new Error("Unauthorized");

            const { data: interaction } = await supabaseClient
                .from('user_integrations')
                .select('*')
                .eq('user_id', user.id)
                .eq('provider', 'google_calendar')
                .single();

            if (!interaction || !interaction.access_token) {
                return new Response(JSON.stringify({ message: "No Google Calendar connected" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            // 2. Fetch Appointments from Supabase (Future)
            const { data: appointments } = await supabaseClient
                .from('appointments')
                .select('*')
                .gte('start_time', new Date().toISOString())
                .eq('staff_id', user.id); // Assuming user is the staff

            // 3. Mock Sync Logic to Google Calendar
            // In production: Use google-auth-library to refresh token and push events.
            const syncedCount = appointments?.length || 0;

            // Log
            await supabaseClient.from('integration_logs').insert({
                tenant_id: (await supabaseClient.from('profiles').select('tenant_id').eq('id', user.id).single()).data?.tenant_id,
                provider: 'google_calendar',
                event: 'sync_success',
                details: `Synced ${syncedCount} appointments to Google Calendar`
            });

            return new Response(JSON.stringify({ success: true, synced: syncedCount }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ message: "Action not supported" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (error: unknown) {
        console.error(error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
