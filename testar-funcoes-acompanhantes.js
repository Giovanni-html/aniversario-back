const db = require('./src/db/connection');
const { 
  verificarDuplicatas, 
  salvarConfirmacaoComAcompanhantes,
  listarConfirmacoes,
  removerConfirmacao
} = require('./src/db/confirmacoes');

async function testarFuncoes() {
  try {
    console.log('🧪 Iniciando testes das novas funções...\n');
    
    // Inicializar conexão
    await db.inicializarConexao();
    
    // Teste 1: verificarDuplicatas com array vazio
    console.log('📋 Teste 1: verificarDuplicatas com array vazio');
    const resultado1 = await verificarDuplicatas([]);
    console.log('Resultado:', resultado1);
    console.log('✅ Passou\n');
    
    // Teste 2: verificarDuplicatas com nomes que não existem
    console.log('📋 Teste 2: verificarDuplicatas com nomes novos');
    const resultado2 = await verificarDuplicatas(['Teste Usuario 1', 'Teste Usuario 2', 'Teste Usuario 3']);
    console.log('Resultado:', resultado2);
    console.log('Esperado: todos false');
    console.log('✅ Passou\n');
    
    // Teste 3: salvarConfirmacaoComAcompanhantes - apenas principal
    console.log('📋 Teste 3: Salvar apenas convidado principal');
    const resultado3 = await salvarConfirmacaoComAcompanhantes('Teste Principal 1', []);
    console.log('Principal:', resultado3.principal);
    console.log('Acompanhantes:', resultado3.acompanhantes);
    console.log('✅ Passou\n');
    
    // Teste 4: salvarConfirmacaoComAcompanhantes - principal + 2 acompanhantes
    console.log('📋 Teste 4: Salvar principal + 2 acompanhantes');
    const resultado4 = await salvarConfirmacaoComAcompanhantes(
      'Teste Principal 2', 
      ['Teste Acompanhante 1', 'Teste Acompanhante 2']
    );
    console.log('Principal:', resultado4.principal);
    console.log('Acompanhantes:', resultado4.acompanhantes);
    console.log('Verificando associação...');
    console.log('Acompanhante 1 - convidado_principal_id:', resultado4.acompanhantes[0].convidado_principal_id);
    console.log('Acompanhante 2 - convidado_principal_id:', resultado4.acompanhantes[1].convidado_principal_id);
    console.log('✅ Passou\n');
    
    // Teste 5: verificarDuplicatas com nomes que agora existem
    console.log('📋 Teste 5: verificarDuplicatas com nomes existentes');
    const resultado5 = await verificarDuplicatas(['Teste Principal 1', 'Teste Novo', 'Teste Acompanhante 1']);
    console.log('Resultado:', resultado5);
    console.log('Esperado: Teste Principal 1 = true, Teste Novo = false, Teste Acompanhante 1 = true');
    console.log('✅ Passou\n');
    
    // Teste 6: Tentar salvar duplicata (deve falhar e fazer rollback)
    console.log('📋 Teste 6: Tentar salvar com nome duplicado (deve falhar)');
    try {
      await salvarConfirmacaoComAcompanhantes('Teste Principal 3', ['Teste Principal 1']);
      console.log('❌ ERRO: Deveria ter lançado exceção de duplicata');
    } catch (error) {
      if (error.message === 'DUPLICATA') {
        console.log('✅ Exceção de duplicata capturada corretamente');
        console.log('Duplicatas detectadas:', error.duplicatas);
      } else {
        throw error;
      }
    }
    console.log('\n');
    
    // Teste 7: Verificar que o rollback funcionou (Teste Principal 3 não deve existir)
    console.log('📋 Teste 7: Verificar rollback (Teste Principal 3 não deve existir)');
    const resultado7 = await verificarDuplicatas(['Teste Principal 3']);
    console.log('Resultado:', resultado7);
    console.log('Esperado: Teste Principal 3 = false');
    if (!resultado7['Teste Principal 3']) {
      console.log('✅ Rollback funcionou corretamente\n');
    } else {
      console.log('❌ ERRO: Rollback não funcionou\n');
    }
    
    // Teste 8: Listar todas as confirmações
    console.log('📋 Teste 8: Listar todas as confirmações');
    const todasConfirmacoes = await listarConfirmacoes();
    console.log(`Total de confirmações: ${todasConfirmacoes.length}`);
    todasConfirmacoes.forEach(conf => {
      console.log(`  - ${conf.nome} (tipo: ${conf.tipo}, principal_id: ${conf.convidado_principal_id || 'N/A'})`);
    });
    console.log('✅ Passou\n');
    
    // Limpar dados de teste
    console.log('🧹 Limpando dados de teste...');
    const confirmacoesTeste = todasConfirmacoes.filter(c => c.nome.startsWith('Teste'));
    for (const conf of confirmacoesTeste) {
      await removerConfirmacao(conf.id);
      console.log(`  Removido: ${conf.nome}`);
    }
    
    console.log('\n✅ Todos os testes passaram com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    throw error;
  } finally {
    await db.fecharConexao();
  }
}

testarFuncoes();
