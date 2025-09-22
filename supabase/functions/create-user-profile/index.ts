import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

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

  try {
    // Parse the request body to get user data
    const { userId, firstName, lastName, email, phone, organizationId, organizationRole, credits, simulationsUsed } = await req.json()

    console.log('Creating user profile for:', { userId, firstName, lastName, email, organizationId, organizationRole })

    // Create a Supabase client with the service role key
    // This client has elevated privileges to insert into the 'users' table
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Insert the user profile into the 'users' table
    const { error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        organization_id: organizationId,
        organization_role: organizationRole,
        credits: credits,
        simulations_used: simulationsUsed,
      })

    if (error) {
      console.error('Error inserting user profile:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log('User profile created successfully for:', userId)

    // If insertion is successful, return a success response
    return new Response(JSON.stringify({ message: 'User profile created successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Handle any errors during the process
    console.error('Error in create-user-profile function:', error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})