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
    const { type, payload, stream = false } = JSON.parse(event.body || "{}");

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "OpenAI API key not configured" }),
      };
    }

    // Si streaming est demandé pour chat completion
    if (stream && type === 'chatCompletion') {
      console.log('🚀 Starting streaming chat completion...');
      
      try {
        const streamingResponse = await handleStreamingChatCompletion(payload);
        
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          body: streamingResponse,
        };
      } catch (streamError) {
        console.error('❌ Streaming error:', streamError);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Streaming error: ${streamError.message}` }),
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
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: `OpenAI API error: ${response.statusText}` }),
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
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};

// Nouvelle fonction pour gérer le streaming des réponses chat completion
async function handleStreamingChatCompletion(payload: any): Promise<string> {
  try {
    console.log('📡 Making streaming request to OpenAI...');
    
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
      const errorData = await response.text();
      console.error('OpenAI Streaming API error:', errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body from OpenAI");
    }

    console.log('✅ OpenAI streaming response received, processing...');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Streaming completed');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Garder la dernière ligne incomplète dans le buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              result += 'data: [DONE]\n\n';
              break;
            }

            try {
              const parsed = JSON.parse(data);
              // Transmettre directement le chunk au client
              result += `data: ${JSON.stringify(parsed)}\n\n`;
            } catch (e) {
              // Ignorer les chunks malformés
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return result;
  } catch (error) {
    console.error('Error in streaming response:', error);
    return `data: ${JSON.stringify({ error: error.message || "Streaming error" })}\n\n`;
  }
}

export { handler };