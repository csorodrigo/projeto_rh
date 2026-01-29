/**
 * Base Email Template
 * Layout comum para todos os emails
 */

export interface EmailTemplateProps {
  title: string;
  preheader?: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
  companyName?: string;
  companyLogo?: string;
}

export function baseEmailTemplate({
  title,
  preheader,
  content,
  actionUrl,
  actionText,
  companyName = 'RH Sistema',
  companyLogo,
}: EmailTemplateProps): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background-color: #4338CA;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #4F46E5;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .header, .content, .footer {
        padding: 20px !important;
      }
      .header h1 {
        font-size: 20px !important;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}

  <div class="container">
    <div class="header">
      ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" class="logo">` : ''}
      <h1>${title}</h1>
    </div>

    <div class="content">
      ${content}

      ${actionUrl && actionText ? `
        <div style="text-align: center;">
          <a href="${actionUrl}" class="button">${actionText}</a>
        </div>
      ` : ''}
    </div>

    <div class="footer">
      <p>
        <strong>${companyName}</strong><br>
        Sistema de Gestão de Recursos Humanos
      </p>
      <div class="divider"></div>
      <p style="font-size: 12px; color: #9ca3af;">
        Você está recebendo este email porque possui uma conta no ${companyName}.<br>
        Para alterar suas preferências de notificação, <a href="#">clique aqui</a>.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
