const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Caminho do banco de dados
const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

console.log('🔄 Iniciando migração do schema para suporte a acompanhantes...');
console.log('📁 Banco de dados:', dbPath);
console.log('');

// Conectar ao banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco de dados');
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON', (err) => {
  if (err) {
    console.error('❌ Erro ao habilitar foreign keys:', err.message);
    process.exit(1);
  }
  console.log('✅ Foreign keys habilitadas');
});

// Executar migração
db.serialize(() => {
  console.log('');
  console.log('📝 Etapa 1: Verificando schema atual...');
  
  // Verificar se as colunas já existem
  db.all("PRAGMA table_info(confirmacoes)", (err, columns) => {
    if (err) {
      console.error('❌ Erro ao verificar schema:', err.message);
      db.close();
      process.exit(1);
    }
    
    const hasType = columns.some(col => col.name === 'tipo');
    const hasPrincipalId = columns.some(col => col.name === 'convidado_principal_id');
    
    if (hasType && hasPrincipalId) {
      console.log('ℹ️  Schema já está atualizado. Nenhuma migração necessária.');
      db.close();
      return;
    }
    
    console.log('✅ Schema precisa ser atualizado');
    console.log('');
    console.log('📝 Etapa 2: Criando backup da tabela...');
    
    // Criar tabela temporária com dados existentes
    db.run(`
      CREATE TABLE confirmacoes_backup AS 
      SELECT * FROM confirmacoes
    `, (err) => {
      if (err) {
        console.error('❌ Erro ao criar backup:', err.message);
        db.close();
        process.exit(1);
      }
      console.log('✅ Backup criado');
      console.log('');
      console.log('📝 Etapa 3: Removendo tabela antiga...');
      
      // Remover tabela antiga
      db.run('DROP TABLE confirmacoes', (err) => {
        if (err) {
          console.error('❌ Erro ao remover tabela antiga:', err.message);
          db.close();
          process.exit(1);
        }
        console.log('✅ Tabela antiga removida');
        console.log('');
        console.log('📝 Etapa 4: Criando nova tabela com schema atualizado...');
        
        // Criar nova tabela com schema atualizado
        db.run(`
          CREATE TABLE confirmacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            tipo TEXT NOT NULL DEFAULT 'principal',
            convidado_principal_id INTEGER,
            data_confirmacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (convidado_principal_id) 
              REFERENCES confirmacoes(id) 
              ON DELETE CASCADE
          )
        `, (err) => {
          if (err) {
            console.error('❌ Erro ao criar nova tabela:', err.message);
            // Tentar restaurar backup
            db.run('ALTER TABLE confirmacoes_backup RENAME TO confirmacoes', () => {
              db.close();
              process.exit(1);
            });
            return;
          }
          console.log('✅ Nova tabela criada');
          console.log('');
          console.log('📝 Etapa 5: Criando índices...');
          
          // Criar índices
          db.run('CREATE INDEX idx_nome ON confirmacoes(nome COLLATE NOCASE)', (err) => {
            if (err) {
              console.error('❌ Erro ao criar índice idx_nome:', err.message);
            } else {
              console.log('✅ Índice idx_nome criado');
            }
            
            db.run('CREATE INDEX idx_tipo ON confirmacoes(tipo)', (err) => {
              if (err) {
                console.error('❌ Erro ao criar índice idx_tipo:', err.message);
              } else {
                console.log('✅ Índice idx_tipo criado');
              }
              
              db.run('CREATE INDEX idx_principal ON confirmacoes(convidado_principal_id)', (err) => {
                if (err) {
                  console.error('❌ Erro ao criar índice idx_principal:', err.message);
                } else {
                  console.log('✅ Índice idx_principal criado');
                }
                console.log('');
                console.log('📝 Etapa 6: Migrando dados existentes...');
                
                // Migrar dados do backup para nova tabela
                db.run(`
                  INSERT INTO confirmacoes (id, nome, tipo, data_confirmacao)
                  SELECT id, nome, 'principal', data_confirmacao
                  FROM confirmacoes_backup
                `, (err) => {
                  if (err) {
                    console.error('❌ Erro ao migrar dados:', err.message);
                    db.close();
                    process.exit(1);
                  }
                  
                  // Contar registros migrados
                  db.get('SELECT COUNT(*) as count FROM confirmacoes', (err, row) => {
                    if (err) {
                      console.error('❌ Erro ao contar registros:', err.message);
                    } else {
                      console.log(`✅ ${row.count} registro(s) migrado(s) com tipo='principal'`);
                    }
                    console.log('');
                    console.log('📝 Etapa 7: Removendo backup...');
                    
                    // Remover tabela de backup
                    db.run('DROP TABLE confirmacoes_backup', (err) => {
                      if (err) {
                        console.error('⚠️  Aviso: Não foi possível remover backup:', err.message);
                        console.log('   Você pode remover manualmente a tabela confirmacoes_backup');
                      } else {
                        console.log('✅ Backup removido');
                      }
                      
                      console.log('');
                      console.log('🎉 Migração concluída com sucesso!');
                      console.log('');
                      console.log('📊 Nova estrutura da tabela confirmacoes:');
                      console.log('   - id (INTEGER, PRIMARY KEY, AUTOINCREMENT)');
                      console.log('   - nome (TEXT, NOT NULL)');
                      console.log('   - tipo (TEXT, NOT NULL, DEFAULT \'principal\')');
                      console.log('   - convidado_principal_id (INTEGER, NULLABLE)');
                      console.log('   - data_confirmacao (DATETIME, DEFAULT CURRENT_TIMESTAMP)');
                      console.log('');
                      console.log('🔗 Foreign Key:');
                      console.log('   - convidado_principal_id -> confirmacoes(id) ON DELETE CASCADE');
                      console.log('');
                      console.log('📇 Índices criados:');
                      console.log('   - idx_nome (nome COLLATE NOCASE)');
                      console.log('   - idx_tipo (tipo)');
                      console.log('   - idx_principal (convidado_principal_id)');
                      
                      db.close((err) => {
                        if (err) {
                          console.error('❌ Erro ao fechar conexão:', err.message);
                        } else {
                          console.log('');
                          console.log('✅ Conexão fechada');
                        }
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
