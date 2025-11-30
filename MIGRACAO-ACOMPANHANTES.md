# Migração do Schema - Suporte a Acompanhantes

## Visão Geral

Esta migração adiciona suporte para que convidados possam trazer até 3 acompanhantes ao confirmar presença no aniversário.

## Mudanças no Schema

### Novas Colunas

1. **tipo** (TEXT, NOT NULL, DEFAULT 'principal')
   - Indica se o registro é um convidado principal ou acompanhante
   - Valores possíveis: 'principal' ou 'acompanhante'

2. **convidado_principal_id** (INTEGER, NULL)
   - Referência ao ID do convidado principal
   - NULL para registros principais
   - Contém o ID do principal para acompanhantes

### Foreign Key

- `convidado_principal_id` → `confirmacoes(id)` ON DELETE CASCADE
- Quando um convidado principal é removido, todos os seus acompanhantes são removidos automaticamente

### Índices

1. **idx_nome** - Busca rápida por nome (case-insensitive)
2. **idx_tipo** - Filtragem por tipo de convidado
3. **idx_principal** - Busca de acompanhantes por convidado principal

## Como Executar a Migração

### Opção 1: Script Batch (Windows)
```bash
migrar-schema-acompanhantes.bat
```

### Opção 2: Node.js Direto
```bash
node migrar-schema-acompanhantes.js
```

## O Que a Migração Faz

1. ✅ Verifica se o schema já está atualizado
2. ✅ Cria backup da tabela existente
3. ✅ Remove a tabela antiga
4. ✅ Cria nova tabela com schema atualizado
5. ✅ Cria os índices necessários
6. ✅ Migra todos os registros existentes (tipo='principal')
7. ✅ Remove o backup
8. ✅ Valida a migração

## Segurança

- A migração cria um backup antes de fazer qualquer alteração
- Se algo der errado, o backup é restaurado automaticamente
- Todos os registros existentes são preservados
- A migração é idempotente (pode ser executada múltiplas vezes)

## Verificar Schema

Para verificar se a migração foi bem-sucedida:

```bash
node verificar-schema.js
```

## Estrutura Final

```sql
CREATE TABLE confirmacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'principal',
  convidado_principal_id INTEGER,
  data_confirmacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (convidado_principal_id) 
    REFERENCES confirmacoes(id) 
    ON DELETE CASCADE
);

CREATE INDEX idx_nome ON confirmacoes(nome COLLATE NOCASE);
CREATE INDEX idx_tipo ON confirmacoes(tipo);
CREATE INDEX idx_principal ON confirmacoes(convidado_principal_id);
```

## Exemplo de Dados

### Convidado Principal
```json
{
  "id": 1,
  "nome": "João Silva",
  "tipo": "principal",
  "convidado_principal_id": null,
  "data_confirmacao": "2025-01-05T10:30:00Z"
}
```

### Acompanhante
```json
{
  "id": 2,
  "nome": "Maria Silva",
  "tipo": "acompanhante",
  "convidado_principal_id": 1,
  "data_confirmacao": "2025-01-05T10:30:00Z"
}
```

## Rollback

Se precisar reverter a migração:

1. Restaure o backup do banco de dados (se disponível)
2. Ou recrie o banco usando o schema antigo:
   ```bash
   # Backup do banco atual
   copy database.sqlite database-com-acompanhantes.sqlite
   
   # Recriar banco com schema antigo
   del database.sqlite
   # Use o schema antigo para recriar
   ```

## Próximos Passos

Após executar a migração:

1. ✅ Atualizar funções do banco de dados (Task 2)
2. ✅ Atualizar API endpoint (Task 3)
3. ✅ Atualizar template de email (Task 4)
4. ✅ Implementar UI para adicionar acompanhantes (Tasks 6-13)
