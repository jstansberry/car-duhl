import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

// Remove 'ai' SDK imports as requested to emulate 'generate-hints' raw fetch logic
// import { streamText } from 'https://esm.sh/ai@4.0.0'; 
// import { google } from 'https://esm.sh/@ai-sdk/google@1.0.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getDailyCar(supabase: any) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

    try {
        const { data, error } = await supabase
            .from('driving_blind')
            .select(`
                year,
                make:makes(name),
                model:models(name)
            `)
            .eq('date', today)
            .single();

        if (data && !error) {
            return {
                make: data.make?.name || 'Unknown',
                model: data.model?.name || 'Unknown',
                year: data.year
            };
        } else {
            throw new Error('No daily car found for today.');
        }
    } catch (err) {
        console.error("Error fetching from driving_blind table:", err);
        throw err;
    }
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { messages, reveal } = await req.json();

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const car = await getDailyCar(supabase);

        // If client requested a reveal (Game Over), return the car details directly
        if (reveal) {
            return new Response(JSON.stringify({
                car: {
                    year: car.year,
                    make: car.make,
                    model: car.model
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const systemPrompt = `
        I am blindfolded in the drivers seat of a mystery car.
        The secret car is a ${car.year} ${car.make} ${car.model}.
        You are a knowledgable car reviewer who will take on the personality characteristics of the mystery car.
        
        Your goal is to help me guess the car by describing its attributes and specs. Sometimes simple facts will suffice.
        
        RULES:
        1. DO NOT reveal the Make, Model, or Year (including decade) directly but confirm if the player gets it correct.
        2. DO NOT mention other specific model names from the same manufacturer that would give it away (e.g. if it's a 911, don't say "It's like a Boxster").
        3. Keep your responses short (under 50 words) to keep the game moving.
        4. Entirely reject multiple guesses within one try or multiple questions within one try such as, "is it a Ford or Chevy?".
        5. If I guess correctly (Year within +/- 2 years, Make, and Model), set the "won" flag to true.
        6. If I guess ONLY the Make correctly, set "solved_make" to the correct Make.
        7. If I guess ONLY the Model correctly, set "solved_model" to the correct Model.
        8. If I guess ONLY the Year correctly (within +/- 2 years), set "solved_year" to the correct Year.
        9. Don't reveal more than asked for - directly answer my question.

        RESPONSE FORMAT:
        You must return a valid JSON object with this structure and escape all quotes:
        {
            "response": "Your chat response string here",
            "won": boolean, // true if the user guessed the correct car (Year, Make, AND Model)
            "solved_make": string | null,  // Set to "${car.make}" if guessed correctly, else null
            "solved_model": string | null, // Set to "${car.model}" if guessed correctly, else null
            "solved_year": string | null   // Set to "${car.year}" if guessed correctly, else null
        }
        `;

        // Transform messages for Gemini API
        // Message format: { role: 'user'|'assistant', content: string }
        // Gemini format: contents: [{ role: 'user'|'model', parts: [{ text: string }] }]
        const contents = [
            {
                role: 'model', // System instruction equivalent (or passed as system_instruction in v1beta)
                parts: [{ text: systemPrompt }]
            },
            ...messages.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                // Handle legacy string content or new JSON content
                parts: [{ text: typeof m.content === 'object' ? m.content.response : m.content }]
            }))
        ];

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            throw new Error("Missing GEMINI_API_KEY");
        }

        // Using non-streaming 'generateContent' to emulate 'generate-hints' stability
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents,
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                    maxOutputTokens: 650,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(textResponse);
        } catch (e) {
            console.error("Failed to parse JSON response:", textResponse);
            // Fallback
            jsonResponse = {
                response: textResponse || "Error parsing response",
                won: false,
                solved_make: null,
                solved_model: null,
                solved_year: null
            };
        }

        return new Response(JSON.stringify(jsonResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
