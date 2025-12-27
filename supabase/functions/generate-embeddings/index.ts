
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { initVertexAI, getEmbeddings } from "../_shared/vertex-ai.ts";

console.log("Hello from generate-embeddings!");

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Service role needed to update embeddings
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        const { table, id, text_column } = await req.json();

        if (!table || !id || !text_column) {
            throw new Error("Missing table, id, or text_column");
        }

        // 1. Get the content
        const { data: item, error: fetchErr } = await supabaseClient
            .from(table)
            .select(text_column)
            .eq("id", id)
            .single();

        if (fetchErr) throw fetchErr;
        const text = item[text_column];

        if (!text) {
            throw new Error("Content is empty");
        }

        // 2. Generate Embedding
        const vertex_ai = initVertexAI();
        const embedding = await getEmbeddings(vertex_ai, [text]);

        // 3. Update the Row
        // Assuming table has 'embedding' column
        const { error: updateErr } = await supabaseClient
            .from(table)
            .update({ embedding: JSON.stringify(embedding) }) // pgvector format handles JSON array usually
            .eq("id", id);

        if (updateErr) throw updateErr;

        return new Response(JSON.stringify({ success: true, id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: unknown) {
        console.error("Embedding Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
