import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing image for anomalies...');

    const systemPrompt = `You are an expert visual anomaly detection AI, similar to industrial anomaly detection systems like Anomalib. Your job is to analyze images and detect anomalies, defects, or irregularities.

For each image, you must provide a detailed JSON analysis with:

1. **anomaly_score**: A number from 0.0 to 1.0 where:
   - 0.0-0.2 = Normal (no anomalies detected)
   - 0.2-0.5 = Minor anomalies or suspicious areas
   - 0.5-0.8 = Significant anomalies detected
   - 0.8-1.0 = Critical anomalies/defects

2. **status**: "normal", "warning", or "anomaly_detected"

3. **classifications**: Array of detected objects/features with confidence scores

4. **anomaly_regions**: Array of detected anomaly regions with:
   - label: Description of the anomaly
   - x, y: Normalized coordinates (0-1) of the anomaly center
   - width, height: Normalized size (0-1) of the affected region
   - severity: "low", "medium", or "high"
   - score: Confidence score 0-1

5. **summary**: Brief description of findings

6. **defect_types**: Array of detected defect categories (e.g., "scratch", "dent", "discoloration", "crack", "missing_part", "contamination")

Analyze the image carefully for any visual anomalies, defects, scratches, dents, discoloration, missing parts, contamination, or any irregularities that would indicate a problem in quality control or industrial inspection contexts.

IMPORTANT: Always respond with valid JSON only, no markdown or explanations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image for anomalies and defects. Provide detailed anomaly detection results in JSON format.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response received:', content?.substring(0, 200));

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No analysis result from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response from AI
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.slice(7);
      }
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.slice(3);
      }
      if (jsonContent.endsWith('```')) {
        jsonContent = jsonContent.slice(0, -3);
      }
      analysisResult = JSON.parse(jsonContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a fallback structure if parsing fails
      analysisResult = {
        anomaly_score: 0.1,
        status: 'normal',
        classifications: [{ label: 'Image analyzed', score: 0.9 }],
        anomaly_regions: [],
        summary: content,
        defect_types: []
      };
    }

    console.log('Analysis complete:', analysisResult.status);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-anomaly function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
