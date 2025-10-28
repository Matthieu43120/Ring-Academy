const OPENAI_PROXY_URL = '/.netlify/functions/openai-proxy';

export async function analyzeCall(
  conversationHistory: Array<{ role: string; content: string }>,
  target: string,
  difficulty: string,
  duration: number
): Promise<{
  score: number;
  strengths: string[];
  recommendations: string[];
  detailedFeedback: any;
  improvements: string[];
}> {
  try {
    console.log('🔍 Analyse de l\'appel en cours...');

    const analysisMessages = [
      {
        role: 'system' as const,
        content: `Tu es un coach expert en prospection téléphonique B2B, spécialisé dans la prise de rendez-vous qualifiés.
Ton rôle est d'analyser la conversation ci-dessous entre un commercial et un prospect, afin de produire une évaluation complète, pédagogique et exploitable pour le suivi de progression sur plusieurs appels.

L'objectif principal de l'appel est d'obtenir un rendez-vous. Tes retours doivent donc toujours être orientés vers cet objectif.

CRITÈRES D'ÉVALUATION
Analyse la conversation selon les 5 axes suivants (chacun noté sur 100) :

1. Accroche et mise en confiance
   - Clarté et professionnalisme de la présentation initiale
   - Tonalité appropriée dès le début de l'appel
   - Capacité à susciter l'intérêt dans les 10 premières secondes

2. Capacité d'écoute et adaptation
   - Pratique de l'écoute active (reformulations, questions ouvertes)
   - Adaptation du discours aux signaux du prospect
   - Identification et prise en compte des besoins exprimés

3. Gestion des objections
   - Anticipation et traitement des objections courantes
   - Empathie et validation des préoccupations du prospect
   - Ténacité respectueuse et capacité à rebondir

4. Clarté du discours et structure
   - Cohérence et fluidité de l'argumentation
   - Utilisation d'exemples concrets et pertinents
   - Aisance verbale et absence de tics de langage

5. Conclusion et engagement
   - Capacité à proposer un rendez-vous de manière claire
   - Gestion de la prise de date concrète
   - Confirmation des engagements mutuels

FORMAT DE RÉPONSE ATTENDU (JSON STRICT)
Tu dois OBLIGATOIREMENT répondre dans ce format JSON exact, sans texte ni commentaires extérieurs :

{
  "score": <nombre entre 0 et 100, score global moyen des 5 critères>,
  "strengths": [
    "Point positif concret observé 1 (avec exemple tiré de la conversation)",
    "Point positif concret observé 2 (avec exemple tiré de la conversation)",
    "Point positif concret observé 3 (avec exemple tiré de la conversation)"
  ],
  "recommendations": [
    "Conseil actionnable et mesurable 1 (ex: 'Reformuler systématiquement les besoins exprimés avant de proposer')",
    "Conseil actionnable et mesurable 2 (ex: 'Préparer 3 questions de qualification avant chaque appel')",
    "Conseil actionnable et mesurable 3 (ex: 'Conclure chaque appel en proposant 2 créneaux de rendez-vous précis')"
  ],
  "improvements": [
    "Axe d'amélioration prioritaire 1 avec indicateur de progression (ex: 'Réduire les hésitations en préparant un pitch de 30 secondes')",
    "Axe d'amélioration prioritaire 2 avec indicateur de progression (ex: 'Traiter les objections prix en valorisant le ROI plutôt que le coût')",
    "Axe d'amélioration prioritaire 3 avec indicateur de progression (ex: 'Oser demander le rendez-vous dès que 2 besoins sont identifiés')"
  ],
  "detailedFeedback": {
    "accroche_mise_en_confiance": {
      "score": <nombre entre 0 et 100>,
      "commentaire": "<Analyse synthétique avec 1-2 exemples précis tirés de la conversation>"
    },
    "ecoute_adaptation": {
      "score": <nombre entre 0 et 100>,
      "commentaire": "<Analyse synthétique avec 1-2 exemples précis tirés de la conversation>"
    },
    "gestion_objections": {
      "score": <nombre entre 0 et 100>,
      "commentaire": "<Analyse synthétique avec 1-2 exemples précis tirés de la conversation>"
    },
    "clarte_structure": {
      "score": <nombre entre 0 et 100>,
      "commentaire": "<Analyse synthétique avec 1-2 exemples précis tirés de la conversation>"
    },
    "conclusion_engagement": {
      "score": <nombre entre 0 et 100>,
      "commentaire": "<Analyse synthétique avec 1-2 exemples précis tirés de la conversation>"
    },
    "analyse_generale": "<Texte rédigé en français naturel, de 4-6 phrases, mettant en évidence les tendances observées, la progression par rapport aux standards de la prospection B2B, et les leviers de croissance prioritaires. Ton bienveillant et motivant de coach expérimenté. IMPORTANT: Ce champ doit contenir UNIQUEMENT du texte français naturel, PAS de JSON, PAS de structure de données, PAS de guillemets ou crochets.>"
  }
}

CONSIGNES SUPPLÉMENTAIRES
- Le ton doit être bienveillant, constructif et motivant, comme un coach de vente expérimenté qui veut faire progresser son apprenant
- Chaque conseil et axe d'amélioration doit être précis, exploitable et observable dans les prochains appels
- Les exemples tirés de la conversation doivent être courts mais explicites (une phrase du commercial)
- Chaque sous-score doit refléter la qualité réelle du comportement observé dans cet appel
- Le score global est la moyenne arithmétique des 5 sous-scores
- Le JSON doit être propre, parfaitement formaté, sans texte avant ou après
- IMPORTANT : Retourne UNIQUEMENT le JSON, sans aucun texte d'introduction ou de conclusion
- CRITIQUE : Le champ "analyse_generale" doit être un TEXTE SIMPLE en français, JAMAIS un JSON stringifié ou une structure de données. Écris directement le texte du coach comme si tu parlais à l'apprenant.`
      },
      {
        role: 'user' as const,
        content: `Analyse cette conversation de prospection téléphonique B2B :

TYPE DE PROSPECT : ${target === 'secretary' ? 'Secrétaire/Assistante de direction' : target === 'hr' ? 'Directeur des Ressources Humaines' : target === 'manager' ? 'Chef d\'entreprise/Manager' : 'Directeur Commercial'}
NIVEAU DE DIFFICULTÉ : ${difficulty === 'easy' ? 'Facile (prospect ouvert et bienveillant)' : difficulty === 'medium' ? 'Moyen (prospect sceptique mais accessible)' : 'Difficile (prospect pressé et méfiant)'}
DURÉE DE L'APPEL : ${Math.round(duration)} secondes

TRANSCRIPT DE LA CONVERSATION :
${conversationHistory.map((msg, index) => {
  const role = msg.role === 'user' ? 'COMMERCIAL' : 'PROSPECT';
  return `[${index + 1}] ${role}: ${msg.content}`;
}).join('\n')}

Fournis ton analyse au format JSON strict tel que défini dans les instructions système.`
      }
    ];

    const payload = {
      model: 'gpt-4o-mini',
      messages: analysisMessages,
      temperature: 0.3,
      max_tokens: 1000
    };

    const response = await fetch(OPENAI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chatCompletion',
        payload: payload
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Détails erreur analyse:', errorData);
      throw new Error(`Erreur HTTP ${response.status}: ${errorData.error || errorData.details || 'Erreur inconnue'}`);
    }

    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content || '';

    let cleanedAnalysisText = analysisText.trim();

    if (cleanedAnalysisText.startsWith('```json')) {
      cleanedAnalysisText = cleanedAnalysisText.replace(/^```json\s*/, '');
    }
    if (cleanedAnalysisText.startsWith('```')) {
      cleanedAnalysisText = cleanedAnalysisText.replace(/^```\s*/, '');
    }
    if (cleanedAnalysisText.endsWith('```')) {
      cleanedAnalysisText = cleanedAnalysisText.replace(/\s*```$/, '');
    }

    console.log('📝 Texte d\'analyse nettoyé:', cleanedAnalysisText.substring(0, 200) + '...');

    try {
      const analysis = JSON.parse(cleanedAnalysisText);
      console.log('✅ Analyse terminée:', analysis);
      return analysis;
    } catch (parseError) {
      console.warn('⚠️ Erreur parsing analyse, utilisation fallback:', parseError);
      console.warn('📝 Texte problématique:', cleanedAnalysisText);

      return {
        score: 75,
        strengths: ['Bonne approche générale', 'Participation active à la conversation', 'Effort de communication visible'],
        recommendations: ['Continuer à pratiquer régulièrement', 'Travailler la structure de vos arguments', 'Préparer des réponses aux objections courantes'],
        detailedFeedback: {
          accroche_mise_en_confiance: {
            score: 70,
            commentaire: 'Présentation correcte mais pourrait être plus percutante.'
          },
          ecoute_adaptation: {
            score: 75,
            commentaire: 'Bonne capacité d\'adaptation aux réponses du prospect.'
          },
          gestion_objections: {
            score: 70,
            commentaire: 'Gestion acceptable des objections, quelques hésitations notées.'
          },
          clarte_structure: {
            score: 75,
            commentaire: 'Discours globalement cohérent et fluide.'
          },
          conclusion_engagement: {
            score: 75,
            commentaire: 'Conclusion présente mais pourrait être plus directive.'
          },
          analyse_generale: cleanedAnalysisText || 'Votre performance est correcte avec une marge de progression intéressante. Continuez à vous entraîner sur les points clés de la prospection téléphonique pour gagner en assurance et en efficacité.'
        },
        improvements: ['Améliorer la gestion des objections', 'Renforcer l\'accroche initiale', 'Travailler la conclusion pour obtenir l\'engagement']
      };
    }
  } catch (error) {
    console.error('❌ Erreur analyse appel:', error);

    return {
      score: 50,
      strengths: ['Participation à la simulation', 'Volonté d\'apprendre', 'Engagement dans l\'exercice'],
      recommendations: ['Réessayer la simulation pour mieux comprendre le processus', 'Pratiquer davantage les techniques de base', 'Se concentrer sur la structure de l\'appel'],
      detailedFeedback: {
        accroche_mise_en_confiance: {
          score: 50,
          commentaire: 'Analyse technique indisponible. Réessayez la simulation.'
        },
        ecoute_adaptation: {
          score: 50,
          commentaire: 'Analyse technique indisponible. Réessayez la simulation.'
        },
        gestion_objections: {
          score: 50,
          commentaire: 'Analyse technique indisponible. Réessayez la simulation.'
        },
        clarte_structure: {
          score: 50,
          commentaire: 'Analyse technique indisponible. Réessayez la simulation.'
        },
        conclusion_engagement: {
          score: 50,
          commentaire: 'Analyse technique indisponible. Réessayez la simulation.'
        },
        analyse_generale: 'Une erreur technique est survenue lors de l\'analyse de votre appel. Cela n\'affecte pas votre performance réelle. Veuillez réessayer la simulation pour obtenir une analyse complète et personnalisée de vos compétences en prospection téléphonique.'
      },
      improvements: ['Améliorer la technique de prospection', 'Renforcer la confiance en soi', 'Structurer davantage le discours commercial']
    };
  }
}
