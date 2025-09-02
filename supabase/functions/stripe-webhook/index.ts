import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // LOGS DE DIAGNOSTIC POUR IDENTIFIER LE PROBLÈME 401
    console.log('🔍 Diagnostic: SUPABASE_URL =', Deno.env.get('SUPABASE_URL'));
    console.log('🔍 Diagnostic: SUPABASE_SERVICE_ROLE_KEY est définie =', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    console.log('🔍 Diagnostic: STRIPE_SECRET_KEY est définie =', !!Deno.env.get('STRIPE_SECRET_KEY'));
    console.log('🔍 Diagnostic: STRIPE_WEBHOOK_SECRET est définie =', !!Deno.env.get('STRIPE_WEBHOOK_SECRET'));
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      console.error('Missing Stripe signature or webhook secret')
      return new Response('Missing Stripe signature or webhook secret', { status: 400 })
    }

    const body = await req.text()
    let event: Stripe.Event

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      console.log(`✅ Webhook signature verified for event: ${event.type}`)
    } catch (err) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Initialiser le client Supabase avec la clé de rôle de service pour les opérations admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    console.log(`📨 Processing webhook event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log('💳 Checkout session completed:', session.id)
        
        const { credits, userId, organizationId } = session.metadata || {}

        if (!credits || !userId) {
          console.error('❌ Missing metadata in checkout session:', session.metadata)
          return new Response('Missing required metadata (credits or userId)', { status: 400 })
        }

        const parsedCredits = parseInt(credits, 10)
        if (isNaN(parsedCredits) || parsedCredits <= 0) {
          console.error('❌ Invalid credits value:', credits)
          return new Response('Invalid credits value', { status: 400 })
        }

        // Gérer le cas où organizationId est la chaîne "null" ou undefined
        const actualOrganizationId = organizationId && organizationId !== 'null' ? organizationId : null

        console.log(`💰 Adding ${parsedCredits} credits to ${actualOrganizationId ? `organization ${actualOrganizationId}` : `user ${userId}`}`)

        if (actualOrganizationId) {
          // Ajouter les crédits à l'organisation via la fonction RPC
          const { error: rpcError } = await supabaseAdmin.rpc('add_organization_credits', {
            org_id: actualOrganizationId,
            amount: parsedCredits
          })

          if (rpcError) {
            console.error('❌ Error adding credits to organization:', rpcError)
            return new Response(`Failed to add credits to organization: ${rpcError.message}`, { status: 500 })
          }
          
          console.log(`✅ Successfully added ${parsedCredits} credits to organization ${actualOrganizationId}`)
        } else {
          // Ajouter les crédits à l'utilisateur individuel
          const { data: userProfile, error: fetchUserError } = await supabaseAdmin
            .from('users')
            .select('credits')
            .eq('id', userId)
            .single()

          if (fetchUserError || !userProfile) {
            console.error('❌ Error fetching user profile:', fetchUserError)
            return new Response(`Failed to fetch user profile: ${fetchUserError?.message}`, { status: 500 })
          }

          const newCreditsTotal = userProfile.credits + parsedCredits

          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ 
              credits: newCreditsTotal,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)

          if (updateError) {
            console.error('❌ Error updating user credits:', updateError)
            return new Response(`Failed to update user credits: ${updateError.message}`, { status: 500 })
          }
          
          console.log(`✅ Successfully added ${parsedCredits} credits to user ${userId} (total: ${newCreditsTotal})`)
        }
        break

      case 'invoice.payment_succeeded':
        // Gérer les paiements d'abonnement récurrents
        const invoice = event.data.object as Stripe.Invoice
        console.log('🔄 Invoice payment succeeded:', invoice.id)
        
        if (invoice.subscription) {
          // Récupérer les détails de l'abonnement pour obtenir les métadonnées
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          const subscriptionMetadata = subscription.metadata || {}
          
          const { credits: subCredits, userId: subUserId, organizationId: subOrgId } = subscriptionMetadata

          if (!subCredits || !subUserId) {
            console.error('❌ Missing metadata in subscription:', subscriptionMetadata)
            return new Response('Missing required subscription metadata', { status: 400 })
          }

          const parsedSubCredits = parseInt(subCredits, 10)
          const actualSubOrgId = subOrgId && subOrgId !== 'null' ? subOrgId : null

          console.log(`🔄 Adding ${parsedSubCredits} subscription credits to ${actualSubOrgId ? `organization ${actualSubOrgId}` : `user ${subUserId}`}`)

          if (actualSubOrgId) {
            // Ajouter les crédits à l'organisation
            const { error: rpcError } = await supabaseAdmin.rpc('add_organization_credits', {
              org_id: actualSubOrgId,
              amount: parsedSubCredits
            })

            if (rpcError) {
              console.error('❌ Error adding subscription credits to organization:', rpcError)
              return new Response(`Failed to add subscription credits to organization: ${rpcError.message}`, { status: 500 })
            }
            
            console.log(`✅ Successfully added ${parsedSubCredits} subscription credits to organization ${actualSubOrgId}`)
          } else {
            // Ajouter les crédits à l'utilisateur individuel
            const { data: userProfile, error: fetchUserError } = await supabaseAdmin
              .from('users')
              .select('credits')
              .eq('id', subUserId)
              .single()

            if (fetchUserError || !userProfile) {
              console.error('❌ Error fetching user profile for subscription:', fetchUserError)
              return new Response(`Failed to fetch user profile for subscription: ${fetchUserError?.message}`, { status: 500 })
            }

            const newCreditsTotal = userProfile.credits + parsedSubCredits

            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({ 
                credits: newCreditsTotal,
                updated_at: new Date().toISOString()
              })
              .eq('id', subUserId)

            if (updateError) {
              console.error('❌ Error updating user subscription credits:', updateError)
              return new Response(`Failed to update user subscription credits: ${updateError.message}`, { status: 500 })
            }
            
            console.log(`✅ Successfully added ${parsedSubCredits} subscription credits to user ${subUserId} (total: ${newCreditsTotal})`)
          }
        }
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return new Response('ok', { headers: corsHeaders, status: 200 })
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})