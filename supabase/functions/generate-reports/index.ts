
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from generate-reports!");

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        // Get parameters: report_type, start_date, end_date
        const { report_type, start_date, end_date } = await req.json();

        // Get user's tenant
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        // We need to fetch the tenant_id safely. 
        // In a real scenario, use a helper or custom claim. 
        // Here we query the profiles table which is RLS protected.
        const { data: profile } = await supabaseClient
            .from("profiles")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        if (!profile?.tenant_id) throw new Error("Tenant not found");
        const tenantId = profile.tenant_id;

        let result = {};

        if (report_type === "financial_summary") {
            const { data: transactions, error } = await supabaseClient
                .from("financial_transactions")
                .select("*")
                .eq("tenant_id", tenantId)
                .gte("transaction_date", start_date)
                .lte("transaction_date", end_date);

            if (error) throw error;

            const income = transactions
                .filter((t: any) => t.type === 'income')
                .reduce((sum: number, t: any) => sum + t.amount, 0);

            const expense = transactions
                .filter((t: any) => t.type === 'expense')
                .reduce((sum: number, t: any) => sum + t.amount, 0);

            result = {
                period: { start: start_date, end: end_date },
                total_income: income,
                total_expense: expense,
                net_profit: income - expense,
                transaction_count: transactions.length
            };
        } else {
            throw new Error("Invalid report_type");
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
