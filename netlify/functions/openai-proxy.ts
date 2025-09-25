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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  console.log('Raw event.body at start:', event.body);
  // Log pour diagnostiquer le contenu de la requête
  console.log('Received event body:', event.body);
  console.log('Event body type:', typeof event.body);
  console.log('Event body length:', event.body ? event.body.length : 'null');

  try {
    // Convertir explicitement event.body en string pour s'assurer que JSON.parse reçoit une chaîne
    const eventBodyString = typeof event.body === 'string' ? event.body : String(event.body);
    const { type, payload, stream = false } = JSON.parse(eventBodyString || "{}");

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "OpenAI API key not configured" }),
      };
    }

    // Si streaming est demandé pour chat completion
    if (stream && type === 'chatCompletion') {
      console.log('🚀 Starting streaming chat completion...');
      
      try {
        // Ajouter le paramètre stream à la payload
        const streamPayload = { ...payload, stream: true };
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(streamPayload),
        });

        if (!response.ok) {
          console.error(`OpenAI Streaming API returned status: ${response.status}`);
          console.error(`OpenAI Streaming API Content-Type: ${response.headers.get('Content-Type')}`);
          let errorData = 'Unknown error from OpenAI API';
          try {
            errorData = await response.text();
          } catch (textError) {
            console.error('Failed to read OpenAI error response as text:', textError);
            errorData = `Failed to read error body (status: ${response.status})`;
          }
          console.error('OpenAI Streaming API error details:', errorData);
          throw new Error(`OpenAI API error (${response.status}): ${errorData}`);
        }

        if (!response.body) {
          throw new Error("No response body from OpenAI");
        }

        console.log('✅ OpenAI streaming response received, forwarding...');

        // Retourner directement le stream sans le traiter
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamResult = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('✅ Streaming completed');
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            streamResult += chunk;
          }
        } finally {
          reader.releaseLock();
        }
        
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          body: streamResult,
        };
      } catch (streamError) {
        console.error('❌ Streaming error:', streamError);
        return {
          statusCode: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: "Erreur de streaming depuis le proxy OpenAI. Veuillez vérifier les logs Netlify pour plus de détails." }),
        };
      }
    }

    // Comportement normal pour les requêtes non-streaming
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`OpenAI API returned status: ${response.status}`);
      console.error(`OpenAI API Content-Type: ${response.headers.get('Content-Type')}`);
      let errorData = 'Unknown error from OpenAI API';
      try {
        errorData = await response.text();
      } catch (textError) {
        console.error('Failed to read OpenAI error response as text:', textError);
        errorData = `Failed to read error body (status: ${response.status})`;
      }
      console.error('OpenAI API error details:', errorData);
      return {
        statusCode: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: `OpenAI API error (${response.status}): ${errorData}`,
          details: errorData
        }),
      };
    }

    const completion = await response.json();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(completion),
    };
  } catch (error) {
    console.error("Error in OpenAI proxy function:", error);
    
    // Log détaillé pour le diagnostic
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message || "Internal Server Error",
        type: error.name || "UnknownError"
      }),
    };
  }
};

export { handler };