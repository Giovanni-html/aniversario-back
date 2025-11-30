const { enviarEmail } = require('./src/email/enviar-email');

async function testarEmail() {
  try {
    console.log('🧪 Testando envio de email com acompanhantes...\n');
    
    // Teste 1: Email com apenas nome principal
    console.log('📋 Teste 1: Email com apenas nome principal');
    const timestamp1 = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });
    
    const sucesso1 = await enviarEmail('Teste Principal Solo', timestamp1);
    if (sucesso1) {
      console.log('✅ Email enviado com sucesso\n');
    } else {
      console.log('❌ Falha ao enviar email\n');
    }
    
    // Aguardar um pouco antes do próximo teste
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teste 2: Email com principal + 2 acompanhantes
    console.log('📋 Teste 2: Email com principal + 2 acompanhantes');
    const timestamp2 = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });
    
    const sucesso2 = await enviarEmail(
      ['Teste Principal Com Acompanhantes', 'Teste Acompanhante 1', 'Teste Acompanhante 2'],
      timestamp2
    );
    if (sucesso2) {
      console.log('✅ Email enviado com sucesso\n');
    } else {
      console.log('❌ Falha ao enviar email\n');
    }
    
    // Aguardar um pouco antes do próximo teste
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teste 3: Email com principal + 3 acompanhantes (máximo)
    console.log('📋 Teste 3: Email com principal + 3 acompanhantes (máximo)');
    const timestamp3 = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });
    
    const sucesso3 = await enviarEmail(
      ['Teste Principal Max', 'Acomp 1', 'Acomp 2', 'Acomp 3'],
      timestamp3
    );
    if (sucesso3) {
      console.log('✅ Email enviado com sucesso\n');
    } else {
      console.log('❌ Falha ao enviar email\n');
    }
    
    console.log('✅ Testes de email concluídos!');
    console.log('📧 Verifique sua caixa de entrada para confirmar o formato dos emails');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

testarEmail();
