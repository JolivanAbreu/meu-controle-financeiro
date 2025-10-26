Projeto: Meu Controle Financeiro
Uma aplicação web full-stack para gerenciamento de finanças pessoais. Permite que os usuários registrem receitas e despesas, criem orçamentos mensais por categoria, definam metas de poupança e visualizem sua saúde financeira através de gráficos e relatórios.

📜 Índice
Sobre o Projeto

















🎯 Sobre o Projeto
O "Meu Controle Financeiro" é uma aplicação web full-stack concebida para a gestão de finanças pessoais. Ela permite que usuários se cadastrem, façam login e controlem suas finanças de forma detalhada, com foco em categorização, orçamentos e metas de economia.

A aplicação segue uma arquitetura cliente-servidor desacoplada, com um backend Node.js servindo uma API RESTful e um frontend React (SPA) consumindo essa API.

✨ Principais Funcionalidades
Autenticação de Usuário: Sistema padrão de registro (/register) e login (/login) com tokens JWT para segurança.

Gerenciamento de Transações: CRUD completo para receitas e despesas. Suporta transações "variáveis" (únicas) e "fixas" (recorrentes/parceladas).

Categorização em Dois Níveis:

Categorias (Fixas): Entidades padrão do sistema (ex: "Moradia", "Transporte").

Subcategorias (Gerenciáveis): Criadas pelo usuário e vinculadas a uma categoria (ex: "Aluguel", "Gasolina").

Definição de Orçamentos (Budgets): Usuários podem definir limites de gastos mensais por Categoria (ex: R$ 500 para "Lazer" em Outubro/2025).

Metas de Economia (Goals): Usuários podem criar metas (ex: "Viagem de Férias") com valor e prazo. O sistema permite "aportes" e calcula o progresso.

Geração de Relatórios: Geração de relatórios em PDF com filtros avançados (data, categorias, etc.), com opção de envio por e-mail.

💻 Stack de Tecnologias
🚀 Começando (Guia de Instalação)
Siga estes passos para configurar e executar a aplicação completa no seu computador.

Pré-requisitos
Antes de começar, garanta que tem as seguintes ferramentas instaladas na sua máquina:

Git: Para clonar o repositório.

Node.js (versão LTS): Essencial para ambos os projetos.

Docker Desktop: Para executar a base de dados MariaDB.

Passos de Instalação
1. Clonar o Repositório

Abra o seu terminal e clone o projeto:

2. Configurar e Iniciar a Base de Dados (Docker)

A base de dados MariaDB corre num container Docker.

a. Certifique-se de que o Docker Desktop está sendo executado. b. No terminal, na pasta raiz do projeto (-My-Financial-Control), inicie o container:

O -d executa o container em segundo plano.

3. Configurar o Backend

a. Navegue para a pasta do backend:

b. Crie o Ficheiro de Variáveis de Ambiente. Crie um ficheiro chamado .env e copie o conteúdo abaixo:

c. Instale as Dependências:

d. Execute as Migrations (para criar as tabelas no banco):

4. Configurar o Frontend

a. Navegue para a pasta do frontend (a partir da raiz):

b. Instale as Dependências:

5. Executar a Aplicação Completa

Você precisará de dois terminais abertos.

Terminal 1 (Backend):

O servidor da API estará rodando em http://localhost:3333.

Terminal 2 (Frontend):

A aplicação frontend estará acessível no seu navegador em http://localhost:5173.

🏛️ Arquitetura da Solução
Backend (Estrutura de Pastas)
O backend segue uma estrutura padrão de API Node.js, separando responsabilidades:

Frontend (Fluxo de Rotas)
A navegação do usuário é dividida em rotas públicas e privadas:

Rotas Públicas:

/login: Página de Login.

/register: Página de Registro.

/: Redireciona automaticamente para /login.

Rotas Protegidas (Exigem Login):

/dashboard: Página principal após o login (DashboardPage).

/budgets: Página para gerenciar orçamentos (BudgetsPage).

