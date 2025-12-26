import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

// Mock Embedding Generator (In production, use OpenAI or Transformers.js)
// This function returns a random vector of 384 dimensions for demonstration.
function generateMockEmbedding(text: string): number[] {
    // Deterministic-ish to be stable for same text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }

    const embedding = new Array(384).fill(0).map((_, i) => {
        return Math.sin(hash + i); // pseudo-random derived from text
    });
    return embedding;
}

serve(async (req) => {
    try {
        const { query } = await req.json();

        if (!query) {
            return new Response(JSON.stringify({ error: 'Query is required' }), { status: 400 });
        }

        // Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );

        // 1. Generate Embedding
        // const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', ...);
        const embedding = generateMockEmbedding(query);

        // 2. Search via RPC
        const { data, error } = await supabaseClient.rpc('match_services', {
            query_embedding: embedding,
            match_threshold: 0.5, // Lower threshold for mock
            match_count: 5
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
