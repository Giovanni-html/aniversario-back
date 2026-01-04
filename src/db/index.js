/**
 * Módulo que detecta automaticamente qual banco de dados usar
 * - PostgreSQL em produção (Render)
 * - SQLite em desenvolvimento local
 */

const usePostgres = process.env.DATABASE_URL ? true : false;

let dbConnection;
let confirmacoes;
let fotos;

if (usePostgres) {
  console.log('🐘 Usando PostgreSQL');
  dbConnection = require('./connection-postgres');
  confirmacoes = require('./confirmacoes-postgres');
  // fotos usa SQLite-style queries que funcionam em ambos
  fotos = require('./fotos');
  // Injetar conexão Postgres
  fotos.setDbConnection(dbConnection);
} else {
  console.log('📁 Usando SQLite');
  dbConnection = require('./connection');
  confirmacoes = require('./confirmacoes');
  fotos = require('./fotos');
}

module.exports = {
  dbConnection,
  confirmacoes,
  fotos
};
