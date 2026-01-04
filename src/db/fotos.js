// Default to SQLite connection, but allow injection
let db = require('./connection');

/**
 * Set database connection (for dependency injection)
 * @param {Object} dbConnection
 */
function setDbConnection(dbConnection) {
  db = dbConnection;
}

/**
 * Create fotos table if it doesn't exist
 */
async function criarTabelaFotos() {
  let sql;
  
  // Detectar se é Postgres (via variável de ambiente ou propriedade injetada)
  const isPostgres = !!process.env.DATABASE_URL;

  if (isPostgres) {
    // Sintaxe PostgreSQL
    sql = `
      CREATE TABLE IF NOT EXISTS fotos (
        id SERIAL PRIMARY KEY,
        google_drive_id TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        nome_arquivo TEXT,
        tamanho_bytes INTEGER,
        data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } else {
    // Sintaxe SQLite
    sql = `
      CREATE TABLE IF NOT EXISTS fotos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_drive_id TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        nome_arquivo TEXT,
        tamanho_bytes INTEGER,
        data_upload DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
  }
  
  await db.executarComando(sql);
  console.log('✅ Tabela fotos criada/verificada');
}

/**
 * Save photo metadata to database
 * @param {Object} fotoData
 * @returns {Promise<Object>} Saved photo data
 */
async function salvarFoto(fotoData) {
  const { google_drive_id, url, thumbnail_url, nome_arquivo, tamanho_bytes } = fotoData;
  
  const resultado = await db.executarComando(
    `INSERT INTO fotos (google_drive_id, url, thumbnail_url, nome_arquivo, tamanho_bytes) 
     VALUES (?, ?, ?, ?, ?) RETURNING id`,
    [google_drive_id, url, thumbnail_url || null, nome_arquivo, tamanho_bytes]
  );
  
  const foto = await db.executarQueryUnica(
    'SELECT * FROM fotos WHERE id = ?',
    [resultado.lastID]
  );
  
  console.log(`✅ Foto salva no DB: ${nome_arquivo} (ID: ${foto.id})`);
  return foto;
}

/**
 * List all photos with pagination
 * @param {number} pagina - Page number (1-indexed)
 * @param {number} limite - Items per page
 */
async function listarFotos(pagina = 1, limite = 50) {
  const offset = (pagina - 1) * limite;
  
  const fotos = await db.executarQuery(
    'SELECT * FROM fotos ORDER BY data_upload DESC LIMIT ? OFFSET ?',
    [limite, offset]
  );
  
  return fotos;
}

/**
 * Count total photos
 */
async function contarFotos() {
  const resultado = await db.executarQueryUnica(
    'SELECT COUNT(*) as total FROM fotos'
  );
  return resultado.total;
}

/**
 * Get photo by ID
 * @param {number} id
 */
async function buscarFotoPorId(id) {
  const foto = await db.executarQueryUnica(
    'SELECT * FROM fotos WHERE id = ?',
    [id]
  );
  return foto;
}

/**
 * Delete photo from database
 * @param {number} id
 * @returns {Promise<boolean>} True if deleted
 */
async function deletarFoto(id) {
  const resultado = await db.executarComando(
    'DELETE FROM fotos WHERE id = ?',
    [id]
  );
  return resultado.changes > 0;
}

module.exports = {
  criarTabelaFotos,
  salvarFoto,
  listarFotos,
  contarFotos,
  buscarFotoPorId,
  deletarFoto,
  setDbConnection
};
