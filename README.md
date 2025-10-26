# 💰 MEU-CONTROLE-FINANCEIRO

Uma aplicação **Full-Stack Web** desenvolvida para **gerenciamento de finanças pessoais**, permitindo que usuários controlem receitas, despesas, orçamentos e metas de economia de forma simples e intuitiva.

---

## 🧭 Visão Geral do Sistema

O **MEU-CONTROLE-FINANCEIRO** é um sistema completo para organização financeira pessoal. Ele inclui autenticação segura, categorização de gastos, orçamentos mensais, metas de economia e geração de relatórios em PDF.

### ✨ Principais Funcionalidades

- **Autenticação de Usuário:**  
  Registro (`/register`) e login (`/login`) com **JWT (JSON Web Token)** para segurança.

- **Gerenciamento de Transações:**  
  CRUD completo para receitas e despesas.  
  Suporte a transações **fixas (recorrentes)** e **variáveis (únicas)**.

- **Categorização:**  
  Categorias fixas (ex: `Moradia`, `Transporte`) e subcategorias personalizadas (ex: `Aluguel`, `Gasolina`).

- **Orçamentos (Budgets):**  
  Definição de **limites mensais por categoria**, com cálculo automático do gasto atual.

- **Metas de Economia (Goals):**  
  Criação de **metas com valor e prazo**, com cálculo de progresso e **aporte sugerido mensal**.

- **Relatórios (Reports):**  
  Geração de relatórios em **PDF** com filtros personalizados e envio automático por **e-mail (SMTP)**.

---

## 🧩 Fluxo do Usuário (Frontend)

O fluxo de navegação é dividido em **rotas públicas** e **rotas protegidas**:

### 🔓 Rotas Públicas
| Rota | Descrição |
|------|------------|
| `/login` | Página de Login |
| `/register` | Página de Registro |
| `/` | Redireciona para `/login` |

### 🔐 Rotas Protegidas (após login)
| Rota | Descrição |
|------|------------|
| `/dashboard` | Página principal (DashboardPage) |
| `/budgets` | Gerenciamento de orçamentos (BudgetsPage) |
| `/goals` | Metas de economia (GoalsPage) |
| `/reports` | Geração de relatórios (ReportsPage) |
| `/categorias` | Gerenciamento de subcategorias (CategoriesPage) |

> Todas as rotas protegidas são renderizadas dentro de um **MainLayout**, contendo a barra lateral de navegação.

---

## 🗄️ Modelo de Dados (Schema do Banco)

Abaixo, o modelo de entidades e relacionamentos utilizados pelo sistema:

### 👤 User (Usuário)
| Campo | Tipo | Descrição |
|--------|------|-----------|
| nome | String | Nome do usuário |
| email | String | E-mail do usuário |
| senha_hash | String | Senha criptografada |

**Relações:**
- 1:N → Transações  
- 1:N → Orçamentos  
- 1:N → Metas  
- 1:N → Subcategorias  
- 1:N → Contribuições de metas  

---

### 🏷️ Category (Categoria)
| Campo | Tipo | Descrição |
|--------|------|-----------|
| name | String | Nome da categoria (fixa) |

**Relações:**
- 1:N → Subcategorias  

> As categorias são **pré-definidas** no banco (ex: Moradia, Lazer, Saúde).

---

### 🪪 Subcategory (Subcategoria)
| Campo | Tipo | Descrição |
|--------|------|-----------|
| name | String | Nome da subcategoria |

**Relações:**
- N:1 → Usuário  
- N:1 → Categoria  
- 1:N → Transações  

> Subcategorias são **criadas e gerenciadas pelos usuários**.

---

### 💸 Transaction (Transação)
| Campo | Tipo | Descrição |
|--------|------|-----------|
| tipo | ENUM('receita', 'despesa') | Tipo da transação |
| valor | Number | Valor da transação |
| data | Date | Data da transação |
| descricao | String | Descrição |
| recurrence | ENUM('fixo', 'variável') | Tipo de recorrência |
| recurrence_group_id | String | ID de grupo para parcelas |
| recurrence_end_date | Date | Data final de recorrência |

**Relações:**
- N:1 → Usuário  
- N:1 → Subcategoria  

---

### 💰 Budget (Orçamento)
| Campo | Tipo | Descrição |
|--------|------|-----------|
| categoria | String | Nome da categoria principal |
| limite | Number | Limite mensal |
| mes | Number | Mês de referência |
| ano | Number | Ano de referência |

**Relações:**
- N:1 → Usuário  

---

### 🎯 Goal (Meta)
| Campo | Tipo | Descrição |
|--------|------|-----------|
| titulo | String | Nome da meta |
| valor_objetivo | Number | Valor total desejado |
| valor_atual | Number | Valor atual acumulado |
| prazo | Date | Data limite da meta |

