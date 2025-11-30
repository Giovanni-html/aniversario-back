-- Criar tabela de confirmações para SQLite
-- Suporta convidado principal e acompanhantes
CREATE TABLE IF NOT EXISTS confirmacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'principal',
    convidado_principal_id INTEGER,
    data_confirmacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (convidado_principal_id) 
        REFERENCES confirmacoes(id) 
        ON DELETE CASCADE
);

-- Criar índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_nome ON confirmacoes(nome COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tipo ON confirmacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_principal ON confirmacoes(convidado_principal_id);
