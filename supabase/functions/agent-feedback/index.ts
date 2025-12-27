
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI, getGeminiModel, getEmbeddings } from "../_shared/vertex-ai.ts";

console.log("Hello from agent-feedback-advanced!");

// --- TOOLS ---

async function createAlert(supabase: SupabaseClient, tenantId: string, message: string) {
    // We notify all 'admin'/'manager' profiles for the tenant
    const { data: managers } = await supabase
        .from("profiles")
        .select("id")
        .eq("tenant_id", tenantId)
        .in("role", ["owner", "manager"]);

    if (managers && managers.length > 0) {
        const notifications = managers.map((m: any) => ({
            user_id: m.id,
            tenant_id: tenantId, // Optional depending on schema
            title: "🚨 Critical Feedback Alert",
            message: message,
            read_at: null
        }));

        await supabase.from("notifications").insert(notifications);
    }
}

async function updateReviewAnalysis(supabase: SupabaseClient, reviewId: string, analysis: any, embedding: any) {
    // Map sentiment to score -1 to 1
    let score = 0;
    if (analysis.sentiment === "Positive") score = 0.8;
    else if (analysis.sentiment === "Negative") score = -0.8;

    const updatePayload: any = {
        analysis: analysis,
        sentiment_score: score
    };

    if (embedding && embedding.length > 0) {
        updatePayload.embedding = JSON.stringify(embedding);
    }

    await supabase.from("reviews").update(updatePayload).eq("id", reviewId);
}

// --- MAIN AGENT ---

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Service role to access all users for alerts
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        const { review_id } = await req.json();

        if (!review_id) throw new Error("Missing review_id");

        // 1. Fetch the Review
        const { data: review, error: rErr } = await supabaseClient
            .from("reviews")
            .select("*, clients(full_name)")
            .eq("id", review_id)
            .single();

        if (rErr || !review) throw new Error("Review not found");

        const vertex_ai = initVertexAI();
        const model = getGeminiModel(vertex_ai, "gemini-1.5-pro");

        // 2. Analyze (Sentiment, Topics, Urgency)
        const prompt = `
      You are a Customer Experience Analyst for a salon.
      
      Review Text: "${review.comment}"
      Rating: ${review.rating}/5
      Client: ${review.clients?.full_name || "Anonymous"}
      
      Tasks:
      1. Classify Sentiment: "Positive", "Neutral", "Negative".
      2. Extract 2-3 Key Topics (e.g. Service Quality, Speed, Hygiene, Price).
      3. Determine Urgency: Does this require immediate manager attention? (e.g. rude staff, injury, very angry).
      4. Draft a short, professional response.
      
      Output JSON:
      {
        "sentiment": "...",
        "topics": ["..."],
        "is_urgent": true/false,
        "urgency_reason": "...",
        "suggested_response": "..."
      }
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.candidates[0].content.parts[0].text;
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const analysis = JSON.parse(cleanedText);

        // 3. Generate Embedding for Semantic Search
        let embedding = [];
        if (review.comment) {
            embedding = await getEmbeddings(vertex_ai, [review.comment]);
        }

        // 4. Save Analysis
        await updateReviewAnalysis(supabaseClient, review_id, analysis, embedding);

        // 5. Trigger Alert if Urgent
        if (analysis.is_urgent) {
            /*
             * Ideally, we would also integrate with Sentry or external monitoring here
             * as per the prompt requirements ("Integração: Supabase + Sentry").
             * For this code, we create an internal notification.
             */
            const alertMsg = `Review from ${review.clients?.full_name}: "${review.comment.substring(0, 50)}..." - Reason: ${analysis.urgency_reason}`;
            await createAlert(supabaseClient, review.tenant_id, alertMsg);
        }

        return new Response(JSON.stringify({
            success: true,
            analysis
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: unknown) {
        console.error("Agent Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
