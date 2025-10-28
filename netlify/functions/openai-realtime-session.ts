import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
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

  try {
    const { target, difficulty, voice } = JSON.parse(event.body || "{}");

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured in Netlify environment variables');
      console.error('Please configure it at: Site settings > Environment variables');
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: "Configuration serveur incorrecte",
          details: "La clé API OpenAI n'est pas configurée. Veuillez contacter l'administrateur."
        }),
      };
    }

    if (!target || !difficulty || !voice) {
      console.error('❌ Missing required parameters:', { target, difficulty, voice });
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: "Paramètres manquants",
          details: "Les paramètres target, difficulty et voice sont requis"
        }),
      };
    }

    const validTargets = ['secretary', 'hr', 'manager', 'sales'];
    const validDifficulties = ['easy', 'medium', 'hard'];
    const validVoices = ['nova', 'onyx', 'shimmer', 'echo', 'alloy', 'fable'];

    if (!validTargets.includes(target)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: "Paramètre invalide",
          details: `Le target doit être l'un des suivants: ${validTargets.join(', ')}`
        }),
      };
    }

    if (!validDifficulties.includes(difficulty)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: "Paramètre invalide",
          details: `La difficulté doit être l'une des suivantes: ${validDifficulties.join(', ')}`
        }),
      };
    }

    if (!validVoices.includes(voice)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: "Paramètre invalide",
          details: `La voix doit être l'une des suivantes: ${validVoices.join(', ')}`
        }),
      };
    }

    const targetPrompts = {
      secretary: "Tu es une assistante de direction. Ton rôle est de filtrer les appels et protéger l'agenda de ton patron. Tu es polie mais sélective : seuls les appels vraiment pertinents passent. Adopte à chaque appel une attitude légèrement différente (plus cordiale, plus expéditive, plus sceptique…).",
      hr: "Tu es un directeur des ressources humaines. Tu es souvent occupé et sollicité, mais tu restes poli. Tu écoutes si la proposition peut être utile à tes collaborateurs ou à ton entreprise. Varie ton attitude : parfois tu es ouvert, parfois sceptique, parfois pressé.",
      manager: "Tu es un chef d'entreprise expérimenté. Tu reçois de nombreux appels commerciaux chaque semaine. Tu es direct, pragmatique et tu veux rapidement savoir si l'appel t'apporte de la valeur. Ton comportement change à chaque appel : parfois curieux, parfois pressé, parfois très sceptique.",
      sales: "Tu es un directeur commercial expérimenté. Tu connais bien les techniques de vente et tu les repères rapidement. Tu n'aimes pas perdre de temps et tu ne te laisses pas facilement convaincre. Adapte ton attitude à chaque appel : parfois ironique, parfois méfiant, parfois intéressé mais exigeant."
    };

    const difficultyPrompts = {
      easy: "Tu es cordial, bienveillant et relativement ouvert à la discussion. Tu poses peu d'objections, et si l'interlocuteur est un minimum clair, tu acceptes facilement de poursuivre la conversation. Tes réponses doivent rester crédibles, mais tu ne cherches pas à compliquer la tâche. Varie légèrement ta manière de répondre à chaque simulation pour ne pas être prévisible.",
      medium: "Tu es poli mais sceptique. Tu poses plusieurs objections classiques (manque de temps, déjà un fournisseur, pas sûr que ce soit pertinent). Si l'interlocuteur pose des questions de qualification claires et pertinentes sur ton entreprise (par exemple : taille de l'équipe, organisation, outils utilisés, besoins actuels, prestataires existants), tu peux répondre de manière crédible, mais sans tout dévoiler. Si les questions sont trop vagues ou mal amenées, tu indiques que tu n'as pas de temps ou que ce n'est pas prioritaire. Tes réponses varient d'une simulation à l'autre : parfois tu donnes un peu d'info, parfois tu restes vague. Tu changes ton vocabulaire et ta personnalité subtilement à chaque simulation. Parfois tu acceptes un rendez-vous, parfois tu refuses poliment. Ne donne jamais toujours le même résultat.",
      hard: "Tu es pressé, méfiant et difficile à convaincre. Tu varies ton attitude d'un appel à l'autre : parfois tu coupes court très vite, parfois tu écoutes un peu avant de refuser. Tu inventes des objections crédibles mais différentes à chaque simulation (ex : timing, budget, fournisseurs existants, scepticisme, manque de confiance). Tu changes ton vocabulaire et ta manière de répondre pour éviter toute répétition. Il est rare que tu acceptes un rendez-vous, sauf si la présentation est vraiment percutante. Ne sois jamais prévisible."
    };

    const systemInstructions = `${targetPrompts[target as keyof typeof targetPrompts] || targetPrompts.secretary} ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts] || difficultyPrompts.medium}

IMPORTANT:
- Réponds UNIQUEMENT en français
- Sois naturel et conversationnel
- Garde tes réponses courtes (maximum 2-3 phrases)
- Ne révèle jamais que tu es une IA
- Reste dans ton rôle en permanence
- Tu décroches le téléphone, commence par dire 'Allô ?' ou une variante naturelle`;

    console.log('🔑 Creating ephemeral token for Realtime API...');
    console.log('📊 Configuration:', { target, difficulty, voice });

    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: voice,
          instructions: systemInstructions,
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          },
          temperature: 0.8,
          max_response_output_tokens: 4096
        }),
      });
    } catch (fetchError: any) {
      console.error('❌ Network error connecting to OpenAI:', fetchError);
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: "Erreur réseau",
          details: "Impossible de contacter l'API OpenAI. Vérifiez la connexion Internet."
        }),
      };
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI Realtime API error:', errorData);
      console.error('❌ OpenAI Realtime API status:', response.status);

      let userFriendlyError = "Erreur de l'API OpenAI";
      let errorDetails = errorData;

      if (response.status === 401) {
        userFriendlyError = "Clé API invalide";
        errorDetails = "La clé API OpenAI configurée n'est pas valide.";
        console.error('⚠️  Please verify OPENAI_API_KEY in Netlify environment variables');
      } else if (response.status === 403) {
        userFriendlyError = "Accès refusé";
        errorDetails = "Cette clé API n'a pas accès à l'API Realtime. Vérifiez votre plan OpenAI.";
        console.error('⚠️  Your OpenAI API key may not have access to Realtime API');
      } else if (response.status === 429) {
        userFriendlyError = "Limite de requêtes atteinte";
        errorDetails = "Trop de requêtes. Veuillez réessayer dans quelques instants.";
      } else if (response.status >= 500) {
        userFriendlyError = "Erreur serveur OpenAI";
        errorDetails = "Le serveur OpenAI rencontre des difficultés. Réessayez plus tard.";
      }

      return {
        statusCode: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: userFriendlyError,
          details: errorDetails
        }),
      };
    }

    const sessionData = await response.json();

    console.log('✅ Ephemeral session created successfully');
    console.log('📋 Session ID:', sessionData.id);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSecret: sessionData.client_secret,
        sessionId: sessionData.id,
        expiresAt: sessionData.expires_at
      }),
    };
  } catch (error: any) {
    console.error("❌ Unexpected error in OpenAI Realtime session function:", error);

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: "Erreur serveur interne",
        details: error?.message || "Une erreur inattendue s'est produite"
      }),
    };
  }
};

export { handler };
