// backend/src/controllers/CardController.js

const { Op, fn, col } = require('sequelize');
const Card = require('../models/Card');
const Transaction = require('../models/Transaction');

function safeDate(year, monthIndex, day) {
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDayOfMonth));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getCurrentCycle(diaFechamento, now = new Date()) {
  const closingThisMonth = safeDate(now.getFullYear(), now.getMonth(), diaFechamento);
  let cycleEndDate;
  let prevClosing;

  if (now <= closingThisMonth) {
    cycleEndDate = closingThisMonth;
    const prevMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevClosing = safeDate(prevMonthRef.getFullYear(), prevMonthRef.getMonth(), diaFechamento);
  } else {
    const nextMonthRef = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    cycleEndDate = safeDate(nextMonthRef.getFullYear(), nextMonthRef.getMonth(), diaFechamento);
    prevClosing = closingThisMonth;
  }

  const cycleStart = addDays(prevClosing, 1);
  const cycleEnd = new Date(
    cycleEndDate.getFullYear(),
    cycleEndDate.getMonth(),
    cycleEndDate.getDate(),
    23, 59, 59, 999
  );
  return { cycleStart, cycleEnd };
}

function getCycleForClosingMonth(diaFechamento, year, monthIndex) {
  const closing = safeDate(year, monthIndex, diaFechamento);
  const prevMonthRef = new Date(year, monthIndex - 1, 1);
  const prevClosing = safeDate(prevMonthRef.getFullYear(), prevMonthRef.getMonth(), diaFechamento);
  const cycleStart = addDays(prevClosing, 1);
  const cycleEnd = new Date(closing.getFullYear(), closing.getMonth(), closing.getDate(), 23, 59, 59, 999);
  return { cycleStart, cycleEnd };
}

function getPastCycles(diaFechamento, count, now = new Date()) {
  const current = getCurrentCycle(diaFechamento, now);
  const cycles = [current];
  let refYear = current.cycleEnd.getFullYear();
  let refMonth = current.cycleEnd.getMonth();

  for (let i = 1; i < count; i++) {
    refMonth -= 1;
    if (refMonth < 0) {
      refMonth = 11;
      refYear -= 1;
    }
    cycles.unshift(getCycleForClosingMonth(diaFechamento, refYear, refMonth));
  }

  return cycles;
}

class CardController {
  async store(req, res) {
    try {
      const userId = req.userId;
      const {
        nome,
        banco,
        bandeira,
        tipo,
        cartaoPaiId,
        limiteTotal,
        diaFechamento,
        diaVencimento,
        cor,
      } = req.body;

      if (!nome || !banco || !tipo) {
        return res.status(400).json({ error: 'Nome, banco e tipo são obrigatórios.' });
      }
      if (!['fisico', 'virtual'].includes(tipo)) {
        return res.status(400).json({ error: "Tipo deve ser 'fisico' ou 'virtual'." });
      }

      let cardData = { userId, nome, banco, bandeira: bandeira || null, tipo, cor: cor || null };

      if (tipo === 'fisico') {
        if (!limiteTotal || !diaFechamento || !diaVencimento) {
          return res.status(400).json({
            error: 'Cartões físicos exigem limite total, dia de fechamento e dia de vencimento.',
          });
        }
        cardData = {
          ...cardData,
          cartaoPaiId: null,
          limiteTotal,
          diaFechamento,
          diaVencimento,
        };
      } else {
        if (!cartaoPaiId) {
          return res.status(400).json({ error: 'Cartões virtuais precisam estar vinculados a um cartão físico.' });
        }
        const cartaoPai = await Card.findOne({ where: { id: cartaoPaiId, userId } });
        if (!cartaoPai) {
          return res.status(404).json({ error: 'Cartão físico vinculado não encontrado.' });
        }
        if (cartaoPai.tipo !== 'fisico') {
          return res.status(400).json({ error: 'Um cartão virtual só pode ser vinculado a um cartão físico.' });
        }
        // Cartões virtuais herdam limite e datas do físico; nunca têm valor próprio.
        cardData = {
          ...cardData,
          cartaoPaiId: cartaoPai.id,
          limiteTotal: null,
          diaFechamento: null,
          diaVencimento: null,
        };
      }

      const card = await Card.create(cardData);
      return res.status(201).json(card);
    } catch (error) {
      console.error('ERRO AO CRIAR CARTÃO:', error);
      return res.status(500).json({ error: 'Falha ao criar cartão.', details: error.message });
    }
  }

