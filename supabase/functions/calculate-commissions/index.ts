
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from calculate-commissions!");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get the request body (expecting appointment_id)
        const { appointment_id } = await req.json();

        if (!appointment_id) {
            throw new Error("Missing appointment_id");
        }

        // Fetch appointment details
        const { data: appointment, error: appError } = await supabaseClient
            .from("appointments")
            .select("*, services(price), profiles(id, full_name)")
            .eq("id", appointment_id)
            .single();

        if (appError || !appointment) {
            throw new Error("Appointment not found");
        }

        if (appointment.status !== 'completed') {
            return new Response(JSON.stringify({ message: "Appointment not completed yet." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Commission logic: 10% of service price
        const commissionRate = 0.10;
        const commissionAmount = appointment.services.price * commissionRate;

        // Record the commission as a financial transaction (Expense for the salon)
        const { error: transError } = await supabaseClient
            .from("financial_transactions")
            .insert({
                tenant_id: appointment.tenant_id,
                type: "expense",
                category: "commission",
                amount: commissionAmount,
                description: `Commission for ${appointment.profiles.full_name} - Appt ${appointment.id}`,
                related_appointment_id: appointment.id,
                transaction_date: new Date().toISOString()
            });

        if (transError) {
            throw transError;
        }

        return new Response(JSON.stringify({
            success: true,
            commission: commissionAmount,
            staff: appointment.profiles.full_name
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
