const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { dbConnection } = require('./db');
const { confirmarPresenca, listarConfirmacoes } = require('./api/confirmar');
const { limparBanco, estatisticas, dashboardStats, deletarConfirmacao } = require('./api/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permitir requisições do frontend
app.use(express.json({ limit: '10mb' })); // Parse JSON no body - limit increased for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse form data

// Middleware de log
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Rota de health check
app.get('/', (req, res) => {
  res.json({
    message: 'API de Confirmação de Presença - Aniversário',
    status: 'online',
    version: '1.1.0'
  });
});

// Rota para confirmar presença
app.post('/api/confirmar-presenca', confirmarPresenca);

// Rota para listar confirmações (admin)
app.get('/api/confirmacoes', listarConfirmacoes);

// Rotas de administração
app.post('/api/admin/limpar-banco', limparBanco);
app.get('/api/admin/estatisticas', estatisticas);
app.get('/api/admin/dashboard', dashboardStats);
app.delete('/api/admin/confirmacao/:id', deletarConfirmacao);



// Middleware de erro 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Inicializar banco de dados e iniciar servidor
async function iniciar() {
  try {
    console.log('🚀 Iniciando servidor...\n');
    
    // Conectar ao banco de dados
    await dbConnection.inicializarConexao();
    console.log('');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('✅ Servidor rodando!');
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log('========================================');
      console.log('\n📋 Rotas disponíveis:');
      console.log(`   GET  /                        - Health check`);
      console.log(`   POST /api/confirmar-presenca  - Confirmar presença`);
      console.log(`   GET  /api/confirmacoes        - Listar confirmações`);
      console.log('\n💡 Pressione Ctrl+C para parar o servidor\n');
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de encerramento gracioso
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Encerrando servidor...');
  
  try {
    await dbConnection.fecharConexao();
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar:', error);
    process.exit(1);
  }
});

// Iniciar aplicação
iniciar();

