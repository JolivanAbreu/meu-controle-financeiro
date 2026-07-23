// frontend/src/services/categoryService.js

import api from './api';

export const getCategories = () => {
  return api.get('/categories');
};

/**
 * Atualiza a cor de uma categoria (usada nos gráficos).
 * @param {number} id
 * @param {object} data - { cor: '#3E6B52' }
 */
export const updateCategory = (id, data) => {
  return api.put(`/categories/${id}`, data);
};

export const getSubcategories = () => {
  return api.get('/subcategories');
};

/**
 * Cria uma nova subcategoria.
 * @param {object} data - { name: 'Nome', categoryId: 1 }
 */
export const createSubcategory = (data) => {
  return api.post('/subcategories', data);
};

/**
 * Atualiza uma subcategoria existente.
 * @param {number} id - ID da subcategoria a ser atualizada.
 * @param {object} data - { name: 'Novo Nome', categoryId: 2 }
 */
export const updateSubcategory = (id, data) => {
  return api.put(`/subcategories/${id}`, data);
};

/**
 * Deleta uma subcategoria.
 * @param {number} id - ID da subcategoria a ser deletada.
 */
export const deleteSubcategory = (id) => {
  return api.delete(`/subcategories/${id}`);
};