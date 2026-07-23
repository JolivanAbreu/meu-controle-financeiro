// frontend/src/services/goalService.js
import api from './api';

export const getGoals = () => {
    return api.get('/goals');
};

export const createGoal = (data) => {
    const { valor_atual, ...payload } = data;
    return api.post('/goals', payload);
};

export const updateGoal = (id, data) => {
    const { valor_atual, ...payload } = data;
    return api.put(`/goals/${id}`, payload);
};

export const deleteGoal = (id) => {
    return api.delete(`/goals/${id}`);
};

export const addGoalContribution = (goalId, data) => {
    return api.post(`/goals/${goalId}/contribute`, data);
};

export const getGoalContributions = (goalId) => {
    return api.get(`/goals/${goalId}/contributions`);
};