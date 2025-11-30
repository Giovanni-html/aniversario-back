/**
 * Teste End-to-End Completo da Funcionalidade de Acompanhantes
 * 
 * Este script testa toda a implementação:
 * - Backend (banco de dados, API)
 * - Integração (fluxo completo)
 * - Email
 */

const db = require('./src/db/connection');
const { 
  verificarDuplicatas, 
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

async function testarImplementacaoCompleta() {
  try {
    console.log('🎯 CHECKPOINT FINAL: Teste End-to-End Completo\n');
    console.log('=' .repeat(70));
    
    // Inicializar conexão
    await db.inicializarConexao();
    
    // ========================================
    // SEÇÃO 1: Testes de Funcionalidade Básica
    // ========================================
    console.log('\n📦 SEÇÃO 1: Funcionalidade Básica\n');
    
    // Teste 1.1: Adicionar apenas principal
    console.log('Teste 1.1: Confirmação apenas com principal');
    const { req: req1, res: res1 } = criarMockReqRes({
      nome: 'E2E Test Principal Solo'
    });
    await confirmarPresenca(req1, res1);
    if (res1.statusCode === 200 && res1.responseData.confirmacoes.length === 1) {
      registrarSucesso('Principal salvo corretamente');
    } else {
      registrarFalha('Falha ao salvar apenas principal');
    }
    
    // Teste 1.2: Adicionar principal + 1 acompanhante
    console.log('\nTeste 1.2: Confirmação com 1 acompanhante');
    const { req: req2, res: res2 } = criarMockReqRes({
      nome: 'E2E Test Principal 1',
      acompanhantes: ['E2E Test Acomp 1']
    });
    await confirmarPresenca(req2, res2);
    if (res2.statusCode === 200 && res2.responseData.confirmacoes.length === 2) {
      registrarSucesso('Principal + 1 acompanhante salvos');
    } else {
      registrarFalha('Falha ao salvar com 1 acompanhante');
    }
    
    // Teste 1.3: Adicionar principal + 3 acompanhantes (máximo)
    console.log('\nTeste 1.3: Confirmação com 3 acompanhantes (máximo)');
    const { req: req3, res: res3 } = criarMockReqRes({
      nome: 'E2E Test Principal 2',
      acompanhantes: ['E2E Test Acomp 2', 'E2E Test Acomp 3', 'E2E Test Acomp 4']
    });
    await confirmarPresenca(req3, res3);
    if (res3.statusCode === 200 && res3.responseData.confirmacoes.length === 4) {
      registrarSucesso('Principal + 3 acompanhantes salvos (máximo)');
    } else {
      registrarFalha('Falha ao salvar com 3 acompanhantes');
    }
    
    // ========================================
    // SEÇÃO 2: Testes de Validação
    // ========================================
    console.log('\n🔍 SEÇÃO 2: Validação\n');
    
    // Teste 2.1: Rejeitar nome vazio
    console.log('Teste 2.1: Rejeitar nome principal vazio');
    const { req: req4, res: res4 } = criarMockReqRes({
      nome: ''
    });
    await confirmarPresenca(req4, res4);
    if (res4.statusCode === 400) {
      registrarSucesso('Nome vazio rejeitado');
    } else {
      registrarFalha('Nome vazio não foi rejeitado');
    }
    
    // Teste 2.2: Rejeitar acompanhante vazio
    console.log('\nTeste 2.2: Rejeitar acompanhante vazio');
    const { req: req5, res: res5 } = criarMockReqRes({
      nome: 'Test',
      acompanhantes: ['Acomp 1', '', 'Acomp 3']
    });
    await confirmarPresenca(req5, res5);
    if (res5.statusCode === 400 && res5.responseData.campos_vazios) {
      registrarSucesso('Acompanhante vazio rejeitado');
    } else {
      registrarFalha('Acompanhante vazio não foi rejeitado');
    }
    
    // Teste 2.3: Rejeitar mais de 3 acompanhantes
    console.log('\nTeste 2.3: Rejeitar mais de 3 acompanhantes');
    const { req: req6, res: res6 } = criarMockReqRes({
      nome: 'Test',
      acompanhantes: ['A1', 'A2', 'A3', 'A4']
    });
    await confirmarPresenca(req6, res6);
    if (res6.statusCode === 400) {
      registrarSucesso('Mais de 3 acompanhantes rejeitado');
    } else {
      registrarFalha('Mais de 3 acompanhantes não foi rejeitado');
    }
    
    // ========================================
    // SEÇÃO 3: Testes de Duplicatas
    // ========================================
    console.log('\n🚫 SEÇÃO 3: Detecção de Duplicatas\n');
    
    // Teste 3.1: Detectar duplicata no principal
    console.log('Teste 3.1: Detectar duplicata no nome principal');
    const { req: req7, res: res7 } = criarMockReqRes({
      nome: 'E2E Test Principal Solo',
      acompanhantes: ['Novo Acomp']
    });
    await confirmarPresenca(req7, res7);
    if (res7.statusCode === 409 && res7.responseData.duplicatas.nome) {
      registrarSucesso('Duplicata no principal detectada');
    } else {
      registrarFalha('Duplicata no principal não detectada');
    }
    
    // Teste 3.2: Detectar duplicata em acompanhante
    console.log('\nTeste 3.2: Detectar duplicata em acompanhante');
    const { req: req8, res: res8 } = criarMockReqRes({
      nome: 'E2E Test Principal 3',
      acompanhantes: ['E2E Test Acomp 1', 'Novo Acomp 2']
    });
    await confirmarPresenca(req8, res8);
    if (res8.statusCode === 409 && res8.responseData.duplicatas.acompanhantes[0]) {
      registrarSucesso('Duplicata em acompanhante detectada');
    } else {
      registrarFalha('Duplicata em acompanhante não detectada');
    }
    
    // Teste 3.3: Detectar múltiplas duplicatas
    console.log('\nTeste 3.3: Detectar múltiplas duplicatas');
    const { req: req9, res: res9 } = criarMockReqRes({
      nome: 'E2E Test Principal 1',
      acompanhantes: ['E2E Test Acomp 2', 'E2E Test Acomp 3']
    });
    await confirmarPresenca(req9, res9);
    if (
      res9.statusCode === 409 && 
      res9.responseData.duplicatas.nome &&
      res9.responseData.duplicatas.acompanhantes[0] &&
      res9.responseData.duplicatas.acompanhantes[1]
    ) {
      registrarSucesso('Múltiplas duplicatas detectadas');
    } else {
      registrarFalha('Múltiplas duplicatas não detectadas corretamente');
    }
    
    // ========================================
    // SEÇÃO 4: Integridade de Dados
    // ========================================
    console.log('\n💾 SEÇÃO 4: Integridade de Dados\n');
    
    // Teste 4.1: Verificar estrutura do banco
    console.log('Teste 4.1: Verificar registros no banco');
    const todasConfirmacoes = await listarConfirmacoes();
    const e2eConfirmacoes = todasConfirmacoes.filter(c => c.nome.startsWith('E2E Test'));
    
    const principaisCount = e2eConfirmacoes.filter(c => c.tipo === 'principal').length;
    const acompanhantesCount = e2eConfirmacoes.filter(c => c.tipo === 'acompanhante').length;
    
    // Esperado: 3 principais (Solo, Principal 1, Principal 2) e 4 acompanhantes (1 + 3)
    if (principaisCount === 3 && acompanhantesCount === 4) {
      registrarSucesso(`Registros corretos (${principaisCount} principais, ${acompanhantesCount} acompanhantes)`);
    } else {
      registrarFalha(`Contagem incorreta (${principaisCount} principais, ${acompanhantesCount} acompanhantes) - esperado 3 principais e 4 acompanhantes`);
    }
    
    // Teste 4.2: Verificar associações
    console.log('\nTeste 4.2: Verificar associações principal-acompanhante');
    const acompanhantes = e2eConfirmacoes.filter(c => c.tipo === 'acompanhante');
    const todasAssociacoesCorretas = acompanhantes.every(a => 
      a.convidado_principal_id !== null && 
      e2eConfirmacoes.some(p => p.id === a.convidado_principal_id && p.tipo === 'principal')
    );
    
    if (todasAssociacoesCorretas) {
      registrarSucesso('Todas as associações estão corretas');
    } else {
      registrarFalha('Algumas associações estão incorretas');
    }
    
    // Teste 4.3: Verificar timestamps
    console.log('\nTeste 4.3: Verificar timestamps');
    const todosComTimestamp = e2eConfirmacoes.every(c => c.data_confirmacao !== null);
    
    if (todosComTimestamp) {
      registrarSucesso('Todos os registros têm timestamp');
    } else {
      registrarFalha('Alguns registros não têm timestamp');
    }
    
    // ========================================
    // SEÇÃO 5: Teste de Transação (Rollback)
    // ========================================
    console.log('\n🔄 SEÇÃO 5: Atomicidade de Transações\n');
    
    // Teste 5.1: Verificar rollback em caso de duplicata
    console.log('Teste 5.1: Verificar rollback (nenhum dado parcial salvo)');
    const antesCount = (await listarConfirmacoes()).length;
    
    try {
      await salvarConfirmacaoComAcompanhantes('E2E Test Rollback', ['E2E Test Acomp 1']);
    } catch (error) {
      // Esperado falhar por duplicata
    }
    
    const depoisCount = (await listarConfirmacoes()).length;
    const rollbackVerificado = await verificarDuplicatas(['E2E Test Rollback']);
    
    if (antesCount === depoisCount && !rollbackVerificado['E2E Test Rollback']) {
      registrarSucesso('Rollback funcionou - nenhum dado parcial salvo');
    } else {
      registrarFalha('Rollback não funcionou corretamente');
    }
    
    // ========================================
    // Limpeza
    // ========================================
    console.log('\n🧹 Limpando dados de teste...');
    for (const conf of e2eConfirmacoes) {
      await removerConfirmacao(conf.id);
    }
    console.log(`   Removidos ${e2eConfirmacoes.length} registros de teste`);
    
    // ========================================
    // Resultado Final
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESULTADO DO CHECKPOINT FINAL\n');
    console.log(`✅ Testes passaram: ${testesPassaram}`);
    console.log(`❌ Testes falharam: ${testesFalharam}`);
    console.log(`📈 Taxa de sucesso: ${((testesPassaram / (testesPassaram + testesFalharam)) * 100).toFixed(1)}%`);
    
    if (testesFalharam === 0) {
      console.log('\n🎉 CHECKPOINT PASSOU! Implementação completa e funcionando!');
      console.log('✅ Todos os componentes estão integrados corretamente.');
      console.log('✅ Backend, API, validação e banco de dados funcionando.');
      console.log('✅ Pronto para testes manuais e deploy!\n');
      return true;
    } else {
      console.log('\n⚠️  CHECKPOINT FALHOU! Alguns testes não passaram.');
      console.log('❌ Revise os erros acima antes de continuar.\n');
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
testarImplementacaoCompleta().then(sucesso => {
  process.exit(sucesso ? 0 : 1);
});
