
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// CORS headers for all responses
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const gameId = url.searchParams.get('id');

        if (!gameId) {
            return new Response(JSON.stringify({ error: 'Missing game ID' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Initialize Supabase Client with Service Role Key to bypass RLS if needed,
        // or just to ensure we can read the secret URL.
        // Env vars are injected by Supabase Edge Runtime.
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch the daily game to get the secret image_url and reveal_url
        // We only need image_url for the main game, but we might want to proxy reveal image too.
        // For now, let's assume 'type' param or default to main image.
        const type = url.searchParams.get('type') || 'main'; // 'main' or 'reveal'

        const { data, error } = await supabase
            .from('daily_games')
            .select('image_url, game_over_image_url, date')
            .eq('id', gameId)
            .single();

        if (error || !data) {
            return new Response(JSON.stringify({ error: 'Game not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Time-Gating: Prevent access to future games
        // Use New York time to match game logic
        const nowNY = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
        if (data.date > nowNY) {
            return new Response(JSON.stringify({ error: 'You cannot access future games' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // If requesting 'reveal' but no reveal image is set, fallback to the main image
        const targetUrl = (type === 'reveal' && data.game_over_image_url)
            ? data.game_over_image_url
            : data.image_url;

        if (!targetUrl) {
            return new Response(JSON.stringify({ error: 'Image URL not found for this game' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Proxy the image
        const imageResponse = await fetch(targetUrl);

        if (!imageResponse.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch upstream image' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Create a new response with the image body and headers
        // We forward Content-Type to ensure the browser processes it correctly
        const headers = new Headers(corsHeaders);
        headers.set('Content-Type', imageResponse.headers.get('Content-Type') || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        return new Response(imageResponse.body, { headers });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
