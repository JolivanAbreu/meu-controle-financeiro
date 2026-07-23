// frontend/src/pages/TransactionsPage.jsx

import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import TransactionForm from "../components/TransactionForm";
import { FaEdit, FaTrash, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

const LIMIT = 20;

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Espera 400ms sem digitação antes de disparar a busca, evitando uma
  // requisição a cada tecla pressionada.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/transactions", {
        params: {
          page,
          limit: LIMIT,
          q: debouncedSearch || undefined,
        },
      });
      setTransactions(response.data.data);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Falha ao buscar transações:", error);
      toast.error("Não foi possível carregar as transações.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleTogglePago = async (transaction) => {
    setTransactions((current) =>
      current.map((t) =>
        t.id === transaction.id ? { ...t, pago: !t.pago } : t,
      ),
    );
    try {
      await api.patch(`/transactions/${transaction.id}/pago`);
    } catch (error) {
      console.error("Falha ao atualizar status de pagamento:", error);
      toast.error("Não foi possível atualizar o status de pagamento.");
      setTransactions((current) =>
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

  const executeDelete = async (id, isGroup = false, overrideTransaction = null) => {
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
    <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink dark:text-ink-dark">
            Transações
          </h1>
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">
            {total} transação(ões) encontrada(s)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-ink-soft-dark"
              size={13}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por descrição..."
              className="pl-9 pr-3 py-2 rounded-lg border border-rule dark:border-rule-dark bg-paper-raised dark:bg-paper-raised-dark text-sm text-ink dark:text-ink-dark placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent w-56"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent dark:bg-accent-dark text-paper-raised dark:text-paper-dark px-4 py-2 rounded-lg font-medium text-sm shadow-card dark:shadow-card-dark hover:opacity-90 transition-opacity"
          >
            + Nova transação
          </button>
        </div>
      </div>

      <div className="bg-paper-raised dark:bg-paper-raised-dark rounded-xl shadow-card dark:shadow-card-dark border border-rule dark:border-rule-dark overflow-hidden">
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
                  <td colSpan="6" className="p-10 text-center text-ink-soft dark:text-ink-soft-dark">
                    Carregando...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-ink-soft dark:text-ink-soft-dark">
                    {debouncedSearch
                      ? `Nenhum resultado para "${debouncedSearch}".`
                      : "Nenhuma transação encontrada."}
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-paper dark:hover:bg-paper-dark transition-colors">
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
                        {t.descricao || t.subcategory?.name}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-rule dark:border-rule-dark">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 text-sm text-ink-soft dark:text-ink-soft-dark hover:text-accent dark:hover:text-accent-dark disabled:opacity-40 disabled:hover:text-ink-soft transition-colors"
            >
              <FaChevronLeft size={11} /> Anterior
            </button>
            <span className="text-xs text-ink-soft dark:text-ink-soft-dark font-mono">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 text-sm text-ink-soft dark:text-ink-soft-dark hover:text-accent dark:hover:text-accent-dark disabled:opacity-40 disabled:hover:text-ink-soft transition-colors"
            >
              Próxima <FaChevronRight size={11} />
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTransaction ? "Editar" : "Nova transação"}
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

export default TransactionsPage;