// Email sending service using Resend
// Set RESEND_API_KEY in environment variables

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Captain\'s Log <notifications@captainslog.ae>';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Email Templates
export function getAlertEmailHtml(alerts: Array<{
  title: string;
  boatName: string;
  dueText: string;
  type: string;
  link: string;
}>): string {
  const alertRows = alerts.map(alert => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-weight: 500; color: #111827;">${alert.title}</div>
        <div style="font-size: 14px; color: #6b7280;">${alert.boatName}</div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <span style="display: inline-block; padding: 4px 8px; background: ${getTypeColor(alert.type)}; color: white; border-radius: 4px; font-size: 12px;">
          ${alert.dueText}
        </span>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%); border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">⚓ Captain's Log</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Maintenance Alerts</p>
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <p style="margin: 0 0 16px; color: #374151;">You have upcoming maintenance items that need attention:</p>
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 500; color: #6b7280; font-size: 12px; text-transform: uppercase;">Item</th>
            <th style="padding: 12px; text-align: right; font-weight: 500; color: #6b7280; font-size: 12px; text-transform: uppercase;">Due</th>
          </tr>
        </thead>
        <tbody>
          ${alertRows}
        </tbody>
      </table>
      
      <div style="margin-top: 24px; text-align: center;">
        <a href="https://captainslog.ae" style="display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
          View in Captain's Log
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">You're receiving this because you enabled email notifications.</p>
      <p style="margin: 4px 0 0;">
        <a href="https://captainslog.ae/settings" style="color: #0d9488;">Manage preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'document_expiry':
      return '#3b82f6'; // blue
    case 'maintenance_hours':
      return '#f59e0b'; // amber
    case 'maintenance_date':
      return '#f59e0b'; // amber
    default:
      return '#6b7280'; // gray
  }
}

export function getAlertEmailText(alerts: Array<{
  title: string;
  boatName: string;
  dueText: string;
}>): string {
  const lines = alerts.map(a => `• ${a.title} (${a.boatName}) - ${a.dueText}`).join('\n');
  return `Captain's Log - Maintenance Alerts\n\nYou have upcoming maintenance items:\n\n${lines}\n\nView details: https://captainslog.ae\n\nManage notifications: https://captainslog.ae/settings`;
}
