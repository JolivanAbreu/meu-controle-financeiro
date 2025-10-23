// backend/src/routes/routes.js
const { Router } = require("express");

// Middlewares
const authMiddleware = require("../middlewares/auth");

// Controllers
const UserController = require("../controllers/UserController");
const SessionController = require("../controllers/SessionController");
const TransactionController = require("../controllers/TransactionController");
const BudgetController = require('../controllers/BudgetController');
const GoalController = require('../controllers/GoalController');
const CategoryController = require("../controllers/CategoryController");
const SubcategoryController = require("../controllers/SubcategoryController");
const ReportController = require('../controllers/ReportController');


const routes = new Router();

// Rotas Públicas
routes.post("/register", UserController.store);
routes.post("/login", SessionController.store);

// Barreira de Autenticação
routes.use(authMiddleware);

// Rotas Privadas
routes.get("/dashboard", (req, res) => {
  return res.json({
    message: `Bem-vindo ao Dashboard, usuário com ID: ${req.userId}!`,
  });
});

// Rotas de Transações
routes.get('/transactions', TransactionController.index);
// routes.get('/transactions/:id', TransactionController.show);
routes.post('/transactions', TransactionController.store);
routes.put('/transactions/:id', TransactionController.update);
routes.delete('/transactions/:id', TransactionController.destroy);
routes.delete('/transactions/group/:groupId', TransactionController.destroyGroup);

// Rotas de Orçamentos
routes.post('/budgets', BudgetController.store);
routes.get('/budgets', BudgetController.index);
routes.put('/budgets/:id', BudgetController.update);
routes.delete('/budgets/:id', BudgetController.destroy);

// Rotas de Metas
routes.post('/goals', GoalController.store);
routes.get('/goals', GoalController.index);
routes.put('/goals/:id', GoalController.update);
routes.delete('/goals/:id', GoalController.destroy);

// --- ROTAS DE CATEGORIAS ---

// Lista as Categorias principais (fixas, ex: Alimentação, Transporte)
routes.get('/categories', CategoryController.index);

// Lista/Cria Subcategorias do usuário
routes.get('/subcategories', SubcategoryController.index);
routes.post('/subcategories', SubcategoryController.store);

// --- ROTA DE RELATÓRIOS ---
routes.post('/reports/custom', ReportController.generate); // Add this route

module.exports = routes;