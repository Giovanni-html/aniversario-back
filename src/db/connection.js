let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  // Ignora erro se não tiver sqlite3 (ex: produção)
  console.log('⚠️ SQLite3 não encontrado ou erro ao carregar (ok se usando Postgres)');
}
const path = require('path');
require('dotenv').config();

// Caminho do banco de dados
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

let db = null;

/**
 * Inicializa a conexão com o banco de dados SQLite
 * @returns {Promise<sqlite3.Database>} Instância do banco de dados
 */
function inicializarConexao() {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err.message);
        return reject(err);
      }
      
      console.log('✅ Conectado ao banco de dados SQLite');
      console.log('📁 Localização:', dbPath);
      
      // Habilitar foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('⚠️  Aviso: Não foi possível habilitar foreign keys');
        }
      });
      
      resolve(db);
    });
  });
}

/**
 * Obtém a instância do banco de dados
 * @returns {sqlite3.Database} Instância do banco de dados
 */
function obterConexao() {
  if (!db) {
    throw new Error('Banco de dados não inicializado. Chame inicializarConexao() primeiro.');
  }
  return db;
}

/**
 * Fecha a conexão com o banco de dados
 * @returns {Promise<void>}
 */
function fecharConexao() {
  return new Promise((resolve, reject) => {
    if (!db) {
      return resolve();
    }

    db.close((err) => {
      if (err) {
        console.error('❌ Erro ao fechar conexão:', err.message);
        return reject(err);
      }
      
      console.log('✅ Conexão com banco de dados fechada');
      db = null;
      resolve();
    });
  });
}

/**
 * Executa uma query com tratamento de erros
 * @param {string} sql - Query SQL
 * @param {Array} params - Parâmetros da query
 * @returns {Promise<any>} Resultado da query
 */
function executarQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = obterConexao();
    
    database.all(sql, params, (err, rows) => {
      if (err) {
        console.error('❌ Erro ao executar query:', err.message);
        console.error('   SQL:', sql);
        console.error('   Params:', params);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

/**
 * Executa uma query que retorna uma única linha
 * @param {string} sql - Query SQL
 * @param {Array} params - Parâmetros da query
 * @returns {Promise<any>} Primeira linha do resultado
 */
function executarQueryUnica(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = obterConexao();
    
    database.get(sql, params, (err, row) => {
      if (err) {
        console.error('❌ Erro ao executar query:', err.message);
        console.error('   SQL:', sql);
        console.error('   Params:', params);
        return reject(err);
      }
      resolve(row);
    });
  });
}

/**
 * Executa uma query de inserção/atualização/deleção
 * @param {string} sql - Query SQL
 * @param {Array} params - Parâmetros da query
 * @returns {Promise<{lastID: number, changes: number}>} ID do último registro e número de mudanças
 */
function executarComando(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = obterConexao();
    
    database.run(sql, params, function(err) {
      if (err) {
        console.error('❌ Erro ao executar comando:', err.message);
        console.error('   SQL:', sql);
        console.error('   Params:', params);
        return reject(err);
      }
      resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
}

/**
 * Inicia uma transação
 * @returns {Promise<void>}
 */
function iniciarTransacao() {
  return executarComando('BEGIN TRANSACTION');
}

/**
 * Confirma uma transação
 * @returns {Promise<void>}
 */
function confirmarTransacao() {
  return executarComando('COMMIT');
}

/**
 * Reverte uma transação
 * @returns {Promise<void>}
 */
function reverterTransacao() {
  return executarComando('ROLLBACK');
}

/**
 * Executa uma função dentro de uma transação
 * @param {Function} callback - Função a ser executada dentro da transação
 * @returns {Promise<any>} Resultado da função callback
 */
async function executarEmTransacao(callback) {
  try {
    await iniciarTransacao();
    const resultado = await callback();
    await confirmarTransacao();
    return resultado;
  } catch (error) {
    await reverterTransacao();
    throw error;
  }
}

module.exports = {
  inicializarConexao,
  obterConexao,
  fecharConexao,
  executarQuery,
  executarQueryUnica,
  executarComando,
  iniciarTransacao,
  confirmarTransacao,
  reverterTransacao,
  executarEmTransacao
};
