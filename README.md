# 🚀 MEU-CONTROLE-FINANCEIRO

Uma aplicação web full-stack para gerenciamento de finanças pessoais, construída com Node.js (API), React (Frontend) e Sequelize.

---

## 📋 Índice

* [🎯 Sobre o Projeto](#-sobre-o-projeto)
* [✨ Funcionalidades Principais](#-funcionalidades-principais)
* [🚀 Tecnologias Utilizadas](#-tecnologias-utilizadas)
* [🔧 Instalação e Execução](#-instalação-e-execução)
* [📚 Documentação da API (Resumo)](#-documentação-da-api-resumo)
* [📄 Licença](#-licença)

---

## 🎯 Sobre o Projeto

O "Meu Controle Financeiro" é um sistema completo para ajudar usuários a organizar sua vida financeira. Ele permite o cadastro detalhado de receitas e despesas, categorização, criação de orçamentos mensais e acompanhamento de metas de economia.

O projeto é dividido em duas partes principais:

* **`backend/`**: Uma API RESTful construída em **Node.js** e **Express**, usando **Sequelize** como ORM para se comunicar com o banco de dados.
* **`frontend/`**: Uma SPA (Single Page Application) construída em **React** e **Vite**, que consome a API do backend.

---

## ✨ Funcionalidades Principais

* **Autenticação Segura:** Sistema de registro e login de usuários com tokens **JWT**.
* **Gerenciamento de Transações (CRUD):** Cadastro completo de receitas e despesas.
* **Transações Recorrentes:** Suporte para transações "fixas" (parceladas), que geram automaticamente as entradas futuras.
* **Categorização em Dois Níveis:**
    * **Categorias:** Entidades fixas (ex: "Moradia", "Lazer", "Alimentação").
    * **Subcategorias:** Criadas e gerenciadas pelo usuário (ex: "Aluguel", "Cinema", "Supermercado").
* **Orçamentos Mensais:** Permite ao usuário definir um limite de gasto por Categoria para um mês/ano específico (ex: R$ 500 em "Lazer" para Outubro/2025).
* **Acompanhamento de Metas:**
    * Criação de metas (ex: "Viagem de Férias") com valor-alvo e prazo.
    * Registro de aportes (contribuições) para cada meta.
    * Cálculos automáticos de progresso (`valor_restante`, `meses_restantes`, `aporte_sugerido_mes`).
    * Status de meta (`on_track`, `behind`, `completed`, `overdue`).
* **Geração de Relatórios:**
    * Filtros avançados por data, categorias, subcategorias e palavras-chave.
    * Geração de um relatório em **PDF** detalhado.
    * Opção de **enviar o PDF por e-mail** para o usuário ou fazer o download.

---

## 🚀 Tecnologias Utilizadas

### Backend
* [Node.js](https://nodejs.org/)
* [Express](https://expressjs.com/)
* [Sequelize](https://sequelize.org/) (ORM)
* [JSON Web Token (JWT)](https://jwt.io/) (Autenticação)
* [Bcrypt.js](https://github.com/kelektiv/bcrypt.js) (Hashing de Senhas)
* [Yup](https://github.com/jquense/yup) (Validação de dados)
* [Nodemailer](https://nodemailer.com/) (Envio de e-mails)
* [PDFMake](https://pdfmake.github.io/) (Geração de PDFs no servidor)

### Frontend
* [React](https://reactjs.org/)
* [Vite](https://vitejs.dev/)
* [React Router DOM](https://reactrouter.com/) (Roteamento)
* [Axios](https://axios-http.com/) (Requisições HTTP)
* [Tailwind CSS](https://tailwindcss.com/) (Estilização)
* [React Hot Toast](https://react-hot-toast.com/) (Notificações)

### Banco de Dados & Infra
* SQL (PostgreSQL, MariaDB, ou MySQL, via Sequelize)
* [Docker](https://www.docker.com/) / [Docker Compose](https://docs.docker.com/compose/)

---

## 🔧 Instalação e Execução

### Pré-requisitos

* [Node.js](https://nodejs.org/en/) (v16 ou superior)
* [Docker](https://www.docker.com/get-started) e [Docker Compose](https://docs.docker.com/compose/install/)
* Um gerenciador de pacotes (NPM ou Yarn)

### 1. Configuração do Ambiente

1.  Clone o repositório:
    ```sh
    git clone [https://github.com/SEU-USUARIO/MEU-CONTROLE-FINANCEIRO.git](https://github.com/SEU-USUARIO/MEU-CONTROLE-FINANCEIRO.git)
    cd MEU-CONTROLE-FINANCEIRO
    ```

2.  **Banco de Dados (com Docker)**
    O arquivo `docker-compose.yml` na raiz gerencia o banco de dados. Para iniciá-lo:
    ```sh
    docker-compose up -d
    ```

3.  **Configurar Variáveis de Ambiente (Backend)**
    Renomeie `backend/.env.example` (você precisa criá-lo) para `backend/.env` e preencha as variáveis:

    ```ini
    # Configuração da Aplicação
    APP_SECRET=SEU_SEGREDO_JWT_SUPER_SEGURO

    # Configuração do Banco de Dados (deve bater com o docker-compose.yml)
    DB_DIALECT=mysql # ou postgres
    DB_HOST=localhost
    DB_PORT=3306 # ou 5432
    DB_USER=root # ou seu usuário
    DB_PASS=sua_senha_docker
    DB_NAME=meu_controle_financeiro

    # Configuração de E-mail (para relatórios)
    MAIL_HOST=smtp.mailtrap.io
    MAIL_PORT=2525
    MAIL_USER=seu_usuario_mail
    MAIL_PASS=sua_senha_mail
    ```

### 2. Backend (API)

```sh
# 1. Navegue até a pasta do backend
cd backend

# 2. Instale as dependências
npm install

# 3. Execute as migrations do Sequelize
npx sequelize-cli db:migrate

# 4. (Opcional) Execute os seeders (para popular categorias, por exemplo)
npx sequelize-cli db:seed:all

# 5. Inicie o servidor
npm run dev
O servidor backend estará rodando em http://localhost:3333 (ou a porta definida no seu server.js).3. Frontend (React)Bash# 1. Em um NOVO terminal, navegue até a pasta do frontend
cd frontend

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento (Vite)
npm run dev
A aplicação React estará disponível em http://localhost:5173.📚 Documentação da API (Resumo)Todas as rotas, exceto /register e /login, são protegidas e exigem um Token de Autenticação (Bearer <token>).MétodoEndpointDescriçãoAutenticaçãoPOST/registerRegistra um novo usuário.POST/loginAutentica um usuário e retorna um token JWT.TransaçõesGET/transactionsLista transações com filtros (datas, categorias, etc.).POST/transactionsCria uma transação (única ou recorrente).PUT/transactions/:idAtualiza uma transação (pode aplicar a futuras).DELETE/transactions/:idDeleta uma transação.DELETE/transactions/group/:groupIdDeleta transações recorrentes futuras.Orçamentos (Budgets)GET/budgetsLista orçamentos (com gasto_atual calculado).POST/budgetsCria um novo limite de orçamento para um mês/categoria.PUT/budgets/:idAtualiza um orçamento.DELETE/budgets/:idDeleta um orçamento.Metas (Goals)GET/goalsLista metas (com status e progresso calculados).POST/goalsCria uma nova meta de economia.POST/goals/:id/contributeAdiciona um aporte (contribuição) a uma meta.PUT/goals/:idAtualiza os dados de uma meta (título, valor, prazo).DELETE/goals/:idDeleta uma meta.CategoriasGET/categoriesLista as categorias principais (fixas).GET/subcategoriesLista as subcategorias criadas pelo usuário.POST/subcategoriesCria uma nova subcategoria.PUT/subcategories/:idAtualiza uma subcategoria.DELETE/subcategories/:idDeleta uma subcategoria.RelatóriosPOST/reports/customGera um relatório em PDF e envia por e-mail ou download.📄 LicençaEste projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
