const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Caminho do banco de dados
const dbPath = path.join(__dirname, 'database.sqlite');

// Criar banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao criar banco de dados:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco de dados SQLite');
});

// Criar tabela
const sql = `
CREATE TABLE IF NOT EXISTS confirmacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'principal',
    convidado_principal_id INTEGER,
    data_confirmacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (convidado_principal_id) 
        REFERENCES confirmacoes(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nome ON confirmacoes(nome COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tipo ON confirmacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_principal ON confirmacoes(convidado_principal_id);
`;

db.exec(sql, (err) => {
  if (err) {
    console.error('❌ Erro ao criar tabela:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Tabela "confirmacoes" criada com sucesso!');
  console.log('');
  console.log('📊 Estrutura do banco:');
  console.log('   - Tabela: confirmacoes');
  console.log('   - Campos:');
  console.log('     • id (INTEGER, PRIMARY KEY, AUTOINCREMENT)');
  console.log('     • nome (TEXT, NOT NULL)');
  console.log('     • tipo (TEXT, NOT NULL, DEFAULT \'principal\')');
  console.log('     • convidado_principal_id (INTEGER, NULLABLE)');
  console.log('     • data_confirmacao (DATETIME, DEFAULT CURRENT_TIMESTAMP)');
  console.log('   - Foreign Key:');
  console.log('     • convidado_principal_id -> confirmacoes(id) ON DELETE CASCADE');
  console.log('   - Índices:');
  console.log('     • idx_nome (nome COLLATE NOCASE)');
  console.log('     • idx_tipo (tipo)');
  console.log('     • idx_principal (convidado_principal_id)');
  console.log('');
  console.log('🎉 Banco de dados pronto para uso!');
  console.log('📁 Localização:', dbPath);
  
  db.close();
});
