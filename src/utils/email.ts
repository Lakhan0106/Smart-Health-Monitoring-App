interface EmailProvider {
  name: string;
  sendEmail(to: string, subject: string, message: string, apiKey?: string, fromEmail?: string): Promise<boolean>;
}

// Resend Email Provider
class ResendProvider implements EmailProvider {
  name = 'Resend';

  async sendEmail(to: string, subject: string, message: string, apiKey?: string, fromEmail?: string): Promise<boolean> {
    if (!apiKey) {
      console.error('Resend API key not provided');
      return false;
    }

    try {
      // This would integrate with Resend API
      console.log(`Resend Email: From: ${fromEmail || 'alerts@yourapp.com'}, To: ${to}, Subject: ${subject}`);
      console.log(`Message: ${message}`);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true; // Assume success for demo
    } catch (error) {
      console.error('Resend email error:', error);
      return false;
    }
  }
}

// SendGrid Email Provider
class SendGridProvider implements EmailProvider {
  name = 'SendGrid';

  async sendEmail(to: string, subject: string, message: string, apiKey?: string, fromEmail?: string): Promise<boolean> {
    if (!apiKey) {
      console.error('SendGrid API key not provided');
      return false;
    }

    try {
      // This would integrate with SendGrid API
      console.log(`SendGrid Email: From: ${fromEmail || 'alerts@yourapp.com'}, To: ${to}, Subject: ${subject}`);
      console.log(`Message: ${message}`);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true; // Assume success for demo
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }
}

// Mailgun Email Provider
class MailgunProvider implements EmailProvider {
  name = 'Mailgun';

  async sendEmail(to: string, subject: string, message: string, apiKey?: string, fromEmail?: string): Promise<boolean> {
    if (!apiKey) {
      console.error('Mailgun API key not provided');
      return false;
    }

    try {
      // This would integrate with Mailgun API
      console.log(`Mailgun Email: From: ${fromEmail || 'alerts@yourapp.com'}, To: ${to}, Subject: ${subject}`);
      console.log(`Message: ${message}`);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true; // Assume success for demo
    } catch (error) {
      console.error('Mailgun email error:', error);
      return false;
    }
  }
}

// Email Service Manager
class EmailService {
  private providers: EmailProvider[] = [
    new ResendProvider(),
    new SendGridProvider(),
    new MailgunProvider(),
  ];

  async sendEmail(to: string[], subject: string, message: string, provider: 'resend' | 'sendgrid' | 'mailgun' = 'resend'): Promise<{ success: boolean; results: boolean[] }> {
    const selectedProvider = this.providers.find(p => p.name.toLowerCase() === provider);

    if (!selectedProvider) {
      console.error(`Email provider '${provider}' not found`);
      return { success: false, results: [] };
    }

    // Get API key from environment variables
    const apiKey = import.meta.env[`VITE_${provider.toUpperCase()}_API_KEY`];
    const fromEmail = import.meta.env.VITE_FROM_EMAIL || 'alerts@yourapp.com';

    const results: boolean[] = [];
    let overallSuccess = true;

    for (const emailAddress of to) {
      try {
        const success = await selectedProvider.sendEmail(emailAddress, subject, message, apiKey, fromEmail);
        results.push(success);
        if (!success) overallSuccess = false;
      } catch (error) {
        console.error(`Failed to send email to ${emailAddress}:`, error);
        results.push(false);
        overallSuccess = false;
      }
    }

    return { success: overallSuccess, results };
  }

  // Send to multiple emails with fallback providers
  async sendEmailWithFallback(to: string[], subject: string, message: string): Promise<{ success: boolean; provider?: string }> {
    for (const provider of this.providers) {
      const apiKey = import.meta.env[`VITE_${provider.name.toUpperCase()}_API_KEY`];

      if (!apiKey) {
        console.warn(`${provider.name} API key not configured, skipping`);
        continue;
      }

      const fromEmail = import.meta.env.VITE_FROM_EMAIL || 'alerts@yourapp.com';
      const { success } = await this.sendEmail(to, subject, message, provider.name.toLowerCase() as any);

      if (success) {
        return { success: true, provider: provider.name };
      }
    }

    return { success: false };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Utility function for emergency alerts
export async function sendEmergencyAlert(
  patientName: string,
  emailAddresses: string[],
  location: { lat: number; lng: number; url: string }
): Promise<{ success: boolean; provider?: string }> {
  const subject = `🚨 Emergency Alert - ${patientName}`;
  const message = `⚠️ Emergency Alert: ${patientName} is in distress!
Current Location: ${location.url}
Please check immediately.`;

  return await emailService.sendEmailWithFallback(emailAddresses, subject, message);
}
