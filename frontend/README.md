# Atividades da Família – MVP

Sistema web para controle de atividades, participação e histórico dos membros da família.

## Funcionalidades Principais
- Cadastro de atividades
- Registro de participação em atividades
- Histórico filtrável por período (dia, semana, mês, ano)
- Dashboard de usuários (administração)
- Autenticação por JWT
- Feedback visual (toasts, loaders)

---

## Instalação e Execução

1. **Instale as dependências:**
   ```bash
   npm install
   # ou
   yarn install
   ```

2. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto com:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
   ```
   Ajuste a URL conforme o endereço da sua API backend.

3. **Execute o frontend em modo desenvolvimento:**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000)

4. **Build para produção:**
   ```bash
   npm run build
   npm start
   ```

---

## Rodando os Testes

```bash
npm test
```
> **Nota:** Alguns testes podem falhar caso haja mudanças recentes ou dependências externas. Ajuste os testes conforme necessário.

---

## Estrutura de Pastas
- `src/app/activity` – Página de atividades (listar, registrar, cadastrar)
- `src/app/history` – Página de histórico de participações
- `src/app/dashboard` – Administração de usuários
- `src/config.ts` – Configuração de variáveis de ambiente

---

## Principais Rotas
- `/activity` – Atividades
- `/history` – Histórico
- `/dashboard` – Usuários (admin)
- `/login` – Autenticação

---

## Observações
- O sistema exige autenticação (JWT) para acessar as rotas protegidas.
- Certifique-se de que o backend está rodando e configurado para aceitar requisições do frontend.
- O MVP prioriza usabilidade e feedback visual.

---

## Contato
Dúvidas ou sugestões? Abra uma issue ou entre em contato com o desenvolvedor.
