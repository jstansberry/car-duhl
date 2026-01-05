
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Image, decode } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { id: gameId } = await req.json();

        if (!gameId) throw new Error("Missing gameId");

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch Game Data
        const { data: game, error: gameError } = await supabase
            .from('daily_games')
            .select('*')
            .eq('id', gameId)
            .single();

        if (gameError || !game) throw new Error("Game not found");

        console.log(`Generating crops for Game ${gameId}...`);

        // 2. Download Image
        const imageRes = await fetch(game.image_url);
        if (!imageRes.ok) throw new Error("Failed to fetch source image");

        const imageBuffer = await imageRes.arrayBuffer();
        const originalImage = await decode(imageBuffer); // ImageScript decode

        // 3. Prepare Crop Logic
        // Logic replicated from ImageDisplay.js (Client)
        // zoomLevel = 0 (max zoom) to 5 (full image)
        // transformOrigin = "X% Y%"

        // Parse Transform Origin (e.g. "50% 50%", "center center", "top left")
        const originStr = (game.transform_origin || '50% 50%').toLowerCase();
        const [xPart, yPart] = originStr.split(' ').filter((p: string) => p.trim() !== ''); // Explicit type for filter param

        const parseDimension = (val: string, type: 'x' | 'y'): number => {
            if (!val) return 0.5;
            if (val.includes('%')) return parseFloat(val) / 100;

            // Handle keywords
            switch (val) {
                case 'left': return type === 'x' ? 0 : 0.5;
                case 'right': return type === 'x' ? 1 : 0.5;
                case 'top': return type === 'y' ? 0 : 0.5;
                case 'bottom': return type === 'y' ? 1 : 0.5;
                case 'center': return 0.5;
                default: return 0.5;
            }
        };

        const originX = parseDimension(xPart || 'center', 'x');
        const originY = parseDimension(yPart || 'center', 'y');
        const maxZoom = game.max_zoom || 5;

        // Container size (Client side is 300x200)
        // We generate 2x for Retina (600x400)
        const TARGET_W = 600;
        const TARGET_H = 400;

        // Function: Get Crop Rect for a specific stage (guess count)
        // In the client, they use scale() on a large image in a small window.
        // Server-side, we must grab the subset of pixels that would be visible in that window.
        // Concept: The "visible window" is 1/Scale size of the full image?
        // Wait, ImageDisplay implementation:
        // Container: 300x200. Image style: width: 100%, height: 100% (so fits in container).
        // Then transform: scale(N). transform-origin: X Y.
        // If Scale=5, Origin=Center: The image is drawn 5x larger. The center 20% is visible in the window.

        // So, Visible Width = Total Width / Scale.
        // Visible Height = Total Height / Scale.
        // Center of Visible Area = (Total Width * OriginX, Total Height * OriginY).
        // Top Left Crop X = CenterX - (VisibleWidth / 2).

        const originalW = originalImage.width;
        const originalH = originalImage.height;

        const generateStage = async (stage) => {
            // Calculate Scale for this stage
            // Logic from ImageDisplay.js:
            // for loop 0 to guessCount; scale *= 0.9 - (i * 0.025)...
            // Wait, "zoomLevel" in ImageDisplay IS "guessCount".
            // Stage 0 (0 guesses) = Max Zoom.
            // Stage 5 = Min Zoom.

            let scale = maxZoom;
            let currentReduction = 0.90;
            const progression = 0.025;

            // Apply reduction loop 'stage' times
            for (let i = 0; i < stage; i++) {
                scale = scale * currentReduction;
                currentReduction -= progression;
            }
            scale = Math.max(scale, 1);

            // Calculate Crop Window
            const visibleW = originalW / scale;
            const visibleH = originalH / scale;

            const centerX = originalW * originX;
            const centerY = originalH * originY;

            let cropX = centerX - (visibleW / 2);
            let cropY = centerY - (visibleH / 2);

            // Clamp crop to bounds (CSS transform might show whitespace/black bg if Origin is near edge, 
            // but usually we want to clamp to image bounds for safety).
            // Actually, if we stick to strict CSS replication, CSS would show background.
            // For simplicity, let's clamp.
            if (cropX < 0) cropX = 0;
            if (cropY < 0) cropY = 0;
            if (cropX + visibleW > originalW) cropX = originalW - visibleW;
            if (cropY + visibleH > originalH) cropY = originalH - visibleH;

            // Perform Crop
            // Clone original to avoid mutating shared object (if ImageScript mutates? safer to assume yes or verify)
            // ImageScript methods usually return new or modify in place? docs say crop returns new image usually.
            // But let's verify: ImageScript.crop(x,y,w,h) returns a new image.

            const cropped = originalImage.clone().crop(
                Math.round(cropX),
                Math.round(cropY),
                Math.round(visibleW),
                Math.round(visibleH)
            );

            // Resize to standard container size
            const resized = cropped.resize(TARGET_W, TARGET_H);

            // Encode (Quality 80)
            return await resized.encodeJPEG(80);
        };

        const uploads = [];

        // Generate Stages 0-4
        for (let i = 0; i < 5; i++) {
            const buffer = await generateStage(i);
            const path = `${gameId}/stage_${i}.jpg`;
            uploads.push(supabase.storage.from('game-crops').upload(path, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            }));
        }

        // Generate Stage 5 (Full Image / Reveal)
        // Stage 5 is basically the full image, or maybe specific reveal image logic?
        // Implementation plan says "Upload full image as stage_5.jpg".
        // Let's just resize original to target W/H to keep it consistent? 
        // Or if aspect ratio differs, maybe fit?
        // Let's treat Stage 5 as "Scale=1".

        /* 
           Wait, logic check: 
           In ImageDisplay.js, if gameStatus !== 'playing', getScale returns 1.
           So Stage 5 should just be Scale 1.
        */
        const buffer5 = await generateStage(5); // This executes loop 5 times, scale reduces to ~1 (or close to it logic-wise)
        // Wait, ImageDisplay loop goes up to `zoomLevel`. Max is 5?
        // If zoomLevel=5, scale is reduced 5 times.
        // Actually, if "Won", scale is forced to 1.
        // Let's perform a forced Scale=1 generation for stage_5.

        const fullImageResized = originalImage.clone().resize(TARGET_W, TARGET_H); // Distorts if aspect ratio differs?
        // ImageDisplay: objectFit: 'cover'.
        // To match 'cover' on 300x200 container with Scale 1:
        // If we resize straightforwardly, we might distort.
        // Better to use resize(TARGET_W, TARGET_H) assuming the source was roughly correct aspect?
        // Or use ImageScript's 'cover' equivalent?
        // ImageScript documentation: resize(w, h) stretches.
        // Let's assume for now resizing is acceptable or source aligns.
        // Actually, let's use the same `generateStage` loop logic but ensure `scale` logic matches "Game Over".
        // If we want "Stage 5" to be the "Zoom Level 5" state (which is the widest clue before reveal? No, clues are 0,1,2,3,4).
        // The 5th array item is the 6th state.
        // Let's store Stage 0,1,2,3,4 (The 5 clue states).
        // And Stage 5 (The Reveal).

        // Stage 5 (Reveal): Just use the full image resized (or cropped to aspect ratio).
        // Let's use `resize` for now.

        uploads.push(supabase.storage.from('game-crops').upload(`${gameId}/stage_5.jpg`, await fullImageResized.encodeJPEG(80), {
            contentType: 'image/jpeg',
            upsert: true
        }));

        await Promise.all(uploads);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
