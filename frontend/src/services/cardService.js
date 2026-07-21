// frontend/src/services/cardService.js

import api from './api';

export const getCards = (params = {}) => {
  return api.get('/cards', { params });
};

export const getCardTransactions = (id, params = {}) => {
  return api.get(`/cards/${id}/transacoes`, { params });
};

export const createCard = (data) => {
  return api.post('/cards', data);
};

export const updateCard = (id, data) => {
  return api.put(`/cards/${id}`, data);
};

export const deleteCard = (id) => {
  return api.delete(`/cards/${id}`);
};

export const getCardHistory = (id, meses = 6) => {
  return api.get(`/cards/${id}/historico`, { params: { meses } });
};