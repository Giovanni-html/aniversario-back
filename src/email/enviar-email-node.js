const nodemailer = require('nodemailer');

/**
 * Envia email de notificação usando Nodemailer
 * @param {string|string[]} nomeConvidado - Nome do convidado ou array de nomes
 * @param {string} timestamp - Data e hora da confirmação
 * @returns {Promise<boolean>} True se enviado com sucesso
 */
async function enviarEmail(nomeConvidado, timestamp) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️  Variáveis de email não configuradas. Email não será enviado.');
      return false;
    }
    
    // Converter array de nomes em string
    const nomesArray = Array.isArray(nomeConvidado) ? nomeConvidado : [nomeConvidado];
    const nomePrincipal = nomesArray[0];
    const acompanhantes = nomesArray.slice(1);
    
    // Criar transporter
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: port,
      secure: port === 465, // true para 465, false para 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      connectionTimeout: 30000, // 30 segundos
      greetingTimeout: 30000,
      socketTimeout: 30000,
      logger: true, // Ativar logs
      debug: true // Ativar debug
    });
    
    // Montar o corpo do email
    let corpoEmail = `
🎉 Nova confirmação de presença!

👤 Convidado Principal: ${nomePrincipal}
`;
    
    if (acompanhantes.length > 0) {
      corpoEmail += `\n👥 Acompanhantes:\n`;
      acompanhantes.forEach((acomp, index) => {
        corpoEmail += `   ${index + 1}. ${acomp}\n`;
      });
    }
    
    corpoEmail += `\n📅 Data/Hora: ${timestamp}`;
    corpoEmail += `\n\n✨ Total de pessoas: ${nomesArray.length}`;
    
    // HTML do email
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #B76E79 0%, #8B5A63 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #B76E79; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .emoji { font-size: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="emoji">🎉</h1>
            <h2>Nova Confirmação de Presença!</h2>
        </div>
        <div class="content">
            <div class="info">
                <p><strong>👤 Convidado Principal:</strong></p>
                <h3 style="margin: 10px 0; color: #B76E79;">${nomePrincipal}</h3>
            </div>
            
            ${acompanhantes.length > 0 ? `
            <div class="info">
                <p><strong>👥 Acompanhantes:</strong></p>
                <ul style="margin: 10px 0;">
                    ${acompanhantes.map(acomp => `<li>${acomp}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            <div class="info">
                <p><strong>📅 Data/Hora:</strong> ${timestamp}</p>
                <p><strong>✨ Total de pessoas:</strong> ${nomesArray.length}</p>
            </div>
        </div>
        <div class="footer">
            <p>Sistema de Confirmação de Presença - Aniversário da Beh 🎂</p>
        </div>
    </div>
</body>
</html>
    `;
    
    // Configurar email
    const mailOptions = {
      from: `"Aniversário da Beh 🎂" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `🎉 Nova confirmação: ${nomePrincipal}${acompanhantes.length > 0 ? ` +${acompanhantes.length}` : ''}`,
      text: corpoEmail,
      html: htmlEmail
    };
    
    // Enviar email
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email enviado com sucesso para ${process.env.EMAIL_TO}`);
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    return false;
  }
}

module.exports = { enviarEmail };
