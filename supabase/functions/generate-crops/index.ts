
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
        // We generate 3x pixel density (900x600) with MAX quality per user request.
        const TARGET_W = 900;
        const TARGET_H = 600;

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

        // 3. Pre-Process: Crop to Aspect Ratio (Mimic object-fit: cover)
        // The client container is 3:2 (e.g. 300x200). `object-fit: cover` centers the image.
        // We must perform this "Cover Crop" first so our Zoom/Pan logic acts on the same visual content.

        const TARGET_RATIO = 3 / 2;
        const sourceW = originalImage.width;
        const sourceH = originalImage.height;
        const sourceRatio = sourceW / sourceH;

        let baseCropX = 0;
        let baseCropY = 0;
        let baseCropW = sourceW;
        let baseCropH = sourceH;

        if (sourceRatio > TARGET_RATIO) {
            // Too wide: Crop width (center)
            baseCropW = sourceH * TARGET_RATIO;
            baseCropX = (sourceW - baseCropW) / 2;
        } else if (sourceRatio < TARGET_RATIO) {
            // Too tall: Crop height (center)
            baseCropH = sourceW / TARGET_RATIO;
            baseCropY = (sourceH - baseCropH) / 2;
        }

        // We act on the "Visual Base" image (the theoretical cropped image seen in the container)
        // To save memory, we can calculate offsets relative to the original rather than creating an intermediate image,
        // but `ImageScript` might be faster if we just crop once? 
        // Let's create `baseImage` to simplify logic and ensure coordinate systems match 100%.
        const baseImage = originalImage.clone().crop(
            Math.round(baseCropX),
            Math.round(baseCropY),
            Math.round(baseCropW),
            Math.round(baseCropH)
        );

        const baseW = baseImage.width;
        const baseH = baseImage.height;



        const generateStage = async (stage: number) => {
            // Calculate Scale for this stage
            let scale = maxZoom;
            let currentReduction = 0.90;
            const progression = 0.025;

            // Apply reduction loop 'stage' times
            for (let i = 0; i < stage; i++) {
                scale = scale * currentReduction;
                currentReduction -= progression;
            }
            scale = Math.max(scale, 1);



            // Calculate Crop Window on the BASE IMAGE
            const visibleW = baseW / scale;
            const visibleH = baseH / scale;

            // CORRECT PIVOT MATH:
            // The Crop origin is derived from the mapping: x_source = P + (x_screen - P) / S
            // Where x_screen is 0 (left edge of view).
            // Simplifies to: CropX = P * (1 - 1/scale)

            const centerX = baseW * originX;
            const centerY = baseH * originY;

            let cropX = centerX * (1 - 1 / scale);
            let cropY = centerY * (1 - 1 / scale);

            // Clamp crop to bounds of BASE IMAGE
            if (cropX < 0) cropX = 0;
            if (cropY < 0) cropY = 0;
            if (cropX + visibleW > baseW) cropX = baseW - visibleW;
            if (cropY + visibleH > baseH) cropY = baseH - visibleH;

            console.log(`Stage ${stage}: Scale[${scale.toFixed(2)}] Origin[${originX},${originY}] Base[${baseW}x${baseH}] Crop[${cropX.toFixed(0)},${cropY.toFixed(0)} ${visibleW.toFixed(0)}x${visibleH.toFixed(0)}]`);

            // Perform Crop on BASE IMAGE
            const cropped = baseImage.clone().crop(
                Math.round(cropX),
                Math.round(cropY),
                Math.round(visibleW),
                Math.round(visibleH)
            );

            // OPTIMIZATION: Do not upscale!
            // If the crop is smaller than our target (900x600), sending the native pixels 
            // looks much better than server-side upscaling which adds grain/blur.
            // The browser is substantialy better at rendering small images into the viewport.
            if (visibleW < TARGET_W) {
                console.log(`Stage ${stage}: Rendering Native Resolution (${visibleW.toFixed(0)}x${visibleH.toFixed(0)})`);
                return await cropped.encodeJPEG(100);
            }

            // Downscale if larger (to save bandwidth)
            return await cropped.resize(TARGET_W, TARGET_H).encodeJPEG(100);
        };

        const uploads = [];

        // Generate Stages 0-4
        for (let i = 0; i < 5; i++) {
            const buffer = await generateStage(i);
            const path = `${gameId}/stage_${i}.jpg`;
            const promise = supabase.storage.from('game-crops').upload(path, buffer, {
                contentType: 'image/jpeg',
                upsert: true,
                cacheControl: '0'
            }).then(({ data, error }) => {
                if (error) console.error(`Upload error stage_${i}:`, error);
                else console.log(`Uploaded stage_${i}:`, data);
            });
            uploads.push(promise);
        }

        // Generate Stage 5 (Full Reveal)
        console.log("Generating Stage 5 (Reveal)...");
        // Target 900x600 for sharp reveal
        const buffer5 = await baseImage.clone().resize(TARGET_W, TARGET_H).encodeJPEG(100);

        const promise5 = supabase.storage.from('game-crops').upload(`${gameId}/stage_5.jpg`, buffer5, {
            contentType: 'image/jpeg',
            upsert: true,
            cacheControl: '0'
        }).then(({ data, error }) => {
            if (error) console.error(`Upload error stage_5:`, error);
            else console.log(`Uploaded stage_5:`, data);
        });
        uploads.push(promise5);

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
