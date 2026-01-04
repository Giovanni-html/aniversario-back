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
  
  // Converter ? para $1, $2, etc se necessário
  if (sql.includes('?')) {
    let paramCount = 1;
    sql = sql.replace(/\?/g, () => `$${paramCount++}`);
  }
  
  // Para queries de listagem, normalizar retorno para parecer array direto (compatível com adapter SQLite que retorna rows)
  // Mas espera, o adapter sqlite retorna rows direto. O PG retorna objeto Result { rows: [] }.
  // O fotos.js espera que executarQuery retorne o array de linhas.
  
  const result = await client.query(sql, params);
  return result.rows;
}

/**
 * Executa uma query que retorna uma única linha
 */
async function executarQueryUnica(sql, params = []) {
  const result = await executarQuery(sql, params);
  return result.rows[0];
}

/**
 * Executa um comando (INSERT, UPDATE, DELETE)
 * Retorna objeto compatível com o adapter SQLite { lastID, changes }
 * Nota: PostgreSQL retorna rows, rowCount, oide command.
 * Para INSERT retornar ID, o SQL deve ter "RETURNING id"
 */
async function executarComando(sql, params = []) {
  // Ajuste para SQLite vs Postgres:
  // Postgres usa $1, $2, etc. SQLite usa ?.
  // Precisamos converter ? para $n
  let paramCount = 1;
  const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);
  
  const result = await executarQuery(pgSql, params);
  
  // Tentar extrair ID se houver retorno
  let lastID = 0;
  if (result.rows && result.rows.length > 0 && result.rows[0].id) {
    lastID = result.rows[0].id;
  }
  
  return {
    lastID: lastID,
    changes: result.rowCount
  };
}

module.exports = {
  inicializarConexao,
  fecharConexao,
  executarQuery,
  executarQueryUnica,
  executarComando,
  getPool
};
