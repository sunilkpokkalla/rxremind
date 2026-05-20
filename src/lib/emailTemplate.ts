/**
 * Professional HTML Email Template Generator for RxRemind
 * Renders a state-of-the-art medical brand layout with dynamic logo support,
 * clean responsive grid, high contrast CTA, and secure verification details.
 */
export function getProfessionalEmailTemplate(
  clinicName: string,
  logoUrl: string | undefined | null,
  message: string,
  confirmUrl: string
): string {
  const primaryColor = '#2563eb'; // Sleek medical blue
  
  // Renders dynamic image logo or a sleek visual clinic monogram fallback
  const logoHtml = logoUrl && logoUrl.trim() !== ''
    ? `<img src="${logoUrl.trim()}" alt="${clinicName}" style="max-height: 60px; max-width: 220px; object-fit: contain; display: block; margin: 0 auto 12px auto;" />`
    : `<div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background-color: #eff6ff; border-radius: 50%; color: ${primaryColor}; font-weight: 800; font-size: 24px; text-align: center; margin: 0 auto 12px auto;">${clinicName.charAt(0).toUpperCase()}</div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription Refill Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
          
          <!-- HEADER / BRANDING -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              ${logoHtml}
              <div style="font-size: 20px; font-weight: 800; color: #1e293b; letter-spacing: -0.025em; margin-top: 8px;">${clinicName}</div>
            </td>
          </tr>

          <!-- MESSAGE BODY -->
          <tr>
            <td style="padding: 32px 32px 28px 32px; font-size: 16px; line-height: 1.625; color: #334155;">
              <div style="margin-bottom: 24px; font-size: 16px; color: #334155;">
                ${message.replace(/\n/g, '<br/>')}
              </div>
            </td>
          </tr>

          <!-- CALL TO ACTION (CTA) -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${confirmUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 15px; letter-spacing: -0.01em; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); text-align: center; border: 1px solid #1d4ed8;">
                      Confirm Prescription Refill
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- ALTERNATIVE TEXT LINK -->
              <div style="font-size: 12px; color: #94a3b8; margin-top: 24px; word-break: break-all; line-height: 1.5;">
                If the button above does not work, copy and paste this link into your browser: <br/>
                <a href="${confirmUrl}" style="color: #2563eb; text-decoration: underline;">${confirmUrl}</a>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
              <div style="font-weight: 600; color: #475569; margin-bottom: 4px;">Health & Prescription Security</div>
              This secure, automated reminder was sent on behalf of ${clinicName}. If you believe you received this in error, please contact your clinic administrator directly.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
