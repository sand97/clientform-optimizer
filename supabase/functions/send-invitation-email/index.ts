import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the invitation data from the request
    const { invitation } = await req.json()

    // Get the organization details
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select('name')
      .eq('id', invitation.organization_id)
      .single()

    if (orgError) throw orgError

    // Get the inviter's details
    const { data: inviter, error: inviterError } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', invitation.invited_by)
      .single()

    if (inviterError) throw inviterError

    // Send the email using Supabase's email service
    const { error: emailError } = await supabaseClient.auth.admin.sendRawEmail({
      to: invitation.email as string,
      subject: `You've been invited to join ${organization.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join ${organization.name}</h2>
          <p>Hello,</p>
          <p>You've been invited to join ${organization.name} on our platform.</p>
          <p>To accept this invitation, please click the link below:</p>
          <p>
            <a href="${Deno.env.get('APP_URL')}/invitations" 
               style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
              View Invitation
            </a>
          </p>
          <p>This invitation will expire on ${new Date(invitation.expires_at).toLocaleDateString()}.</p>
          <p>If you did not expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    })

    if (emailError) throw emailError

    return new Response(
      JSON.stringify({ message: 'Invitation email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 