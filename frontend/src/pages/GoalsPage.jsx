// frontend/src/pages/GoalsPage.jsx

import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import GoalForm from "../components/GoalForm";
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/goals");
      setGoals(response.data);
    } catch (error) {
      console.error("Falha ao buscar metas:", error);
      alert("Não foi possível carregar as metas.");
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
  };

  const handleGoalSuccess = (updatedOrNewGoal) => {
    if (editingGoal) {
      setGoals((current) =>
        current.map((g) =>
          g.id === updatedOrNewGoal.id ? updatedOrNewGoal : g
        )
      );
    } else {
      setGoals((current) => [...current, updatedOrNewGoal]);
    }
    closeModal();
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleDelete = async (goalId) => {
    if (window.confirm("Tem certeza que deseja apagar esta meta?")) {
      const promise = api.delete(`/goals/${goalId}`);
      try {
        await toast.promise(promise, {
          loading: "Apagando...",
          success: "Meta apagada com sucesso!",
          error: "Não foi possível apagar a meta.",
        });
        setGoals((current) => current.filter((g) => g.id !== goalId));
      } catch (error) {
        console.error("Erro ao apagar meta:", error);
      }
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  if (loading) return <p>Carregando metas...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Minhas Metas</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          + Nova Meta
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingGoal ? "Editar Meta" : "Adicionar Nova Meta"}
      >
        <GoalForm onSuccess={handleGoalSuccess} initialData={editingGoal} />
      </Modal>

      {goals.length === 0 ? (
        <p className="text-gray-500">Nenhuma meta encontrada.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const percentual = (goal.valor_atual / goal.valor_objetivo) * 100;
            return (
              <div
                key={goal.id}
                className="bg-white p-4 rounded-lg shadow-md flex flex-col"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{goal.titulo}</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                {goal.prazo && (
                  <p className="text-sm text-gray-500">
                    Prazo:{" "}
                    {new Date(goal.prazo).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </p>
                )}
                <div className="flex-grow mt-4">
                  <p className="text-gray-600 text-sm">
                    {formatCurrency(goal.valor_atual)} /{" "}
                    <span className="font-medium">
                      {formatCurrency(goal.valor_objetivo)}
                    </span>
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
                    <div
                      className="bg-green-500 h-4 rounded-full"
                      style={{ width: `${Math.min(percentual, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-sm font-semibold mt-1">
                    {percentual.toFixed(1)}%
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

export default GoalsPage;
