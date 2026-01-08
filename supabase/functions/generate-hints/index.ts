import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { make, model, year } = await req.json();

        if (!make || !model) {
            return new Response(JSON.stringify({ error: 'Make and Model are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            console.error('Missing GEMINI_API_KEY');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const prompt = `
        I need details for the car: ${year || ''} ${make} ${model}.
        Return a valid JSON object with exactly these keys:
        - "country_code": The ISO 3166-1 alpha-2 country code of the MANUFACTURER'S origin (e.g. "US", "JP", "DE", "GB", "IT", "SE").
        - "fun_facts": A single string containing 3-4 interesting bullet points about the car's specs (Hp, 0-60, Engine) and quirks/history. Use markdown bullet points.
        
        Example JSON:
        {
          "country_code": "JP",
          "fun_facts": "- Powered by a 2JZ-GTE engine.\\n- 0-60 mph in 4.6 seconds.\\n- Featured prominently in Fast & Furious."
        }
        
        Do not include markdown code fence. Just the raw JSON.
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        // Parse Gemini Response
        // Candidate layout: data.candidates[0].content.parts[0].text
        const textToParse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textToParse) {
            throw new Error('No content returned from Gemini');
        }

        // Clean up markdown code blocks if present (despite prompt)
        const cleanedText = textToParse.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsedResult;
        try {
            parsedResult = JSON.parse(cleanedText);
        } catch (e) {
            console.error('Failed to parse JSON:', cleanedText);
            throw new Error('Failed to parse AI response');
        }

        return new Response(JSON.stringify(parsedResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
