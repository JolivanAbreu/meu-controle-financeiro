// backend/src/controllers/BudgetController.js

const { Op } = require('sequelize');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');

class BudgetController {

    async store(req, res) {
        try {
            const { categoria, limite, mes, ano } = req.body;
            const user_id = req.userId;

            const categoryExistsInTable = await Category.findOne({ where: { name: categoria } });
            if (!categoryExistsInTable) {
                return res.status(400).json({ error: `Categoria principal '${categoria}' não encontrada.` });
            }

            const budgetExists = await Budget.findOne({ where: { user_id, categoria, mes, ano } });
            if (budgetExists) {
                return res.status(400).json({ error: 'Orçamento já cadastrado para esta categoria e mês.' });
            }

            const budget = await Budget.create({ user_id, categoria, limite, mes, ano });
            return res.status(201).json(budget);
        } catch (error) {
            console.error("ERRO AO CRIAR ORÇAMENTO:", error);
            return res.status(500).json({ error: 'Falha ao criar orçamento.', details: error.message });
        }
    }

    async index(req, res) {
        try {
            const userId = req.userId;
            const { mes, ano } = req.query;

            const whereCondition = { user_id: userId };
            if (mes && ano) {
                whereCondition.mes = parseInt(mes, 10);
                whereCondition.ano = parseInt(ano, 10);
            }

            const budgets = await Budget.findAll({ where: whereCondition });
            const allCategories = await Category.findAll();
            const categoryMap = new Map(allCategories.map(cat => [cat.name, cat.id]));

            const budgetsComGastos = await Promise.all(
                budgets.map(async (budget) => {
                    const inicioDoMes = new Date(budget.ano, budget.mes - 1, 1);
                    const fimDoMes = new Date(budget.ano, budget.mes, 0, 23, 59, 59, 999);
                    const categoryId = categoryMap.get(budget.categoria);
                    let totalGasto = 0;

                    if (categoryId) {
                        const userSubcategories = await Subcategory.findAll({
                            where: {
                                userId: userId,
                                categoryId: categoryId,
                            },
                            attributes: ['id'],
                        });
                        const subcategoryIds = userSubcategories.map(sub => sub.id);

                        if (subcategoryIds.length > 0) {
                            totalGasto = await Transaction.sum('valor', {
                                where: {
                                    userId: userId,
                                    subcategoryId: {
                                        [Op.in]: subcategoryIds,
                                    },
                                    tipo: 'despesa',
                                    data: {
                                        [Op.between]: [inicioDoMes.toISOString().split('T')[0], fimDoMes.toISOString().split('T')[0]],
                                    },
                                },
                            });
                        } else {
                            console.log(`Nenhuma subcategoria encontrada para Categoria ID ${categoryId}, Usuário ID ${userId}`);
                        }
                    } else {
                        console.warn(`Categoria '${budget.categoria}' do orçamento ID ${budget.id} não encontrada na tabela 'categories'.`);
                    }


                    return {
                        ...budget.toJSON(),
                        gasto_atual: totalGasto || 0,
                    };
                })
            );

            return res.json(budgetsComGastos);
        } catch (error) {
            console.error("ERRO AO LISTAR ORÇAMENTOS:", error);
            return res.status(500).json({ error: 'Falha ao listar orçamentos.', details: error.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId; 
            const { categoria, limite, mes, ano } = req.body;
            if (categoria) {
                const categoryExistsInTable = await Category.findOne({ where: { name: categoria } });
                if (!categoryExistsInTable) {
                    return res.status(400).json({ error: `Categoria principal '${categoria}' não encontrada.` });
                }
            }

            const budget = await Budget.findOne({ where: { id, user_id: userId } });

            if (!budget) {
                return res.status(404).json({ error: 'Orçamento não encontrado.' });
            }

            const updatedBudget = await budget.update({ categoria, limite, mes, ano });
            return res.json(updatedBudget);
        } catch (error) {
            console.error("ERRO AO ATUALIZAR ORÇAMENTO:", error);
            return res.status(500).json({ error: 'Falha ao atualizar orçamento.', details: error.message });
        }
    }

    async destroy(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const budget = await Budget.findOne({ where: { id, user_id: userId } });

            if (!budget) {
                return res.status(404).json({ error: 'Orçamento não encontrado.' });
            }

            await budget.destroy();
            return res.status(204).send();
        } catch (error) {
            console.error("ERRO AO APAGAR ORÇAMENTO:", error);
            return res.status(500).json({ error: 'Falha ao apagar orçamento.', details: error.message });
        }
    }

}

module.exports = new BudgetController();