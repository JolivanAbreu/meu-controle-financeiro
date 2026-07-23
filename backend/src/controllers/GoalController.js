// backend/src/controllers/GoalController.js

const { parseISO, differenceInCalendarMonths, isAfter, startOfDay, addMonths } = require('date-fns');
const Yup = require('yup');
const Goal = require('../models/Goal');
const GoalContribution = require('../models/GoalContribution');
const sequelizeInstance = require('../database'); 
const sequelize = sequelizeInstance.connection;

class GoalController {

    async store(req, res) {
         const schema = Yup.object().shape({
            titulo: Yup.string().required('Título é obrigatório'),
            valor_objetivo: Yup.number().positive('Valor objetivo deve ser positivo').required(),
            prazo: Yup.date().nullable().min(startOfDay(new Date()), 'Prazo não pode ser no passado'),
        });
         try {
            await schema.validate(req.body, { abortEarly: false });
            const { titulo, valor_objetivo, prazo /*, accountId */ } = req.body;

            const goal = await Goal.create({
                userId: req.userId,
                titulo,
                valor_objetivo,
                valor_atual: 0,
                prazo: prazo || null,
            });
            return res.status(201).json(goal.toJSON());
        } catch (error) {
             if (error instanceof Yup.ValidationError) {
                return res.status(400).json({ error: 'Validação falhou.', details: error.errors });
             }
             console.error("ERRO AO CRIAR META:", error);
             return res.status(500).json({ error: 'Falha ao criar meta.', details: error.message });
        }
    }

    async index(req, res) {
        try {
            const goalsRaw = await Goal.findAll({
                 where: { userId: req.userId },
                 order: [['prazo', 'ASC'], ['titulo', 'ASC']]
            });

            const goalsWithCalculations = goalsRaw.map(goal => {
                const goalJSON = goal.toJSON();

                goalJSON.valor_restante = Math.max(0, parseFloat(goalJSON.valor_objetivo) - parseFloat(goalJSON.valor_atual));

                goalJSON.meses_restantes = null;
                goalJSON.aporte_sugerido_mes = null;
                const hoje = startOfDay(new Date());
                const prazoDate = goalJSON.prazo && typeof goalJSON.prazo === 'string' ? parseISO(goalJSON.prazo) : null;

                if (prazoDate && isAfter(prazoDate, hoje)) {
                    goalJSON.meses_restantes = differenceInCalendarMonths(prazoDate, hoje) + 1;
                    if (goalJSON.meses_restantes > 0 && goalJSON.valor_restante > 0) {
                        goalJSON.aporte_sugerido_mes = (goalJSON.valor_restante / goalJSON.meses_restantes).toFixed(2);
                    } else {
                        goalJSON.aporte_sugerido_mes = "0.00";
                    }
                } else if (prazoDate && !isAfter(prazoDate, hoje)) {
                     goalJSON.meses_restantes = 0;
                     goalJSON.aporte_sugerido_mes = goalJSON.valor_restante > 0 ? null : "0.00";
                }


                if (parseFloat(goalJSON.valor_atual) >= parseFloat(goalJSON.valor_objetivo)) {
                    goalJSON.status = 'completed';
                } else if (prazoDate && !isAfter(prazoDate, hoje)) {
                    goalJSON.status = 'overdue';
                } else if (goalJSON.meses_restantes !== null && goalJSON.meses_restantes > 0 && goalJSON.createdAt) {
                    try {
                        const inicioDate = parseISO(goalJSON.createdAt);
                        const totalMonthsDuration = differenceInCalendarMonths(prazoDate, inicioDate) + 1;
                        const elapsedMonths = differenceInCalendarMonths(hoje, inicioDate);

                        if (totalMonthsDuration > 0 && elapsedMonths >= 0) {
                             const timePercentageElapsed = Math.max(0, Math.min(100, (elapsedMonths / totalMonthsDuration) * 100));
                             const valuePercentageAchieved = Math.max(0, Math.min(100, (parseFloat(goalJSON.valor_atual) / parseFloat(goalJSON.valor_objetivo)) * 100));

                             if (valuePercentageAchieved >= timePercentageElapsed || valuePercentageAchieved > 95) {
                                  goalJSON.status = 'on_track';
                             } else {
                                  goalJSON.status = 'behind';
                             }
                        } else {
                             goalJSON.status = 'pending';
                        }
                    } catch(dateError) {
                         console.error("Erro ao calcular status da meta:", dateError, goalJSON);
                         goalJSON.status = 'pending';
                    }

                } else {
                    goalJSON.status = 'pending';
                }

                return goalJSON;
            });


            return res.json(goalsWithCalculations);
        } catch (error) {
             console.error("ERRO AO LISTAR METAS:", error);
            return res.status(500).json({ error: 'Falha ao listar metas.', details: error.message });
        }
    }

