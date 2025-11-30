const dbConnection = require('./src/db/connection');
const confirmacoes = require('./src/db/confirmacoes');

async function testar() {
  try {
    console.log('🧪 Testando funções do banco de dados...\n');
    
    // Inicializar conexão
    await dbConnection.inicializarConexao();
    
    // Teste 1: Contar confirmações iniciais
    console.log('📊 Teste 1: Contar confirmações');
    const totalInicial = await confirmacoes.contarConfirmacoes();
    console.log(`   Total inicial: ${totalInicial}\n`);
    
    // Teste 2: Salvar nova confirmação
    console.log('💾 Teste 2: Salvar confirmação');
    const nome1 = 'João Silva Teste';
    const conf1 = await confirmacoes.salvarConfirmacao(nome1);
    console.log(`   Confirmação salva:`, conf1);
    console.log('');
    
    // Teste 3: Verificar duplicata
    console.log('🔍 Teste 3: Verificar duplicata');
    const isDuplicata = await confirmacoes.verificarDuplicata(nome1);
    console.log(`   "${nome1}" é duplicata? ${isDuplicata ? 'SIM ✅' : 'NÃO ❌'}\n`);
    
    // Teste 4: Tentar salvar duplicata
    console.log('⚠️  Teste 4: Tentar salvar duplicata');
    try {
      await confirmacoes.salvarConfirmacao(nome1);
      console.log('   ❌ ERRO: Deveria ter rejeitado duplicata!\n');
    } catch (error) {
      if (error.message === 'DUPLICATA') {
        console.log('   ✅ Duplicata rejeitada corretamente!\n');
      } else {
        throw error;
      }
    }
    
    // Teste 5: Salvar outra confirmação
    console.log('💾 Teste 5: Salvar segunda confirmação');
    const nome2 = 'Maria Santos Teste';
    const conf2 = await confirmacoes.salvarConfirmacao(nome2);
    console.log(`   Confirmação salva:`, conf2);
    console.log('');
    
    // Teste 6: Buscar por nome
    console.log('🔎 Teste 6: Buscar por nome');
    const encontrado = await confirmacoes.buscarPorNome(nome1);
    console.log(`   Encontrado:`, encontrado);
    console.log('');
    
    // Teste 7: Listar todas
    console.log('📋 Teste 7: Listar todas as confirmações');
    const todas = await confirmacoes.listarConfirmacoes();
    console.log(`   Total de confirmações: ${todas.length}`);
    todas.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.nome} - ${c.data_confirmacao}`);
    });
    console.log('');
    
    // Teste 8: Contar total
    console.log('📊 Teste 8: Contar total');
    const totalFinal = await confirmacoes.contarConfirmacoes();
    console.log(`   Total final: ${totalFinal}\n`);
    
    // Limpar dados de teste
    console.log('🧹 Limpando dados de teste...');
    await confirmacoes.removerConfirmacao(conf1.id);
    await confirmacoes.removerConfirmacao(conf2.id);
    console.log('   Dados de teste removidos\n');
    
    // Fechar conexão
    await dbConnection.fecharConexao();
    
    console.log('✅ Todos os testes passaram com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testar();