**Relações:**
- N:1 → Usuário  
- 1:N → Contribuições de metas  

> O sistema calcula automaticamente:  
> `valor_restante`, `meses_restantes`, `aporte_sugerido_mes` e `status`.

---

### 📈 GoalContribution (Aporte de Meta)
| Campo | Tipo | Descrição |
|--------|------|-----------|
| valor | Number | Valor aportado |
| data | Date | Data do aporte |

**Relações:**
- N:1 → Usuário  
- N:1 → Meta  

---

## 🚀 Referência da API (Endpoints)

### 👤 Autenticação e Usuários
#### `POST /register` *(Pública)*
Registra um novo usuário.  
```json
{
  "nome": "João",
  "email": "joao@email.com",
  "senha": "123456"
}
POST /login (Pública)
Autentica o usuário e retorna um token JWT.

json
Copiar código
{
  "email": "joao@email.com",
  "senha": "123456"
}
💸 Transações (Transactions)
GET /transactions (Autenticada)
Lista transações do usuário com filtros:
startDate, endDate, categories, subcategories, keywords.

POST /transactions (Autenticada)
Cria uma nova transação.
Se recurrence for "fixo", cria múltiplas parcelas.

json
Copiar código
{
  "tipo": "despesa",
  "valor": 200,
  "data": "2025-10-25",
  "descricao": "Supermercado",
  "subcategoryId": 10,
  "recurrence": "fixo",
  "installments": 3
}
PUT /transactions/:id (Autenticada)
Atualiza uma transação (ou todas futuras com applyToFuture=true).

DELETE /transactions/:id (Autenticada)
Remove uma transação.

DELETE /transactions/group/:groupId (Autenticada)
Remove um grupo de transações recorrentes a partir de uma data específica.

📊 Orçamentos (Budgets)
GET /budgets
Lista orçamentos filtrados por mês/ano.
Calcula gasto_atual automaticamente.

POST /budgets
Cria um novo orçamento.

json
Copiar código
{
  "categoria": "Lazer",
  "limite": 500,
  "mes": 10,
  "ano": 2025
}
PUT /budgets/:id
Atualiza um orçamento existente.

DELETE /budgets/:id
Remove um orçamento.

🎯 Metas (Goals)
GET /goals
Lista todas as metas com progresso calculado:

valor_restante

meses_restantes

aporte_sugerido_mes

status

POST /goals
Cria uma nova meta de economia.

json
Copiar código
{
  "titulo": "Viagem de Férias",
  "valor_objetivo": 10000,
  "prazo": "2026-12-31"
}
POST /goals/:id/contribute
Adiciona um aporte à meta.

json
Copiar código
{
  "valor": 500,
  "data": "2025-10-26"
}
🏷️ Categorias e Subcategorias
GET /categories
Lista categorias principais (fixas).

GET /subcategories
Lista subcategorias criadas pelo usuário.

POST /subcategories
Cria uma nova subcategoria.

json
Copiar código
{
  "name": "Cinema",
  "categoryId": 2
}
PUT /subcategories/:id
Atualiza nome ou categoria-pai.

DELETE /subcategories/:id
Remove uma subcategoria.

📄 Relatórios (Reports)
POST /reports/custom
Gera relatório PDF personalizado e envia por e-mail ou download.

json
Copiar código
{
  "startDate": "2025-10-01",
  "endDate": "2025-10-31",
  "categories": [1, 2],
  "subcategories": [10, 12],
  "keywords": "mercado",
  "sendEmail": true
}
Lógica:

Filtra transações conforme os parâmetros.

Gera PDF com totais de receita, despesa e saldo.

Envia por e-mail (via nodemailer) ou retorna o PDF diretamente.

🧠 Tecnologias Principais
Backend: Node.js, Express, JWT, Sequelize, Nodemailer, PDFMake

Frontend: React.js, React Router, Axios

Banco de Dados: PostgreSQL ou MySQL

Autenticação: JWT

Relatórios: PDFMake

E-mail: Nodemailer (SMTP)

⚙️ Instalação e Execução
bash
Copiar código
# Clone o repositório
git clone https://github.com/seuusuario/MEU-CONTROLE-FINANCEIRO.git

# Acesse o diretório
cd MEU-CONTROLE-FINANCEIRO

# Instale as dependências
npm install

# Configure variáveis de ambiente (.env)
# Exemplo:
# JWT_SECRET=suachavesecreta
# DB_USER=root
# DB_PASS=123456
# DB_NAME=financeiro_db

# Execute a aplicação
npm run dev
