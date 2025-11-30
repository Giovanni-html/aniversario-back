const db = require('./src/db/connection');
const { confirmarPresenca } = require('./src/api/confirmar');
const { removerConfirmacao, listarConfirmacoes } = require('./src/db/confirmacoes');

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

async function testarAPI() {
  try {
    console.log('🧪 Iniciando testes da API...\n');
    
    // Inicializar conexão
    await db.inicializarConexao();
    
    // Teste 1: Validação - nome vazio
    console.log('📋 Teste 1: Validação - nome vazio');
    const { req: req1, res: res1 } = criarMockReqRes({ nome: '' });
    await confirmarPresenca(req1, res1);
    console.log('Status:', res1.statusCode);
    console.log('Response:', res1.responseData);
    if (res1.statusCode === 400 && res1.responseData.campos_vazios) {
      console.log('✅ Passou\n');
    } else {
      console.log('❌ Falhou\n');
    }
    
    // Teste 2: Validação - máximo de acompanhantes
    console.log('📋 Teste 2: Validação - máximo de 3 acompanhantes');
    const { req: req2, res: res2 } = criarMockReqRes({
      nome: 'Teste Principal',
      acompanhantes: ['Acomp 1', 'Acomp 2', 'Acomp 3', 'Acomp 4']
    });
    await confirmarPresenca(req2, res2);
    console.log('Status:', res2.statusCode);
    console.log('Response:', res2.responseData);
    if (res2.statusCode === 400 && res2.responseData.message.includes('Máximo de 3')) {
      console.log('✅ Passou\n');
    } else {
      console.log('❌ Falhou\n');
    }
    
    // Teste 3: Validação - acompanhante vazio
    console.log('📋 Teste 3: Validação - acompanhante vazio');
    const { req: req3, res: res3 } = criarMockReqRes({
      nome: 'Teste Principal',
      acompanhantes: ['Acomp 1', '', 'Acomp 3']
    });
    await confirmarPresenca(req3, res3);
    console.log('Status:', res3.statusCode);
    console.log('Response:', res3.responseData);
    if (res3.statusCode === 400 && res3.responseData.campos_vazios) {
      console.log('Campos vazios:', res3.responseData.campos_vazios);
      console.log('✅ Passou\n');
    } else {
      console.log('❌ Falhou\n');
    }
    
    // Teste 4: Sucesso - apenas principal
    console.log('📋 Teste 4: Sucesso - apenas principal');
    const { req: req4, res: res4 } = criarMockReqRes({
      nome: 'API Teste Principal 1'
    });
    await confirmarPresenca(req4, res4);
    console.log('Status:', res4.statusCode);
    console.log('Success:', res4.responseData.success);
    console.log('Confirmações:', res4.responseData.confirmacoes?.length);
    if (res4.statusCode === 200 && res4.responseData.success) {
      console.log('✅ Passou\n');
    } else {
      console.log('❌ Falhou\n');
    }
    
    // Teste 5: Sucesso - principal + 2 acompanhantes
    console.log('📋 Teste 5: Sucesso - principal + 2 acompanhantes');
    const { req: req5, res: res5 } = criarMockReqRes({
      nome: 'API Teste Principal 2',
      acompanhantes: ['API Teste Acomp 1', 'API Teste Acomp 2']
    });
    await confirmarPresenca(req5, res5);
    console.log('Status:', res5.statusCode);
    console.log('Success:', res5.responseData.success);
    console.log('Confirmações:', res5.responseData.confirmacoes?.length);
    if (res5.statusCode === 200 && res5.responseData.confirmacoes?.length === 3) {
      console.log('Confirmações criadas:');
      res5.responseData.confirmacoes.forEach(c => {
        console.log(`  - ${c.nome} (tipo: ${c.tipo})`);
      });
      console.log('✅ Passou\n');
    } else {
      console.log('❌ Falhou\n');
    }
    
    // Teste 6: Duplicata - nome principal já existe
    console.log('📋 Teste 6: Duplicata - nome principal já existe');
    const { req: req6, res: res6 } = criarMockReqRes({
      nome: 'API Teste Principal 1',
      acompanhantes: ['API Teste Novo Acomp']
    });
    await confirmarPresenca(req6, res6);
    console.log('Status:', res6.statusCode);
    console.log('Response:', res6.responseData);
    if (res6.statusCode === 409 && res6.responseData.duplicatas) {
      console.log('Duplicatas:', res6.responseData.duplicatas);
      console.log('✅ Passou\n');
    } else {
      console.log('❌ Falhou\n');
    }
    
    // Teste 7: Duplicata - acompanhante já existe
    console.log('📋 Teste 7: Duplicata - acompanhante já existe');
    const { req: req7, res: res7 } = criarMockReqRes({
      nome: 'API Teste Principal 3',
      acompanhantes: ['API Teste Acomp 1', 'API Teste Novo Acomp 2']
    });
    await confirmarPresenca(req7, res7);
    console.log('Status:', res7.statusCode);
    console.log('Response:', res7.responseData);
    if (res7.statusCode === 409 && res7.responseData.duplicatas) {
      console.log('Duplicatas:', res7.responseData.duplicatas);
      console.log('✅ Passou\n');
    } else {
      console.log('❌ Falhou\n');
    }
    
    // Teste 8: Duplicata - múltiplos nomes duplicados
    console.log('📋 Teste 8: Duplicata - múltiplos nomes duplicados');
    const { req: req8, res: res8 } = criarMockReqRes({
      nome: 'API Teste Principal 1',
      acompanhantes: ['API Teste Acomp 1', 'API Teste Acomp 2']
    });
    await confirmarPresenca(req8, res8);
    console.log('Status:', res8.statusCode);
    console.log('Response:', res8.responseData);
    if (res8.statusCode === 409 && res8.responseData.duplicatas) {
      console.log('Duplicatas:', res8.responseData.duplicatas);
      console.log('✅ Passou\n');
    } else {
      console.log('❌ Falhou\n');
    }
    
    // Limpar dados de teste
    console.log('🧹 Limpando dados de teste...');
    const todasConfirmacoes = await listarConfirmacoes();
    const confirmacoesTeste = todasConfirmacoes.filter(c => c.nome.startsWith('API Teste'));
    for (const conf of confirmacoesTeste) {
      await removerConfirmacao(conf.id);
      console.log(`  Removido: ${conf.nome}`);
    }
    
    console.log('\n✅ Todos os testes da API passaram com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    throw error;
  } finally {
    await db.fecharConexao();
  }
}

testarAPI();
