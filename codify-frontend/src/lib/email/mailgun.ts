interface MailgunConfig {
  apiKey: string;
  domain: string;
  from: string;
}

export function getMailgunConfig(): MailgunConfig {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  
  if (!apiKey || !domain) {
    throw new Error("Mailgun configuration missing. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.");
  }

  return {
    apiKey,
    domain,
    from: `CodiFY <noreply@${domain}>`,
  };
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const config = getMailgunConfig();
  
  const formData = new FormData();
  formData.append('from', config.from);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('html', html);

  const response = await fetch(`https://api.mailgun.net/v3/${config.domain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${config.apiKey}`).toString('base64')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${errorText}`);
  }
}

export function getPasswordResetEmailHtml(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your CodiFY Password</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0;
          background-color: #f9fafb;
        }
        .container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content { 
          padding: 40px 30px; 
        }
        .content p {
          margin: 0 0 20px 0;
          color: #374151;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); 
          color: white !important; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 12px; 
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-1px);
        }
        .footer { 
          background: #f9fafb;
          padding: 30px;
          text-align: center; 
          color: #6b7280; 
          font-size: 14px; 
          line-height: 1.5;
        }
        .footer a {
          color: #7c3aed;
          word-break: break-all;
        }
        .security-note {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          color: #92400e;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>We received a request to reset the password for your CodiFY account. If you made this request, click the button below to reset your password:</p>
          
          <div class="button-container">
            <a href="${resetUrl}" class="button">Reset My Password</a>
          </div>
          
          <div class="security-note">
            <strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email.
          </div>
          
          <p>If you're having trouble with the button above, you can copy and paste the following link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          
          <p>Best regards,<br><strong>The CodiFY Team</strong></p>
        </div>
        <div class="footer">
          <p>This email was sent to you because a password reset was requested for your CodiFY account.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
