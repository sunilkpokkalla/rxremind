/**
 * Professional HTML Email Template Generator for rxRemind
 * Renders a state-of-the-art medical brand layout with dynamic logo support,
 * clean responsive grid, high contrast CTA, and secure verification details.
 * Highly inspired by premium clinical reminder designs.
 */
export function getProfessionalEmailTemplate(
  clinicName: string,
  logoUrl: string | undefined | null,
  message: string,
  confirmUrl: string
): string {
  const primaryColor = '#0f766e'; // Modern medical teal/green
  
  // Center-aligned or left-aligned logo container
  const logoHtml = logoUrl && logoUrl.trim() !== ''
    ? `<img src="${logoUrl.trim()}" alt="${clinicName}" style="max-height: 48px; max-width: 180px; object-fit: contain; display: block;" />`
    : `<div style="font-size: 16px; font-weight: 800; color: #0f766e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">🏥 ${clinicName}</div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription Refill Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
          
          <!-- MAIN CONTENT CONTAINER -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              
              <!-- rxRemind BRAND HEADER -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <div style="display: inline-block; vertical-align: middle; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 6px; border-radius: 10px; color: #ffffff; font-weight: 800; font-size: 14px; width: 18px; height: 18px; line-height: 18px; text-align: center; margin-right: 8px; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.15);">✚</div>
                    <span style="display: inline-block; vertical-align: middle; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; font-weight: 800; color: #0f766e; letter-spacing: -0.03em;">rx<span style="color: #1e293b;">Remind</span></span>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    ${logoHtml}
                  </td>
                </tr>
              </table>

              <!-- CLINICAL FRIENDLY GREETING -->
              <h2 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #0f766e; letter-spacing: -0.025em; line-height: 1.3;">
                Just a friendly reminder.
              </h2>

              <!-- MESSAGE BODY -->
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                ${message.replace(/\n/g, '<br/>')}
              </div>

              <!-- MEDICATION REFLEX DETAILS CARD -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 24px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
                <tr>
                  <td style="padding: 16px; width: 48px; vertical-align: top; text-align: center; background-color: #fafafa; border-right: 1px solid #f1f5f9;">
                    <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; width: 36px; height: 36px; line-height: 36px; text-align: center; margin: 0 auto;">
                      <span style="font-size: 20px; color: #16a34a; line-height: 36px; display: block;">💊</span>
                    </div>
                  </td>
                  <td style="padding: 16px 20px; vertical-align: middle; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="font-size: 14px; font-weight: 700; color: #0f766e; margin-bottom: 2px;">Prescription Refill Outreach</div>
                    <div style="font-size: 12px; font-weight: 600; color: #475569;">Care Provider: ${clinicName}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.45;">If you are running low on this prescription, please confirm below to send an automated refill request instantly to your clinic.</div>
                  </td>
                </tr>
              </table>

              <!-- CALL TO ACTION (CTA) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${confirmUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; padding: 14px 0; color: #ffffff; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 15px; text-align: center; box-shadow: 0 4px 10px rgba(13, 148, 136, 0.18); border: 1px solid #0f766e;">
                      Confirm Refill Recommendation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- SECURE DOCK LINK FALLBACK -->
              <div style="font-size: 11px; color: #64748b; margin-top: 24px; word-break: break-all; line-height: 1.6; padding: 14px; background-color: #f8fafc; border-radius: 10px; border: 1px dashed #e2e8f0; text-align: left;">
                <span style="font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">🛡️ Secure Verification Link</span>
                If the action button above does not load, copy and paste this unique link into your browser: <br/>
                <a href="${confirmUrl}" style="color: #2563eb; text-decoration: underline; font-family: monospace; font-size: 10.5px; font-weight: 600;">${confirmUrl}</a>
              </div>

              <!-- DYNAMIC CLINIC CO-BRANDING AT BOTTOM -->
              ${logoUrl && logoUrl.trim() !== '' 
                ? `<div style="margin-top: 32px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                     <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; tracking-spacing: 0.05em; display: block; margin-bottom: 8px;">Direct Clinic Partner</span>
                     <img src="${logoUrl.trim()}" alt="${clinicName}" style="max-height: 36px; max-width: 140px; object-fit: contain;" />
                   </div>` 
                : ''
              }

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="font-weight: 700; color: #475569; margin-bottom: 4px;">Security & Privacy Safeguard</div>
              This secure message was transmitted on behalf of ${clinicName}. If you did not expect this communication or wish to opt-out, please contact your care administrator directly.
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
