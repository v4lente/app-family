# App Family

Aplicativo web para registro e acompanhamento de atividades familiares/domésticas, com arquitetura modularizada por domínio e foco em mobile-first. O aplicativo permite que usuários se cadastrem, criem ou participem de famílias, e registrem atividades realizadas, com histórico e estatísticas por família.

## Arquitetura Geral
- **Frontend:** Next.js (React 19), Tailwind CSS, design responsivo mobile-first
- **Backend:** Go (Fiber), API RESTful, JWT, bcrypt, PostgreSQL
- **Docker Compose:** Orquestração dos serviços (backend, frontend, banco de dados)
- **CI:** GitHub Actions para rodar testes automáticos no backend
- **Segurança:** Autenticação JWT, senhas com hash bcrypt, validação de entradas

## Estrutura do Projeto
```
app-family/
├── backend/        # API Go (Fiber)
│   ├── handlers.go         # Handlers principais
│   ├── handlers_user.go    # Handlers de usuários
│   ├── handlers_activity.go # Handlers de atividades
│   ├── handlers_family.go  # Handlers de famílias
│   ├── db.go               # Conexão com o banco
│   ├── main.go             # Ponto de entrada
│   ├── handlers_test.go    # Testes unitários
│   ├── scripts/            # Migrations SQL
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_families.sql
│   │   ├── 003_create_family_members.sql
│   │   ├── 004_create_activities.sql
│   │   └── 005_create_activity_logs.sql
│   └── go.mod / go.sum
├── frontend/       # Next.js + Tailwind
│   ├── src/
│   │   ├── app/            # Páginas da aplicação
│   │   │   ├── dashboard/  # Gerenciamento de membros
│   │   │   ├── family/     # Gerenciamento de famílias
│   │   │   ├── activities/ # Registro de atividades
│   │   │   ├── history/    # Histórico de atividades
│   │   │   ├── login/      # Autenticação
│   │   │   └── register/   # Cadastro de usuário
│   │   ├── components/     # Componentes reutilizáveis
│   │   └── config/         # Configurações
│   ├── package.json
│   └── ...
├── docker-compose.yml      # Orquestração de serviços
├── README.md               # Documentação
└── prompt-atividades-familia # Requisitos originais
```

## Como rodar localmente

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- Go e Node.js (opcional, para rodar serviços separadamente)

### 1. Clone o repositório
```sh
git clone <repo-url>
cd app-family
```

### 2. Instale as dependências do frontend
```sh
cd frontend
npm install
npm install react-router-dom @types/react-router-dom --save-dev
cd ..
```

