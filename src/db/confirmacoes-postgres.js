const db = require('./connection-postgres');

/**
 * Verifica se múltiplos nomes já confirmaram presença
 */
async function verificarDuplicatas(nomes) {
  try {
    if (!Array.isArray(nomes) || nomes.length === 0) {
      return {};
    }
    
    const nomesTrimmed = nomes.map(nome => nome.trim());
    
    // PostgreSQL usa $1, $2, etc para placeholders
    const placeholders = nomesTrimmed.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await db.executarQuery(
      `SELECT LOWER(nome) as nome_lower FROM confirmacoes WHERE LOWER(nome) IN (${placeholders})`,
      nomesTrimmed
    );
    
    const nomesExistentesSet = new Set(
      result.rows.map(row => row.nome_lower)
    );
    
    const resultado = {};
    nomesTrimmed.forEach(nome => {
      resultado[nome] = nomesExistentesSet.has(nome.toLowerCase());
    });
    
    return resultado;
  } catch (error) {
    console.error('Erro ao verificar duplicatas:', error);
    throw error;
  }
}

/**
 * Salva confirmação com convidado principal e acompanhantes
 */
async function salvarConfirmacaoComAcompanhantes(nomePrincipal, acompanhantes = []) {
  const client = db.getPool();
  
  try {
    await client.query('BEGIN');
    
    const nomePrincipalTrimmed = nomePrincipal.trim();
    const acompanhantesTrimmed = acompanhantes.map(nome => nome.trim());
    
    // Verificar duplicatas
    const todosNomes = [nomePrincipalTrimmed, ...acompanhantesTrimmed];
    const duplicatas = await verificarDuplicatas(todosNomes);
    
    const nomeDuplicado = Object.keys(duplicatas).find(nome => duplicatas[nome]);
    if (nomeDuplicado) {
      const error = new Error('DUPLICATA');
      error.duplicatas = duplicatas;
      throw error;
    }
    
    // Inserir convidado principal
    const resultPrincipal = await client.query(
      'INSERT INTO confirmacoes (nome) VALUES ($1) RETURNING *',
      [nomePrincipalTrimmed]
    );
    
    const confirmacaoPrincipal = resultPrincipal.rows[0];
    const principalId = confirmacaoPrincipal.id;
    
    console.log(`✅ Confirmação principal salva: ${confirmacaoPrincipal.nome} (ID: ${principalId})`);
    
    // Inserir acompanhantes
    const confirmacoesAcompanhantes = [];
    for (const nomeAcompanhante of acompanhantesTrimmed) {
      const resultAcomp = await client.query(
        'INSERT INTO confirmacoes (nome, id_principal) VALUES ($1, $2) RETURNING *',
        [nomeAcompanhante, principalId]
      );
      
      const confirmacaoAcompanhante = resultAcomp.rows[0];
      confirmacoesAcompanhantes.push(confirmacaoAcompanhante);
      console.log(`✅ Acompanhante salvo: ${confirmacaoAcompanhante.nome} (ID: ${confirmacaoAcompanhante.id})`);
    }
    
    await client.query('COMMIT');
    
    return {
      principal: confirmacaoPrincipal,
      acompanhantes: confirmacoesAcompanhantes
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao salvar confirmação:', error);
    throw error;
  }
}

/**
 * Lista todas as confirmações
 */
async function listarConfirmacoes() {
  try {
    const result = await db.executarQuery(
      'SELECT * FROM confirmacoes ORDER BY data_confirmacao DESC'
    );
    
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar confirmações:', error);
    throw error;
  }
}

/**
 * Conta o total de confirmações
 */
async function contarConfirmacoes() {
  try {
    const result = await db.executarQuery(
      'SELECT COUNT(*) as total FROM confirmacoes'
    );
    
    return parseInt(result.rows[0].total);
  } catch (error) {
    console.error('Erro ao contar confirmações:', error);
    throw error;
  }
}

module.exports = {
  verificarDuplicatas,
  salvarConfirmacaoComAcompanhantes,
  listarConfirmacoes,
  contarConfirmacoes
};
