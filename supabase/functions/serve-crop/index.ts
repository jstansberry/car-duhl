
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const url = new URL(req.url);
        const gameId = url.searchParams.get('id');
        const stage = parseInt(url.searchParams.get('stage') || '0');

        if (!gameId) throw new Error("Missing gameId");

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        let userId = null;

        if (authHeader) {
            const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
            if (user) userId = user.id;
        }

        // 2. Security Logic (Logged In Users Only)
        // Anonymous users are allowed to access any stage (client-side enforcement only)
        // Logged In users are competing in Grand Prix, so we enforce progress.
        if (userId) {
            // Check Progress
            // "Stage" corresponds to number of wrong guesses?
            // Stage 0: 0 guesses. Stage 1: 1 guess made.
            // If I request Stage 2, I must have made at least 2 guesses.

            const { data: progress } = await supabase
                .from('game_progress')
                .select('guesses')
                .eq('user_id', userId)
                .eq('daily_game_id', gameId)
                .maybeSingle();

            const guessesCount = progress?.guesses?.length || 0;

            // Allow if requesting previously earned stage
            // e.g. If I have 2 guesses, I can see Stage 0, 1, 2.
            // Can I see Stage 3? No.

            if (stage > guessesCount) {
                // Check if game is completed (Won/Lost)?
                // If game is completed, they can see everything (Stage 5 usually).
                const { data: score } = await supabase
                    .from('user_scores')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('daily_game_id', gameId)
                    .maybeSingle();

                if (!score) {
                    return new Response(JSON.stringify({ error: "You haven't earned this hint yet." }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
            }
        }

        // 3. Serve Image from Storage
        const path = `${gameId}/stage_${stage}.jpg`;
        const { data, error } = await supabase.storage.from('game-crops').download(path);

        if (error) {
            console.error("Storage Error:", error);
            // Fallback?
            // If crop doesn't exist (maybe old game?), we might want to fallback to on-the-fly generation or serve original?
            // For now, return 404 to fail fast.
            return new Response(JSON.stringify({ error: 'Crop not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(data, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=60, must-revalidate' // Short cache for active editing
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
