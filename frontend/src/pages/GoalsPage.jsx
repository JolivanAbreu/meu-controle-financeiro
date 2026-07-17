// frontend/src/pages/GoalsPage.jsx

import { useEffect, useState, useCallback, useMemo } from "react";
import Modal from "../components/Modal";
import GoalForm from "../components/GoalForm";
import ContributeModal from "../components/ContributeModal";
import { FaEdit, FaTrash, FaPlusCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import { getGoals, deleteGoal } from "../services/goalService";

// Badge de Status (recolorido com os tokens do sistema)
const STATUS_STYLES = {
  completed: {
    bg: "bg-receita-soft dark:bg-receita-soft-dark",
    text: "text-receita dark:text-receita-dark",
    label: "Concluída",
  },
  on_track: {
    bg: "bg-accent-soft dark:bg-accent-soft-dark",
    text: "text-accent dark:text-accent-dark",
    label: "Em dia",
  },
  behind: {
    bg: "bg-despesa-soft dark:bg-despesa-soft-dark",
    text: "text-despesa dark:text-despesa-dark",
    label: "Atrasada",
  },
  overdue: {
    bg: "bg-despesa dark:bg-despesa-dark",
    text: "text-paper-raised dark:text-paper-dark",
    label: "Expirada",
  },
  pending: {
    bg: "bg-rule/50 dark:bg-rule-dark/50",
    text: "text-ink-soft dark:text-ink-soft-dark",
    label: "Pendente",
  },
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
};

// Cor da barra de progresso conforme a situação da meta
const progressBarColor = (status) => {
  if (status === "completed") return "bg-receita dark:bg-receita-dark";
  if (status === "behind" || status === "overdue")
    return "bg-despesa dark:bg-despesa-dark";
  return "bg-accent dark:bg-accent-dark";
};

// --- NOVO: abas de filtro por status ---
const FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "andamento", label: "Em andamento" },
  { key: "concluidas", label: "Concluídas" },
];

