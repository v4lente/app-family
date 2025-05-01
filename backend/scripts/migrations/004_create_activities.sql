CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    created_by INTEGER REFERENCES users(id), -- null para atividades padrão
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
