// backend/src/routes/routes.js
const { Router } = require("express");

// Middlewares
const authMiddleware = require("../middlewares/auth");
const { authLimiter } = require("../middlewares/rateLimiter");

// Controllers
const UserController = require("../controllers/UserController");
const SessionController = require("../controllers/SessionController");
const PasswordResetController = require("../controllers/PasswordResetController");
const TransactionController = require("../controllers/TransactionController");
const BudgetController = require('../controllers/BudgetController');
const GoalController = require('../controllers/GoalController');
const CategoryController = require("../controllers/CategoryController");
const SubcategoryController = require("../controllers/SubcategoryController");
const ReportController = require('../controllers/ReportController');
const CardController = require('../controllers/CardController');

const routes = new Router();

// Rotas Públicas
routes.post("/register", authLimiter, UserController.store);
routes.post("/login", authLimiter, SessionController.store);
routes.post("/forgot-password", authLimiter, PasswordResetController.forgotPassword);
routes.post("/reset-password", authLimiter, PasswordResetController.resetPassword);
routes.get("/verify-email", UserController.verifyEmail);

// Barreira de Autenticação
routes.use(authMiddleware);

// --- PERFIL ---
routes.get("/dashboard", (req, res) => res.json({ message: `Bem-vindo ao Dashboard, usuário com ID: ${req.userId}!` }));
routes.get('/me', UserController.show);
routes.put('/me', UserController.update);
routes.post('/resend-verification', UserController.resendVerification);

// --- TRANSAÇÕES ---
routes.get('/transactions', TransactionController.index);
routes.post('/transactions', TransactionController.store);
routes.put('/transactions/:id', TransactionController.update);
routes.delete('/transactions/:id', TransactionController.destroy);
routes.delete('/transactions/group/:groupId', TransactionController.destroyGroup);
routes.patch('/transactions/:id/pago', TransactionController.togglePago);

// --- ORÇAMENTOS ---
routes.post('/budgets', BudgetController.store);
routes.get('/budgets', BudgetController.index);
routes.put('/budgets/:id', BudgetController.update);
routes.delete('/budgets/:id', BudgetController.destroy);

// --- METAS ---
routes.post('/goals', GoalController.store);
routes.get('/goals', GoalController.index);
routes.put('/goals/:id', GoalController.update);
routes.delete('/goals/:id', GoalController.destroy);
routes.post('/goals/:id/contribute', GoalController.addContribution);
routes.get('/goals/:id/contributions', GoalController.listContributions);

// --- ROTAS DE CATEGORIAS ---
routes.get('/categories', CategoryController.index);
routes.put('/categories/:id', CategoryController.update);

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
routes.get('/cards/:id/transacoes', CardController.transacoes);
routes.put('/cards/:id', CardController.update);
routes.delete('/cards/:id', CardController.destroy);

module.exports = routes;