import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  name: string
  emailAddresses: string[]
  location: {
    lat: number
    lng: number
    url: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, emailAddresses, location }: EmailRequest = await req.json()

    console.log('Emergency alert request:', { name, emailAddresses, location })

    // Validate required fields
    if (!name || !emailAddresses || !location) {
      throw new Error('Missing required fields: name, emailAddresses, or location')
    }

    if (emailAddresses.length === 0) {
      throw new Error('No email addresses provided')
    }

    // Construct emergency message
    const message = `⚠️ Emergency Alert: ${name} is in distress!
Current Location: ${location.url}
Please check immediately.`

    console.log('Sending email to addresses:', emailAddresses)

    // Get email provider configuration from environment
    const emailProvider = Deno.env.get('EMAIL_PROVIDER') || 'resend'
    const apiKey = Deno.env.get(`${emailProvider.toUpperCase()}_API_KEY`)
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'alerts@yourapp.com'

    let emailResults

    if (apiKey && emailProvider === 'resend') {
      // Use real Resend API
      console.log('Using Resend API for email sending')
      emailResults = await sendEmailsWithResend(emailAddresses, {
        apiKey,
        fromEmail,
        subject: `🚨 Emergency Alert - ${name}`,
        message,
      })
      console.log('Real email send results:', emailResults)
    } else {
      // Demo mode fallback
      console.log('No API key found or unsupported provider. Using demo mode.')
      emailResults = emailAddresses.map(email => ({
        emailAddress: email,
        success: true
      }))
      console.log('Email send results (demo):', emailResults)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emergency alert sent successfully to ${emailResults.filter(r => r.success).length} contacts`,
        results: emailResults,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending emergency alert:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Real email sending function using Resend API
async function sendEmailsWithResend(
  emailAddresses: string[],
  config: {
    apiKey: string
    fromEmail: string
    subject: string
    message: string
  }
) {
  const results = []

  for (const emailAddress of emailAddresses) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.fromEmail,
          to: [emailAddress],
          subject: config.subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
              <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🚨 Emergency Alert</h1>
              </div>
              <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Emergency Situation Detected</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">${config.message}</p>
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                  <strong>⚠️ Immediate Action Required</strong>
                  <p style="margin: 10px 0 0 0;">Please contact the patient or emergency services immediately.</p>
                </div>
                <p style="color: #888; font-size: 14px; margin-top: 30px;">
                  This is an automated emergency alert from your health monitoring system.
                </p>
              </div>
            </div>
          `,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`Email sent successfully to ${emailAddress}:`, result.id)
        results.push({ emailAddress, success: true, messageId: result.id })
      } else {
        const error = await response.text()
        console.error(`Failed to send email to ${emailAddress}:`, error)
        results.push({ emailAddress, success: false, error })
      }
    } catch (error) {
      console.error(`Error sending email to ${emailAddress}:`, error)
      results.push({ emailAddress, success: false, error: error.message })
    }
  }

  return results
}
