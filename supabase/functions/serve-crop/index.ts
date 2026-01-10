
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

        // 1. Auth Check (Header OR Query Param)
        let token = req.headers.get('Authorization')?.replace('Bearer ', '');

        // Fallback: Check for token in query params (for <img> tags in ProofSheet)
        if (!token) {
            token = url.searchParams.get('token');
        }

        // Handle string literal "undefined" or "null" (common from frontend)
        if (token === 'undefined' || token === 'null') {
            token = null;
        }

        let userId = null;
        let isAdmin = false;

        if (token) {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser(token);

                if (authError) {
                    // console.error("Auth Error:", authError.message); 
                    // Swallow error, treat as anonymous
                }

                if (user) {
                    userId = user.id;
                    // Check Admin Status
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('is_admin')
                        .eq('id', userId)
                        .single();
                    isAdmin = profile?.is_admin || false;
                }
            } catch (e) {
                console.error("Auth Exception:", e);
                // Swallow exception, treat as anonymous
            }
        }

        const now = new Date();
        const todayNY = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York'
        }).format(now);

        // Fetch Game Date to check for Future
        const { data: game, error: gameError } = await supabase
            .from('daily_games')
            .select('date')
            .eq('id', gameId)
            .single();

        if (gameError || !game) throw new Error("Game not found");

        const isFutureGame = game.date > todayNY;

        // 2. Security Logic

        // Block Future Games (Unless Admin)
        if (isFutureGame && !isAdmin) {
            return new Response(JSON.stringify({ error: "This game hasn't happened yet!" }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Logged In users (Grand Prix) - Enforce Progress
        if (userId) {
            // Check Progress logic only if it's NOT a future game (or if admin wants to see stages)
            // Actually, for future games, admins might want to test stages too.
            // But usually admin just sees stage 0 in proof sheet.

            // If it's today's game, check progress (skip for admins?)
            // Let's enforce progress for everyone EXCEPT admins for future/current games?
            // Actually, admins playing the game should play fairly.
            // But admins viewing Proof Sheet (future games) need access.

            // Logic:
            // If Admin AND Future Game -> ALLOW (Bypass progress check)
            // If Regular User -> Enforce Progress

            if (!isAdmin || !isFutureGame) {
                const { data: progress } = await supabase
                    .from('game_progress')
                    .select('guesses')
                    .eq('user_id', userId)
                    .eq('daily_game_id', gameId)
                    .maybeSingle();

                const guessesCount = progress?.guesses?.length || 0;

                if (stage > guessesCount) {
                    // Check if game is completed
                    const { data: score } = await supabase
                        .from('user_scores')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('daily_game_id', gameId)
                        .maybeSingle();

                    if (!score && !isAdmin) { // Admins can bypass progress check too if needed? Let's just say Admins bypass ONLY for future games for now to keep it simple.
                        return new Response(JSON.stringify({ error: "You haven't earned this hint yet." }), {
                            status: 403,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                        });
                    }
                }
            }
        } else {
            // Anonymous Users
            // Already checked isFutureGame above. 
            // If not future, allow access (Progress not enforced for anon currently)
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
                'Cache-Control': 'public, max-age=86400, must-revalidate' // Cache for 1 day
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
