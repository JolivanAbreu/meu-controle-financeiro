// frontend/src/pages/BudgetsPage.jsx

import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import BudgetForm from "../components/BudgetForm";
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

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
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  // --- Filtro de mês/ano (o endpoint já suporta, só não era usado aqui) ---
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().getMonth() + 1,
  );
  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear(),
  );

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/budgets", {
        params: { mes: mesSelecionado, ano: anoSelecionado },
      });
      setBudgets(response.data);
    } catch (error) {
      console.error("Falha ao buscar orçamentos:", error);
      toast.error("Não foi possível carregar os orçamentos.");
    } finally {
      setLoading(false);
    }
  }, [mesSelecionado, anoSelecionado]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleBudgetSuccess = () => {
    fetchBudgets();
    closeModal();
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const [pendingDelete, setPendingDelete] = useState(null);

  const handleDelete = (budget) => {
    setPendingDelete(budget);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const promise = api.delete(`/budgets/${pendingDelete.id}`);
    try {
      await toast.promise(promise, {
        loading: "Apagando...",
        success: "Orçamento apagado com sucesso!",
        error: "Não foi possível apagar o orçamento.",
      });
      setBudgets((current) => current.filter((b) => b.id !== pendingDelete.id));
    } catch (error) {
      console.error("Erro ao apagar orçamento:", error);
    } finally {
      setPendingDelete(null);
    }
  };

  // --- Resumo do período selecionado ---
  const summary = useMemo(() => {
    const totalLimite = budgets.reduce(
      (sum, b) => sum + parseFloat(b.limite || 0),
      0,
    );
    const totalGasto = budgets.reduce(
      (sum, b) => sum + parseFloat(b.gasto_atual || 0),
      0,
    );
    const percentual = totalLimite > 0 ? (totalGasto / totalLimite) * 100 : 0;
    const ultrapassados = budgets.filter(
      (b) => b.limite > 0 && b.gasto_atual / b.limite > 1,
    ).length;
    return { totalLimite, totalGasto, percentual, ultrapassados };
  }, [budgets]);

  // --- Ordena pelos orçamentos mais "no limite" primeiro ---
  const sortedBudgets = useMemo(() => {
    return [...budgets].sort((a, b) => {
      const pctA = a.limite > 0 ? a.gasto_atual / a.limite : 0;
      const pctB = b.limite > 0 ? b.gasto_atual / b.limite : 0;
      return pctB - pctA;
    });
  }, [budgets]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 text-ink-soft dark:text-ink-soft-dark">
        Carregando orçamentos...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink dark:text-ink-dark">
            Meus Orçamentos
          </h1>
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">
            Defina limites de gasto por categoria e acompanhe o período
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
            onClick={() => setIsModalOpen(true)}
            className="bg-accent dark:bg-accent-dark text-paper-raised dark:text-paper-dark px-4 py-2 rounded-lg font-medium text-sm shadow-card dark:shadow-card-dark hover:opacity-90 transition-opacity"
          >
            + Novo Orçamento
          </button>
        </div>
      </div>

      {/* NOVO: Resumo do período */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-4">
            <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
              Total planejado
            </p>
            <p className="font-mono text-lg font-medium text-ink dark:text-ink-dark mt-1">
              {formatCurrency(summary.totalLimite)}
            </p>
          </div>
          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-4">
            <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
              Total gasto
            </p>
            <p className="font-mono text-lg font-medium text-despesa dark:text-despesa-dark mt-1">
              {formatCurrency(summary.totalGasto)}
            </p>
          </div>
          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-4">
            <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
              % utilizado
            </p>
            <p
              className={`font-mono text-lg font-medium mt-1 ${
                summary.percentual > 100
                  ? "text-despesa dark:text-despesa-dark"
                  : "text-accent dark:text-accent-dark"
              }`}
            >
              {summary.percentual.toFixed(1)}%
            </p>
          </div>
          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-4">
            <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
              Ultrapassados
            </p>
            <p className="font-mono text-lg font-medium text-ink dark:text-ink-dark mt-1">
              {summary.ultrapassados} de {budgets.length}
            </p>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBudget ? "Editar Orçamento" : "Adicionar Novo Orçamento"}
      >
        <BudgetForm
          onSuccess={handleBudgetSuccess}
          initialData={editingBudget}
          defaultMes={mesSelecionado}
          defaultAno={anoSelecionado}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Excluir orçamento"
        message={`Tem certeza que deseja apagar o orçamento de "${pendingDelete?.categoria}"?`}
        confirmLabel="Apagar"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {budgets.length === 0 ? (
        <p className="text-ink-soft dark:text-ink-soft-dark text-center py-10">
          Nenhum orçamento encontrado para este período.{" "}
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-accent dark:text-accent-dark hover:underline"
          >
            Criar o primeiro
          </button>
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedBudgets.map((budget) => {
            const percentualGasto =
              budget.limite > 0
                ? (budget.gasto_atual / budget.limite) * 100
                : 0;
            const isOver = percentualGasto > 100;

            return (
              <div
                key={budget.id}
                className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-5"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-display text-lg font-medium text-ink dark:text-ink-dark">
                      {budget.categoria}
                    </h3>
                    <span className="text-xs text-ink-soft dark:text-ink-soft-dark">
                      {MESES.find((m) => m.valor === budget.mes)?.nome} /{" "}
                      {budget.ano}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(budget)}
                      aria-label="Editar orçamento"
                      className="p-2 text-ink-soft dark:text-ink-soft-dark hover:text-accent dark:hover:text-accent-dark hover:bg-accent-soft dark:hover:bg-accent-soft-dark rounded-full transition-colors"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(budget)}
                      aria-label="Excluir orçamento"
                      className="p-2 text-ink-soft dark:text-ink-soft-dark hover:text-despesa dark:hover:text-despesa-dark hover:bg-despesa-soft dark:hover:bg-despesa-soft-dark rounded-full transition-colors"
                    >
                      <FaTrash size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-baseline text-sm mb-1.5">
                  <span className="font-mono text-ink dark:text-ink-dark">
                    {formatCurrency(budget.gasto_atual)} /{" "}
                    <span className="font-medium">
                      {formatCurrency(budget.limite)}
                    </span>
                  </span>
                  <span
                    className={`font-medium text-xs ${
                      isOver
                        ? "text-despesa dark:text-despesa-dark"
                        : "text-ink-soft dark:text-ink-soft-dark"
                    }`}
                  >
                    {percentualGasto.toFixed(0)}%
                  </span>
                </div>

                <div className="w-full bg-rule dark:bg-rule-dark rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isOver
                        ? "bg-despesa dark:bg-despesa-dark"
                        : "bg-accent dark:bg-accent-dark"
                    }`}
                    style={{ width: `${Math.min(percentualGasto, 100)}%` }}
                  />
                </div>

                {isOver && (
                  <p className="text-despesa dark:text-despesa-dark text-xs mt-2">
                    Orçamento ultrapassado em{" "}
                    {formatCurrency(budget.gasto_atual - budget.limite)}
                  </p>
                )}

                {budget.categoriaValida === false && (
                  <p className="text-despesa dark:text-despesa-dark text-xs mt-2">
                    Categoria "{budget.categoria}" não foi reconhecida
                    automaticamente. Edite este orçamento e selecione a
                    categoria novamente.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BudgetsPage;