  async index(req, res) {
    try {
      const userId = req.userId;
      const { includeInactive, mes, ano } = req.query;

      const whereCondition = { userId };
      if (includeInactive !== 'true') {
        whereCondition.ativo = true;
      }

      const cards = await Card.findAll({
        where: whereCondition,
        order: [['tipo', 'ASC'], ['nome', 'ASC']],
      });

      const cardsById = new Map(cards.map((c) => [c.id, c]));
      const mesRef = mes ? parseInt(mes, 10) : null;
      const anoRef = ano ? parseInt(ano, 10) : null;

      const totalGastoRows = await Transaction.findAll({
        attributes: ['cardId', [fn('SUM', col('valor')), 'total']],
        where: { userId, tipo: 'despesa', cardId: { [Op.ne]: null } },
        group: ['cardId'],
        raw: true,
      });
      const totalGastoPorCartao = new Map(
        totalGastoRows.map((r) => [r.cardId, parseFloat(r.total) || 0])
      );

      const fisicos = cards.filter((c) => c.tipo === 'fisico');
      const gastoPorCicloPorCartao = new Map();
      const faturaAbertaPorFisico = new Map();

      for (const fisico of fisicos) {
        if (!fisico.diaFechamento) continue;

        const { cycleStart, cycleEnd } = mesRef && anoRef
          ? getCycleForClosingMonth(fisico.diaFechamento, anoRef, mesRef - 1)
          : getCurrentCycle(fisico.diaFechamento);

        faturaAbertaPorFisico.set(fisico.id, new Date() <= cycleEnd);

        const idsDoGrupo = [
          fisico.id,
          ...cards.filter((c) => c.cartaoPaiId === fisico.id).map((c) => c.id),
        ];

        const rows = await Transaction.findAll({
          attributes: ['cardId', [fn('SUM', col('valor')), 'total']],
          where: {
            userId,
            tipo: 'despesa',
            cardId: { [Op.in]: idsDoGrupo },
            data: {
              [Op.between]: [
                cycleStart.toISOString().split('T')[0],
                cycleEnd.toISOString().split('T')[0],
              ],
            },
          },
          group: ['cardId'],
          raw: true,
        });

        rows.forEach((r) => gastoPorCicloPorCartao.set(r.cardId, parseFloat(r.total) || 0));
      }

      const cardsComStats = cards.map((card) => {
        const isFisico = card.tipo === 'fisico';
        const cartaoBase = isFisico ? card : cardsById.get(card.cartaoPaiId);
        const limiteTotal = cartaoBase ? parseFloat(cartaoBase.limiteTotal || 0) : 0;

        const idsDoGrupo = isFisico
          ? [card.id, ...cards.filter((c) => c.cartaoPaiId === card.id).map((c) => c.id)]
          : [card.id];

        const limiteUtilizado = idsDoGrupo.reduce(
          (sum, id) => sum + (gastoPorCicloPorCartao.get(id) || 0),
          0
        );
        const proximaFatura = gastoPorCicloPorCartao.get(card.id) || 0;
        const totalGasto = totalGastoPorCartao.get(card.id) || 0;
        const faturaAberta = cartaoBase
          ? faturaAbertaPorFisico.get(cartaoBase.id) ?? true
          : true;

        const result = {
          ...card.toJSON(),
          limiteTotal,
          limiteUtilizado,
          limiteDisponivel: limiteTotal - limiteUtilizado,
          proximaFatura,
          totalGasto,
          faturaAberta,
        };

        if (isFisico) {
          result.cartoesVirtuais = cards
            .filter((c) => c.cartaoPaiId === card.id)
            .map((c) => ({ id: c.id, nome: c.nome, ativo: c.ativo }));
        }

        return result;
      });

      return res.json(cardsComStats);
    } catch (error) {
      console.error('ERRO AO LISTAR CARTÕES:', error);
      return res.status(500).json({ error: 'Falha ao listar cartões.', details: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const {
        nome,
        banco,
        bandeira,
        tipo,
        cartaoPaiId,
        limiteTotal,
        diaFechamento,
        diaVencimento,
        cor,
        ativo,
      } = req.body;

      const card = await Card.findOne({ where: { id, userId } });
      if (!card) {
        return res.status(404).json({ error: 'Cartão não encontrado.' });
      }

      const tipoFinal = tipo || card.tipo;
      let updateData = { nome, banco, bandeira, cor, ativo, tipo: tipoFinal };

      if (tipoFinal === 'fisico') {
        updateData = {
          ...updateData,
          cartaoPaiId: null,
          limiteTotal: limiteTotal ?? card.limiteTotal,
          diaFechamento: diaFechamento ?? card.diaFechamento,
          diaVencimento: diaVencimento ?? card.diaVencimento,
        };
      } else {
        const paiId = cartaoPaiId ?? card.cartaoPaiId;
        if (!paiId) {
          return res.status(400).json({ error: 'Cartões virtuais precisam estar vinculados a um cartão físico.' });
        }
        const cartaoPai = await Card.findOne({ where: { id: paiId, userId } });
        if (!cartaoPai || cartaoPai.tipo !== 'fisico') {
          return res.status(400).json({ error: 'Cartão físico vinculado inválido.' });
        }
        updateData = {
          ...updateData,
          cartaoPaiId: paiId,
          limiteTotal: null,
          diaFechamento: null,
          diaVencimento: null,
        };
      }

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      const updatedCard = await card.update(updateData);
      return res.json(updatedCard);
    } catch (error) {
      console.error('ERRO AO ATUALIZAR CARTÃO:', error);
      return res.status(500).json({ error: 'Falha ao atualizar cartão.', details: error.message });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const card = await Card.findOne({ where: { id, userId } });

      if (!card) {
        return res.status(404).json({ error: 'Cartão não encontrado.' });
      }

      await card.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error('ERRO AO APAGAR CARTÃO:', error);
      return res.status(500).json({ error: 'Falha ao apagar cartão.', details: error.message });
    }
  }

  async history(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const meses = Math.min(parseInt(req.query.meses, 10) || 6, 24);

      const card = await Card.findOne({ where: { id, userId } });
      if (!card) {
        return res.status(404).json({ error: 'Cartão não encontrado.' });
      }

      const isFisico = card.tipo === 'fisico';
      const cartaoBase = isFisico
        ? card
        : await Card.findOne({ where: { id: card.cartaoPaiId, userId } });

      if (!cartaoBase || !cartaoBase.diaFechamento) {
        return res.status(400).json({ error: 'Cartão sem dia de fechamento definido.' });
      }

      const idsDoGrupo = isFisico
        ? [
          card.id,
          ...(await Card.findAll({ where: { cartaoPaiId: card.id, userId }, attributes: ['id'] })).map((c) => c.id),
        ]
        : [card.id];

      const cycles = getPastCycles(cartaoBase.diaFechamento, meses);

      const historico = await Promise.all(
        cycles.map(async ({ cycleStart, cycleEnd }) => {
          const totalGasto = await Transaction.sum('valor', {
            where: {
              userId,
              tipo: 'despesa',
              cardId: { [Op.in]: idsDoGrupo },
              data: {
                [Op.between]: [
                  cycleStart.toISOString().split('T')[0],
                  cycleEnd.toISOString().split('T')[0],
                ],
              },
            },
          }) || 0;

          const label = cycleEnd
            .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
            .replace('.', '');

          return {
            label: label.charAt(0).toUpperCase() + label.slice(1),
            cycleStart: cycleStart.toISOString().split('T')[0],
            cycleEnd: cycleEnd.toISOString().split('T')[0],
            totalGasto,
          };
        })
      );

      return res.json(historico);
    } catch (error) {
      console.error('ERRO AO BUSCAR HISTÓRICO DO CARTÃO:', error);
      return res.status(500).json({ error: 'Falha ao buscar histórico.', details: error.message });
    }
  }
 
  async transacoes(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const { mes, ano } = req.query;

      const card = await Card.findOne({ where: { id, userId } });
      if (!card) {
        return res.status(404).json({ error: 'Cartão não encontrado.' });
      }

      const isFisico = card.tipo === 'fisico';
      const cartaoBase = isFisico
        ? card
        : await Card.findOne({ where: { id: card.cartaoPaiId, userId } });

      if (!cartaoBase || !cartaoBase.diaFechamento) {
        return res.status(400).json({ error: 'Cartão sem dia de fechamento definido.' });
      }

      const mesRef = mes ? parseInt(mes, 10) : null;
      const anoRef = ano ? parseInt(ano, 10) : null;
      const { cycleStart, cycleEnd } = mesRef && anoRef
        ? getCycleForClosingMonth(cartaoBase.diaFechamento, anoRef, mesRef - 1)
        : getCurrentCycle(cartaoBase.diaFechamento);

      const idsDoGrupo = isFisico
        ? [
          card.id,
          ...(await Card.findAll({ where: { cartaoPaiId: card.id, userId }, attributes: ['id'] })).map((c) => c.id),
        ]
        : [card.id];

      const transactions = await Transaction.findAll({
        where: {
          userId,
          tipo: 'despesa',
          cardId: { [Op.in]: idsDoGrupo },
          data: {
            [Op.between]: [
              cycleStart.toISOString().split('T')[0],
              cycleEnd.toISOString().split('T')[0],
            ],
          },
        },
        include: [{ model: Card, as: 'card', attributes: ['id', 'nome'] }],
        order: [['data', 'DESC']],
      });

      return res.json(transactions);
    } catch (error) {
      console.error('ERRO AO LISTAR TRANSAÇÕES DA FATURA:', error);
      return res.status(500).json({ error: 'Falha ao listar transações da fatura.', details: error.message });
    }
  }
}

module.exports = new CardController();