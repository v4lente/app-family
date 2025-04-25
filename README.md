# App Family

Aplicativo web para registro e acompanhamento de atividades familiares/domésticas, com arquitetura modular e foco em mobile-first.

## Tecnologias
- **Backend:** Go (Fiber ou Gin), API RESTful, JWT, bcrypt, PostgreSQL/SQLite
- **Frontend:** Next.js (React), consumo de API REST, autenticação JWT
- **Docker:** Facilita ambiente de desenvolvimento

## Funcionalidades (MVP)
- Cadastro/login de usuários
- Criação/gerenciamento de grupos familiares
- Registro e histórico de atividades
- Estatísticas e ranking
- Exportação de dados (CSV/PDF)

## Estrutura do Projeto
```
app-family/
├── backend/        # Código Go (API REST)
├── frontend/       # Next.js (React)
├── README.md
├── docker-compose.yml
└── prompt-atividades-familia
```

## Como rodar localmente
1. Clone o repositório:
   ```sh
   git clone https://github.com/v4lente/app-family.git
   ```
2. Configure variáveis de ambiente conforme necessário (ver exemplos em cada serviço)
3. Rode com Docker Compose:
   ```sh
   docker-compose up --build
   ```

## Prompt do Projeto
Veja detalhes e requisitos no arquivo `prompt-atividades-familia`.

---

> Desenvolvido por v4lente
