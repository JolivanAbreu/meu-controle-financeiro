import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import TransactionForm from "../components/TransactionForm";
import ExpensesChart from "../components/ExpensesChart";
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
  const [transactions, setTransactions] = useState([]);
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

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = new Date(anoSelecionado, mesSelecionado - 1, 1)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(anoSelecionado, mesSelecionado, 0)
        .toISOString()
        .split("T")[0];
      const response = await api.get("/transactions", {
        params: { startDate, endDate },
      });
      setTransactions(response.data);
    } catch (error) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [mesSelecionado, anoSelecionado]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };

  // FUNÇÃO CORRIGIDA: Decide se abre o modal de recorrência ou deleta direto
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

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Painel</h1>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(Number(e.target.value))}
            className="border rounded-lg p-2 bg-white shadow-sm"
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
            className="border rounded-lg p-2 bg-white shadow-sm"
          >
            {ANOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md"
          >
            + Nova Transação
          </button>
        </div>
      </header>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Receitas"
          value={totals.receitas}
          icon={<FaArrowUp />}
          color="text-green-600"
          bg="bg-green-50"
        />
        <SummaryCard
          title="Despesas"
          value={totals.despesas}
          icon={<FaArrowDown />}
          color="text-red-600"
          bg="bg-red-50"
        />
        <SummaryCard
          title="Saldo"
          value={saldo}
          icon={<FaDollarSign />}
          color={saldo >= 0 ? "text-blue-600" : "text-red-600"}
          bg="bg-blue-50"
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-center font-bold text-gray-700 mb-4">
          Distribuição de Despesas
        </h3>
        <ExpensesChart transactions={transactions} />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">Transações do Mês</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="p-4 font-semibold">Data</th>
                <th className="p-4 font-semibold">Categoria</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold text-right">Valor</th>
                <th className="p-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-400">
                    Carregando...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-400">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600 whitespace-nowrap">
                      {formatDate(t.data)}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">
                        {t.subcategory?.category?.name || "Geral"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {t.subcategory?.name}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${t.tipo === "receita" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {t.tipo}
                      </span>
                    </td>
                    <td
                      className={`p-4 text-right font-bold ${t.tipo === "receita" ? "text-green-600" : "text-red-600"}`}
                    >
                      {t.tipo === "receita" ? "+" : "-"}{" "}
                      {formatCurrency(t.valor)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTransaction(t);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-all"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(t)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all"
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

      {/* Modais */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTransaction ? "Editar" : "Nova Transação"}
      >
        <TransactionForm
          onSuccess={() => {
            fetchTransactions();
            closeModal();
          }}
          initialData={editingTransaction}
        />
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={closeModal}
        title="Excluir Transação Recorrente"
      >
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-6">
            Esta é uma transação recorrente. Como deseja excluí-la?
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => executeDelete()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
            >
              Somente esta
            </button>
            <button
              onClick={() => executeDelete(null, true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Esta e futuras
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({ title, value, icon, color, bg }) {
  return (
    <div
      className={`flex items-center p-6 rounded-xl shadow-sm border border-gray-100 ${bg}`}
    >
      <div className={`text-3xl mr-4 ${color} opacity-80`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {title}
        </p>
        <p className={`text-2xl font-bold ${color}`}>{formatCurrency(value)}</p>
      </div>
    </div>
  );
}

export default DashboardPage;
