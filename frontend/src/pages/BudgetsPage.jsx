// frontend/src/pages/BudgetsPage.jsx

import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import BudgetForm from "../components/BudgetForm";
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/budgets");
      setBudgets(response.data);
    } catch (error) {
      console.error("Falha ao buscar orçamentos:", error);
      alert("Não foi possível carregar os orçamentos.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleDelete = async (budgetId) => {
    if (window.confirm("Tem certeza que deseja apagar este orçamento?")) {
      const promise = api.delete(`/budgets/${budgetId}`);
      try {
        await toast.promise(promise, {
          loading: "Apagando...",
          success: "Orçamento apagado com sucesso!",
          error: "Não foi possível apagar o orçamento.",
        });
        setBudgets((current) => current.filter((b) => b.id !== budgetId));
      } catch (error) {
        console.error("Erro ao apagar orçamento:", error);
      }
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  if (loading) return <p>Carregando orçamentos...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meus Orçamentos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          + Novo Orçamento
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBudget ? "Editar Orçamento" : "Adicionar Novo Orçamento"}
      >
        <BudgetForm
          onSuccess={handleBudgetSuccess}
          initialData={editingBudget}
        />
      </Modal>

      {budgets.length === 0 ? (
        <p className="text-gray-500">Nenhum orçamento encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => {
            const percentualGasto = (budget.gasto_atual / budget.limite) * 100;
            const progressBarColor =
              percentualGasto > 100 ? "bg-red-500" : "bg-blue-500";

            return (
              <div
                key={budget.id}
                className="bg-white p-4 rounded-lg shadow-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {budget.categoria}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {budget.mes}/{budget.ano}
                    </span>
                  </div>
                  <div className="flex gap-3 text-gray-500">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="hover:text-blue-700"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600">
                  {formatCurrency(budget.gasto_atual)} /{" "}
                  <span className="font-medium">
                    {formatCurrency(budget.limite)}
                  </span>
                </p>
                <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                  <div
                    className={`h-4 rounded-full ${progressBarColor}`}
                    style={{ width: `${Math.min(percentualGasto, 100)}%` }}
                  ></div>
                </div>
                {percentualGasto > 100 && (
                  <p className="text-red-600 text-sm mt-1">
                    Orçamento ultrapassado!
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
