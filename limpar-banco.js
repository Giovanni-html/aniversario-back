const dbConnection = require('./src/db/connection');

async function limpar() {
  try {
    console.log('🗑️  Limpando banco de dados...\n');
    
    // Inicializar conexão
    await dbConnection.inicializarConexao();
    
    // Contar registros antes
    const antes = await dbConnection.executarQueryUnica('SELECT COUNT(*) as total FROM confirmacoes');
    console.log(`📊 Confirmações antes: ${antes.total}`);
    
    // Deletar todos os registros
    const resultado = await dbConnection.executarComando('DELETE FROM confirmacoes');
    console.log(`🗑️  Registros removidos: ${resultado.changes}`);
    
    // Resetar o auto-increment
    await dbConnection.executarComando('DELETE FROM sqlite_sequence WHERE name="confirmacoes"');
    console.log('🔄 Auto-increment resetado');
    
    // Contar registros depois
    const depois = await dbConnection.executarQueryUnica('SELECT COUNT(*) as total FROM confirmacoes');
    console.log(`📊 Confirmações depois: ${depois.total}`);
    
    // Fechar conexão
    await dbConnection.fecharConexao();
    
    console.log('\n✅ Banco de dados limpo com sucesso!');
    console.log('   Agora você pode fazer novos testes.\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao limpar banco:', error.message);
    process.exit(1);
  }
}

limpar();
