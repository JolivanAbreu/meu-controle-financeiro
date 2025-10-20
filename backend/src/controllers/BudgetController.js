// backend/src/controllers/BudgetController.js

const { Op } = require('sequelize');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

class BudgetController {
    
    async store(req, res) {
        try {
            const { categoria, limite, mes, ano } = req.body;
            const user_id = req.userId;

            const budgetExists = await Budget.findOne({ where: { user_id, categoria, mes, ano } });
            if (budgetExists) {
                return res.status(400).json({ error: 'Orçamento já cadastrado para esta categoria e mês.' });
            }

            const budget = await Budget.create({ user_id, categoria, limite, mes, ano });
            return res.status(201).json(budget);
        } catch (error) {
            return res.status(500).json({ error: 'Falha ao criar orçamento.', details: error.message });
        }
    }

    async index(req, res) {
        try {
            const user_id = req.userId;
            const { mes, ano } = req.query;

            const whereCondition = { user_id };
            if (mes && ano) {
                whereCondition.mes = mes;
                whereCondition.ano = ano;
            }

            const budgets = await Budget.findAll({ where: whereCondition });

            const budgetsComGastos = await Promise.all(
                budgets.map(async (budget) => {
                    const inicioDoMes = new Date(budget.ano, budget.mes - 1, 1);
                    const fimDoMes = new Date(budget.ano, budget.mes, 0);

                    const totalGasto = await Transaction.sum('valor', {
                        where: {
                            user_id,
                            categoria: budget.categoria,
                            tipo: 'despesa',
                            data: { [Op.between]: [inicioDoMes, fimDoMes] },
                        },
                    });

                    return {
                        ...budget.toJSON(),
                        gasto_atual: totalGasto || 0,
                    };
                })
            );

            return res.json(budgetsComGastos);
        } catch (error) {
            return res.status(500).json({ error: 'Falha ao listar orçamentos.', details: error.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const budget = await Budget.findOne({ where: { id, user_id: req.userId } });

            if (!budget) {
                return res.status(404).json({ error: 'Orçamento não encontrado.' });
            }

            const updatedBudget = await budget.update(req.body);
            return res.json(updatedBudget);
        } catch (error) {
            return res.status(500).json({ error: 'Falha ao atualizar orçamento.', details: error.message });
        }
    }

    async destroy(req, res) {
        try {
            const { id } = req.params;
            const budget = await Budget.findOne({ where: { id, user_id: req.userId } });

            if (!budget) {
                return res.status(404).json({ error: 'Orçamento não encontrado.' });
            }

            await budget.destroy();
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ error: 'Falha ao apagar orçamento.', details: error.message });
        }
    }

}

module.exports = new BudgetController();