function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState(null);

  // --- NOVO: filtro por status ---
  const [filterStatus, setFilterStatus] = useState("todas");

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getGoals();
      setGoals(response.data);
    } catch (error) {
      console.error("Falha ao buscar metas:", error);
      toast.error("Não foi possível carregar as metas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setIsContributeModalOpen(false);
    setContributingGoal(null);
  };

  const handleGoalSuccess = (updatedOrNewGoal) => {
    setGoals((current) => {
      const exists = current.some((g) => g.id === updatedOrNewGoal.id);
      if (exists) {
        return current.map((g) =>
          g.id === updatedOrNewGoal.id ? updatedOrNewGoal : g,
        );
      } else {
        return [...current, updatedOrNewGoal];
      }
    });
    closeModal();
  };

  const handleContributionSuccess = (updatedGoal) => {
    setGoals((current) =>
      current.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)),
    );
    closeModal();
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleContribute = (goal) => {
    setContributingGoal(goal);
    setIsContributeModalOpen(true);
  };

  const handleDelete = async (goalId) => {
    if (
      window.confirm(
        "Tem certeza que deseja apagar esta meta? (Contribuições também serão apagadas)",
      )
    ) {
      const promise = deleteGoal(goalId);
      try {
        await toast.promise(promise, {
          loading: "Apagando...",
          success: "Meta apagada com sucesso!",
          error: (err) =>
            err.response?.data?.error || "Não foi possível apagar a meta.",
        });
        setGoals((current) => current.filter((g) => g.id !== goalId));
      } catch (error) {
        console.error("Erro ao apagar meta:", error);
      }
    }
  };

  const formatCurrency = (value) =>
    value != null
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(value)
      : "N/A";

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" })
      : "Sem prazo";

  // --- NOVO: resumo geral (calculado a partir dos dados já carregados) ---
  const summary = useMemo(() => {
    const totalAtual = goals.reduce(
      (sum, g) => sum + parseFloat(g.valor_atual || 0),
      0,
    );
    const totalObjetivo = goals.reduce(
      (sum, g) => sum + parseFloat(g.valor_objetivo || 0),
      0,
    );
    const concluidas = goals.filter((g) => g.status === "completed").length;
    const progresso = totalObjetivo > 0 ? (totalAtual / totalObjetivo) * 100 : 0;
    return { totalAtual, totalObjetivo, concluidas, progresso };
  }, [goals]);

  // --- NOVO: metas filtradas pela aba selecionada ---
  const filteredGoals = useMemo(() => {
    if (filterStatus === "concluidas") {
      return goals.filter((g) => g.status === "completed");
    }
    if (filterStatus === "andamento") {
      return goals.filter((g) => g.status !== "completed");
    }
    return goals;
  }, [goals, filterStatus]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 text-ink-soft dark:text-ink-soft-dark">
        Carregando metas...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink dark:text-ink-dark">
            Minhas Metas
          </h1>
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">
            Acompanhe o progresso das suas metas de economia
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-accent dark:bg-accent-dark text-paper-raised dark:text-paper-dark px-4 py-2 rounded-lg font-medium text-sm shadow-card dark:shadow-card-dark hover:opacity-90 transition-opacity"
        >
          + Nova Meta
        </button>
      </div>

      {/* NOVO: Resumo geral */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-4">
            <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
              Guardado até agora
            </p>
            <p className="font-mono text-lg font-medium text-receita dark:text-receita-dark mt-1">
              {formatCurrency(summary.totalAtual)}
            </p>
          </div>
          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-4">
            <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
              Total das metas
            </p>
            <p className="font-mono text-lg font-medium text-ink dark:text-ink-dark mt-1">
              {formatCurrency(summary.totalObjetivo)}
            </p>
          </div>
          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-4">
            <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
              Progresso geral
            </p>
            <p className="font-mono text-lg font-medium text-accent dark:text-accent-dark mt-1">
              {summary.progresso.toFixed(1)}%
            </p>
          </div>
          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-4">
            <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
              Concluídas
            </p>
            <p className="font-mono text-lg font-medium text-ink dark:text-ink-dark mt-1">
              {summary.concluidas} de {goals.length}
            </p>
          </div>
        </div>
      )}

      {/* NOVO: Abas de filtro por status */}
      {goals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                filterStatus === f.key
                  ? "bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark text-paper-raised dark:text-paper-dark"
                  : "border-rule dark:border-rule-dark text-ink-soft dark:text-ink-soft-dark hover:border-accent hover:text-accent dark:hover:border-accent-dark dark:hover:text-accent-dark"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Modal Criar/Editar Meta */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingGoal ? "Editar Meta" : "Adicionar Nova Meta"}
      >
        <GoalForm onSuccess={handleGoalSuccess} initialData={editingGoal} />
      </Modal>

      {/* Modal de Aporte */}
      <ContributeModal
        isOpen={isContributeModalOpen}
        onClose={closeModal}
        goal={contributingGoal}
        onSuccess={handleContributionSuccess}
      />

      {goals.length === 0 ? (
        <p className="text-ink-soft dark:text-ink-soft-dark text-center py-10">
          Nenhuma meta encontrada. Crie sua primeira meta!
        </p>
      ) : filteredGoals.length === 0 ? (
        <p className="text-ink-soft dark:text-ink-soft-dark text-center py-10">
          Nenhuma meta {filterStatus === "concluidas" ? "concluída" : "em andamento"} no momento.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => {
            const percentual =
              goal.valor_objetivo > 0
                ? (parseFloat(goal.valor_atual) / parseFloat(goal.valor_objetivo)) * 100
                : 0;
            const valorRestante = parseFloat(goal.valor_restante || 0);
            const aporteSugerido = parseFloat(goal.aporte_sugerido_mes || 0);

            return (
              <div
                key={goal.id}
                className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-5 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display text-lg font-medium text-ink dark:text-ink-dark">
                      {goal.titulo}
                    </h3>
                    <div className="flex items-center gap-1">
                      {goal.status !== "completed" && (
                        <button
                          onClick={() => handleContribute(goal)}
                          className="p-2 text-ink-soft dark:text-ink-soft-dark hover:text-receita dark:hover:text-receita-dark hover:bg-receita-soft dark:hover:bg-receita-soft-dark rounded-full transition-colors"
                          title="Adicionar Aporte"
                        >
                          <FaPlusCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-2 text-ink-soft dark:text-ink-soft-dark hover:text-accent dark:hover:text-accent-dark hover:bg-accent-soft dark:hover:bg-accent-soft-dark rounded-full transition-colors"
                        title="Editar Meta"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-2 text-ink-soft dark:text-ink-soft-dark hover:text-despesa dark:hover:text-despesa-dark hover:bg-despesa-soft dark:hover:bg-despesa-soft-dark rounded-full transition-colors"
                        title="Excluir Meta"
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-3 text-xs text-ink-soft dark:text-ink-soft-dark">
                    <span>Prazo: {formatDate(goal.prazo)}</span>
                    <StatusBadge status={goal.status} />
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-ink dark:text-ink-dark text-sm mb-1.5">
                      <span className="font-mono">
                        {formatCurrency(goal.valor_atual)} /{" "}
                        {formatCurrency(goal.valor_objetivo)}
                      </span>
                      <span className="font-medium">{percentual.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-rule dark:bg-rule-dark rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progressBarColor(goal.status)}`}
                        style={{ width: `${Math.min(percentual, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-rule dark:border-rule-dark text-sm text-ink-soft dark:text-ink-soft-dark space-y-1">
                  {valorRestante > 0 && (
                    <p>
                      Faltam:{" "}
                      <span className="font-mono font-medium text-ink dark:text-ink-dark">
                        {formatCurrency(valorRestante)}
                      </span>
                    </p>
                  )}
                  {aporteSugerido > 0 && isFinite(aporteSugerido) && (
                    <p>
                      Sugestão mensal:{" "}
                      <span className="font-mono font-medium text-ink dark:text-ink-dark">
                        {formatCurrency(aporteSugerido)}
                      </span>
                    </p>
                  )}
                  {goal.status === "completed" && (
                    <p className="font-medium text-receita dark:text-receita-dark">
                      Meta Concluída!
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GoalsPage;