const db = require('./src/db/connection');
const { 
  verificarDuplicata,
  verificarDuplicatas, 
  salvarConfirmacao,
  salvarConfirmacaoComAcompanhantes,
  listarConfirmacoes,
  removerConfirmacao
} = require('./src/db/confirmacoes');
const { confirmarPresenca } = require('./src/api/confirmar');

// Mock do Express req/res
function criarMockReqRes(body) {
  const req = { body };
  const res = {
    statusCode: null,
    responseData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.responseData = data;
      return this;
    }
  };
  return { req, res };
}

let testesPassaram = 0;
let testesFalharam = 0;

function registrarSucesso(mensagem) {
  console.log(`✅ ${mensagem}`);
  testesPassaram++;
}

function registrarFalha(mensagem, detalhes = '') {
  console.log(`❌ ${mensagem}`);
  if (detalhes) {
    console.log(`   ${detalhes}`);
  }
  testesFalharam++;
}

async function testarBackendCompleto() {
  try {
    console.log('🧪 CHECKPOINT: Testando Backend Completo\n');
    console.log('=' .repeat(60));
    
    // Inicializar conexão
    await db.inicializarConexao();
    
    // ========================================
    // SEÇÃO 1: Testes de Funções de Banco de Dados
    // ========================================
    console.log('\n📦 SEÇÃO 1: Funções de Banco de Dados\n');
    
    // Teste 1.1: verificarDuplicatas com array vazio
    console.log('Teste 1.1: verificarDuplicatas com array vazio');
    const resultado1_1 = await verificarDuplicatas([]);
    if (Object.keys(resultado1_1).length === 0) {
      registrarSucesso('Array vazio retorna objeto vazio');
    } else {
      registrarFalha('Array vazio deveria retornar objeto vazio', JSON.stringify(resultado1_1));
    }
    
    // Teste 1.2: verificarDuplicatas com nomes novos
    console.log('\nTeste 1.2: verificarDuplicatas com nomes novos');
    const resultado1_2 = await verificarDuplicatas(['Checkpoint Test 1', 'Checkpoint Test 2']);
    if (!resultado1_2['Checkpoint Test 1'] && !resultado1_2['Checkpoint Test 2']) {
      registrarSucesso('Nomes novos retornam false');
    } else {
      registrarFalha('Nomes novos deveriam retornar false', JSON.stringify(resultado1_2));
    }
    
    // Teste 1.3: salvarConfirmacaoComAcompanhantes - apenas principal
    console.log('\nTeste 1.3: Salvar apenas convidado principal');
    const resultado1_3 = await salvarConfirmacaoComAcompanhantes('Checkpoint Principal 1', []);
    if (resultado1_3.principal && resultado1_3.principal.tipo === 'principal' && resultado1_3.acompanhantes.length === 0) {
      registrarSucesso('Principal salvo corretamente sem acompanhantes');
    } else {
      registrarFalha('Principal não foi salvo corretamente');
    }
    
    // Teste 1.4: salvarConfirmacaoComAcompanhantes - principal + 2 acompanhantes
    console.log('\nTeste 1.4: Salvar principal + 2 acompanhantes');
    const resultado1_4 = await salvarConfirmacaoComAcompanhantes(
      'Checkpoint Principal 2', 
      ['Checkpoint Acomp 1', 'Checkpoint Acomp 2']
    );
    if (
      resultado1_4.principal && 
      resultado1_4.principal.tipo === 'principal' &&
      resultado1_4.acompanhantes.length === 2 &&
      resultado1_4.acompanhantes[0].tipo === 'acompanhante' &&
      resultado1_4.acompanhantes[0].convidado_principal_id === resultado1_4.principal.id &&
      resultado1_4.acompanhantes[1].convidado_principal_id === resultado1_4.principal.id
    ) {
      registrarSucesso('Principal + acompanhantes salvos com associação correta');
    } else {
      registrarFalha('Principal + acompanhantes não foram salvos corretamente');
    }
    
    // Teste 1.5: verificarDuplicatas com nomes existentes
    console.log('\nTeste 1.5: verificarDuplicatas detecta nomes existentes');
    const resultado1_5 = await verificarDuplicatas(['Checkpoint Principal 1', 'Checkpoint Novo', 'Checkpoint Acomp 1']);
    if (
      resultado1_5['Checkpoint Principal 1'] === true &&
      resultado1_5['Checkpoint Novo'] === false &&
      resultado1_5['Checkpoint Acomp 1'] === true
    ) {
      registrarSucesso('Duplicatas detectadas corretamente');
    } else {
      registrarFalha('Duplicatas não foram detectadas corretamente', JSON.stringify(resultado1_5));
    }
    
    // Teste 1.6: Tentar salvar duplicata (deve falhar e fazer rollback)
    console.log('\nTeste 1.6: Rollback em caso de duplicata');
    try {
      await salvarConfirmacaoComAcompanhantes('Checkpoint Principal 3', ['Checkpoint Principal 1']);
      registrarFalha('Deveria ter lançado exceção de duplicata');
    } catch (error) {
      if (error.message === 'DUPLICATA') {
        // Verificar que o rollback funcionou
        const resultado1_6 = await verificarDuplicatas(['Checkpoint Principal 3']);
        if (!resultado1_6['Checkpoint Principal 3']) {
          registrarSucesso('Rollback funcionou - nenhum dado parcial foi salvo');
        } else {
          registrarFalha('Rollback não funcionou - dados parciais foram salvos');
        }
      } else {
        registrarFalha('Erro inesperado', error.message);
      }
    }
    
    // Teste 1.7: Timestamps são armazenados
    console.log('\nTeste 1.7: Timestamps são armazenados corretamente');
    if (resultado1_4.principal.data_confirmacao && resultado1_4.acompanhantes[0].data_confirmacao) {
      registrarSucesso('Timestamps armazenados em todos os registros');
    } else {
      registrarFalha('Timestamps não foram armazenados');
    }
    
    // ========================================
    // SEÇÃO 2: Testes de API
    // ========================================
    console.log('\n📡 SEÇÃO 2: Endpoint da API\n');
    
    // Teste 2.1: Validação - nome vazio
    console.log('Teste 2.1: API rejeita nome vazio');
    const { req: req2_1, res: res2_1 } = criarMockReqRes({ nome: '' });
    await confirmarPresenca(req2_1, res2_1);
    if (res2_1.statusCode === 400 && res2_1.responseData.campos_vazios) {
      registrarSucesso('API rejeita nome vazio com campos_vazios');
    } else {
      registrarFalha('API não rejeitou nome vazio corretamente');
    }
    
    // Teste 2.2: Validação - máximo de acompanhantes
    console.log('\nTeste 2.2: API rejeita mais de 3 acompanhantes');
    const { req: req2_2, res: res2_2 } = criarMockReqRes({
      nome: 'Test',
      acompanhantes: ['A1', 'A2', 'A3', 'A4']
    });
    await confirmarPresenca(req2_2, res2_2);
    if (res2_2.statusCode === 400 && res2_2.responseData.message.includes('Máximo de 3')) {
      registrarSucesso('API rejeita mais de 3 acompanhantes');
    } else {
      registrarFalha('API não rejeitou excesso de acompanhantes');
    }
    
    // Teste 2.3: Validação - acompanhante vazio
    console.log('\nTeste 2.3: API detecta acompanhante vazio');
    const { req: req2_3, res: res2_3 } = criarMockReqRes({
      nome: 'Test',
      acompanhantes: ['A1', '', 'A3']
    });
    await confirmarPresenca(req2_3, res2_3);
    if (
      res2_3.statusCode === 400 && 
      res2_3.responseData.campos_vazios &&
      res2_3.responseData.campos_vazios.acompanhantes[1] === true
    ) {
      registrarSucesso('API detecta campo vazio específico');
    } else {
      registrarFalha('API não detectou campo vazio corretamente');
    }
    
    // Teste 2.4: Sucesso - apenas principal
    console.log('\nTeste 2.4: API aceita confirmação apenas com principal');
    const { req: req2_4, res: res2_4 } = criarMockReqRes({
      nome: 'API Checkpoint Principal 1'
    });
    await confirmarPresenca(req2_4, res2_4);
    if (res2_4.statusCode === 200 && res2_4.responseData.success && res2_4.responseData.confirmacoes.length === 1) {
      registrarSucesso('API aceita confirmação apenas com principal');
    } else {
      registrarFalha('API não processou confirmação simples corretamente');
    }
    
    // Teste 2.5: Sucesso - principal + acompanhantes
    console.log('\nTeste 2.5: API aceita confirmação com acompanhantes');
    const { req: req2_5, res: res2_5 } = criarMockReqRes({
      nome: 'API Checkpoint Principal 2',
      acompanhantes: ['API Checkpoint Acomp 1', 'API Checkpoint Acomp 2']
    });
    await confirmarPresenca(req2_5, res2_5);
    if (
      res2_5.statusCode === 200 && 
      res2_5.responseData.success && 
      res2_5.responseData.confirmacoes.length === 3
    ) {
      registrarSucesso('API aceita confirmação com acompanhantes');
    } else {
      registrarFalha('API não processou confirmação com acompanhantes corretamente');
    }
    
    // Teste 2.6: Duplicata - nome principal
    console.log('\nTeste 2.6: API detecta duplicata no nome principal');
    const { req: req2_6, res: res2_6 } = criarMockReqRes({
      nome: 'API Checkpoint Principal 1',
      acompanhantes: ['Novo Acomp']
    });
    await confirmarPresenca(req2_6, res2_6);
    if (
      res2_6.statusCode === 409 && 
      res2_6.responseData.duplicatas &&
      res2_6.responseData.duplicatas.nome === true
    ) {
      registrarSucesso('API detecta duplicata no nome principal');
    } else {
      registrarFalha('API não detectou duplicata no nome principal');
    }
    
    // Teste 2.7: Duplicata - acompanhante
    console.log('\nTeste 2.7: API detecta duplicata em acompanhante');
    const { req: req2_7, res: res2_7 } = criarMockReqRes({
      nome: 'API Checkpoint Principal 3',
      acompanhantes: ['API Checkpoint Acomp 1', 'Novo Acomp 2']
    });
    await confirmarPresenca(req2_7, res2_7);
    if (
      res2_7.statusCode === 409 && 
      res2_7.responseData.duplicatas &&
      res2_7.responseData.duplicatas.acompanhantes[0] === true &&
      res2_7.responseData.duplicatas.acompanhantes[1] === false
    ) {
      registrarSucesso('API detecta duplicata em acompanhante específico');
    } else {
      registrarFalha('API não detectou duplicata em acompanhante corretamente');
    }
    
    // Teste 2.8: Múltiplas duplicatas
    console.log('\nTeste 2.8: API detecta múltiplas duplicatas');
    const { req: req2_8, res: res2_8 } = criarMockReqRes({
      nome: 'API Checkpoint Principal 1',
      acompanhantes: ['API Checkpoint Acomp 1', 'API Checkpoint Acomp 2']
    });
    await confirmarPresenca(req2_8, res2_8);
    if (
      res2_8.statusCode === 409 && 
      res2_8.responseData.duplicatas &&
      res2_8.responseData.duplicatas.nome === true &&
      res2_8.responseData.duplicatas.acompanhantes[0] === true &&
      res2_8.responseData.duplicatas.acompanhantes[1] === true
    ) {
      registrarSucesso('API detecta múltiplas duplicatas corretamente');
    } else {
      registrarFalha('API não detectou múltiplas duplicatas corretamente');
    }
    
    // ========================================
    // SEÇÃO 3: Integridade de Dados
    // ========================================
    console.log('\n🔍 SEÇÃO 3: Integridade de Dados\n');
    
    // Teste 3.1: Verificar estrutura do banco
    console.log('Teste 3.1: Verificar estrutura dos registros');
    const todasConfirmacoes = await listarConfirmacoes();
    const checkpointConfirmacoes = todasConfirmacoes.filter(c => 
      c.nome.startsWith('Checkpoint') || c.nome.startsWith('API Checkpoint')
    );
    
    const principaisCount = checkpointConfirmacoes.filter(c => c.tipo === 'principal').length;
    const acompanhantesCount = checkpointConfirmacoes.filter(c => c.tipo === 'acompanhante').length;
    
    if (principaisCount >= 4 && acompanhantesCount >= 4) {
      registrarSucesso(`Registros criados corretamente (${principaisCount} principais, ${acompanhantesCount} acompanhantes)`);
    } else {
      registrarFalha(`Contagem de registros incorreta (${principaisCount} principais, ${acompanhantesCount} acompanhantes)`);
    }
    
    // Teste 3.2: Verificar associações
    console.log('\nTeste 3.2: Verificar associações principal-acompanhante');
    const acompanhantes = checkpointConfirmacoes.filter(c => c.tipo === 'acompanhante');
    const todasAssociacoesCorretas = acompanhantes.every(a => a.convidado_principal_id !== null);
    
    if (todasAssociacoesCorretas) {
      registrarSucesso('Todas as associações principal-acompanhante estão corretas');
    } else {
      registrarFalha('Algumas associações estão incorretas');
    }
    
    // Teste 3.3: Verificar timestamps
    console.log('\nTeste 3.3: Verificar timestamps');
    const todosComTimestamp = checkpointConfirmacoes.every(c => c.data_confirmacao !== null);
    
    if (todosComTimestamp) {
      registrarSucesso('Todos os registros têm timestamp');
    } else {
      registrarFalha('Alguns registros não têm timestamp');
    }
    
    // ========================================
    // Limpeza
    // ========================================
    console.log('\n🧹 Limpando dados de teste...');
    for (const conf of checkpointConfirmacoes) {
      await removerConfirmacao(conf.id);
    }
    console.log(`   Removidos ${checkpointConfirmacoes.length} registros de teste`);
    
    // ========================================
    // Resultado Final
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESULTADO DO CHECKPOINT\n');
    console.log(`✅ Testes passaram: ${testesPassaram}`);
    console.log(`❌ Testes falharam: ${testesFalharam}`);
    console.log(`📈 Taxa de sucesso: ${((testesPassaram / (testesPassaram + testesFalharam)) * 100).toFixed(1)}%`);
    
    if (testesFalharam === 0) {
      console.log('\n🎉 CHECKPOINT PASSOU! Todos os testes do backend estão funcionando corretamente!');
      console.log('✅ Pronto para continuar com a implementação do frontend.\n');
      return true;
    } else {
      console.log('\n⚠️  CHECKPOINT FALHOU! Alguns testes não passaram.');
      console.log('❌ Corrija os problemas antes de continuar.\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Erro crítico durante os testes:', error);
    return false;
  } finally {
    await db.fecharConexao();
  }
}

// Executar testes
testarBackendCompleto().then(sucesso => {
  process.exit(sucesso ? 0 : 1);
});
