const { confirmacoes } = require('../db');
const { enviarEmail } = require('../email/enviar-email-node');

// Lista de nomes bloqueados (não podem confirmar presença)
const NOMES_BLOQUEADOS = ['izabelle', 'iza', 'zabele', 'zaza'];

// Lista de sugestões de presentes
const SUGESTOES_PRESENTES = [
  'Perfume',
  'Joia (colar, brinco, pulseira)',
  'Bolsa',
  'Maquiagem',
  'Livro',
  'Vale-presente',
  'Flores',
  'Chocolates finos',
  'Vinho ou espumante',
  'Kit de skincare'
];

/**
 * Verifica se um nome está na lista de bloqueados
 * @param {string} nome - Nome a ser verificado
 * @returns {boolean} - true se o nome está bloqueado
 */
function isNomeBloqueado(nome) {
  const nomeNormalizado = nome.trim().toLowerCase();
  return NOMES_BLOQUEADOS.some(bloqueado => nomeNormalizado.includes(bloqueado));
}

/**
 * Handler para confirmar presença
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 */
async function confirmarPresenca(req, res) {
  try {
    const { nome, acompanhantes } = req.body;
    
    // Validação: nome não pode estar vazio
    if (!nome || nome.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe seu nome',
        campos_vazios: {
          nome: true,
          acompanhantes: []
        }
      });
    }
    
    // Validação: nome não pode ter apenas espaços
    if (nome.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe seu nome',
        campos_vazios: {
          nome: true,
          acompanhantes: []
        }
      });
    }
    
    // Validação: verificar se o nome está bloqueado
    if (isNomeBloqueado(nome)) {
      console.log(`🚫 Tentativa de confirmação com nome bloqueado: ${nome.trim()}`);
      return res.status(403).json({
        success: false,
        message: 'Essa pessoa não foi convidada',
        nome_bloqueado: true
      });
    }
    
    // Processar acompanhantes (se fornecidos)
    const acompanhantesArray = Array.isArray(acompanhantes) ? acompanhantes : [];
    
    // Validação: máximo de 3 acompanhantes
    if (acompanhantesArray.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Máximo de 3 acompanhantes permitidos'
      });
    }
    
    // Validação: verificar campos vazios nos acompanhantes
    const camposVaziosAcompanhantes = acompanhantesArray.map(acomp => 
      !acomp || acomp.trim() === ''
    );
    
    if (camposVaziosAcompanhantes.some(vazio => vazio)) {
      return res.status(400).json({
        success: false,
        message: 'Preencha todos os campos',
        campos_vazios: {
          nome: false,
          acompanhantes: camposVaziosAcompanhantes
        }
      });
    }
    
    // Validação: verificar se algum acompanhante está bloqueado
    const acompanhantesBloqueados = acompanhantesArray.map(acomp => isNomeBloqueado(acomp));
    
    if (acompanhantesBloqueados.some(bloqueado => bloqueado)) {
      const nomesBloqueados = acompanhantesArray.filter((_, index) => acompanhantesBloqueados[index]);
      console.log(`🚫 Tentativa de confirmação com acompanhante(s) bloqueado(s): ${nomesBloqueados.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        message: 'Essa pessoa não foi convidada',
        nome_bloqueado: true,
        acompanhantes_bloqueados: acompanhantesBloqueados
      });
    }
    
    console.log(`\n📝 Nova tentativa de confirmação: ${nome.trim()}`);
    if (acompanhantesArray.length > 0) {
      console.log(`   Com ${acompanhantesArray.length} acompanhante(s): ${acompanhantesArray.join(', ')}`);
    }
    
    // Verificar duplicatas em lote
    const todosNomes = [nome, ...acompanhantesArray];
    const duplicatas = await confirmacoes.verificarDuplicatas(todosNomes);
    
    // Verificar se algum nome é duplicata
    const temDuplicata = Object.values(duplicatas).some(isDup => isDup);
    
    if (temDuplicata) {
      console.log(`⚠️  Duplicata(s) detectada(s):`);
      Object.keys(duplicatas).forEach(n => {
        if (duplicatas[n]) {
          console.log(`   - ${n}`);
        }
      });
      
      // Mapear duplicatas para o formato esperado pelo frontend
      const duplicatasPorCampo = {
        nome: duplicatas[nome],
        acompanhantes: acompanhantesArray.map(acomp => duplicatas[acomp])
      };
      
      return res.status(409).json({
        success: false,
        message: 'Alguns nomes já foram confirmados',
        duplicatas: duplicatasPorCampo
      });
    }
    
    // Salvar confirmação com acompanhantes
    const resultado = await confirmacoes.salvarConfirmacaoComAcompanhantes(
      nome,
      acompanhantesArray
    );
    
    console.log(`✅ Confirmação salva: Principal ID ${resultado.principal.id}`);
    if (resultado.acompanhantes.length > 0) {
      console.log(`   + ${resultado.acompanhantes.length} acompanhante(s)`);
    }
    
    // Tentar enviar email (não bloqueia se falhar)
    // Converter para horário de Brasília (UTC-3)
    const timestamp = new Date(resultado.principal.data_confirmacao).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });
    
    // Preparar lista de todos os nomes para o email
    const todosNomesParaEmail = [
      resultado.principal.nome,
      ...resultado.acompanhantes.map(a => a.nome)
    ];
    
    enviarEmail(todosNomesParaEmail, timestamp)
      .then(sucesso => {
        if (sucesso) {
          console.log(`📧 Email enviado com sucesso`);
        } else {
          console.log(`⚠️  Email não enviado, mas confirmação foi salva`);
        }
      })
      .catch(error => {
        console.error(`❌ Erro ao enviar email:`, error.message);
        console.log(`   Confirmação foi salva normalmente`);
      });
    
    // Retornar sucesso com sugestões de presentes e dados das confirmações
    return res.status(200).json({
      success: true,
      message: 'Presença confirmada com sucesso',
      confirmacoes: [resultado.principal, ...resultado.acompanhantes],
      sugestoes_presentes: SUGESTOES_PRESENTES
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar confirmação:', error);
    
    // Se for erro de duplicata com informações detalhadas
    if (error.message === 'DUPLICATA' && error.duplicatas) {
      const duplicatasPorCampo = {
        nome: error.duplicatas[req.body.nome],
        acompanhantes: (req.body.acompanhantes || []).map(acomp => error.duplicatas[acomp])
      };
      
      return res.status(409).json({
        success: false,
        message: 'Alguns nomes já foram confirmados',
        duplicatas: duplicatasPorCampo
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar sua confirmação. Tente novamente.'
    });
  }
}

/**
 * Handler para listar todas as confirmações (útil para admin)
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 */
async function listarConfirmacoes(req, res) {
  try {
    const lista = await confirmacoes.listarConfirmacoes();
    const total = await confirmacoes.contarConfirmacoes();
    
    return res.status(200).json({
      success: true,
      total: total,
      confirmacoes: lista
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar confirmações:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar confirmações'
    });
  }
}

module.exports = {
  confirmarPresenca,
  listarConfirmacoes,
  SUGESTOES_PRESENTES
};
