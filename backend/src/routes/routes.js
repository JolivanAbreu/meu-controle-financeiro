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
const CardController = require('../controllers/CardController');

const routes = new Router();

// Rotas Públicas
routes.post("/register", UserController.store);
routes.post("/login", SessionController.store);

// Barreira de Autenticação
routes.use(authMiddleware);

// ... (Rotas Privadas, Transações, Orçamentos, Metas) ...
routes.get("/dashboard", (req, res) => res.json({ message: `Bem-vindo ao Dashboard, usuário com ID: ${req.userId}!` }));
routes.get('/transactions', TransactionController.index);
routes.post('/transactions', TransactionController.store);
routes.put('/transactions/:id', TransactionController.update);
routes.delete('/transactions/:id', TransactionController.destroy);
routes.delete('/transactions/group/:groupId', TransactionController.destroyGroup);
routes.post('/budgets', BudgetController.store);
routes.get('/budgets', BudgetController.index);
routes.put('/budgets/:id', BudgetController.update);
routes.delete('/budgets/:id', BudgetController.destroy);
routes.post('/goals', GoalController.store);
routes.get('/goals', GoalController.index);
routes.put('/goals/:id', GoalController.update);
routes.delete('/goals/:id', GoalController.destroy);
routes.post('/goals/:id/contribute', GoalController.addContribution);

// --- ROTAS DE CATEGORIAS ---
routes.get('/categories', CategoryController.index);

// --- ROTAS DE SUBCATEGORIAS ---
routes.get('/subcategories', SubcategoryController.index);
routes.post('/subcategories', SubcategoryController.store);
routes.put('/subcategories/:id', SubcategoryController.update);
routes.delete('/subcategories/:id', SubcategoryController.destroy);

// --- ROTA DE RELATÓRIOS ---
routes.post('/reports/custom', ReportController.generate);

// --- ROTAS DE CARTÕES ---
routes.post('/cards', CardController.store);
routes.get('/cards', CardController.index);
routes.get('/cards/:id/historico', CardController.history);
routes.put('/cards/:id', CardController.update);
routes.delete('/cards/:id', CardController.destroy);

module.exports = routes;