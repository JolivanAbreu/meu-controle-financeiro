// backend/src/controllers/TransactionController.js

const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  parseISO,
  addMonths,
  endOfDay,
} = require('date-fns');

// --- MODELS IMPORTADOS ---
const Transaction = require('../models/Transaction');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');
const Yup = require('yup');

class TransactionController {

  async index(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const whereCondition = { user_id: req.userId };

      if (startDate && endDate) {
        whereCondition.data = {
          [Op.between]: [
            parseISO(startDate),
            endOfDay(parseISO(endDate))
          ],
        };
      }

      const transactions = await Transaction.findAll({
        where: whereCondition,
        order: [['data', 'DESC']],
        include: [
          {
            model: Subcategory,
            as: 'subcategory',
            attributes: ['id', 'name'],
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
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

  async store(req, res) {
    try {
      // Trocado 'categoria' por 'subcategoryId'
      const { tipo, valor, data, descricao, recurrence, installments, subcategoryId } = req.body;
      const userId = req.userId;

      // 1. Validação e Verificação de Segurança da Subcategoria
      if (!subcategoryId) {
        return res.status(400).json({ error: 'O campo subcategoryId é obrigatório.' });
      }
      
      const subcategory = await Subcategory.findOne({
        where: { id: subcategoryId, user_id: userId } 
      });

      if (!subcategory) {
        return res.status(403).json({ error: 'Subcategoria não encontrada ou não pertence a este usuário.' });
      }


      if (recurrence === 'variável') {
        // --- LÓGICA VARIÁVEL (Lançamento único) ---
        const transaction = await Transaction.create({
          user_id: userId,
          tipo, 
          valor, 
          data, 
          descricao,
          subcategoryId,
          recurrence: 'variável',
        });
        return res.status(201).json(transaction);

      } else if (recurrence === 'fixo') {
        // --- LÓGICA FIXA (Baseada na quantidade) ---
        const totalMonths = parseInt(installments, 10);
        if (!totalMonths || totalMonths <= 0) {
          return res.status(400).json({ error: 'A quantidade de meses (installments) é inválida.' });
        }

        const recurrenceGroupId = uuidv4();
        const startDate = parseISO(data); 
        const endDate = addMonths(startDate, totalMonths - 1);

        const transactionsToCreate = [];

        for (let i = 0; i < totalMonths; i++) {
          transactionsToCreate.push({
            user_id: userId,
            tipo,
            valor,
            data: addMonths(startDate, i),
            descricao,
            subcategoryId,
            recurrence: 'fixo',
            recurrence_group_id: recurrenceGroupId,
            recurrence_end_date: endDate,
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

  /**
   * MÉTODO UPDATE (MODIFICADO)
   * - Substituído 'categoria' por 'subcategoryId'.
   * - Adicionada verificação de segurança para a subcategoria.
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { applyToFuture } = req.query;
      
      // --- INÍCIO DA MODIFICAÇÃO ---
      // Trocado 'categoria' por 'subcategoryId'
      const { tipo, valor, data, descricao, subcategoryId } = req.body;
      const userId = req.userId;

      // 1. Validação e Verificação de Segurança
      if (!subcategoryId) {
        return res.status(400).json({ error: 'O campo subcategoryId é obrigatório.' });
      }
      
      const subcategory = await Subcategory.findOne({
        where: { id: subcategoryId, user_id: userId } 
      });

      if (!subcategory) {
        return res.status(403).json({ error: 'Subcategoria não encontrada ou não pertence a este usuário.' });
      }
      // --- FIM DA MODIFICAÇÃO ---


      const transaction = await Transaction.findOne({
        where: { id, user_id: userId },
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transação não encontrada." });
      }

      // Dados da transação atual
      const updateData = { tipo, valor, data, descricao, subcategoryId };

      if (!applyToFuture || applyToFuture === 'false') {
        // Atualiza apenas a transação única
        const updatedTransaction = await transaction.update(updateData);
        return res.json(updatedTransaction);
      }

      // Lógica para aplicar a futuras
      if (!transaction.recurrence_group_id) {
        return res.status(400).json({ error: "Esta não é uma transação recorrente para aplicar a futuras." });
      }

      const originalDate = transaction.data;

      // 1. Atualiza a transação selecionada
      const updatedCurrentTransaction = await transaction.update(updateData);

      // 2. Prepara dados para transações futuras (não atualiza a 'data')
      const futureUpdateData = { tipo, valor, descricao, subcategoryId };

      // 3. Atualiza todas as transações futuras do grupo
      await Transaction.update(futureUpdateData, {
        where: {
          user_id: userId,
          recurrence_group_id: transaction.recurrence_group_id,
          data: {
            [Op.gt]: originalDate, // Apenas datas posteriores à original
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

  /**
   * MÉTODO DESTROY (Sem alterações)
   */
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
    } catch (error)
    {
      console.error("ERRO AO APAGAR TRANSAÇÃO:", error);
      return res.status(500).json({
        error: "Falha ao apagar transação.",
        details: error.message,
      });
    }
  }

  /**
   * MÉTODO DESTROYGROUP (Sem alterações)
   */
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