const { Pool } = require('pg');

let pool = null;

/**
 * Cria e retorna o pool de conexões PostgreSQL
 */
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    pool.on('error', (err) => {
      console.error('❌ Erro inesperado no pool PostgreSQL:', err);
    });
  }
  
  return pool;
}

/**
 * Inicializa a conexão e cria as tabelas
 */
async function inicializarConexao() {
  console.log('🔄 Conectando ao PostgreSQL...');
  
  const client = getPool();
  
  try {
    // Testar conexão
    await client.query('SELECT NOW()');
    console.log('✅ Conectado ao PostgreSQL');
    
    // Criar tabela de confirmações
    await client.query(`
      CREATE TABLE IF NOT EXISTS confirmacoes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        data_confirmacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        id_principal INTEGER,
        FOREIGN KEY (id_principal) REFERENCES confirmacoes(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Tabelas criadas/verificadas');
    
    // Contar confirmações
    const result = await client.query('SELECT COUNT(*) as total FROM confirmacoes');
    console.log(`📊 Total de confirmações: ${result.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro ao inicializar PostgreSQL:', error);
    throw error;
  }
}

/**
 * Fecha a conexão com o banco
 */
async function fecharConexao() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Conexão com PostgreSQL fechada');
  }
}

/**
 * Executa uma query
 */
async function executarQuery(sql, params = []) {
  const client = getPool();
  return await client.query(sql, params);
}

module.exports = {
  inicializarConexao,
  fecharConexao,
  executarQuery,
  getPool
};
