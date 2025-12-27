
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from send-campaign!");

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        const { campaign_id } = await req.json();
        if (!campaign_id) throw new Error("Missing campaign_id");

        // 1. Fetch Campaign
        const { data: campaign, error: cErr } = await supabaseClient
            .from("marketing_campaigns")
            .select("*")
            .eq("id", campaign_id)
            .single();

        if (cErr || !campaign) throw new Error("Campaign not found");
        if (campaign.status === 'sent') throw new Error("Campaign already sent");
        if (!campaign.variations || campaign.variations.length === 0) throw new Error("No content variations found");

        // 2. Fetch Audience (This is where 'segmentClients' logic would ideally be a shared helper)
        // For MVP, we will simpler query or use the criteria if possible.
        // Let's assume we fetch ALL clients for the tenant if segment is 'all' or mock for now.
        const { data: clients } = await supabaseClient.from("clients").select("id, email, full_name").eq("tenant_id", campaign.tenant_id);

        if (!clients || clients.length === 0) throw new Error("No audience found");

        // 3. Send Batch (Loop or Batch API)
        // We will do a loop for MVP simplicity, but Resend has Batch API.
        // We also apply A/B distribution: 50% get A, 50% get B.

        let sentCount = 0;

        for (let i = 0; i < clients.length; i++) {
            const client = clients[i];
            if (!client.email) continue;

            const variationIndex = i % 2; // Simple 50/50 toggle
            const variant = campaign.variations[variationIndex] || campaign.variations[0];

            // Call Resend API
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${RESEND_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from: "AgendaCasaES <onboarding@resend.dev>", // Or verified domain
                    to: [client.email], // In dev, only delivered if verified or to self.
                    subject: variant.subject,
                    html: `<p>Hi ${client.full_name},</p>${variant.body}`,
                    tags: [{ name: "campaign_id", value: campaign_id }, { name: "variation", value: String(variationIndex) }]
                })
            });

            if (res.ok) {
                sentCount++;
                // Log the send
                await supabaseClient.from("campaign_logs").insert({
                    tenant_id: campaign.tenant_id,
                    campaign_id: campaign.id,
                    client_id: client.id,
                    variation_index: variationIndex,
                    status: 'sent'
                });
            }
        }

        // 4. Update Campaign Status
        await supabaseClient.from("marketing_campaigns").update({
            status: 'sent',
            sent_at: new Date(),
            metrics: { sent: sentCount }
        }).eq("id", campaign_id);

        return new Response(JSON.stringify({
            success: true,
            sent: sentCount
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Send Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
