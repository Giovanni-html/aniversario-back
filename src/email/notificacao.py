#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import smtplib
import sys
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def enviar_notificacao(nome_convidado, timestamp=None):
    """
    Envia email de notificação para gatinha@gmail.com
    
    Args:
        nome_convidado (str): Nome do convidado ou nomes separados por vírgula (principal,acomp1,acomp2)
        timestamp (str, optional): Data e hora da confirmação. Se None, usa a hora atual.
        
    Returns:
        bool: True se enviado com sucesso, False caso contrário
    """
    try:
        # Configurações do email
        email_host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        email_port = int(os.getenv('EMAIL_PORT', '587'))
        email_user = os.getenv('EMAIL_USER')
        email_password = os.getenv('EMAIL_PASSWORD')
        email_to = os.getenv('EMAIL_TO', 'gatinha@gmail.com')
        
        # Validar configurações
        if not email_user or not email_password:
            print('[ERRO] EMAIL_USER e EMAIL_PASSWORD devem estar configurados no .env')
            return False
        
        # Usar timestamp fornecido ou gerar um novo
        if timestamp is None:
            timestamp = datetime.now().strftime('%d/%m/%Y às %H:%M:%S')
        
        # Processar nomes (pode ser um único nome ou múltiplos separados por vírgula)
        nomes = [n.strip() for n in nome_convidado.split(',')]
        nome_principal = nomes[0]
        acompanhantes = nomes[1:] if len(nomes) > 1 else []
        
        # Criar mensagem
        mensagem = MIMEMultipart('alternative')
        mensagem['Subject'] = 'Nova Confirmacao de Presenca - 18 Anos da Brenda'
        mensagem['From'] = email_user
        mensagem['To'] = email_to
        
        # Corpo do email em texto
        if acompanhantes:
            lista_acompanhantes = '\n'.join([f'  - {nome}' for nome in acompanhantes])
            texto = f"""
Ola!

{nome_principal} confirmou presenca para os 18 anos da Brenda!

Acompanhantes:
{lista_acompanhantes}

Data/Hora da confirmacao: {timestamp}

Detalhes da Festa:
- Data: 10 de Janeiro
- Horario: 19:00
- Local: Rua Alegre, 123 - Cidade Brasileira

Ate breve!
        """
        else:
            texto = f"""
Ola!

{nome_principal} confirmou presenca para os 18 anos da Brenda!

Data/Hora da confirmacao: {timestamp}

Detalhes da Festa:
- Data: 10 de Janeiro
- Horario: 19:00
- Local: Rua Alegre, 123 - Cidade Brasileira

Ate breve!
        """
        
        # Corpo do email em HTML - versao compacta com info transparente
        if acompanhantes:
            # Criar lista HTML de acompanhantes
            lista_html = ''.join([f'<li style="color:#666!important;font-size:14px;margin:4px 0">{nome}</li>' for nome in acompanhantes])
            nomes_html = f"""
                <div style="font-size:20px;font-weight:bold;color:#B76E79!important;text-align:center;margin:8px 0">{nome_principal}</div>
                <p style="text-align:center;color:#666!important;font-size:14px;margin:10px 0">Confirmou presenca com acompanhantes!</p>
                <div style="background:#f9f9f9!important;padding:12px;border-radius:8px;margin:12px 0">
                    <p style="margin:0 0 8px 0;font-size:13px;color:#B76E79!important;font-weight:bold">Acompanhantes:</p>
                    <ul style="margin:0;padding-left:20px;list-style:none">
                        {lista_html}
                    </ul>
                </div>
            """
        else:
            nomes_html = f"""
                <div style="font-size:20px;font-weight:bold;color:#B76E79!important;text-align:center;margin:8px 0">{nome_principal}</div>
                <p style="text-align:center;color:#666!important;font-size:14px;margin:10px 0">Confirmou presenca!</p>
            """
        
        html = f"""<html><head><meta name="color-scheme" content="light only"><style>*{{color-scheme:light only}}</style></head><body style="margin:0;padding:10px"><div style="max-width:550px;margin:0 auto;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#C0C0C0,#B76E79)!important;color:#fff!important;padding:15px;text-align:center"><h1 style="margin:0;font-size:18px;letter-spacing:1px;color:#fff!important">MINHA FESTA DE 18</h1><p style="margin:3px 0;font-size:11px;color:#fff!important">Nova confirmacao</p></div><div style="background:#fff!important;padding:15px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">{nomes_html}<div style="background:transparent!important;padding:15px;border-radius:8px;margin:15px 0;border-left:3px solid #B76E79"><p style="margin:6px 0;font-size:14px;color:#333!important"><b>Data:</b> {timestamp}</p></div></div></div></body></html>"""
        
        # Anexar partes da mensagem
        parte_texto = MIMEText(texto, 'plain', 'utf-8')
        parte_html = MIMEText(html, 'html', 'utf-8')
        
        mensagem.attach(parte_texto)
        mensagem.attach(parte_html)
        
        # Conectar ao servidor SMTP
        print(f'[EMAIL] Conectando ao servidor {email_host}:{email_port}...')
        servidor = smtplib.SMTP(email_host, email_port)
        servidor.starttls()
        
        # Fazer login
        print('[EMAIL] Autenticando...')
        servidor.login(email_user, email_password)
        
        # Enviar email
        print(f'[EMAIL] Enviando email para {email_to}...')
        servidor.send_message(mensagem)
        
        # Fechar conexão
        servidor.quit()
        
        print(f'[SUCESSO] Email enviado para {email_to}')
        print(f'   Convidado: {nome_convidado}')
        print(f'   Timestamp: {timestamp}')
        
        return True
        
    except smtplib.SMTPAuthenticationError:
        print('[ERRO] Erro de autenticacao: Verifique EMAIL_USER e EMAIL_PASSWORD')
        print('   Para Gmail, use uma "Senha de App" ao inves da senha normal')
        return False
        
    except smtplib.SMTPException as e:
        print(f'[ERRO] Erro SMTP: {str(e)}')
        return False
        
    except Exception as e:
        print(f'[ERRO] Erro ao enviar email: {str(e)}')
        return False


if __name__ == '__main__':
    # Permitir execução via linha de comando
    if len(sys.argv) < 2:
        print('Uso: python notificacao.py "Nome do Convidado" ["timestamp"]')
        sys.exit(1)
    
    nome = sys.argv[1]
    timestamp = sys.argv[2] if len(sys.argv) > 2 else None
    
    sucesso = enviar_notificacao(nome, timestamp)
    sys.exit(0 if sucesso else 1)
