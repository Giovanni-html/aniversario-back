const db = require('./src/db/connection');

async function testar() {
  try {
    console.log('🔍 Testando conexão com banco de dados...\n');
    
    // Inicializar conexão
    await db.inicializarConexao();
    
    // Testar query simples
    console.log('📊 Testando query...');
    const resultado = await db.executarQuery('SELECT 1 as teste');
    console.log('   Resultado:', resultado);
    
    // Verificar estrutura da tabela
    console.log('\n📋 Verificando tabela confirmacoes...');
    const tabelas = await db.executarQuery(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='confirmacoes'"
    );
    
    if (tabelas.length > 0) {
      console.log('   ✅ Tabela "confirmacoes" existe');
      
      // Verificar estrutura
      const estrutura = await db.executarQuery('PRAGMA table_info(confirmacoes)');
      console.log('\n   Campos da tabela:');
      estrutura.forEach(campo => {
        console.log(`   - ${campo.name} (${campo.type})`);
      });
    } else {
      console.log('   ❌ Tabela "confirmacoes" não encontrada');
      console.log('   Execute: node criar-banco-sqlite.js');
    }
    
    // Contar registros
    console.log('\n📈 Contando registros...');
    const count = await db.executarQueryUnica('SELECT COUNT(*) as total FROM confirmacoes');
    console.log(`   Total de confirmações: ${count.total}`);
    
    // Fechar conexão
    await db.fecharConexao();
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    process.exit(1);
  }
}

testar();
