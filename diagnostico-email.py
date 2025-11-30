#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

print('='*50)
print('DIAGNOSTICO DE CONFIGURACAO DE EMAIL')
print('='*50)
print()

# Verificar configurações
email_user = os.getenv('EMAIL_USER')
email_password = os.getenv('EMAIL_PASSWORD')
email_to = os.getenv('EMAIL_TO')
email_host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
email_port = os.getenv('EMAIL_PORT', '587')

print('1. EMAIL_USER:', email_user if email_user else '[NAO CONFIGURADO]')
print('2. EMAIL_PASSWORD:', '*' * len(email_password) if email_password else '[NAO CONFIGURADO]')
print('   Tamanho da senha:', len(email_password) if email_password else 0, 'caracteres')
print('   (Senha de app do Gmail deve ter 16 caracteres)')
print('3. EMAIL_TO:', email_to if email_to else '[NAO CONFIGURADO]')
print('4. EMAIL_HOST:', email_host)
print('5. EMAIL_PORT:', email_port)
print()

# Verificações
problemas = []

if not email_user:
    problemas.append('EMAIL_USER nao esta configurado')
elif '@gmail.com' not in email_user:
    problemas.append('EMAIL_USER nao parece ser um email do Gmail')

if not email_password:
    problemas.append('EMAIL_PASSWORD nao esta configurado')
elif len(email_password) != 16:
    problemas.append(f'EMAIL_PASSWORD tem {len(email_password)} caracteres, deveria ter 16')
elif ' ' in email_password:
    problemas.append('EMAIL_PASSWORD contem espacos (remova os espacos)')

if not email_to:
    problemas.append('EMAIL_TO nao esta configurado')

if problemas:
    print('[PROBLEMAS ENCONTRADOS]')
    for i, problema in enumerate(problemas, 1):
        print(f'  {i}. {problema}')
    print()
    print('[SOLUCAO]')
    print('1. Acesse: https://myaccount.google.com/security')
    print('2. Ative "Verificacao em duas etapas"')
    print('3. Procure por "Senhas de app"')
    print('4. Gere uma nova senha de app')
    print('5. Copie a senha SEM ESPACOS (16 caracteres)')
    print('6. Cole no arquivo .env em EMAIL_PASSWORD')
else:
    print('[OK] Configuracao parece correta!')
    print()
    print('Se ainda assim nao funcionar:')
    print('1. Verifique se a senha de app esta correta')
    print('2. Tente gerar uma nova senha de app')
    print('3. Verifique sua conexao com a internet')

print()
print('='*50)
