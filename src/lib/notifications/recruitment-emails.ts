/**
 * Recruitment Email Templates
 * Email notifications for recruitment process
 */

interface ApplicationReceivedEmailParams {
  candidateName: string
  candidateEmail: string
  jobTitle: string
}

interface NewApplicationNotificationParams {
  hiringManagerId: string
  candidateName: string
  jobTitle: string
  applicationId: string
}

export async function sendApplicationReceivedEmail(params: ApplicationReceivedEmailParams) {
  const { candidateName, candidateEmail, jobTitle } = params

  const subject = `Candidatura recebida - ${jobTitle}`

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Candidatura Recebida!</h1>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>${candidateName}</strong>,</p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            Obrigado por se candidatar para a vaga de <strong>${jobTitle}</strong>!
          </p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            Recebemos sua candidatura e ela já está sendo analisada por nossa equipe de recrutamento.
          </p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #667eea;">Próximos Passos</h3>
            <ul style="padding-left: 20px; margin: 10px 0;">
              <li style="margin-bottom: 10px;">Nossa equipe irá analisar seu perfil e currículo</li>
              <li style="margin-bottom: 10px;">Se seu perfil for compatível, entraremos em contato para próximas etapas</li>
              <li style="margin-bottom: 10px;">O processo pode levar alguns dias, então pedimos sua paciência</li>
            </ul>
          </div>

          <p style="font-size: 16px; margin-bottom: 20px;">
            Mantenha seu email e telefone atualizados para não perder nenhuma comunicação nossa.
          </p>

          <p style="font-size: 16px; margin-top: 30px;">
            Atenciosamente,<br>
            <strong>Equipe de Recrutamento</strong>
          </p>
        </div>

        <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; margin-top: 20px;">
          <p style="font-size: 12px; color: #6b7280; margin: 0;">
            Este é um email automático, por favor não responda.
          </p>
        </div>
      </body>
    </html>
  `

  const textBody = `
Olá ${candidateName},

Obrigado por se candidatar para a vaga de ${jobTitle}!

Recebemos sua candidatura e ela já está sendo analisada por nossa equipe de recrutamento.

Próximos Passos:
- Nossa equipe irá analisar seu perfil e currículo
- Se seu perfil for compatível, entraremos em contato para próximas etapas
- O processo pode levar alguns dias, então pedimos sua paciência

Mantenha seu email e telefone atualizados para não perder nenhuma comunicação nossa.

Atenciosamente,
Equipe de Recrutamento
  `

  // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
  console.log("Sending email to candidate:", {
    to: candidateEmail,
    subject,
    htmlBody,
    textBody,
  })

  // For now, just log. In production, replace with actual email service:
  // await emailService.send({ to: candidateEmail, subject, html: htmlBody, text: textBody })
}

export async function sendNewApplicationNotification(params: NewApplicationNotificationParams) {
  const { hiringManagerId, candidateName, jobTitle, applicationId } = params

  // TODO: Get hiring manager email from database
  // const hiringManager = await getHiringManager(hiringManagerId)

  const subject = `Nova candidatura - ${jobTitle}`

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Nova Candidatura!</h1>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Você recebeu uma nova candidatura para a vaga:
          </p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #667eea;">${jobTitle}</h3>
            <p style="margin: 10px 0;"><strong>Candidato:</strong> ${candidateName}</p>
            <p style="margin: 10px 0;"><strong>Origem:</strong> Portal de Carreiras</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/recrutamento/candidaturas/${applicationId}"
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Ver Candidatura
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Acesse o painel de recrutamento para revisar o currículo e tomar as próximas ações.
          </p>
        </div>

        <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; margin-top: 20px;">
          <p style="font-size: 12px; color: #6b7280; margin: 0;">
            Sistema de Recrutamento - Notificação Automática
          </p>
        </div>
      </body>
    </html>
  `

  const textBody = `
Nova Candidatura!

Você recebeu uma nova candidatura para a vaga: ${jobTitle}

Candidato: ${candidateName}
Origem: Portal de Carreiras

Acesse ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/recrutamento/candidaturas/${applicationId} para ver a candidatura.

Sistema de Recrutamento - Notificação Automática
  `

  // TODO: Integrate with actual email service
  console.log("Sending notification to hiring manager:", {
    hiringManagerId,
    subject,
    htmlBody,
    textBody,
  })

  // For now, just log. In production, replace with actual email service:
  // await emailService.send({ to: hiringManager.email, subject, html: htmlBody, text: textBody })
}
