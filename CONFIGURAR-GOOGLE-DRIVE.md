# 🔐 Configuração do Google Drive para Upload de Fotos

Este guia explica como configurar o Google Drive para receber as fotos enviadas pelos convidados.

## Passo 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Clique em **"Selecionar projeto"** > **"Novo Projeto"**
3. Nome: `aniversario-beh` (ou qualquer nome)
4. Clique em **"Criar"**

## Passo 2: Ativar API do Google Drive

1. No menu lateral, vá em **"APIs e Serviços"** > **"Biblioteca"**
2. Pesquise por **"Google Drive API"**
3. Clique nela e depois em **"Ativar"**

## Passo 3: Criar Service Account

1. Vá em **"APIs e Serviços"** > **"Credenciais"**
2. Clique em **"Criar credenciais"** > **"Conta de serviço"**
3. Preencha:
   - Nome: `fotos-upload`
   - ID: deixe o padrão
   - Descrição: `Conta para upload de fotos da festa`
4. Clique em **"Criar e continuar"**
5. Pule a etapa de permissões (clique em "Continuar")
6. Clique em **"Concluído"**

## Passo 4: Gerar Chave JSON

1. Na lista de contas de serviço, clique na que você acabou de criar
2. Vá na aba **"Chaves"**
3. Clique em **"Adicionar chave"** > **"Criar nova chave"**
4. Selecione **JSON** e clique em **"Criar"**
5. O arquivo JSON será baixado automaticamente
6. **GUARDE ESTE ARQUIVO COM SEGURANÇA!**

## Passo 5: Criar Pasta no Google Drive

1. Acesse [Google Drive](https://drive.google.com)
2. Crie uma nova pasta: **"Fotos Aniversário Beh"**
3. Clique com botão direito na pasta > **"Compartilhar"**
4. Adicione o email do Service Account (está no arquivo JSON como `client_email`)
   - Exemplo: `fotos-upload@aniversario-beh.iam.gserviceaccount.com`
5. Dê permissão de **"Editor"**
6. Clique em **"Compartilhar"**

## Passo 6: Obter ID da Pasta

1. Abra a pasta no Google Drive
2. A URL será algo como: `https://drive.google.com/drive/folders/ABC123XYZ...`
3. Copie o ID da pasta (a parte depois de `/folders/`)
   - Exemplo: `ABC123XYZ...`

## Passo 7: Configurar Variáveis de Ambiente

No backend (arquivo `.env` ou variáveis no Render), adicione:

```env
# Google Drive Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=fotos-upload@aniversario-beh.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvg...(conteúdo da chave)...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=ABC123XYZ...
```

### ⚠️ Importante sobre a PRIVATE_KEY:

1. Abra o arquivo JSON baixado
2. Copie o valor de `private_key` (incluindo as aspas)
3. As quebras de linha (`\n`) devem ser mantidas
4. No Render, cole a chave diretamente (sem aspas extras)

## Passo 8: Testar

1. Inicie o backend: `npm start`
2. Acesse `http://localhost:8000/memorias.html`
3. Tente enviar uma foto
4. Verifique se aparece na pasta do Google Drive!

---

## Configuração no Render (Produção)

1. Acesse seu app no [Render Dashboard](https://dashboard.render.com)
2. Vá em **"Environment"**
3. Adicione as 3 variáveis:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_DRIVE_FOLDER_ID`
4. Clique em **"Save Changes"**
5. O deploy será feito automaticamente

---

## 🎉 Pronto!

Agora as fotos enviadas pelos convidados irão direto para a pasta do Google Drive!
