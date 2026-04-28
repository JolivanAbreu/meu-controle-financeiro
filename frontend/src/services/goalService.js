// frontend/src/services/goalService.js (Exemplo)
import api from './api';

export const getGoals = () => {
    return api.get('/goals');
};

export const createGoal = (data) => {
    // Garante que valor_atual não seja enviado
    const { valor_atual, ...payload } = data;
    return api.post('/goals', payload);
};

export const updateGoal = (id, data) => {
     // Garante que valor_atual não seja enviado
    const { valor_atual, ...payload } = data;
    return api.put(`/goals/${id}`, payload);
};

export const deleteGoal = (id) => {
    return api.delete(`/goals/${id}`);
};

// --- NOVA FUNÇÃO ---
export const addGoalContribution = (goalId, data) => {
    // data deve ser { valor: number, data: string 'YYYY-MM-DD' }
    return api.post(`/goals/${goalId}/contribute`, data);
};
// -----------------