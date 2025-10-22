// frontend/src/services/categoryService.js

import api from './api';


export const getCategories = () => {
  return api.get('/categories');
};

export const getSubcategories = () => {
  return api.get('/subcategories');
};

/**
 * Cria uma nova subcategoria.
 * @param {object} data - { name: 'Nome da Subcategoria', categoryId: 1 }
 */
export const createSubcategory = (data) => {
  return api.post('/subcategories', data);
};

// TODO: Você pode adicionar 'updateSubcategory' e 'deleteSubcategory' aqui no futuro