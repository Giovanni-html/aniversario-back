/**
 * Módulo que detecta automaticamente qual banco de dados usar
 * - PostgreSQL em produção (Render)
 * - SQLite em desenvolvimento local
 */

const usePostgres = process.env.DATABASE_URL ? true : false;

let dbConnection;
let confirmacoes;

if (usePostgres) {
  console.log('🐘 Usando PostgreSQL');
  dbConnection = require('./connection-postgres');
  confirmacoes = require('./confirmacoes-postgres');
} else {
  console.log('📁 Usando SQLite');
  dbConnection = require('./connection');
  confirmacoes = require('./confirmacoes');
}

module.exports = {
  dbConnection,
  confirmacoes
};
