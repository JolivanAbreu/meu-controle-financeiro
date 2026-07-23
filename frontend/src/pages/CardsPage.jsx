// frontend/src/pages/CardsPage.jsx

import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import CardForm from "../components/CardForm";
import CardStack from "../components/CardStack";
import { useAuth } from "../contexts/AuthContext";
import {
  getCards,
  deleteCard,
  getCardHistory,
  getCardTransactions,
} from "../services/cardService";
import { FaPlus, FaFileInvoiceDollar } from "react-icons/fa";

const MESES = [
  { nome: "Janeiro", valor: 1 },
  { nome: "Fevereiro", valor: 2 },
  { nome: "Março", valor: 3 },
  { nome: "Abril", valor: 4 },
  { nome: "Maio", valor: 5 },
  { nome: "Junho", valor: 6 },
  { nome: "Julho", valor: 7 },
  { nome: "Agosto", valor: 8 },
  { nome: "Setembro", valor: 9 },
  { nome: "Outubro", valor: 10 },
  { nome: "Novembro", valor: 11 },
  { nome: "Dezembro", valor: 12 },
];

const ANOS = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - 2 + i,
);

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0,
  );

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

function CardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [novoVirtualPara, setNovoVirtualPara] = useState(null);

  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().getMonth() + 1,
  );
  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear(),
  );

  const [historicoCard, setHistoricoCard] = useState(null);
  const [historicoData, setHistoricoData] = useState([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);

  const [faturaCard, setFaturaCard] = useState(null);
  const [faturaData, setFaturaData] = useState([]);
  const [faturaLoading, setFaturaLoading] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCards({
        mes: mesSelecionado,
        ano: anoSelecionado,
      });
      setCards(response.data);
    } catch (error) {
      console.error("Falha ao buscar cartões:", error);
      toast.error("Não foi possível carregar os cartões.");
    } finally {
      setLoading(false);
    }
  }, [mesSelecionado, anoSelecionado]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const fisicos = useMemo(
    () => cards.filter((c) => c.tipo === "fisico"),
    [cards],
  );

  const virtuaisPorPai = useMemo(() => {
    const map = {};
    cards
      .filter((c) => c.tipo === "virtual")
      .forEach((c) => {
        if (!map[c.cartaoPaiId]) map[c.cartaoPaiId] = [];
        map[c.cartaoPaiId].push(c);
      });
    return map;
  }, [cards]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
    setNovoVirtualPara(null);
  };

  const handleCardSuccess = () => {
    fetchCards();
    closeModal();
  };

  const handleNovoCartao = () => {
    closeHistorico();
    closeFatura();
    setEditingCard(null);
    setNovoVirtualPara(null);
    setIsModalOpen(true);
  };

  const handleNovoVirtual = (fisico) => {
    closeHistorico();
    closeFatura();
    setEditingCard(null);
    setNovoVirtualPara(fisico);
    setIsModalOpen(true);
  };

  const handleEdit = (card) => {
    closeHistorico();
    closeFatura();
    setEditingCard(card);
    setNovoVirtualPara(null);
    setIsModalOpen(true);
  };

  const [pendingDelete, setPendingDelete] = useState(null);

  const handleDelete = (card) => {
    setPendingDelete(card);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const promise = deleteCard(pendingDelete.id);
    try {
      await toast.promise(promise, {
        loading: "Apagando...",
        success: "Cartão apagado com sucesso!",
        error: "Não foi possível apagar o cartão.",
      });
      fetchCards();
    } catch (error) {
      console.error("Erro ao apagar cartão:", error);
    } finally {
      setPendingDelete(null);
    }
  };

  const handleVerHistorico = async (card) => {
    closeModal();
    closeFatura();
    setHistoricoCard(card);
    setHistoricoLoading(true);
    setHistoricoData([]);
    try {
      const response = await getCardHistory(card.id, 6);
      setHistoricoData(response.data);
    } catch (error) {
      console.error("Falha ao buscar histórico:", error);
      toast.error("Não foi possível carregar o histórico deste cartão.");
    } finally {
      setHistoricoLoading(false);
    }
  };

  const closeHistorico = () => {
    setHistoricoCard(null);
    setHistoricoData([]);
  };

  const maiorGastoHistorico = Math.max(
    1,
    ...historicoData.map((h) => h.totalGasto || 0),
  );

  // --- Resumo geral: calculado a partir dos cartões físicos já carregados ---
  const resumoGeral = useMemo(() => {
    if (fisicos.length === 0) return null;

    const disponibilidadeTotal = fisicos.reduce(
      (sum, f) => sum + (f.limiteDisponivel || 0),
      0,
    );
    const faturaAbertaTotal = fisicos.reduce(
      (sum, f) => sum + (f.limiteUtilizado || 0),
      0,
    );

    // Próximo vencimento: menor distância em dias até o dia de vencimento de cada cartão.
    const hoje = new Date();
    const hojeSemHora = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
    );
    let proximoVencimento = null;

    fisicos.forEach((f) => {
      if (!f.diaVencimento) return;
      const lastDayThisMonth = new Date(
        hoje.getFullYear(),
        hoje.getMonth() + 1,
        0,
      ).getDate();
      let venc = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        Math.min(f.diaVencimento, lastDayThisMonth),
      );
      if (venc < hojeSemHora) {
        const lastDayNextMonth = new Date(
          hoje.getFullYear(),
          hoje.getMonth() + 2,
          0,
        ).getDate();
        venc = new Date(
          hoje.getFullYear(),
          hoje.getMonth() + 1,
          Math.min(f.diaVencimento, lastDayNextMonth),
        );
      }
      const diffDias = Math.round((venc - hojeSemHora) / (1000 * 60 * 60 * 24));
      if (!proximoVencimento || diffDias < proximoVencimento.diffDias) {
        proximoVencimento = { nome: f.nome, diffDias, dia: f.diaVencimento };
      }
    });

    // Alerta: cartão com maior percentual de uso, entre os que passaram de 85%.
    let alerta = null;
    fisicos.forEach((f) => {
      if (f.limiteTotal > 0) {
        const pct = (f.limiteUtilizado / f.limiteTotal) * 100;
        if (pct >= 85 && (!alerta || pct > alerta.pct)) {
          alerta = { nome: f.nome, pct };
        }
      }
    });

    return {
      disponibilidadeTotal,
      faturaAbertaTotal,
      proximoVencimento,
      alerta,
    };
  }, [fisicos]);

  const handleVerFatura = async (card) => {
    closeModal();
    closeHistorico();
    setFaturaCard(card);
    setFaturaLoading(true);
    setFaturaData([]);
    try {
      const response = await getCardTransactions(card.id, {
        mes: mesSelecionado,
        ano: anoSelecionado,
      });
      setFaturaData(response.data);
    } catch (error) {
      console.error("Falha ao buscar fatura:", error);
      toast.error("Não foi possível carregar a fatura deste cartão.");
    } finally {
      setFaturaLoading(false);
    }
  };

  const closeFatura = () => {
    setFaturaCard(null);
    setFaturaData([]);
  };

  const handleTogglePago = async (transaction) => {
    // Atualização otimista: reflete na tela antes da resposta do servidor.
    setFaturaData((current) =>
      current.map((t) =>
        t.id === transaction.id ? { ...t, pago: !t.pago } : t,
      ),
    );
    try {
      await api.patch(`/transactions/${transaction.id}/pago`);
    } catch (error) {
      console.error("Falha ao atualizar status de pagamento:", error);
      toast.error("Não foi possível atualizar o status de pagamento.");
      // Desfaz a atualização otimista em caso de erro
      setFaturaData((current) =>
        current.map((t) =>
          t.id === transaction.id ? { ...t, pago: transaction.pago } : t,
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 text-ink-soft dark:text-ink-soft-dark">
        Carregando cartões...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink dark:text-ink-dark">
            Meus Cartões
          </h1>
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">
            Clique num cartão virtual para trazê-lo para frente da pilha
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(Number(e.target.value))}
            className="border border-rule dark:border-rule-dark rounded-lg px-3 py-2 bg-paper-raised dark:bg-paper-raised-dark text-sm text-ink dark:text-ink-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {MESES.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.nome}
              </option>
            ))}
          </select>
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(Number(e.target.value))}
            className="border border-rule dark:border-rule-dark rounded-lg px-3 py-2 bg-paper-raised dark:bg-paper-raised-dark text-sm text-ink dark:text-ink-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {ANOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            onClick={handleNovoCartao}
            className="bg-accent dark:bg-accent-dark text-paper-raised dark:text-paper-dark px-4 py-2 rounded-lg font-medium text-sm shadow-card dark:shadow-card-dark hover:opacity-90 transition-opacity"
          >
            + Novo Cartão
          </button>
        </div>
      </div>

      {resumoGeral && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-4">
            <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
              Disponível total
            </p>
            <p className="font-mono text-lg font-medium text-ink dark:text-ink-dark mt-1">
              {formatCurrency(resumoGeral.disponibilidadeTotal)}
            </p>
          </div>

          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-4">
            <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
              Fatura em aberto (total)
            </p>
            <p className="font-mono text-lg font-medium text-ink dark:text-ink-dark mt-1">
              {formatCurrency(resumoGeral.faturaAbertaTotal)}
            </p>
          </div>

          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-4">
            <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
              Próximo vencimento
            </p>
            {resumoGeral.proximoVencimento ? (
              <>
                <p className="text-sm font-medium text-ink dark:text-ink-dark mt-1 truncate">
                  {resumoGeral.proximoVencimento.nome}
                </p>
                <p className="text-xs text-ink-soft dark:text-ink-soft-dark">
                  {resumoGeral.proximoVencimento.diffDias === 0
                    ? "vence hoje"
                    : `em ${resumoGeral.proximoVencimento.diffDias} dia(s)`}{" "}
                  · dia {resumoGeral.proximoVencimento.dia}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">
                —
              </p>
            )}
          </div>

          {resumoGeral.alerta ? (
            <div className="bg-despesa-soft dark:bg-despesa-soft-dark border border-despesa/20 dark:border-despesa-dark/20 rounded-xl shadow-card dark:shadow-card-dark p-4">
              <p className="text-[11px] font-medium text-despesa dark:text-despesa-dark uppercase tracking-wider">
                ⚠ Limite alto
              </p>
              <p className="text-sm font-medium text-ink dark:text-ink-dark mt-1 truncate">
                {resumoGeral.alerta.nome}
              </p>
              <p className="text-xs text-despesa dark:text-despesa-dark">
                {resumoGeral.alerta.pct.toFixed(0)}% do limite usado
              </p>
            </div>
          ) : (
            <div className="bg-receita-soft dark:bg-receita-soft-dark border border-receita/20 dark:border-receita-dark/20 rounded-xl shadow-card dark:shadow-card-dark p-4">
              <p className="text-[11px] font-medium text-receita dark:text-receita-dark uppercase tracking-wider">
                Situação
              </p>
              <p className="text-sm font-medium text-ink dark:text-ink-dark mt-1">
                Tudo dentro do limite
              </p>
              <p className="text-xs text-receita dark:text-receita-dark">
                Nenhum cartão passou de 85% de uso
              </p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          editingCard
            ? "Editar Cartão"
            : novoVirtualPara
              ? `Novo cartão virtual — ${novoVirtualPara.nome}`
              : "Adicionar Novo Cartão"
        }
      >
        <CardForm
          onSuccess={handleCardSuccess}
          initialData={editingCard}
          cartoesFisicos={fisicos.filter((f) => f.ativo)}
          defaultTipo={novoVirtualPara ? "virtual" : undefined}
          defaultCartaoPaiId={novoVirtualPara ? novoVirtualPara.id : undefined}
        />
      </Modal>

      <Modal
        isOpen={!!historicoCard}
        onClose={closeHistorico}
        title={`Histórico — ${historicoCard?.nome || ""}`}
      >
        {historicoLoading ? (
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark">
            Carregando...
          </p>
        ) : historicoData.length === 0 ? (
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark">
            Sem dados suficientes para exibir o histórico.
          </p>
        ) : (
          <div className="space-y-3">
            {historicoData.map((ciclo) => (
              <div key={ciclo.cycleEnd}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-ink dark:text-ink-dark">
                    {ciclo.label}
                  </span>
                  <span className="font-mono text-ink-soft dark:text-ink-soft-dark">
                    {formatCurrency(ciclo.totalGasto)}
                  </span>
                </div>
                <div className="w-full bg-rule dark:bg-rule-dark rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent dark:bg-accent-dark"
                    style={{
                      width: `${Math.max(
                        (ciclo.totalGasto / maiorGastoHistorico) * 100,
                        ciclo.totalGasto > 0 ? 4 : 0,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-ink-soft dark:text-ink-soft-dark pt-1">
              Cada barra representa um ciclo de fatura completo, não um mês de
              calendário.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!faturaCard}
        onClose={closeFatura}
        title={`Fatura — ${faturaCard?.nome || ""}`}
      >
        {faturaLoading ? (
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark">
            Carregando...
          </p>
        ) : faturaData.length === 0 ? (
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark">
            Nenhuma despesa nesta fatura.
          </p>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {faturaData.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-paper dark:hover:bg-paper-dark cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!t.pago}
                  onChange={() => handleTogglePago(t)}
                  className="h-4 w-4 accent-receita dark:accent-receita-dark rounded flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm truncate ${
                      t.pago
                        ? "text-ink-soft dark:text-ink-soft-dark line-through"
                        : "text-ink dark:text-ink-dark"
                    }`}
                  >
                    {t.descricao || "Sem descrição"}
                  </p>
                  <p className="text-[11px] text-ink-soft dark:text-ink-soft-dark font-mono">
                    {formatDate(t.data)}
                    {t.card?.nome ? ` · ${t.card.nome}` : ""}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm font-medium flex-shrink-0 ${
                    t.pago
                      ? "text-ink-soft dark:text-ink-soft-dark"
                      : "text-despesa dark:text-despesa-dark"
                  }`}
                >
                  {formatCurrency(t.valor)}
                </span>
              </label>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Excluir cartão"
        message={
          pendingDelete?.tipo === "fisico" &&
          (virtuaisPorPai[pendingDelete.id] || []).length > 0
            ? `Tem certeza que deseja apagar "${pendingDelete.nome}"? Os ${
                virtuaisPorPai[pendingDelete.id].length
              } cartão(ões) virtual(is) vinculado(s) também serão apagados. As transações já lançadas não serão excluídas, só perderão o vínculo com o cartão.`
            : `Tem certeza que deseja apagar "${pendingDelete?.nome}"? As transações já lançadas não serão excluídas, só perderão o vínculo com o cartão.`
        }
        confirmLabel="Apagar"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {fisicos.length === 0 ? (
        <p className="text-ink-soft dark:text-ink-soft-dark text-center py-10">
          Nenhum cartão cadastrado.{" "}
          <button
            onClick={handleNovoCartao}
            className="text-accent dark:text-accent-dark hover:underline"
          >
            Cadastrar o primeiro
          </button>
        </p>
      ) : (
        <div className="flex flex-wrap gap-8">
          {fisicos.map((fisico) => {
            const virtuais = virtuaisPorPai[fisico.id] || [];
            const grupo = [fisico, ...virtuais];
            const percentualUsado =
              fisico.limiteTotal > 0
                ? (fisico.limiteUtilizado / fisico.limiteTotal) * 100
                : 0;

            return (
              <div
                key={fisico.id}
                className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-5"
              >
                <CardStack
                  cards={grupo}
                  titular={user?.nome}
                  onHistory={handleVerHistorico}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />

                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => handleNovoVirtual(fisico)}
                    className="flex items-center gap-1.5 text-xs text-accent dark:text-accent-dark hover:underline"
                  >
                    <FaPlus size={9} /> Adicionar cartão virtual
                  </button>
                  <button
                    onClick={() => handleVerFatura(fisico)}
                    className="flex items-center gap-1.5 text-xs text-accent dark:text-accent-dark hover:underline"
                  >
                    <FaFileInvoiceDollar size={11} /> Ver fatura
                  </button>
                </div>

                {/* Limite compartilhado do grupo */}
                <div className="mt-4 pt-4 border-t border-rule dark:border-rule-dark w-full">
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <span className="font-mono text-sm text-ink dark:text-ink-dark whitespace-nowrap">
                      {formatCurrency(fisico.limiteUtilizado)}
                    </span>
                    <span
                      className={`font-medium text-xs flex-shrink-0 ${
                        percentualUsado > 90
                          ? "text-despesa dark:text-despesa-dark"
                          : "text-ink-soft dark:text-ink-soft-dark"
                      }`}
                    >
                      {percentualUsado.toFixed(0)}%
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-ink-soft dark:text-ink-soft-dark whitespace-nowrap mb-1.5">
                    de {formatCurrency(fisico.limiteTotal)}
                  </p>
                  <div className="w-full bg-rule dark:bg-rule-dark rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        percentualUsado > 90
                          ? "bg-despesa dark:bg-despesa-dark"
                          : "bg-accent dark:bg-accent-dark"
                      }`}
                      style={{ width: `${Math.min(percentualUsado, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-1.5">
                    {fisico.faturaAberta
                      ? "Fatura em aberto"
                      : "Fatura fechada"}{" "}
                    · fecha dia {fisico.diaFechamento} · vence dia{" "}
                    {fisico.diaVencimento}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CardsPage;
