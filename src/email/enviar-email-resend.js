const { Resend } = require('resend');

/**
 * Envia email de notificação usando Resend
 * @param {string|string[]} nomeConvidado - Nome do convidado ou array de nomes
 * @param {string} timestamp - Data e hora da confirmação
 * @returns {Promise<boolean>} True se enviado com sucesso
 */
async function enviarEmail(nomeConvidado, timestamp) {
  try {
    // Verificar se a API key está configurada
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️  RESEND_API_KEY não configurada. Email não será enviado.');
      return false;
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Converter array de nomes em string
    const nomesArray = Array.isArray(nomeConvidado) ? nomeConvidado : [nomeConvidado];
    const nomePrincipal = nomesArray[0];
    const acompanhantes = nomesArray.slice(1);
    
    // HTML do email
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #B76E79 0%, #8B5A63 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #B76E79; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .emoji { font-size: 24px; }
        h1, h2, h3 { margin: 0; }
        ul { margin: 10px 0; padding-left: 20px; }
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
                <p><strong>👥 Acompanhantes (${acompanhantes.length}):</strong></p>
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
    
    // Texto simples (fallback)
    const textoEmail = `
🎉 Nova confirmação de presença!

👤 Convidado Principal: ${nomePrincipal}
${acompanhantes.length > 0 ? `\n👥 Acompanhantes:\n${acompanhantes.map((a, i) => `   ${i + 1}. ${a}`).join('\n')}` : ''}

📅 Data/Hora: ${timestamp}
✨ Total de pessoas: ${nomesArray.length}
    `;
    
    // Enviar email
    const emailTo = process.env.EMAIL_TO || 'behgatissima@gmail.com';
    console.log(`📤 Enviando email para: ${emailTo}`);
    
    const data = await resend.emails.send({
      from: 'Aniversário da Beh 🎂 <onboarding@resend.dev>',
      to: [emailTo],
      subject: `🎉 Nova confirmação: ${nomePrincipal}${acompanhantes.length > 0 ? ` +${acompanhantes.length}` : ''}`,
      html: htmlEmail,
      text: textoEmail
    });
    
    console.log(`📧 Email enviado com sucesso!`);
    console.log(`   ID: ${data.id || 'N/A'}`);
    console.log(`   Para: ${emailTo}`);
    console.log(`   Resposta completa:`, JSON.stringify(data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    return false;
  }
}

module.exports = { enviarEmail };