/goals: Página para gerenciar metas de economia (GoalsPage).

/reports: Página para gerar relatórios (ReportsPage).

/categorias: Página para gerenciar as subcategorias (CategoriesPage).

📦 Modelo de Dados (Schema)
User (Usuário)

Campos: nome, email, senha_hash.

Relações:

Um usuário TEM MUITAS Transações, Orçamentos, Metas, Subcategorias e Contribuições de Metas.

Category (Categoria)

Campos: name.

Relações:

Uma categoria TEM MUITAS Subcategorias.

Nota: Entidade "fixa", pré-povoada no banco (ex: Moradia, Lazer).

Subcategory (Subcategoria)

Campos: name.

Relações:

PERTENCE A UM Usuário.

PERTENCE A UMA Categoria.

TEM MUITAS Transações.

Nota: Entidade gerenciada pelo usuário (ex: "Supermercado", "Cinema").

Transaction (Transação)

Campos: tipo (ENUM: 'receita', 'despesa'), valor, data, descricao, recurrence ('fixo' ou 'variável'), recurrence_group_id, recurrence_end_date.

Relações:

PERTENCE A UM Usuário.

PERTENCE A UMA Subcategoria.

Budget (Orçamento)

Campos: categoria (string), limite, mes, ano.

Relações:

PERTENCE A UM Usuário.

Goal (Meta)

Campos: titulo, valor_objetivo, valor_atual (inicia em 0), prazo.

Relações:

PERTENCE A UM Usuário.

TEM MUITAS Contribuições de Metas.

GoalContribution (Aporte de Meta)

Campos: valor, data.

Relações:

PERTENCE A UM Usuário.

PERTENCE A UMA Meta.

🔌 Referência da API (Endpoints)
(P) = Rota Pública / (A) = Rota Autenticada (Exige Token JWT)

👤 Autenticação e Usuários
POST /register (P)
Descrição: Registra um novo usuário.

Controlador: UserController.store

Body (JSON): { "nome": "...", "email": "...", "senha": "..." }

Resposta (Sucesso 201): { "id": 1, "nome": "...", "email": "..." }

Resposta (Erro 400): Se o e-mail já existir.

POST /login (P)
Descrição: Autentica um usuário existente.

Controlador: SessionController.store

Body (JSON): { "email": "...", "senha": "..." }

Resposta (Sucesso 200): { "user": { ... }, "token": "jwt.token..." }

Resposta (Erro 401): Usuário ou senha incorretos.

💸 Transações (Transactions)
GET /transactions (A)
Descrição: Lista as transações do usuário, com filtros avançados.

Controlador: TransactionController.index

Query Params (Opcionais): startDate, endDate, categories (IDs, ex: 1,2), subcategories (IDs, ex: 5,7), keywords.

Resposta (Sucesso 200): [ { ...transacao, subcategory: { ... } }, ... ]

POST /transactions (A)
Descrição: Cria uma nova transação. Lógica especial para recorrência.

Controlador: TransactionController.store

Body (JSON):

tipo: 'receita' ou 'despesa'

valor: (Number)

data: (Date)

descricao: (String)

subcategoryId: (Integer)

recurrence: 'variável' (única) ou 'fixo' (parcelada)

installments: (Integer) - Obrigatório se recurrence for 'fixo'.

Lógica: Se recurrence for 'fixo', o controlador cria múltiplas transações (uma para cada parcela) com o mesmo recurrence_group_id.

PUT /transactions/:id (A)
Descrição: Atualiza uma transação.

Controlador: TransactionController.update

Query Param (Opcional): applyToFuture=true (Atualiza esta e todas as futuras do mesmo grupo).

Body (JSON): { "tipo", "valor", "data", "descricao", "subcategoryId" }

DELETE /transactions/:id (A)
Descrição: Deleta uma única transação.

Controlador: TransactionController.destroy

DELETE /transactions/group/:groupId (A)
Descrição: Deleta um grupo de transações recorrentes a partir de uma data.

Controlador: TransactionController.destroyGroup

