# Meu Controle Financeiro

Sistema de finanças pessoais full-stack: controle de transações (com recorrência), orçamentos por categoria, metas de economia, cartões de crédito físicos e virtuais com limite compartilhado, relatórios em PDF e um painel com visão geral do mês.

- **Backend:** Node.js + Express + Sequelize (MariaDB/MySQL)
- **Frontend:** React 19 + Vite + Tailwind CSS

---

## Sumário

1. [Funcionalidades](#1-funcionalidades)
2. [Arquitetura e stack](#2-arquitetura-e-stack)
3. [Estrutura de pastas](#3-estrutura-de-pastas)
4. [Modelo de dados](#4-modelo-de-dados)
5. [Instalação](#5-instalação)
6. [Variáveis de ambiente](#6-variáveis-de-ambiente)
7. [Scripts disponíveis](#7-scripts-disponíveis)
8. [API — rotas principais](#8-api--rotas-principais)
9. [Testes](#9-testes)
10. [Limitações conhecidas / próximos passos](#10-limitações-conhecidas--próximos-passos)

---

## 1. Funcionalidades

- **Autenticação completa** — registro, login (JWT), confirmação de e-mail (não bloqueia o login), recuperação de senha por token com expiração, edição de perfil e troca de senha.
- **Transações** — receitas e despesas, com recorrência fixa (parcelada/mensal) ou variável, exclusão em grupo de lançamentos recorrentes, marcação de "pago", e tela dedicada com busca e paginação.
- **Cartões físicos e virtuais** — um cartão físico pode ter vários cartões virtuais vinculados, todos compartilhando o mesmo limite. Cálculo automático do ciclo de fatura (fechamento é derivado do vencimento), navegação por mês, fatura detalhada, histórico dos últimos ciclos, resumo geral (disponível total, próximo vencimento, alerta de limite alto).
- **Orçamentos** — limite mensal por categoria (vínculo real com a tabela de categorias, não texto livre), navegação por mês/ano, resumo do período.
- **Metas de economia** — aportes avulsos, cálculo de meses restantes e sugestão de aporte mensal, histórico de aportes, filtro por status.
- **Relatórios** — geração de PDF agrupado por categoria com subtotais, filtros por categoria/subcategoria/palavra-chave, envio por e-mail ou download, exportação CSV do resultado, atalhos de período.
- **Categorias e subcategorias** — subcategorias personalizáveis pelo usuário; categorias têm cor customizável, refletida no gráfico de despesas.
- **Notificações** — alertas calculados na hora (orçamento estourado, fatura vencendo, limite alto, meta concluída).
- **Modo escuro** em todo o sistema.

## 2. Arquitetura e stack

### Backend

| Camada | Tecnologia |
|---|---|
| Runtime / Framework | Node.js, Express |
| ORM | Sequelize (MariaDB/MySQL) |
| Autenticação | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validação | Yup |
| E-mail | Nodemailer |
| PDF | `pdfmake` |
| Rate limiting | `express-rate-limit` |
| Testes | Jest + Supertest |

### Frontend

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + Vite |
| Estilo | Tailwind CSS |
| Roteamento | React Router v7 |
| HTTP | Axios |
| Gráficos | Recharts |
| Notificações in-app | react-hot-toast |

### Infraestrutura

- `docker-compose.yml` provisiona um MariaDB local para desenvolvimento.

## 3. Estrutura de pastas

```
meu-controle-financeiro/
├── docker-compose.yml
├── requests.http                # Coleção de requisições de exemplo (REST Client)
├── backend/
│   ├── __tests__/               # Testes automatizados (Jest)
│   └── src/
│       ├── app.js / server.js
│       ├── config/database.js
│       ├── controllers/         # Um controller por recurso (Transaction, Budget, Goal, Card, Category, Subcategory, Report, User, Session, PasswordReset)
│       ├── database/
│       │   ├── index.js         # Inicialização e associação dos models
│       │   ├── migrations/      # 19 migrations
│       │   └── seeders/         # Categorias padrão
│       ├── middlewares/         # auth.js, rateLimiter.js
│       ├── models/              # User, Transaction, Budget, Goal, GoalContribution, Category, Subcategory, Card
│       ├── routes/routes.js
│       └── fonts/               # Fontes usadas na geração de PDF
└── frontend/
    └── src/
        ├── App.jsx
        ├── components/          # Formulários, modais, gráficos, layout, cartões
        ├── contexts/AuthContext.jsx
        ├── pages/               # Uma página por rota
        └── services/            # Camada de comunicação com a API (axios)
```

## 4. Modelo de dados

Entidades principais e como se relacionam:

```
User 1──N Transaction  N──1 Subcategory  N──1 Category
User 1──N Budget  N──1 Category
User 1──N Goal 1──N GoalContribution
User 1──N Subcategory
User 1──N Card
Card 1──N Card (auto-relacionamento: físico → virtuais, via cartao_pai_id)
Transaction N──1 Card (opcional)
```

Pontos que valem atenção:

- **`Budget.categoryId`** é a fonte de verdade para o cálculo de gasto — o campo `categoria` (texto) existe só para exibição/compatibilidade e é sempre derivado do nome real da categoria.
- **`Card`**: cartões virtuais têm `limiteTotal`, `diaFechamento` e `diaVencimento` sempre `null` — esses valores são herdados do cartão físico (`cartaoPaiId`) em tempo de consulta, nunca duplicados.
- **Ciclo de fatura**: calculado a partir do dia de fechamento (ele mesmo derivado do vencimento no formulário), não do mês civil da transação. Uma despesa lançada após o fechamento do mês corrente entra na fatura seguinte — como em um cartão de crédito real.

## 5. Instalação

### Pré-requisitos
Node.js 18+, Docker (para o banco local), npm.

### Passos

```bash
git clone <repo>
cd meu-controle-financeiro

# Banco de dados
docker compose up -d

# Backend
cd backend
npm install
cp .env.example .env   # depois preencha os valores (veja seção 6)
npm run db:migrate
npm run dev             # http://localhost:3333

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173
```

## 6. Variáveis de ambiente

Arquivo `backend/.env` (não versionado):

```env
# Servidor
PORT=3333
NODE_ENV=development

# Banco de dados
DB_HOST=localhost
DB_USER=root
DB_PASS=root_password
DB_NAME=financas_db

# Autenticação
APP_SECRET=uma_chave_secreta_qualquer

# URL do frontend (usada nos links de e-mail de confirmação/redefinição de senha)
FRONTEND_URL=http://localhost:5173

# E-mail (opcional em desenvolvimento — sem isso, os links de confirmação/redefinição
# de senha só são impressos no console do backend, em vez de enviados por e-mail)
MAIL_HOST=smtp.exemplo.com
MAIL_PORT=465
MAIL_USER=seu_email@exemplo.com
MAIL_PASS=sua_senha_de_app
```

> Para testar o envio de e-mail sem depender de credenciais reais, uma opção gratuita é o [Ethereal Email](https://ethereal.email/create): gera credenciais de teste na hora e mostra um link de prévia do e-mail, sem entregá-lo de verdade.

## 7. Scripts disponíveis

### Backend

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor com reload automático (nodemon) |
| `npm start` | Inicia o servidor em modo produção |
| `npm run db:migrate` | Executa as migrations pendentes |
| `npm run test:setup` | Cria e migra o banco de testes |
| `npm test` | Executa a suíte de testes (Jest) |

### Frontend

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Executa o ESLint |

## 8. API — rotas principais

Base: `http://localhost:3333/api`. Rotas privadas exigem `Authorization: Bearer <token>`.

| Recurso | Rotas |
|---|---|
| Autenticação | `POST /register` · `POST /login` · `GET /verify-email` · `POST /forgot-password` · `POST /reset-password` |
| Perfil | `GET /me` · `PUT /me` · `POST /resend-verification` |
| Transações | `GET/POST /transactions` · `PUT/DELETE /transactions/:id` · `DELETE /transactions/group/:groupId` · `PATCH /transactions/:id/pago` |
| Orçamentos | `GET/POST /budgets` · `PUT/DELETE /budgets/:id` |
| Metas | `GET/POST /goals` · `PUT/DELETE /goals/:id` · `POST /goals/:id/contribute` · `GET /goals/:id/contributions` |
| Cartões | `GET/POST /cards` · `PUT/DELETE /cards/:id` · `GET /cards/:id/historico` · `GET /cards/:id/transacoes` |
| Categorias | `GET /categories` · `PUT /categories/:id` |
| Subcategorias | `GET/POST /subcategories` · `PUT/DELETE /subcategories/:id` |
| Relatórios | `POST /reports/custom` |

A coleção `requests.http` na raiz do projeto tem exemplos prontos de cada fluxo (usável com a extensão REST Client do VS Code).

## 9. Testes

```bash
cd backend
npm run test:setup   # prepara um banco de dados isolado para teste
npm test
```

## 10. Limitações conhecidas / próximos passos

- A lógica de ciclo de fatura (a parte mais sensível do sistema) não tem testes automatizados ainda — só foi validada manualmente durante o desenvolvimento.
- `GET /transactions` sem paginação nem filtro de categoria/subcategoria retorna todos os registros do usuário; em uso real (muitos meses de dados) isso deve ganhar paginação também nesses casos.
- Sessão expira em 7 dias fixos, sem aviso proativo ao usuário quando isso acontece.
- Não há conta bancária/dinheiro/pix como conceito próprio — hoje só cartões têm modelagem dedicada como forma de pagamento.
