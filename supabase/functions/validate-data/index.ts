
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from validate-data!");

// Simple regex for demonstration
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/; // E.164 format

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email, phone } = await req.json();
        const errors: Record<string, string> = {};

        if (email && !EMAIL_REGEX.test(email)) {
            errors.email = "Invalid email format";
        }

        if (phone && !PHONE_REGEX.test(phone)) {
            errors.phone = "Invalid phone format (E.164 required)";
        }

        if (Object.keys(errors).length > 0) {
            return new Response(JSON.stringify({ valid: false, errors }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        return new Response(JSON.stringify({ valid: true }), {
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
