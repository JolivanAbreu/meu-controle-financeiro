// frontend/src/pages/CardsPage.jsx

import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import CardForm from "../components/CardForm";
import CardStack from "../components/CardStack";
import { useAuth } from "../contexts/AuthContext";
import { getCards, deleteCard, getCardHistory } from "../services/cardService";
import { FaPlus } from "react-icons/fa";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0,
  );

function CardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [novoVirtualPara, setNovoVirtualPara] = useState(null);

  const [historicoCard, setHistoricoCard] = useState(null);
  const [historicoData, setHistoricoData] = useState([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCards();
      setCards(response.data);
    } catch (error) {
      console.error("Falha ao buscar cartões:", error);
      toast.error("Não foi possível carregar os cartões.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    setEditingCard(null);
    setNovoVirtualPara(null);
    setIsModalOpen(true);
  };

  const handleNovoVirtual = (fisico) => {
    closeHistorico();
    setEditingCard(null);
    setNovoVirtualPara(fisico);
    setIsModalOpen(true);
  };

  const handleEdit = (card) => {
    closeHistorico();
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
        <button
          onClick={handleNovoCartao}
          className="bg-accent dark:bg-accent-dark text-paper-raised dark:text-paper-dark px-4 py-2 rounded-lg font-medium text-sm shadow-card dark:shadow-card-dark hover:opacity-90 transition-opacity"
        >
          + Novo Cartão
        </button>
      </div>

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
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark">Carregando...</p>
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

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Excluir cartão"
        message={
          pendingDelete?.tipo === "fisico" && (virtuaisPorPai[pendingDelete.id] || []).length > 0
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

                <button
                  onClick={() => handleNovoVirtual(fisico)}
                  className="flex items-center gap-1.5 mt-3 text-xs text-accent dark:text-accent-dark hover:underline"
                >
                  <FaPlus size={9} /> Adicionar cartão virtual
                </button>

                {/* Limite compartilhado do grupo */}
                <div className="mt-4 pt-4 border-t border-rule dark:border-rule-dark w-[240px]">
                  <div className="flex justify-between items-baseline text-sm mb-1.5">
                    <span className="font-mono text-ink dark:text-ink-dark">
                      {formatCurrency(fisico.limiteUtilizado)} /{" "}
                      <span className="font-medium">
                        {formatCurrency(fisico.limiteTotal)}
                      </span>
                    </span>
                    <span
                      className={`font-medium text-xs ${
                        percentualUsado > 90
                          ? "text-despesa dark:text-despesa-dark"
                          : "text-ink-soft dark:text-ink-soft-dark"
                      }`}
                    >
                      {percentualUsado.toFixed(0)}%
                    </span>
                  </div>
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
                    Compartilhado entre {grupo.length} cartão(ões) · fecha dia{" "}
                    {fisico.diaFechamento} · vence dia {fisico.diaVencimento}
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