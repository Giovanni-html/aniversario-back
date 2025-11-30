const { spawn } = require('child_process');
const path = require('path');

/**
 * Envia email de notificação usando o script Python
 * @param {string|string[]} nomeConvidado - Nome do convidado ou array de nomes (principal + acompanhantes)
 * @param {string} timestamp - Data e hora da confirmação
 * @returns {Promise<boolean>} True se enviado com sucesso
 */
function enviarEmail(nomeConvidado, timestamp) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'notificacao.py');
    
    // Converter array de nomes em string separada por vírgulas
    const nomesString = Array.isArray(nomeConvidado) 
      ? nomeConvidado.join(',') 
      : nomeConvidado;
    
    // Executar script Python
    const python = spawn('python', [scriptPath, nomesString, timestamp]);
    
    let output = '';
    let errorOutput = '';
    
    // Capturar saída padrão
    python.stdout.on('data', (data) => {
      const texto = data.toString();
      output += texto;
      console.log(texto.trim());
    });
    
    // Capturar saída de erro
    python.stderr.on('data', (data) => {
      const texto = data.toString();
      errorOutput += texto;
      console.error(texto.trim());
    });
    
    // Quando o processo terminar
    python.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        console.error(`❌ Script Python terminou com código ${code}`);
        if (errorOutput) {
          console.error('Erro:', errorOutput);
        }
        // Não rejeitar - apenas retornar false
        // Isso permite que a confirmação continue mesmo se o email falhar
        resolve(false);
      }
    });
    
    // Tratar erro ao executar o processo
    python.on('error', (error) => {
      console.error('❌ Erro ao executar script Python:', error.message);
      // Não rejeitar - apenas retornar false
      resolve(false);
    });
  });
}

module.exports = { enviarEmail };
