import { useEffect, useState, useCallback } from "react";
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

// ... (Listas de meses e anos, não precisa mexer) ...
const meses = [
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
const anos = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - 2 + i
);

function DashboardPage() {
  // ... (Toda a lógica de estados, fetch, modais, etc., continua igual) ...
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().getMonth() + 1
  );
  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear()
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = new Date(anoSelecionado, mesSelecionado - 1, 1);
      const endDate = new Date(anoSelecionado, mesSelecionado, 0);

      const response = await api.get("/transactions", {
        params: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        },
      });
      setTransactions(response.data);
    } catch (error) {
      console.error("Falha ao buscar transações:", error);
      toast.error("Não foi possível carregar as transações.");
    } finally {
      setLoading(false);
    }
  }, [mesSelecionado, anoSelecionado]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalReceitas = transactions
    .filter((t) => t.tipo === "receita")
    .reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const totalDespesas = transactions
    .filter((t) => t.tipo === "despesa")
    .reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const saldo = totalReceitas - totalDespesas;

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };

  const handleTransactionSuccess = () => {
    fetchTransactions();
    closeModal();
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (transaction) => {
    if (transaction.recurrence === "fixo" && transaction.recurrence_group_id) {
      setTransactionToDelete(transaction);
      setShowDeleteModal(true);
    } else {
      if (window.confirm("Tem certeza que deseja apagar esta transação?")) {
        handleDeleteSingle(transaction.id);
      }
    }
  };

  const handleDeleteSingle = async (transactionId) => {
    const id = transactionId || transactionToDelete?.id;
    if (!id) return;

    const promise = api.delete(`/transactions/${id}`);
    try {
      await toast.promise(promise, {
        loading: "Apagando...",
        success: "Transação apagada com sucesso!",
        error: "Não foi possível apagar a transação.",
      });
      fetchTransactions();
      closeModal();
    } catch (error) {
      console.error("Erro ao apagar transação:", error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!transactionToDelete) return;

    const { recurrence_group_id, data } = transactionToDelete;
    const promise = api.delete(`/transactions/group/${recurrence_group_id}`, {
      params: { date: data },
    });

    try {
      await toast.promise(promise, {
        loading: "Apagando transações futuras...",
        success: "Transações futuras apagadas com sucesso!",
        error: "Não foi possível apagar as transações futuras.",
      });
      fetchTransactions();
      closeModal();
    } catch (error) {
      console.error("Erro ao apagar grupo de transações:", error);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

  return (
    <div>
      {/* CABEÇALHO, FILTROS E MODAIS (Tudo igual) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Painel</h1>
        <div className="flex items-center gap-2">
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {meses.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.nome}
              </option>
            ))}
          </select>
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            + Nova Transação
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          editingTransaction ? "Editar Transação" : "Adicionar Nova Transação"
        }
        className="max-w-md"
      >
        <TransactionForm
          onSuccess={handleTransactionSuccess}
          initialData={editingTransaction}
        />
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={closeModal}
        title="Excluir Transação Recorrente"
      >
        <div className="p-4">
          <p className="mb-6 text-gray-700">
            Esta é uma transação recorrente. O que você gostaria de fazer?
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => handleDeleteSingle()}
              className="px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Excluir Somente Esta
            </button>
            <button
              onClick={handleDeleteGroup}
              className="px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Excluir Esta e Futuras
            </button>
          </div>
        </div>
      </Modal>

      {/* CARTÕES DE RESUMO (Tudo igual) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-100 p-4 rounded-lg shadow-md flex items-center">
          <FaArrowUp className="text-green-600 text-3xl mr-4" />
          <div>
            <p className="text-gray-600">Total Receitas</p>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(totalReceitas)}
            </p>
          </div>
        </div>
        <div className="bg-red-100 p-4 rounded-lg shadow-md flex items-center">
          <FaArrowDown className="text-red-600 text-3xl mr-4" />
          <div>
            <p className="text-gray-600">Total Despesas</p>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(totalDespesas)}
            </p>
          </div>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg shadow-md flex items-center">
          <FaDollarSign className="text-blue-600 text-3xl mr-4" />
          <div>
            <p className="text-gray-600">Saldo do Mês</p>
            <p
              className={`text-2xl font-bold ${
                saldo >= 0 ? "text-blue-700" : "text-red-700"
              }`}
            >
              {formatCurrency(saldo)}
            </p>
          </div>
        </div>
      </div>

      {/* GRÁFICO E TABELA */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <ExpensesChart transactions={transactions} />
        </div>
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Transações do Mês</h2>
          {loading ? (
            <p>A carregar...</p>
          ) : transactions.length === 0 ? (
            <p>Nenhuma transação encontrada para este período.</p>
          ) : (
            <div className="overflow-y-auto max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 px-3">Data</th>
                    <th className="py-2 px-3">Categoria</th>
                    <th className="py-2 px-3">Tipo</th>
                    <th className="py-2 px-3 text-right">Valor</th>
                    <th className="py-2 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3">{formatDate(t.data)}</td>

                      {/* Coluna Categoria (Corrigida) */}
                      <td className="py-3 px-3">
                        {t.subcategory ? (
                          <>
                            <span className="font-semibold">
                              {t.subcategory.category.name}
                            </span>
                            <span className="text-gray-500">
                              {" "}
                              / {t.subcategory.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">Sem Categoria</span>
                        )}
                      </td>

                      {/* --- CORREÇÃO: Exibir Tipo e Recorrência --- */}
                      <td className="py-3 px-3">
                        <span className="font-semibold capitalize">
                          {t.tipo} {/* "Despesa" ou "Receita" */}
                        </span>
                        <span className="text-gray-500 capitalize">
                          {" "}
                          / {t.recurrence} {/* "Fixo" ou "Variável" */}
                        </span>
                      </td>
                      {/* --- FIM DA CORREÇÃO --- */}

                      <td
                        className={`py-3 px-3 text-right font-semibold ${
                          t.tipo === "receita"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {t.tipo === "receita" ? "+" : "-"}{" "}
                        {formatCurrency(t.valor)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleEdit(t)}
                          className="text-blue-500 hover:text-blue-700 mr-3"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(t)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