### 3. Suba tudo com Docker Compose
```sh
docker-compose up --build
```
Acesse o frontend em [http://localhost:3000](http://localhost:3000)

### 4. Rode as migrations do banco
Os arquivos SQL de migration ficam em `backend/scripts/`. Para rodar todas as migrations:
```sh
docker-compose run --rm migrate
```
Isso irá criar todas as tabelas necessárias automaticamente.

### 5. Variáveis de ambiente
Veja exemplos em `backend/.env` e configure conforme necessário:
```
DB_HOST=db
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=appfamily
DB_PORT=5432
JWT_SECRET=secret123
```

---

## Testes automatizados do backend
- Testes unitários ficam em arquivos `_test.go` no backend (exemplo: `handlers_test.go`).
- Para rodar localmente:
  ```sh
  cd backend
  go test ./...
  ```
- Para rodar via CI/GitHub Actions, basta fazer push ou PR (veja `.github/workflows/test-backend.yml`).

---

## Como inspecionar o banco de dados
Acesse o container do banco:
```sh
docker exec -it atividadesdafamilia-db-1 psql -U postgres -d appfamily
```
Dentro do psql:
- Listar tabelas: `\dt`
- Listar relações: `\d`
- Ver estrutura de tabela: `\d nome_da_tabela`
- Sair: `\q`

---

## Funcionalidades Implementadas

### Módulo de Usuários
- Cadastro de novo membro (nome, email, senha)
- Login com autenticação JWT
- Redirecionamento automático após login bem-sucedido
- Dashboard com visualização, edição e exclusão/desativação de membros
- Associação automática de usuários com famílias

### Módulo de Famílias
- Criação automática de família ao registrar primeiro membro
- Associação de membros a famílias existentes
- Visualização de membros por família
- Filtro de membros por família no dashboard

### Módulo de Atividades
- Cadastro de atividades personalizadas
- Listagem de atividades disponíveis
- Registro de atividades realizadas por membros

### Módulo de Histórico
- Visualização do histórico de atividades por período (dia, semana, mês, ano)
- Filtro de histórico por membro e família

### Infraestrutura
- Migrations automáticas para o banco PostgreSQL
- Estrutura modularizada para expansão futura
- Docker Compose para fácil implantação
- Autenticação segura com JWT

### Fluxo implementado
1. Usuário faz cadastro como membro de uma família (rota de cadastro)
2. Usuário faz login (rota de login)
3. Após login bem-sucedido, token JWT é salvo no localStorage e usuário é redirecionado para `/dashboard`
4. Dashboard exibe todos os membros da família e permite filtrar por família
5. Usuário pode editar/excluir membros e visualizar detalhes da família
6. Usuário pode registrar atividades realizadas
7. Usuário pode visualizar histórico de atividades por período
8. Backend e banco de dados sobem via Docker Compose

### Variáveis de ambiente e configuração da API
- O frontend utiliza variáveis de ambiente para definir a URL base da API.
- Crie um arquivo `.env.local` na raiz do diretório `frontend` com o conteúdo:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

- Sempre que alterar esse arquivo, reinicie o servidor de desenvolvimento (`npm run dev`).
- Use o prefixo `NEXT_PUBLIC_` para variáveis que precisam ser acessíveis no navegador.

### Testes unitários do frontend
- O frontend possui testes unitários para as páginas de dashboard e edição de usuário.
- Para rodar os testes:
```sh
cd frontend
npm test
```

### Observações
- O frontend usa o roteamento nativo do Next.js (não é necessário react-router-dom).
- O backend responde em `http://localhost:8080/api` (ajuste se necessário).

## Roadmap
- [x] Backend Go + Fiber + JWT
- [x] Banco PostgreSQL com migrations versionadas
- [x] Frontend Next.js + Tailwind
- [x] Cadastro de usuário/membro
- [x] Login com token JWT e redirecionamento
- [x] Dashboard inicial com CRUD de usuários
- [x] Sistema de famílias e associação de membros
- [x] Filtro de membros por família
- [x] Cadastro e visualização de atividades
- [x] Registro de atividades realizadas
- [x] Histórico de atividades por período
- [ ] Estatísticas e ranking por família
- [ ] Convite de membros por link ou email
- [ ] Exportação de dados (CSV, PDF)

## Endpoints principais (backend)

### Autenticação e Usuários
- `POST /api/auth/register` — cadastro de membro com associação a família
- `POST /api/auth/login` — login de usuário
- `GET /api/users` — listar todos os membros (com informações de família)
- `GET /api/users/:id` — obter detalhes de um membro específico
- `PUT /api/users/:id` — atualizar dados de um membro (incluindo associação com família)
- `DELETE /api/users/:id` — excluir/desativar um membro

### Famílias
- `GET /api/family` — listar famílias disponíveis
- `POST /api/family` — criar nova família
- `GET /api/family/:id` — obter detalhes de uma família
- `PUT /api/family/:id` — atualizar dados de uma família

### Atividades
- `GET /api/activity/` — listar catálogo de atividades
- `POST /api/activity/` — criar atividade customizada
- `POST /api/activity/log` — registrar atividade realizada
- `GET /api/history?period=week|day|month|year` — histórico do usuário
- `GET /api/stats?family_id=1` — estatísticas e ranking por família

## Exemplos de uso

Registrar atividade:
```json
POST /api/activity/log
{
  "activity_id": 1,
  "family_id": 1
}
```

Listar histórico semanal:
```
GET /api/history?period=week
```

Ranking por família:
```
GET /api/stats?family_id=1
```

## Testes e qualidade
- Testes unitários em todos os handlers principais (exemplo: `handlers_activity_test.go`).
- Cobertura para casos de sucesso e erro.
- Pipeline CI bloqueia merge se testes falharem.
- Boas práticas: validação de entrada, autenticação JWT, hash seguro de senha, SQL parametrizado.

---

## Referência dos requisitos (prompt-atividades-familia)
Veja o arquivo `prompt-atividades-familia` para detalhes completos dos requisitos funcionais, não funcionais e de arquitetura.

## Status de Implementação dos Requisitos

### Requisitos Funcionais (RF)
- [x] RF01. O sistema permite que usuários se cadastrem e façam login.
- [x] RF02. O sistema permite que usuários criem e entrem em grupos de família.
- [x] RF03. O sistema exibe um painel com atividades para registro.
- [x] RF04. O sistema registra a atividade com data, hora e autor.
- [x] RF05. O sistema permite visualizar o histórico de atividades por período.
- [ ] RF06. O sistema mostra estatísticas de contribuição por usuário (parcialmente implementado).
- [x] RF07. O sistema permite que usuários adicionem novas atividades personalizadas.
- [x] RF08. O sistema funciona bem em dispositivos móveis (design responsivo).
- [ ] RF09. O sistema permite a exportação dos dados registrados (pendente).

### Requisitos Não Funcionais (RNF)
- [x] RNF01. O sistema tem interface responsiva (mobile-first).
- [x] RNF02. O tempo de resposta para registrar uma atividade é inferior a 1 segundo.
- [x] RNF03. O sistema suporta até 50 usuários simultâneos no MVP.
- [x] RNF04. A autenticação usa JWT (JSON Web Tokens) para sessões seguras.
- [x] RNF05. Os dados são armazenados de forma segura (senhas com bcrypt).
- [x] RNF06. O backend foi desenvolvido com API RESTful.
- [x] RNF07. A aplicação está disponível via Docker Compose para fácil implantação.

---

## Contribuição
Pull requests são bem-vindos! Ao contribuir, garanta que os testes estejam passando e siga o padrão dos módulos já existentes.

## Como rodar manualmente (sem Docker)

### Backend
```sh
cd backend
go run main.go
```

### Frontend
```sh
cd frontend
npm install
npm run dev
```

---

## Deploy
- O frontend pode ser facilmente deployado em Vercel, Netlify ou similar.
- O backend pode ser deployado em qualquer serviço que rode containers Docker ou Go (Railway, Render, VPS, etc).
- Configure variáveis de ambiente de produção corretamente.

---

## Prompt/Requisitos do Projeto
Veja detalhes e requisitos no arquivo [`prompt-atividades-familia`](./prompt-atividades-familia).

---

> Desenvolvido por v4lente
