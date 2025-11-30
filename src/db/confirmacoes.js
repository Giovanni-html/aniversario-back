const db = require('./connection');

/**
 * Verifica se um nome já confirmou presença
 * @param {string} nome - Nome do convidado
 * @returns {Promise<boolean>} True se já existe, False caso contrário
 */
async function verificarDuplicata(nome) {
  try {
    const nomeTrimmed = nome.trim();
    
    const resultado = await db.executarQueryUnica(
      'SELECT COUNT(*) as count FROM confirmacoes WHERE LOWER(nome) = LOWER(?)',
      [nomeTrimmed]
    );
    
    return resultado.count > 0;
  } catch (error) {
    console.error('Erro ao verificar duplicata:', error);
    throw error;
  }
}

/**
 * Verifica se múltiplos nomes já confirmaram presença (batch checking)
 * @param {string[]} nomes - Array de nomes dos convidados
 * @returns {Promise<{[nome: string]: boolean}>} Objeto com cada nome e se é duplicata
 */
async function verificarDuplicatas(nomes) {
  try {
    if (!Array.isArray(nomes) || nomes.length === 0) {
      return {};
    }
    
    // Trim todos os nomes
    const nomesTrimmed = nomes.map(nome => nome.trim());
    
    // Criar placeholders para a query IN (?, ?, ?)
    const placeholders = nomesTrimmed.map(() => 'LOWER(?)').join(', ');
    
    // Buscar todos os nomes que já existem no banco
    const nomesExistentes = await db.executarQuery(
      `SELECT LOWER(nome) as nome_lower FROM confirmacoes WHERE LOWER(nome) IN (${placeholders})`,
      nomesTrimmed
    );
    
    // Criar set com nomes existentes para lookup rápido
    const nomesExistentesSet = new Set(
      nomesExistentes.map(row => row.nome_lower)
    );
    
    // Criar objeto de resultado
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
 * Salva uma nova confirmação no banco de dados (versão legada - mantida para compatibilidade)
 * @param {string} nome - Nome do convidado
 * @returns {Promise<{id: number, nome: string, data_confirmacao: string}>} Dados da confirmação criada
 */
async function salvarConfirmacao(nome) {
  try {
    const nomeTrimmed = nome.trim();
    
    // Verificar se já existe
    const jaExiste = await verificarDuplicata(nomeTrimmed);
    if (jaExiste) {
      throw new Error('DUPLICATA');
    }
    
    // Inserir nova confirmação como principal
    const resultado = await db.executarComando(
      'INSERT INTO confirmacoes (nome, tipo) VALUES (?, ?)',
      [nomeTrimmed, 'principal']
    );
    
    // Buscar a confirmação criada
    const confirmacao = await db.executarQueryUnica(
      'SELECT * FROM confirmacoes WHERE id = ?',
      [resultado.lastID]
    );
    
    console.log(`✅ Confirmação salva: ${confirmacao.nome} (ID: ${confirmacao.id})`);
    
    return confirmacao;
  } catch (error) {
    if (error.message === 'DUPLICATA') {
      throw error;
    }
    console.error('Erro ao salvar confirmação:', error);
    throw error;
  }
}

/**
 * Salva confirmação com convidado principal e acompanhantes
 * @param {string} nomePrincipal - Nome do convidado principal
 * @param {string[]} acompanhantes - Array de nomes dos acompanhantes (opcional)
 * @returns {Promise<{principal: Object, acompanhantes: Array}>} Dados das confirmações criadas
 */
async function salvarConfirmacaoComAcompanhantes(nomePrincipal, acompanhantes = []) {
  return await db.executarEmTransacao(async () => {
    try {
      const nomePrincipalTrimmed = nomePrincipal.trim();
      const acompanhantesTrimmed = acompanhantes.map(nome => nome.trim());
      
      // Verificar duplicatas em lote
      const todosNomes = [nomePrincipalTrimmed, ...acompanhantesTrimmed];
      const duplicatas = await verificarDuplicatas(todosNomes);
      
      // Verificar se algum nome é duplicata
      const nomeDuplicado = Object.keys(duplicatas).find(nome => duplicatas[nome]);
      if (nomeDuplicado) {
        const error = new Error('DUPLICATA');
        error.duplicatas = duplicatas;
        throw error;
      }
      
      // Inserir convidado principal
      const resultadoPrincipal = await db.executarComando(
        'INSERT INTO confirmacoes (nome, tipo) VALUES (?, ?)',
        [nomePrincipalTrimmed, 'principal']
      );
      
      const principalId = resultadoPrincipal.lastID;
      
      // Buscar confirmação principal criada
      const confirmacaoPrincipal = await db.executarQueryUnica(
        'SELECT * FROM confirmacoes WHERE id = ?',
        [principalId]
      );
      
      console.log(`✅ Confirmação principal salva: ${confirmacaoPrincipal.nome} (ID: ${principalId})`);
      
      // Inserir acompanhantes
      const confirmacoesAcompanhantes = [];
      for (const nomeAcompanhante of acompanhantesTrimmed) {
        const resultadoAcompanhante = await db.executarComando(
          'INSERT INTO confirmacoes (nome, tipo, convidado_principal_id) VALUES (?, ?, ?)',
          [nomeAcompanhante, 'acompanhante', principalId]
        );
        
        const confirmacaoAcompanhante = await db.executarQueryUnica(
          'SELECT * FROM confirmacoes WHERE id = ?',
          [resultadoAcompanhante.lastID]
        );
        
        confirmacoesAcompanhantes.push(confirmacaoAcompanhante);
        console.log(`✅ Acompanhante salvo: ${confirmacaoAcompanhante.nome} (ID: ${confirmacaoAcompanhante.id})`);
      }
      
      return {
        principal: confirmacaoPrincipal,
        acompanhantes: confirmacoesAcompanhantes
      };
    } catch (error) {
      // Erro será capturado pelo executarEmTransacao que fará o rollback
      console.error('Erro ao salvar confirmação com acompanhantes:', error);
      throw error;
    }
  });
}

/**
 * Busca todas as confirmações
 * @returns {Promise<Array>} Lista de todas as confirmações
 */
async function listarConfirmacoes() {
  try {
    const confirmacoes = await db.executarQuery(
      'SELECT * FROM confirmacoes ORDER BY data_confirmacao DESC'
    );
    
    return confirmacoes;
  } catch (error) {
    console.error('Erro ao listar confirmações:', error);
    throw error;
  }
}

/**
 * Busca uma confirmação por nome
 * @param {string} nome - Nome do convidado
 * @returns {Promise<Object|null>} Dados da confirmação ou null se não encontrado
 */
async function buscarPorNome(nome) {
  try {
    const nomeTrimmed = nome.trim();
    
    const confirmacao = await db.executarQueryUnica(
      'SELECT * FROM confirmacoes WHERE LOWER(nome) = LOWER(?)',
      [nomeTrimmed]
    );
    
    return confirmacao || null;
  } catch (error) {
    console.error('Erro ao buscar confirmação:', error);
    throw error;
  }
}

/**
 * Conta o total de confirmações
 * @returns {Promise<number>} Número total de confirmações
 */
async function contarConfirmacoes() {
  try {
    const resultado = await db.executarQueryUnica(
      'SELECT COUNT(*) as total FROM confirmacoes'
    );
    
    return resultado.total;
  } catch (error) {
    console.error('Erro ao contar confirmações:', error);
    throw error;
  }
}

/**
 * Remove uma confirmação (útil para testes)
 * @param {number} id - ID da confirmação
 * @returns {Promise<boolean>} True se removido com sucesso
 */
async function removerConfirmacao(id) {
  try {
    const resultado = await db.executarComando(
      'DELETE FROM confirmacoes WHERE id = ?',
      [id]
    );
    
    return resultado.changes > 0;
  } catch (error) {
    console.error('Erro ao remover confirmação:', error);
    throw error;
  }
}

module.exports = {
  verificarDuplicata,
  verificarDuplicatas,
  salvarConfirmacao,
  salvarConfirmacaoComAcompanhantes,
  listarConfirmacoes,
  buscarPorNome,
  contarConfirmacoes,
  removerConfirmacao
};
