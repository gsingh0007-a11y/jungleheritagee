import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { content, metadata, source_url } = await req.json();
        const apiKey = (Deno.env.get("GEMINI_API_KEY") ?? "").trim();
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (!content) {
            return new Response(JSON.stringify({ error: "Content is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // STEP 1: Generate Embedding using Gemini
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;

        const embedResp = await fetch(embedUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "models/gemini-embedding-001",
                content: {
                    parts: [{ text: content }]
                }
            })
        });

        if (!embedResp.ok) {
            const err = await embedResp.text();
            throw new Error(`Embedding failed: ${err}`);
        }

        const embedData = await embedResp.json();
        const embedding = embedData.embedding.values;

        // STEP 2: Store in Supabase
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from("knowledge_base").insert({
            content,
            metadata,
            source_url,
            embedding,
            updated_at: new Date().toISOString()
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Embedding Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 200, // Return 200 to read error in client easily
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
