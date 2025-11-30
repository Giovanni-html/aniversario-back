const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('📊 Verificando schema da tabela confirmacoes...\n');

db.all('PRAGMA table_info(confirmacoes)', (err, cols) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    db.close();
    return;
  }
  
  console.log('Colunas:');
  cols.forEach(c => {
    const nullable = c.notnull ? 'NOT NULL' : 'NULL';
    const defaultVal = c.dflt_value ? `DEFAULT ${c.dflt_value}` : '';
    console.log(`  - ${c.name} (${c.type}) ${nullable} ${defaultVal}`);
  });
  
  console.log('\nÍndices:');
  db.all('PRAGMA index_list(confirmacoes)', (err, indexes) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      db.close();
      return;
    }
    
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}`);
    });
    
    console.log('\nForeign Keys:');
    db.all('PRAGMA foreign_key_list(confirmacoes)', (err, fks) => {
      if (err) {
        console.error('❌ Erro:', err.message);
        db.close();
        return;
      }
      
      if (fks.length === 0) {
        console.log('  - Nenhuma foreign key encontrada');
      } else {
        fks.forEach(fk => {
          console.log(`  - ${fk.from} -> ${fk.table}(${fk.to}) ON DELETE ${fk.on_delete}`);
        });
      }
      
      console.log('\nDados de exemplo:');
      db.all('SELECT * FROM confirmacoes LIMIT 3', (err, rows) => {
        if (err) {
          console.error('❌ Erro:', err.message);
        } else {
          rows.forEach(row => {
            console.log(`  - ID: ${row.id}, Nome: ${row.nome}, Tipo: ${row.tipo}, Principal ID: ${row.convidado_principal_id || 'NULL'}`);
          });
        }
        
        db.close();
      });
    });
  });
});
