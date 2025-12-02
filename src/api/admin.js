const { confirmacoes } = require('../db');
const { getPool } = require('../db/connection-postgres');

// Senha de administrador (você pode mudar isso)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'beh2025';

/**
 * Limpa todas as confirmações do banco de dados
 * Requer senha de administrador
 */
async function limparBanco(req, res) {
  try {
    const { senha } = req.body;
    
    // Verificar senha
    if (senha !== ADMIN_PASSWORD) {
      return res.status(403).json({
        success: false,
        message: 'Senha incorreta'
      });
    }
    
    console.log('🗑️  Limpando banco de dados...');
    
    // Verificar se está usando PostgreSQL ou SQLite
    const usePostgres = process.env.DATABASE_URL ? true : false;
    
    if (usePostgres) {
      // PostgreSQL
      const pool = getPool();
      await pool.query('DELETE FROM confirmacoes');
      await pool.query('ALTER SEQUENCE confirmacoes_id_seq RESTART WITH 1');
      console.log('✅ Banco PostgreSQL limpo');
    } else {
      // SQLite
      const db = require('../db/connection');
      await db.executarComando('DELETE FROM confirmacoes');
      await db.executarComando('DELETE FROM sqlite_sequence WHERE name="confirmacoes"');
      console.log('✅ Banco SQLite limpo');
    }
    
    return res.status(200).json({
      success: true,
      message: 'Banco de dados limpo com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar banco de dados'
    });
  }
}

/**
 * Lista estatísticas do banco
 */
async function estatisticas(req, res) {
  try {
    const { senha } = req.query;
    
    // Verificar senha
    if (senha !== ADMIN_PASSWORD) {
      return res.status(403).json({
        success: false,
        message: 'Senha incorreta'
      });
    }
    
    const total = await confirmacoes.contarConfirmacoes();
    const lista = await confirmacoes.listarConfirmacoes();
    
    // Contar principais e acompanhantes
    const usePostgres = process.env.DATABASE_URL ? true : false;
    let principais = 0;
    let acompanhantes = 0;
    
    if (usePostgres) {
      principais = lista.filter(c => !c.id_principal).length;
      acompanhantes = lista.filter(c => c.id_principal).length;
    } else {
      principais = lista.filter(c => c.tipo === 'principal').length;
      acompanhantes = lista.filter(c => c.tipo === 'acompanhante').length;
    }
    
    return res.status(200).json({
      success: true,
      total: total,
      principais: principais,
      acompanhantes: acompanhantes,
      confirmacoes: lista
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
}

module.exports = {
  limparBanco,
  estatisticas
};
