# Backend - Sistema de Confirmação de Presença

Backend em Node.js para o sistema de confirmação de presença do aniversário.

## Tecnologias

- Node.js v22.17.1
- Express.js
- SQLite 3 (banco de dados em arquivo)
- Python 3.13 (para envio de emails)

## Instalação

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
   - Edite o arquivo `.env` com suas credenciais de email

3. Criar banco de dados SQLite:
```bash
node criar-banco-sqlite.js
```

Ou execute o arquivo `criar-banco-sqlite.bat`

## Configuração do Banco de Dados

Execute o script para criar o banco SQLite:
```bash
node criar-banco-sqlite.js
```

Isso criará o arquivo `database.sqlite` com a tabela `confirmacoes`:
  - `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
  - `nome` (TEXT, UNIQUE, NOT NULL)
  - `data_confirmacao` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

## Executar

```bash
npm start
```

Ou:

```bash
node src/server.js
```

O servidor estará disponível em: `http://localhost:3000`

## Endpoints da API

### POST /api/confirmar-presenca

Confirma a presença de um convidado.

**Request Body:**
```json
{
  "nome": "Nome do Convidado"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "Presença confirmada com sucesso",
  "sugestoes_presentes": ["Perfume", "Joia", "Bolsa", ...]
}
```

**Response (Duplicata):**
```json
{
  "success": false,
  "message": "Sua presença já foi confirmada anteriormente"
}
```

**Response (Erro):**
```json
{
  "success": false,
  "message": "Erro ao processar sua confirmação. Tente novamente."
}
```

## Estrutura de Diretórios

```
aniversario-back/
├── src/
│   ├── api/
│   │   └── confirmar.js       # Lógica da API de confirmação
│   ├── db/
│   │   └── connection.js      # Conexão com MySQL
│   ├── email/
│   │   └── notificacao.py     # Serviço de envio de email
│   └── server.js              # Servidor Express
├── .env                       # Variáveis de ambiente
├── database.sql               # Script de criação do banco
├── package.json               # Dependências do projeto
└── README.md                  # Este arquivo
```

## Variáveis de Ambiente

Configure no arquivo `.env`:

- `DB_PATH` - Caminho do banco SQLite (padrão: ./database.sqlite)
- `PORT` - Porta do servidor (padrão: 3000)
- `EMAIL_HOST` - Servidor SMTP (padrão: smtp.gmail.com)
- `EMAIL_PORT` - Porta SMTP (padrão: 587)
- `EMAIL_USER` - Email remetente
- `EMAIL_PASSWORD` - Senha de app do Gmail
- `EMAIL_TO` - Email destinatário (gatinha@gmail.com)

## Configuração de Email Gmail

Para usar o Gmail para enviar emails:

1. Acesse sua conta Google
2. Vá em "Segurança" > "Verificação em duas etapas"
3. Ative a verificação em duas etapas
4. Vá em "Senhas de app"
5. Gere uma senha de app para "Email"
6. Use essa senha no campo `EMAIL_PASSWORD` do `.env`
