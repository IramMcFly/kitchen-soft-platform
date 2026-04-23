export type PasswordResetTemplateInput = {
  resetUrl: string;
  supportEmail?: string;
};

export function buildPasswordResetTemplate(input: PasswordResetTemplateInput) {
  const supportEmail = input.supportEmail || 'soporte@kitchensoft.app';

  const html = `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Recuperar contrasena - Kitchen Soft Platform</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:24px 28px;color:#ffffff;">
                <h1 style="margin:0;font-size:22px;line-height:1.2;font-weight:700;">Kitchen Soft Platform</h1>
                <p style="margin:8px 0 0;font-size:14px;opacity:.95;">Recuperacion de contrasena</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.5;">Recibimos una solicitud para restablecer tu contrasena.</p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.5;">Haz clic en el boton para crear una nueva contrasena:</p>

                <p style="margin:0 0 22px;">
                  <a href="${input.resetUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;">Restablecer contrasena</a>
                </p>

                <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5;">Si no solicitaste este cambio, puedes ignorar este correo. Tu cuenta seguira segura.</p>
                <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;word-break:break-all;">Enlace alternativo:</p>
                <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">${input.resetUrl}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#6b7280;">Soporte: ${supportEmail}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  const text = [
    'Kitchen Soft Platform - Recuperacion de contrasena',
    '',
    'Recibimos una solicitud para restablecer tu contrasena.',
    'Usa este enlace para crear una nueva contrasena:',
    input.resetUrl,
    '',
    'Si no solicitaste este cambio, ignora este correo.',
    `Soporte: ${supportEmail}`,
  ].join('\n');

  return {
    subject: 'Recupera tu contrasena - Kitchen Soft Platform',
    html,
    text,
  };
}
