// Carregar variáveis de ambiente
require('dotenv').config();

const { enviarEmail } = require('./src/email/enviar-email');

async function testar() {
  console.log('🧪 Testando serviço de email...\n');
  console.log('⚠️  NOTA: Este teste vai tentar enviar um email real!');
  console.log('   Certifique-se de configurar EMAIL_USER e EMAIL_PASSWORD no .env\n');
  
  const nome = 'João Silva (TESTE)';
  const timestamp = new Date().toLocaleString('pt-BR');
  
  console.log(`📧 Tentando enviar email para confirmação de: ${nome}`);
  console.log(`   Timestamp: ${timestamp}\n`);
  
  try {
    const sucesso = await enviarEmail(nome, timestamp);
    
    if (sucesso) {
      console.log('\n✅ Email enviado com sucesso!');
      console.log(`   Verifique a caixa de entrada de ${process.env.EMAIL_TO || 'behgatissima@gmail.com'}`);
    } else {
      console.log('\n⚠️  Email não foi enviado');
      console.log('   Possíveis causas:');
      console.log('   - EMAIL_USER ou EMAIL_PASSWORD não configurados no .env');
      console.log('   - Senha incorreta ou não é uma "Senha de App" do Gmail');
      console.log('   - Conexão com internet indisponível');
      console.log('\n   Mas não se preocupe! O sistema continua funcionando.');
      console.log('   A confirmação será salva mesmo se o email falhar.');
    }
  } catch (error) {
    console.error('\n❌ Erro ao testar email:', error.message);
  }
}

testar();
