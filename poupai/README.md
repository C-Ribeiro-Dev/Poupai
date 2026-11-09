# Poupai - Controle Financeiro

Aplicativo web de controle financeiro pessoal, instalável como PWA, com contas compartilhadas, cartões, faturas, orçamento, metas e relatórios.

## Funcionalidades

- **Contas e movimentações:** receitas, despesas e transferências entre contas, com tipos e categorias personalizáveis.
- **Movimentações fixas e compromissos:** lançamentos recorrentes e acompanhamento de vencimentos.
- **Cartões e faturas:** compras no cartão, controle de fatura e pagamento.
- **Orçamento e metas:** limites por categoria, metas com aportes e acompanhamento do progresso.
- **Dívidas e investimentos:** controle de dívidas e de ativos com seus lançamentos.
- **Saldo projetado e simulador:** projeção de saldo futuro e simulações do tipo "posso fazer isso?".
- **Relatórios e dashboard:** gráficos e cards de resumo da situação financeira.
- **Importação de movimentações** e **contas compartilhadas** entre usuários.
- **Autenticação** com Supabase e área administrativa restrita.

## Tecnologias

| Área | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) e React 19 |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL (Supabase) com Prisma |
| Autenticação | Supabase Auth (`@supabase/ssr`) |
| Interface | Tailwind CSS 4, shadcn/ui, Base UI, Lucide |
| Formulários e validação | React Hook Form e Zod |
| Gráficos | Recharts |

## Como rodar localmente

Pré-requisitos: Node.js 20 ou superior e um projeto no [Supabase](https://supabase.com).

```bash
# 1. Instale as dependências
npm install

# 2. Crie o arquivo de variáveis de ambiente
cp .env.example .env.local
# preencha os valores no .env.local

# 3. Crie as tabelas no banco a partir do schema do Prisma
npx prisma db push

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Veja o arquivo [`.env.example`](.env.example). Nunca faça commit do `.env.local`: ele contém chaves privadas, principalmente a `SUPABASE_SERVICE_ROLE_KEY`, que só deve existir no servidor.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Executa o build de produção |
| `npm run lint` | Verifica o código com ESLint |

## Estrutura

```
src/
  app/            Rotas (App Router): (auth), (dashboard), auth/callback
  actions/        Server Actions
  components/     Componentes de interface
  lib/            Prisma, clientes do Supabase e utilitários
prisma/           Schema do banco
```