Query Param (Obrigatório): date=YYYY-MM-DD (Deleta todas com este ID a partir desta data).

📊 Orçamentos (Budgets)
GET /budgets (A)
Descrição: Lista os orçamentos do usuário, filtrando por mês/ano.

Controlador: BudgetController.index

Query Params (Opcionais): mes=10, ano=2025

Lógica: O controlador calcula o campo gasto_atual para cada orçamento.

Resposta (Sucesso 200): [ { ..., "limite": 500.00, "gasto_atual": 150.00 }, ... ]

POST /budgets (A)
Descrição: Cria um novo limite de orçamento.

Controlador: BudgetController.store

Body (JSON): { "categoria": "Lazer", "limite": 500, "mes": 10, "ano": 2025 }

PUT /budgets/:id (A)
Descrição: Atualiza um orçamento.

Controlador: BudgetController.update

Body (JSON): { "categoria": "Lazer", "limite": 550, "mes": 10, "ano": 2025 }

DELETE /budgets/:id (A)
Descrição: Deleta um orçamento.

Controlador: BudgetController.destroy

🎯 Metas (Goals)
GET /goals (A)
Descrição: Lista as metas do usuário com cálculos de progresso em tempo real.

Controlador: GoalController.index

Resposta (Sucesso 200): Array de metas com campos calculados (valor_restante, meses_restantes, aporte_sugerido_mes, status).

POST /goals (A)
Descrição: Cria uma nova meta de economia.

Controlador: GoalController.store

Body (JSON): { "titulo": "Viagem", "valor_objetivo": 10000, "prazo": "2026-12-31" }

PUT /goals/:id (A)
Descrição: Atualiza os dados de uma meta (NÃO o valor atual).

Controlador: GoalController.update

Body (JSON): { "titulo", "valor_objetivo", "prazo" }

DELETE /goals/:id (A)
Descrição: Deleta uma meta.

Controlador: GoalController.destroy

POST /goals/:id/contribute (A)
Descrição: Adiciona um aporte (contribuição) a uma meta.

Controlador: GoalController.addContribution

Body (JSON): { "valor": 500, "data": "2025-10-26" }

Lógica: Cria um registro GoalContribution E incrementa o valor_atual na Goal correspondente.

🏷️ Categorias e Subcategorias
GET /categories (A)
Descrição: Lista todas as Categorias principais (fixas) do sistema.

Controlador: CategoryController.index

Resposta (Sucesso 200): [ { "id": 1, "name": "Moradia" }, ... ]

GET /subcategories (A)
Descrição: Lista todas as Subcategorias criadas pelo usuário logado.

Controlador: SubcategoryController.index

Resposta (Sucesso 200): [ { "id": 10, "name": "Supermercado", "category": { ... } }, ... ]

POST /subcategories (A)
Descrição: Cria uma nova subcategoria para o usuário.

Controlador: SubcategoryController.store

Body (JSON): { "name": "Cinema", "categoryId": 2 }

PUT /subcategories/:id (A)
Descrição: Atualiza uma subcategoria.

Controlador: SubcategoryController.update

Body (JSON): { "name": "Netflix", "categoryId": 2 }

DELETE /subcategories/:id (A)
Descrição: Deleta uma subcategoria.

Controlador: SubcategoryController.destroy

📄 Relatórios (Reports)
POST /reports/custom (A)
Descrição: Gera um relatório customizado em PDF e o envia por e-mail ou para download.

Controlador: ReportController.generate

Body (JSON):

startDate: "YYYY-MM-DD"

endDate: "YYYY-MM-DD"

categories: [1, 2] (Array de IDs)

subcategories: [10, 12] (Array de IDs)

keywords: "mercado" (String)

sendEmail: true ou false

Lógica:

Filtra as transações com base no body.

Gera um PDF com os resultados.

Se sendEmail: true, envia o PDF como anexo para o e-mail do usuário.

Se sendEmail: false, retorna o arquivo PDF (application/pdf) na resposta.
