// backend/src/controllers/TransactionController.js

const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  parseISO,
  addMonths,
  endOfDay,
  differenceInCalendarMonths,
  isAfter
} = require('date-fns');
const Transaction = require("../models/Transaction");

class TransactionController {

  async index(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const whereCondition = { user_id: req.userId };

      if (startDate && endDate) {
        whereCondition.data = {
          [Op.between]: [
            parseISO(startDate),
            endOfDay(parseISO(endDate)) // Ex: 2025-10-20T23:59:59.999
          ],
        };
      }

      const transactions = await Transaction.findAll({
        where: whereCondition,
        order: [['data', 'DESC']],
      });
      return res.json(transactions);
    } catch (error) {
      console.error('ERRO AO LISTAR TRANSAÇÕES:', error);
      return res.status(500).json({
        error: 'Erro ao listar transações.',
        details: error.message,
      });
    }
  }

  // MODIFICADO: Lógica de 'fixo' com data final
  async store(req, res) {
    try {
      // Pega 'installments' em vez de 'recurrence_end_date'
      const { tipo, categoria, valor, data, descricao, recurrence, installments } = req.body;
      const userId = req.userId;

      if (recurrence === 'variável') {
        // --- LÓGICA VARIÁVEL (Lançamento único) ---
        const transaction = await Transaction.create({
          user_id: userId,
          tipo, categoria, valor, data, descricao,
          recurrence: 'variável',
        });
        return res.status(201).json(transaction);

      } else if (recurrence === 'fixo') {
        // --- LÓGICA FIXA (Baseada na quantidade) ---

        // 1. Validação da Quantidade
        const totalMonths = parseInt(installments, 10);
        if (!totalMonths || totalMonths <= 0) {
          return res.status(400).json({ error: 'A quantidade de meses (installments) é inválida.' });
        }

        const recurrenceGroupId = uuidv4();
        const startDate = parseISO(data); // Data de início

        // 2. Calcular a data final para salvar no banco
        const endDate = addMonths(startDate, totalMonths - 1);

        const transactionsToCreate = [];

        // 3. Loop baseado na quantidade
        for (let i = 0; i < totalMonths; i++) {
          transactionsToCreate.push({
            user_id: userId,
            tipo,
            categoria,
            valor,
            data: addMonths(startDate, i), // Adiciona 'i' meses à data
            descricao,
            recurrence: 'fixo',
            recurrence_group_id: recurrenceGroupId,
            recurrence_end_date: endDate, // Salva a data final calculada
          });
        }

        const createdTransactions = await Transaction.bulkCreate(transactionsToCreate);
        return res.status(201).json(createdTransactions);

      }

      return res.status(400).json({ error: 'Tipo de recorrência inválido.' });

    } catch (error) {
      console.error('ERRO AO CRIAR TRANSAÇÃO:', error);
      return res.status(500).json({
        error: 'Falha ao criar transação.',
        details: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { applyToFuture } = req.query;
      const { tipo, categoria, valor, data, descricao } = req.body;

      const transaction = await Transaction.findOne({
        where: { id, user_id: req.userId },
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transação não encontrada." });
      }

      if (!applyToFuture || applyToFuture === 'false') {
        const updatedTransaction = await transaction.update({
          tipo, categoria, valor, data, descricao
        });
        return res.json(updatedTransaction);
      }

      if (!transaction.recurrence_group_id) {
        return res.status(400).json({ error: "Esta não é uma transação recorrente para aplicar a futuras." });
      }

      const originalDate = transaction.data;

      const updatedCurrentTransaction = await transaction.update({
        tipo, categoria, valor, data, descricao
      });

      const futureUpdateData = { tipo, categoria, valor, descricao };

      await Transaction.update(futureUpdateData, {
        where: {
          user_id: req.userId,
          recurrence_group_id: transaction.recurrence_group_id,
          data: {
            [Op.gt]: originalDate,
          },
        },
      });

      return res.json(updatedCurrentTransaction);

    } catch (error) {
      console.error("ERRO AO ATUALIZAR TRANSAÇÃO:", error);
      return res.status(500).json({
        error: "Falha ao atualizar transação.",
        details: error.message,
      });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.findOne({
        where: { id, user_id: req.userId },
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transação não encontrada." });
      }

      await transaction.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error("ERRO AO APAGAR TRANSAÇÃO:", error);
      return res.status(500).json({
        error: "Falha ao apagar transação.",
        details: error.message,
      });
    }
  }

  async destroyGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { date } = req.query;
      const userId = req.userId;

      if (!date) {
        return res.status(400).json({ error: "A data de corte é obrigatória." });
      }

      await Transaction.destroy({
        where: {
          user_id: userId,
          recurrence_group_id: groupId,
          data: {
            [Op.gte]: parseISO(date),
          },
        },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("ERRO AO APAGAR GRUPO DE TRANSAÇÕES:", error);
      return res.status(500).json({
        error: "Falha ao apagar transações futuras.",
        details: error.message,
      });
    }
  }
}

module.exports = new TransactionController();