    async update(req, res) {
         const schema = Yup.object().shape({
            titulo: Yup.string().required('Título é obrigatório'),
            valor_objetivo: Yup.number().positive('Valor objetivo deve ser positivo').required(),
            prazo: Yup.date().nullable().min(startOfDay(new Date()), 'Prazo não pode ser no passado'),
            // accountId: Yup.number().integer().nullable()
        });
        try {
            const { id } = req.params;
            await schema.validate(req.body, { abortEarly: false });
            const { titulo, valor_objetivo, prazo /*, accountId*/ } = req.body;

            const goal = await Goal.findOne({ where: { id, userId: req.userId } });
            if (!goal) {
                return res.status(404).json({ error: 'Meta não encontrada.' });
            }

            const updateData = {
                titulo,
                valor_objetivo,
                prazo: prazo || null,
                // accountId: accountId || null,
            };

            const updatedGoalRaw = await goal.update(updateData);

            const reloadedGoal = await Goal.findByPk(id);
            if (!reloadedGoal) throw new Error("Falha ao recarregar meta após update.");

            const updatedGoalJSON = reloadedGoal.toJSON();
            // --- Recalcular campos virtuais (Copiar/Colar lógica do método 'index') ---
            updatedGoalJSON.valor_restante = Math.max(0, parseFloat(updatedGoalJSON.valor_objetivo) - parseFloat(updatedGoalJSON.valor_atual));
            updatedGoalJSON.meses_restantes = null;
            updatedGoalJSON.aporte_sugerido_mes = null;
            const hoje = startOfDay(new Date());
            const prazoDate = updatedGoalJSON.prazo && typeof updatedGoalJSON.prazo === 'string' ? parseISO(updatedGoalJSON.prazo) : null;
            if (prazoDate && isAfter(prazoDate, hoje)) {
                updatedGoalJSON.meses_restantes = differenceInCalendarMonths(prazoDate, hoje) + 1;
                if (updatedGoalJSON.meses_restantes > 0 && updatedGoalJSON.valor_restante > 0) {
                    updatedGoalJSON.aporte_sugerido_mes = (updatedGoalJSON.valor_restante / updatedGoalJSON.meses_restantes).toFixed(2);
                } else { updatedGoalJSON.aporte_sugerido_mes = "0.00"; }
            } else if (prazoDate && !isAfter(prazoDate, hoje)) {
                updatedGoalJSON.meses_restantes = 0;
                updatedGoalJSON.aporte_sugerido_mes = updatedGoalJSON.valor_restante > 0 ? null : "0.00";
            }
            if (parseFloat(updatedGoalJSON.valor_atual) >= parseFloat(updatedGoalJSON.valor_objetivo)) { updatedGoalJSON.status = 'completed'; }
            else if (prazoDate && !isAfter(prazoDate, hoje)) { updatedGoalJSON.status = 'overdue'; }
            else if (updatedGoalJSON.meses_restantes !== null && updatedGoalJSON.meses_restantes > 0 && updatedGoalJSON.createdAt) {
                 try { const inicioDate = parseISO(updatedGoalJSON.createdAt); const totalMonthsDuration = differenceInCalendarMonths(prazoDate, inicioDate) + 1; const elapsedMonths = differenceInCalendarMonths(hoje, inicioDate); if (totalMonthsDuration > 0 && elapsedMonths >= 0) { const timePercentageElapsed = Math.max(0, Math.min(100, (elapsedMonths / totalMonthsDuration) * 100)); const valuePercentageAchieved = Math.max(0, Math.min(100, (parseFloat(updatedGoalJSON.valor_atual) / parseFloat(updatedGoalJSON.valor_objetivo)) * 100)); if (valuePercentageAchieved >= timePercentageElapsed || valuePercentageAchieved > 95) { updatedGoalJSON.status = 'on_track'; } else { updatedGoalJSON.status = 'behind'; } } else { updatedGoalJSON.status = 'pending'; } } catch(dateError) { console.error("Erro ao calcular status da meta (update):", dateError, updatedGoalJSON); updatedGoalJSON.status = 'pending'; }
            } else { updatedGoalJSON.status = 'pending'; }
            // --- Fim do Recálculo ---

            return res.json(updatedGoalJSON);
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
               return res.status(400).json({ error: 'Validação falhou.', details: error.errors });
            }
            console.error("ERRO AO ATUALIZAR META:", error);
            return res.status(500).json({ error: 'Falha ao atualizar meta.', details: error.message });
        }
    }

    async addContribution(req, res) {
        const { id: goalId } = req.params;
        const userId = req.userId;

        const schema = Yup.object().shape({
            valor: Yup.number().positive('Valor do aporte deve ser positivo').required(),
            data: Yup.date().required('Data do aporte é obrigatória').max(new Date(), 'Data não pode ser futura'),
            // conta_origem_id: Yup.number().integer().nullable()
        });

        const t = await sequelize.transaction();

        try {
            await schema.validate(req.body, { abortEarly: false });
            const { valor, data /*, conta_origem_id */ } = req.body;
            const aporteValor = parseFloat(valor);

            const goal = await Goal.findOne({
                where: { id: goalId, userId },
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!goal) {
                await t.rollback();
                return res.status(404).json({ error: 'Meta não encontrada ou não pertence a você.' });
            }

            console.log("Criando contribuição:", { userId, goalId, valor: aporteValor, data });
            await GoalContribution.create({
                userId, goalId, valor: aporteValor, data,
            }, { transaction: t });
            console.log("Contribuição criada.");

            console.log("Incrementando valor_atual da meta ID:", goalId, "por", aporteValor);
            const [affectedRows, updatedGoals] = await Goal.increment(
                { valor_atual: aporteValor },
                { where: { id: goalId }, transaction: t, returning: true }
            );
             console.log("Incremento concluído. Linhas afetadas:", affectedRows);

            await t.commit();
            console.log("Transação commitada.");

            const finalGoal = updatedGoals && updatedGoals.length > 0 && updatedGoals[0].length > 0 ? updatedGoals[0][0] : null;

             if (finalGoal) {
                 // --- Recalcular campos virtuais (Copiar/Colar lógica do método 'index') ---
                 const finalGoalJSON = finalGoal.toJSON();
                 finalGoalJSON.valor_restante = Math.max(0, parseFloat(finalGoalJSON.valor_objetivo) - parseFloat(finalGoalJSON.valor_atual));
                 finalGoalJSON.meses_restantes = null;
                 finalGoalJSON.aporte_sugerido_mes = null;
                 const hoje = startOfDay(new Date());
                 const prazoDate = finalGoalJSON.prazo && typeof finalGoalJSON.prazo === 'string' ? parseISO(finalGoalJSON.prazo) : null;
                 if (prazoDate && isAfter(prazoDate, hoje)) {
                     finalGoalJSON.meses_restantes = differenceInCalendarMonths(prazoDate, hoje) + 1;
                     if (finalGoalJSON.meses_restantes > 0 && finalGoalJSON.valor_restante > 0) {
                         finalGoalJSON.aporte_sugerido_mes = (finalGoalJSON.valor_restante / finalGoalJSON.meses_restantes).toFixed(2);
                     } else { finalGoalJSON.aporte_sugerido_mes = "0.00"; }
                 } else if (prazoDate && !isAfter(prazoDate, hoje)) {
                     finalGoalJSON.meses_restantes = 0;
                     finalGoalJSON.aporte_sugerido_mes = finalGoalJSON.valor_restante > 0 ? null : "0.00";
                 }
                 if (parseFloat(finalGoalJSON.valor_atual) >= parseFloat(finalGoalJSON.valor_objetivo)) { finalGoalJSON.status = 'completed'; }
                 else if (prazoDate && !isAfter(prazoDate, hoje)) { finalGoalJSON.status = 'overdue'; }
                 else if (finalGoalJSON.meses_restantes !== null && finalGoalJSON.meses_restantes > 0 && finalGoalJSON.createdAt) {
                      try { const inicioDate = parseISO(finalGoalJSON.createdAt); const totalMonthsDuration = differenceInCalendarMonths(prazoDate, inicioDate) + 1; const elapsedMonths = differenceInCalendarMonths(hoje, inicioDate); if (totalMonthsDuration > 0 && elapsedMonths >= 0) { const timePercentageElapsed = Math.max(0, Math.min(100, (elapsedMonths / totalMonthsDuration) * 100)); const valuePercentageAchieved = Math.max(0, Math.min(100, (parseFloat(finalGoalJSON.valor_atual) / parseFloat(finalGoalJSON.valor_objetivo)) * 100)); if (valuePercentageAchieved >= timePercentageElapsed || valuePercentageAchieved > 95) { finalGoalJSON.status = 'on_track'; } else { finalGoalJSON.status = 'behind'; } } else { finalGoalJSON.status = 'pending'; } } catch(dateError) { console.error("Erro ao calcular status da meta (aporte):", dateError, finalGoalJSON); finalGoalJSON.status = 'pending'; }
                 } else { finalGoalJSON.status = 'pending'; }
                 // --- Fim do Recálculo ---
                 return res.json(finalGoalJSON);
             } else {
                 console.warn("Increment não retornou a meta, buscando novamente...");
                 const reloadedGoal = await Goal.findByPk(goalId);
                 if (!reloadedGoal) throw new Error("Falha grave ao recarregar meta após aporte.");
                 // --- Recalcular campos virtuais (Copiar/Colar lógica do método 'index') ---
                 const reloadedGoalJSON = reloadedGoal.toJSON();
                 // ... (adicionar toda a lógica de cálculo aqui também) ...
                 return res.json(reloadedGoalJSON);
             }


        } catch (error) {
            await t.rollback();
            if (error instanceof Yup.ValidationError) {
                 console.error('ERRO DE VALIDAÇÃO AO APORTAR:', error.errors);
                return res.status(400).json({ error: 'Dados inválidos.', details: error.errors });
             }
            console.error("ERRO AO ADICIONAR APORTE:", error);
            return res.status(500).json({ error: 'Falha ao adicionar aporte.', details: error.message });
        }
    }

    async destroy(req, res) {
         try {
            const { id } = req.params;
            const goal = await Goal.findOne({ where: { id, userId: req.userId } });
            if (!goal) {
                return res.status(404).json({ error: 'Meta não encontrada.' });
            }
            await goal.destroy();
            return res.status(204).send();
        } catch (error) {
            console.error("ERRO AO APAGAR META:", error);
            return res.status(500).json({ error: 'Falha ao apagar meta.', details: error.message });
        }
    }

    async listContributions(req, res) {
        try {
            const { id: goalId } = req.params;
            const userId = req.userId;

            const goal = await Goal.findOne({ where: { id: goalId, userId } });
            if (!goal) {
                return res.status(404).json({ error: 'Meta não encontrada.' });
            }

            const contributions = await GoalContribution.findAll({
                where: { goalId, userId },
                order: [['data', 'DESC'], ['id', 'DESC']],
            });

            return res.json(contributions);
        } catch (error) {
            console.error("ERRO AO LISTAR APORTES:", error);
            return res.status(500).json({ error: 'Falha ao listar aportes.', details: error.message });
        }
    }
}

module.exports = new GoalController();