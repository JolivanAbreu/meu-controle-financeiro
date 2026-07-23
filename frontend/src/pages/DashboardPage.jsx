import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import TransactionForm from "../components/TransactionForm";
import ExpensesChart from "../components/ExpensesChart";
import IncomeExpenseMonthlyTrendChart from "../components/IncomeExpenseMonthlyTrendChart";
import { getGoals } from "../services/goalService";
import {
  FaEdit,
  FaTrash,
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

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
    value,
  );

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

function DashboardPage() {
  const [rangeTransactions, setRangeTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().getMonth() + 1,
  );
  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear(),
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // --- orçamentos e metas ---
  const [budgetsResumo, setBudgetsResumo] = useState({ limite: 0, gasto: 0 });
  const [goals, setGoals] = useState([]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = new Date(anoSelecionado, mesSelecionado - 6, 1)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(anoSelecionado, mesSelecionado, 0)
        .toISOString()
        .split("T")[0];
      const response = await api.get("/transactions", {
        params: { startDate, endDate },
      });
      setRangeTransactions(response.data);
    } catch (error) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [mesSelecionado, anoSelecionado]);

  const fetchBudgetsResumo = useCallback(async () => {
    try {
      const { data } = await api.get("/budgets", {
        params: { mes: mesSelecionado, ano: anoSelecionado },
      });
      const limite = data.reduce((sum, b) => sum + parseFloat(b.limite), 0);
      const gasto = data.reduce(
        (sum, b) => sum + parseFloat(b.gasto_atual || 0),
        0,
      );
      setBudgetsResumo({ limite, gasto });
    } catch (error) {
      console.error("Falha ao buscar orçamentos:", error);
    }
  }, [mesSelecionado, anoSelecionado]);

  const fetchGoals = useCallback(async () => {
    try {
      const response = await getGoals();
      setGoals(response.data);
    } catch (error) {
      console.error("Falha ao buscar metas:", error);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchBudgetsResumo();
  }, [fetchBudgetsResumo]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Transações apenas do mês/ano selecionado (recorte da janela de 6 meses)
  const transactions = useMemo(() => {
    return rangeTransactions.filter((t) => {
      const d = new Date(t.data);
      return (
        d.getUTCMonth() + 1 === mesSelecionado &&
        d.getUTCFullYear() === anoSelecionado
      );
    });
  }, [rangeTransactions, mesSelecionado, anoSelecionado]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        const v = parseFloat(t.valor);
        if (t.tipo === "receita") acc.receitas += v;
        else acc.despesas += v;
        return acc;
      },
      { receitas: 0, despesas: 0 },
    );
  }, [transactions]);

  const saldo = totals.receitas - totals.despesas;

  // --- categoria com maior gasto no mês ---
  const maiorCategoria = useMemo(() => {
    const despesas = transactions.filter((t) => t.tipo === "despesa");
    if (despesas.length === 0) return null;

    const totalDespesas = despesas.reduce(
      (sum, t) => sum + parseFloat(t.valor),
      0,
    );
    const porCategoria = despesas.reduce((acc, t) => {
      const nome = t.subcategory?.category?.name || "Outros";
      acc[nome] = (acc[nome] || 0) + parseFloat(t.valor);
      return acc;
    }, {});

    const [nome, valor] = Object.entries(porCategoria).sort(
      (a, b) => b[1] - a[1],
    )[0];
    const percentual = totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0;
    return { nome, valor, percentual };
  }, [transactions]);

  // --- tendência dos últimos 6 meses (a partir da mesma janela de dados) ---
  const trendData = useMemo(() => {
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anoSelecionado, mesSelecionado - 1 - i, 1);
      meses.push({ mes: d.getMonth() + 1, ano: d.getFullYear() });
    }

    return meses.map(({ mes, ano }) => {
      const totaisDoMes = rangeTransactions.reduce(
        (acc, t) => {
          const d = new Date(t.data);
          if (d.getUTCMonth() + 1 === mes && d.getUTCFullYear() === ano) {
            const v = parseFloat(t.valor);
            if (t.tipo === "receita") acc.receitas += v;
            else acc.despesas += v;
          }
          return acc;
        },
        { receitas: 0, despesas: 0 },
      );

      const label = new Date(ano, mes - 1, 1)
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", "");

      return {
        label: label.charAt(0).toUpperCase() + label.slice(1),
        ...totaisDoMes,
      };
    });
  }, [rangeTransactions, mesSelecionado, anoSelecionado]);

  // --- próxima meta em andamento (a lista já vem ordenada por prazo) ---
  const proximaMeta = useMemo(() => {
    return goals.find(
      (g) => parseFloat(g.valor_atual) < parseFloat(g.valor_objetivo),
    );
  }, [goals]);

  const handleTogglePago = async (transaction) => {
    setRangeTransactions((current) =>
      current.map((t) =>
        t.id === transaction.id ? { ...t, pago: !t.pago } : t,
      ),
    );
    try {
      await api.patch(`/transactions/${transaction.id}/pago`);
    } catch (error) {
      console.error("Falha ao atualizar status de pagamento:", error);
      toast.error("Não foi possível atualizar o status de pagamento.");
      setRangeTransactions((current) =>
        current.map((t) =>
          t.id === transaction.id ? { ...t, pago: transaction.pago } : t,
        ),
      );
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };

  const handleDeleteClick = (transaction) => {
    if (transaction.recurrence === "fixo" && transaction.recurrence_group_id) {
      setTransactionToDelete(transaction);
      setShowDeleteModal(true);
    } else {
      if (window.confirm("Deseja realmente excluir esta transação?")) {
        executeDelete(transaction.id, false, transaction);
      }
    }
  };

  const executeDelete = async (
    id,
    isGroup = false,
    overrideTransaction = null,
  ) => {
    const target = overrideTransaction || transactionToDelete;
    if (!target) return;

    const url = isGroup
      ? `/transactions/group/${target.recurrence_group_id}`
      : `/transactions/${id || target.id}`;

    try {
      await toast.promise(
        api.delete(url, isGroup ? { params: { date: target.data } } : {}),
        {
          loading: isGroup ? "Excluindo futuras..." : "Excluindo...",
          success: "Excluído!",
          error: "Erro ao excluir.",
        },
      );
      fetchTransactions();
      closeModal();
    } catch (e) {
      console.error(e);
    }
  };

  const percentualOrcamento =
    budgetsResumo.limite > 0
      ? (budgetsResumo.gasto / budgetsResumo.limite) * 100
      : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink dark:text-ink-dark">
            Painel
          </h1>
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">
            Resumo do período selecionado
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
            className="bg-accent dark:bg-accent-dark text-paper-raised dark:text-paper-dark px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-card dark:shadow-card-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            + Nova transação
          </button>
        </div>
      </header>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Receitas"
          value={totals.receitas}
          icon={<FaArrowUp />}
          tone="receita"
        />
        <SummaryCard
          title="Despesas"
          value={totals.despesas}
          icon={<FaArrowDown />}
          tone="despesa"
        />
        <SummaryCard
          title="Saldo"
          value={saldo}
          icon={<FaDollarSign />}
          tone={saldo >= 0 ? "accent" : "despesa"}
        />
      </div>

      {/* Orçamento do mês / Maior categoria / Próxima meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-paper-raised dark:bg-paper-raised-dark p-5 rounded-xl shadow-card dark:shadow-card-dark border border-rule dark:border-rule-dark">
          <h3 className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider mb-3">
            Orçamento do mês
          </h3>
          {budgetsResumo.limite > 0 ? (
            <>
              <p className="text-lg font-medium text-ink dark:text-ink-dark">
                {Math.round(percentualOrcamento)}% utilizado
              </p>
              <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-0.5">
                {formatCurrency(budgetsResumo.gasto)} de{" "}
                {formatCurrency(budgetsResumo.limite)} planejados
              </p>
              <div className="h-1.5 rounded-full bg-rule dark:bg-rule-dark mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    percentualOrcamento > 100
                      ? "bg-despesa dark:bg-despesa-dark"
                      : "bg-accent dark:bg-accent-dark"
                  }`}
                  style={{ width: `${Math.min(percentualOrcamento, 100)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-soft dark:text-ink-soft-dark">
              Nenhum orçamento definido para este mês.{" "}
              <Link
                to="/budgets"
                className="text-accent dark:text-accent-dark hover:underline"
              >
                Criar orçamento
              </Link>
            </p>
          )}
        </div>

        <div className="bg-paper-raised dark:bg-paper-raised-dark p-5 rounded-xl shadow-card dark:shadow-card-dark border border-rule dark:border-rule-dark">
          <h3 className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider mb-3">
            Maior categoria
          </h3>
          {maiorCategoria ? (
            <>
              <p className="text-lg font-medium text-ink dark:text-ink-dark">
                {maiorCategoria.nome}
              </p>
              <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-0.5">
                {formatCurrency(maiorCategoria.valor)} ·{" "}
                {Math.round(maiorCategoria.percentual)}% das despesas
              </p>
              <div className="h-1.5 rounded-full bg-rule dark:bg-rule-dark mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-despesa dark:bg-despesa-dark"
                  style={{ width: `${Math.min(maiorCategoria.percentual, 100)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-soft dark:text-ink-soft-dark">
              Nenhuma despesa registrada neste mês.
            </p>
          )}
        </div>

        <div className="bg-paper-raised dark:bg-paper-raised-dark p-5 rounded-xl shadow-card dark:shadow-card-dark border border-rule dark:border-rule-dark">
          <h3 className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider mb-3">
            Próxima meta
          </h3>
          {proximaMeta ? (
            <>
              <p className="text-lg font-medium text-ink dark:text-ink-dark truncate">
                {proximaMeta.titulo}
              </p>
              <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-0.5">
                {formatCurrency(proximaMeta.valor_atual)} de{" "}
                {formatCurrency(proximaMeta.valor_objetivo)}
                {proximaMeta.meses_restantes != null &&
                  proximaMeta.meses_restantes > 0 &&
                  ` · faltam ${proximaMeta.meses_restantes} ${
                    proximaMeta.meses_restantes === 1 ? "mês" : "meses"
                  }`}
              </p>
              <div className="h-1.5 rounded-full bg-rule dark:bg-rule-dark mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-receita dark:bg-receita-dark"
                  style={{
                    width: `${Math.min(
                      (parseFloat(proximaMeta.valor_atual) /
                        parseFloat(proximaMeta.valor_objetivo)) *
                        100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-soft dark:text-ink-soft-dark">
              Nenhuma meta em andamento.{" "}
              <Link
                to="/goals"
                className="text-accent dark:text-accent-dark hover:underline"
              >
                Criar meta
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Gráfico de despesas por categoria */}
      <div className="bg-paper-raised dark:bg-paper-raised-dark p-6 rounded-xl shadow-card dark:shadow-card-dark border border-rule dark:border-rule-dark">
        <h3 className="text-center font-display text-lg font-medium text-ink dark:text-ink-dark mb-4">
          Distribuição de despesas
        </h3>
        <ExpensesChart transactions={transactions} />
      </div>

      {/* Tabela estilo ledger */}
      <div className="bg-paper-raised dark:bg-paper-raised-dark rounded-xl shadow-card dark:shadow-card-dark border border-rule dark:border-rule-dark overflow-hidden">
        <div className="p-5 border-b border-rule dark:border-rule-dark">
          <h2 className="font-display text-lg font-medium text-ink dark:text-ink-dark">
            Transações do mês
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-ink-soft dark:text-ink-soft-dark text-[10.5px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium text-center">Pago</th>
                <th className="px-5 py-3 font-medium text-right">Valor</th>
                <th className="px-5 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule dark:divide-rule-dark">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-10 text-center text-ink-soft dark:text-ink-soft-dark"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-10 text-center text-ink-soft dark:text-ink-soft-dark"
                  >
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-paper dark:hover:bg-paper-dark transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-[13px] text-ink-soft dark:text-ink-soft-dark whitespace-nowrap">
                      {formatDate(t.data)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div
                        className={`font-medium text-sm ${
                          t.pago
                            ? "text-ink-soft dark:text-ink-soft-dark line-through"
                            : "text-ink dark:text-ink-dark"
                        }`}
                      >
                        {t.subcategory?.category?.name || "Geral"}
                      </div>
                      <div className="text-xs text-ink-soft dark:text-ink-soft-dark">
                        {t.subcategory?.name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                          t.tipo === "receita"
                            ? "bg-receita-soft dark:bg-receita-soft-dark text-receita dark:text-receita-dark"
                            : "bg-despesa-soft dark:bg-despesa-soft-dark text-despesa dark:text-despesa-dark"
                        }`}
                      >
                        {t.tipo === "receita" ? "Receita" : "Despesa"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {t.tipo === "despesa" && (
                        <input
                          type="checkbox"
                          checked={!!t.pago}
                          onChange={() => handleTogglePago(t)}
                          aria-label="Marcar como pago"
                          className="h-4 w-4 accent-receita dark:accent-receita-dark rounded cursor-pointer"
                        />
                      )}
                    </td>
                    <td
                      className={`px-5 py-3.5 text-right font-mono text-sm font-medium ${
                        t.tipo === "receita"
                          ? "text-receita dark:text-receita-dark"
                          : "text-despesa dark:text-despesa-dark"
                      }`}
                    >
                      {t.tipo === "receita" ? "+ " : "− "}
                      {formatCurrency(t.valor)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTransaction(t);
                            setIsModalOpen(true);
                          }}
                          aria-label="Editar transação"
                          className="p-2 text-ink-soft dark:text-ink-soft-dark hover:text-accent dark:hover:text-accent-dark hover:bg-accent-soft dark:hover:bg-accent-soft-dark rounded-full transition-colors"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(t)}
                          aria-label="Excluir transação"
                          className="p-2 text-ink-soft dark:text-ink-soft-dark hover:text-despesa dark:hover:text-despesa-dark hover:bg-despesa-soft dark:hover:bg-despesa-soft-dark rounded-full transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metas + Tendência de 6 meses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-paper-raised dark:bg-paper-raised-dark rounded-xl shadow-card dark:shadow-card-dark border border-rule dark:border-rule-dark p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-medium text-ink dark:text-ink-dark">
              Metas
            </h2>
            <Link
              to="/goals"
              className="text-xs text-accent dark:text-accent-dark hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          {goals.length === 0 ? (
            <p className="text-sm text-ink-soft dark:text-ink-soft-dark">
              Nenhuma meta cadastrada.{" "}
              <Link
                to="/goals"
                className="text-accent dark:text-accent-dark hover:underline"
              >
                Criar a primeira
              </Link>
            </p>
          ) : (
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => {
                const percentual = Math.min(
                  (parseFloat(goal.valor_atual) /
                    parseFloat(goal.valor_objetivo)) *
                    100,
                  100,
                );
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between items-baseline text-sm mb-1.5">
                      <span className="font-medium text-ink dark:text-ink-dark">
                        {goal.titulo}
                      </span>
                      <span className="font-mono text-xs text-ink-soft dark:text-ink-soft-dark">
                        {formatCurrency(goal.valor_atual)} /{" "}
                        {formatCurrency(goal.valor_objetivo)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-rule dark:bg-rule-dark overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent dark:bg-accent-dark"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-ink-soft dark:text-ink-soft-dark mt-1">
                      {Math.round(percentual)}% concluído
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-paper-raised dark:bg-paper-raised-dark rounded-xl shadow-card dark:shadow-card-dark border border-rule dark:border-rule-dark p-6">
          <h2 className="font-display text-lg font-medium text-ink dark:text-ink-dark mb-4">
            Receitas x despesas
          </h2>
          <IncomeExpenseMonthlyTrendChart data={trendData} />
        </div>
      </div>

      {/* Modais */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTransaction ? "Editar" : "Nova transação"}
      >
        <TransactionForm
          onSuccess={() => {
            fetchTransactions();
            fetchBudgetsResumo();
            closeModal();
          }}
          initialData={editingTransaction}
        />
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={closeModal}
        title="Excluir transação recorrente"
      >
        <div className="p-2 text-center">
          <p className="text-ink-soft dark:text-ink-soft-dark mb-6 text-sm">
            Esta é uma transação recorrente. Como deseja excluí-la?
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => executeDelete()}
              className="px-4 py-2 border border-rule dark:border-rule-dark rounded-lg hover:bg-paper dark:hover:bg-paper-dark font-medium text-sm text-ink dark:text-ink-dark transition-colors"
            >
              Somente esta
            </button>
            <button
              onClick={() => executeDelete(null, true)}
              className="px-4 py-2 bg-despesa dark:bg-despesa-dark text-paper-raised dark:text-paper-dark rounded-lg hover:opacity-90 font-medium text-sm transition-opacity"
            >
              Esta e futuras
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const TONE_STYLES = {
  receita: {
    text: "text-receita dark:text-receita-dark",
    bg: "bg-receita-soft dark:bg-receita-soft-dark",
  },
  despesa: {
    text: "text-despesa dark:text-despesa-dark",
    bg: "bg-despesa-soft dark:bg-despesa-soft-dark",
  },
  accent: {
    text: "text-accent dark:text-accent-dark",
    bg: "bg-accent-soft dark:bg-accent-soft-dark",
  },
};

function SummaryCard({ title, value, icon, tone }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.accent;
  return (
    <div
      className={`flex items-center p-5 rounded-xl shadow-card dark:shadow-card-dark border border-rule dark:border-rule-dark ${styles.bg}`}
    >
      <div className={`text-2xl mr-4 ${styles.text} opacity-90`}>{icon}</div>
      <div>
        <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
          {title}
        </p>
        <p className={`font-mono text-xl font-medium ${styles.text}`}>
          {formatCurrency(value)}
        </p>
      </div>
    </div>
  );
}

export default DashboardPage;