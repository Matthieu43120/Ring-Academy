import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request for create-user-profile');
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  // Pour toutes les autres requêtes (POST), renvoyer une réponse simple
  if (req.method === 'POST') {
    console.log('Handling POST request for create-user-profile (simplified)');
    return new Response(JSON.stringify({ message: 'Simplified user profile creation endpoint reached successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  // Méthodes non autorisées
  return new Response(
    JSON.stringify({ error: "Method Not Allowed" }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    }
  );
})