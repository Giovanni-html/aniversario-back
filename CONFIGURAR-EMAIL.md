# Como Configurar o Envio de Emails

O sistema envia emails automáticos para `gatinha@gmail.com` sempre que alguém confirma presença.

## 📋 Pré-requisitos

- Conta Gmail
- Python 3.x instalado (você já tem!)
- Biblioteca `python-dotenv` (vamos instalar)

## 🔧 Passo a Passo

### 1. Instalar Dependência Python

Abra o terminal e execute:

```bash
pip install python-dotenv
```

### 2. Criar Senha de App no Gmail

O Gmail não permite usar a senha normal para aplicativos. Você precisa criar uma "Senha de App":

1. **Acesse sua Conta Google:** https://myaccount.google.com/
2. **Vá em "Segurança"**
3. **Ative "Verificação em duas etapas"** (se ainda não estiver ativa)
4. **Volte em "Segurança"** e procure por **"Senhas de app"**
5. **Selecione:**
   - App: Email
   - Dispositivo: Windows Computer (ou outro)
6. **Clique em "Gerar"**
7. **Copie a senha gerada** (16 caracteres, sem espaços)

### 3. Configurar o arquivo .env

Abra o arquivo `.env` na pasta `aniversario-back` e configure:

```env
# Configurações de Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app-aqui
EMAIL_TO=gatinha@gmail.com
```

**Exemplo:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=joao.silva@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_TO=gatinha@gmail.com
```

### 4. Testar o Envio

Execute o teste:

```bash
node testar-email.js
```

Se tudo estiver correto, você verá:
```
✅ Email enviado com sucesso!
```

E `gatinha@gmail.com` receberá um email de teste.

## 🎨 Formato do Email

O email enviado terá:
- **Assunto:** 🎉 Nova Confirmação de Presença - Aniversário
- **Design:** Cores prata e rose gold
- **Conteúdo:**
  - Nome do convidado
  - Data e hora da confirmação
  - Formatação HTML bonita

## ⚠️ Problemas Comuns

### "Erro de autenticação"
- Verifique se está usando uma **Senha de App**, não a senha normal
- Confirme que a verificação em duas etapas está ativa
- Verifique se o EMAIL_USER está correto

### "Conexão recusada"
- Verifique sua conexão com a internet
- Confirme que EMAIL_HOST e EMAIL_PORT estão corretos

### "Email não enviado"
- O sistema continua funcionando normalmente!
- A confirmação é salva mesmo se o email falhar
- Você pode configurar o email depois

## 🔒 Segurança

- **NUNCA** compartilhe sua senha de app
- **NUNCA** faça commit do arquivo `.env` no Git
- O arquivo `.env` já está no `.gitignore`

## 💡 Dica

Se você não quiser configurar o email agora, tudo bem! O sistema funciona perfeitamente sem ele. As confirmações serão salvas no banco de dados normalmente.

Você pode configurar o email mais tarde quando quiser.
