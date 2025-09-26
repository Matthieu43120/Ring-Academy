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

  // LOGS DÉTAILLÉS POUR DIAGNOSTIQUER LE PROBLÈME
  console.log('=== DIAGNOSTIC COMPLET EVENT.BODY ===');
  console.log('Raw event.body:', event.body);
  console.log('Event body type:', typeof event.body);
  console.log('Event body length:', event.body ? event.body.length : 'null');
  console.log('Event isBase64Encoded:', event.isBase64Encoded);
  
  if (event.body && typeof event.body === 'string' && event.body.length > 0) {
    console.log('Premier caractère:', event.body.charAt(0));
    console.log('Code ASCII du premier caractère:', event.body.charCodeAt(0));
    console.log('50 premiers caractères:', event.body.substring(0, 50));
    console.log('50 derniers caractères:', event.body.substring(Math.max(0, event.body.length - 50)));
  }

  let parsedBody: { type?: string; payload?: any; stream?: boolean } = {};

  try {
    // Préparer le corps de la requête
    let requestBody = event.body || "{}";
    
    // Gérer l'encodage base64 si nécessaire
    if (event.isBase64Encoded && event.body) {
      console.log('Décodage base64 du corps de la requête...');
      try {
        requestBody = Buffer.from(event.body, 'base64').toString('utf8');
        console.log('Corps décodé - 50 premiers caractères:', requestBody.substring(0, 50));
      } catch (decodeError) {
        console.error('❌ Erreur lors du décodage base64:', decodeError);
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: "Erreur de décodage base64 du corps de la requête",
            details: decodeError.message
          }),
        };
      }
    }

    // PARSING JSON SÉCURISÉ
    console.log('=== TENTATIVE DE PARSING JSON ===');
    console.log('RequestBody à parser:', requestBody);
    console.log('RequestBody type:', typeof requestBody);
    console.log('RequestBody length:', requestBody ? requestBody.length : 'null');
    
    if (requestBody && typeof requestBody === 'string' && requestBody.length > 0) {
      console.log('RequestBody premier caractère:', requestBody.charAt(0));
      console.log('RequestBody code ASCII du premier caractère:', requestBody.charCodeAt(0));
    }

    // Vérifier si c'est déjà un objet
    if (typeof requestBody === 'object') {
      console.log('RequestBody est déjà un objet, utilisation directe');
      parsedBody = requestBody;
    } else {
      // Tenter le parsing JSON
      parsedBody = JSON.parse(requestBody);
      console.log('✅ Parsing JSON réussi');
    }

  } catch (parseError) {
    console.error("❌ ERREUR DE PARSING JSON DÉTECTÉE ===");
    console.error("Erreur:", parseError);
    console.error("Message d'erreur:", parseError.message);
    console.error("Stack trace:", parseError.stack);
    console.error("Corps brut qui a causé l'erreur:", event.body);
    console.error("Type du corps brut:", typeof event.body);
    
    // Essayer de déterminer ce qui ne va pas
    if (event.body && typeof event.body === 'string') {
      console.error("Analyse du contenu problématique:");
      console.error("- Longueur:", event.body.length);
      console.error("- Premier caractère:", event.body.charAt(0));
      console.error("- Dernier caractère:", event.body.charAt(event.body.length - 1));
      console.error("- Contient des caractères de contrôle:", /[\x00-\x1F\x7F]/.test(event.body));
      console.error("- Premiers 100 caractères:", event.body.substring(0, 100));
    }
    
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: "Corps de requête JSON invalide",
        details: parseError.message,
        receivedType: typeof event.body,
        receivedLength: event.body ? event.body.length : 0
      }),
    };
  }

  const { type, payload, stream } = parsedBody;
  
  // Extract stream from payload where it's actually located
  const streamFromPayload = payload?.stream;
  const isStreaming = typeof streamFromPayload === 'string' ? streamFromPayload === 'true' : Boolean(streamFromPayload);
  
  // --- NOUVEAU LOG POUR DÉBOGAGE ---
  console.log(`DEBUG: Parsed body - type: ${type}, raw stream value from payload: ${streamFromPayload}, raw stream type: ${typeof streamFromPayload}`);
  console.log(`DEBUG: isStreaming (boolean): ${isStreaming}`);
  // --- FIN NOUVEAU LOG ---

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY non configurée');
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Clé API OpenAI non configurée" }),
    };
  }

  try {
    // --- NOUVEAU LOG POUR DÉBOGAGE DE LA CONDITION ---
    console.log(`DEBUG: Before if condition - isStreaming: ${isStreaming}, type: ${type}`);
    console.log(`DEBUG: isStreaming === true: ${isStreaming === true}`);
    console.log(`DEBUG: type === 'chatCompletion': ${type === 'chatCompletion'}`);
    console.log(`DEBUG: isStreaming && type === 'chatCompletion': ${isStreaming && type === 'chatCompletion'}`);
    // --- FIN NOUVEAU LOG ---

    // Si le streaming est demandé pour la complétion de chat
    if (isStreaming && type === 'chatCompletion') {
      console.log('DEBUG: Entering streaming block');
      console.log('🚀 Démarrage de la complétion de chat en streaming...');
      
      // No need to add stream: true again, it's already in payload
      const streamPayload = { ...payload };
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(streamPayload),
      });

      if (!response.ok) {
        console.error(`L'API de streaming OpenAI a retourné le statut: ${response.status}`);
        const contentType = response.headers.get('Content-Type');
        console.error(`Content-Type de l'API de streaming OpenAI (erreur): ${contentType}`);
        const errorBody = await response.text(); // Lire le corps de l'erreur
        console.error(`Corps de l'erreur OpenAI: ${errorBody}`);
        throw new Error(`Erreur API OpenAI (${response.status}): ${errorBody || response.statusText}`);
      }

      if (!response.body) {
          console.log('ℹ️ Traitement de la requête comme non-streaming.');
        throw new Error("Pas de corps de réponse d'OpenAI");
      }

      console.log('✅ Réponse de streaming OpenAI reçue, traitement...');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamResult = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('✅ Streaming terminé');
            break;
          }

          // --- NOUVEAU LOG POUR DÉBOGAGE DU CONTENT-TYPE DE LA RÉPONSE ---
          const responseContentType = response.headers.get('Content-Type');
          console.log(`DEBUG: Non-streaming response Content-Type from OpenAI: ${responseContentType}`);
          // --- FIN NOUVEAU LOG ---
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Garder la dernière ligne incomplète dans le buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                streamResult += 'data: [DONE]\n\n';
                break;
              }

              // --- NOUVEAU LOG POUR DÉBOGAGE DU CHUNK DATA ---
              console.log('DEBUG: Data chunk before JSON.parse:', data);
              console.log('DEBUG: Data chunk type:', typeof data);
              console.log('DEBUG: Data chunk length:', data ? data.length : 'null');
              if (data && typeof data === 'string' && data.length > 0) {
                console.log('DEBUG: Data chunk premier caractère:', data.charAt(0));
                console.log('DEBUG: Data chunk code ASCII du premier caractère:', data.charCodeAt(0));
                console.log('DEBUG: Data chunk 50 premiers caractères:', data.substring(0, 50));
              }
              // --- FIN NOUVEAU LOG ---

              try {
                const parsed = JSON.parse(data);
                streamResult += `data: ${JSON.stringify(parsed)}\n\n`;
              } catch (e) {
                console.error('❌ ERREUR PARSING CHUNK OpenAI:', e);
                console.error('❌ Chunk problématique complet:', data);
                console.error('❌ Type du chunk problématique:', typeof data);
                console.error('❌ Longueur du chunk problématique:', data ? data.length : 'null');
                // Lancer une erreur pour arrêter le traitement du flux malformé
                throw new Error(`Chunk de données OpenAI malformé: ${data.substring(0, 100)}...`);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      console.log('streamResult final avant le retour (500 premiers caractères):', streamResult.substring(0, 500) + (streamResult.length > 500 ? '...' : ''));
      
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

    } else {
      console.log('DEBUG: Entering non-streaming block');
      console.log('ℹ️ Traitement de la requête comme non-streaming.');
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
        console.error(`L'API OpenAI a retourné le statut: ${response.status}`);
        const contentType = response.headers.get('Content-Type');
        console.error(`Content-Type de l'API OpenAI (erreur): ${contentType}`);
        const errorBody = await response.text(); // Lire le corps de l'erreur
        console.error(`Corps de l'erreur OpenAI: ${errorBody}`);
        throw new Error(`Erreur API OpenAI (${response.status}): ${errorBody || response.statusText}`);
      }

      const completion = await response.json();

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(completion),
      };
    }
  } catch (error) {
    console.error("Erreur dans la fonction proxy OpenAI:", error);
    
    console.error("Détails de l'erreur:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      rawBody: event.body
    });
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message || "Erreur interne du serveur",
        type: error.name || "Erreur inconnue"
      }),
    };
  }
};

export { handler };