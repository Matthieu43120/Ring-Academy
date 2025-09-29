import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { type, payload } = JSON.parse(event.body || "{}");

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "OpenAI API key not configured" }),
      };
    }

    if (type === 'speech') {
      // Générer l'audio avec l'API OpenAI TTS
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI TTS API error:', errorData);
        console.error('OpenAI TTS API status:', response.status);
        return {
          statusCode: response.status,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: `OpenAI TTS API error (${response.status}): ${errorData || response.statusText}`,
            details: errorData
          }),
        };
      }

      // Lire l'audio complet et le convertir en Base64
      console.log('🎵 Génération audio OpenAI TTS et conversion Base64');
      
      const audioArrayBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');
      
      console.log(`✅ Audio généré et encodé (${audioArrayBuffer.byteLength} bytes)`);
      
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioBase64: audioBase64,
          contentType: 'audio/mpeg'
        }),
      };
    } else if (type === 'transcription') {
      // Pour la transcription, nous devrons gérer les FormData
      // Cette partie est plus complexe et nécessiterait une approche différente
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Transcription via proxy not yet implemented" }),
      };
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid request type" }),
    };
  } catch (error) {
    console.error("Error in OpenAI audio proxy function:", error);
    
    // Log détaillé pour le diagnostic
    console.error("Audio error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: error.message || "Internal Server Error",
        type: error.name || "UnknownError"
      }),
    };
  }
};

export { handler };