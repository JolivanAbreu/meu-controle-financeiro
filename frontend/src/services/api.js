import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333/api', // ATUALIZADO
});

// Interceptor para adicionar o token JWT a todas as requisições
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token'); // Ou de onde você armazena o token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Autenticação ---
// (Assumindo que suas rotas de login/registro são /api/login e /api/register)
// Se elas não tiverem o /api, talvez precisemos ajustar
export const login = (email, password) => api.post('/login', { email, password });
export const register = (name, email, password) => api.post('/register', { name, email, password });
// export const getUser = () => api.get('/users'); // Descomente se tiver essa rota

// --- Transações ---
export const getTransactions = (params) => api.get('/transactions', { params });
export const addTransaction = (transaction) => api.post('/transactions', transaction);
export const updateTransaction = (id, transaction) => api.put(`/transactions/${id}`, transaction);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
// export const getSummary = () => api.get('/transactions/summary'); // Descomente se tiver essa rota

// --- Categorias ---
export const getCategories = () => api.get('/categories');
// export const addCategory = (category) => api.post('/categories', category);
// export const updateCategory = (id, category) => api.put(`/categories/${id}`, category);
// export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// --- Subcategorias ---
export const getSubcategories = () => api.get('/subcategories');
export const addSubcategory = (subcategory) => api.post('/subcategories', subcategory);
// export const updateSubcategory = (id, subcategory) => api.put(`/subcategories/${id}`, subcategory);
// export const deleteSubcategory = (id) => api.delete(`/subcategories/${id}`);

// --- Orçamentos (Budgets) ---
export const getBudgets = () => api.get('/budgets');
export const addBudget = (budget) => api.post('/budgets', budget);

// --- Metas (Goals) ---
export const getGoals = () => api.get('/goals');
export const addGoal = (goal) => api.post('/goals', goal);

// --- Relatórios (Reports) ---
/**
 * Gera um relatório customizado.
 * @param {object} filterOptions - Opções de filtro.
 * @param {string[]} filterOptions.categories - IDs das categorias.
 * @param {string[]} filterOptions.subcategories - IDs das subcategorias.
 * @param {string} filterOptions.keywords - Palavras-chave para "Outros".
 * @param {boolean} filterOptions.sendEmail - Se deve enviar por e-mail.
 */
export const generateCustomReport = (filterOptions) => {
  if (filterOptions.sendEmail) {
    // Se for e-mail, espera uma resposta JSON
    return api.post('/reports/custom', filterOptions);
  } else {
    // Se for download, espera um 'blob'
    return api.post('/reports/custom', filterOptions, {
      responseType: 'blob',
    });
  }
};

export default api;

