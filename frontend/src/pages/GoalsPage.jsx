// frontend/src/pages/GoalsPage.jsx

import { useEffect, useState, useCallback } from "react";
// import api from "../services/api"; // Usar services agora
import Modal from "../components/Modal";
import GoalForm from "../components/GoalForm";
import ContributeModal from "../components/ContributeModal"; // <-- Importar novo modal
import { FaEdit, FaTrash, FaPlusCircle } from "react-icons/fa"; // <-- Adicionar FaPlusCircle
import toast from "react-hot-toast";
// Importar services
import { getGoals, deleteGoal } from "../services/goalService"; // Importar getGoals e deleteGoal

// Badge de Status (Componente auxiliar)
const StatusBadge = ({ status }) => {
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-700';
    let text = 'Pendente';

    switch (status) {
        case 'completed':
            bgColor = 'bg-green-100'; textColor = 'text-green-700'; text = 'Concluída';
            break;
        case 'on_track':
            bgColor = 'bg-blue-100'; textColor = 'text-blue-700'; text = 'Em dia';
            break;
        case 'behind':
            bgColor = 'bg-yellow-100'; textColor = 'text-yellow-700'; text = 'Atrasada';
            break;
        case 'overdue':
            bgColor = 'bg-red-100'; textColor = 'text-red-700'; text = 'Expirada';
            break;
        default: // pending
             break;
    }
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
            {text}
        </span>
    );
};


function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal Criar/Editar
  const [editingGoal, setEditingGoal] = useState(null);
  // --- NOVOS ESTADOS PARA APORTE ---
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState(null);
  // ---------------------------------

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getGoals(); // Usa service
      setGoals(response.data);
    } catch (error) {
      console.error("Falha ao buscar metas:", error);
      toast.error("Não foi possível carregar as metas."); // Usa toast
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
    setIsContributeModalOpen(false); // Fecha também o modal de aporte
    setContributingGoal(null);
  };

  // Sucesso ao Criar ou Editar Meta
  const handleGoalSuccess = (updatedOrNewGoal) => {
    setGoals((current) => {
        const exists = current.some(g => g.id === updatedOrNewGoal.id);
        if (exists) {
            // Atualiza
            return current.map((g) =>
                g.id === updatedOrNewGoal.id ? updatedOrNewGoal : g
            );
        } else {
             // Adiciona
            return [...current, updatedOrNewGoal];
        }
    });
    closeModal();
  };

  // --- NOVA FUNÇÃO: Sucesso ao Adicionar Aporte ---
  const handleContributionSuccess = (updatedGoal) => {
      setGoals((current) =>
        current.map((g) =>
          g.id === updatedGoal.id ? updatedGoal : g
        )
      );
      closeModal(); // Fecha o modal de aporte
  };
  // --------------------------------------------

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true); // Abre modal de edição
  };

  // --- NOVA FUNÇÃO: Abrir modal de aporte ---
  const handleContribute = (goal) => {
      setContributingGoal(goal);
      setIsContributeModalOpen(true);
  };
  // --------------------------------------

  const handleDelete = async (goalId) => {
    if (window.confirm("Tem certeza que deseja apagar esta meta? (Contribuições também serão apagadas)")) { // Aviso sobre cascade
      const promise = deleteGoal(goalId); // Usa service
      try {
        await toast.promise(promise, {
          loading: "Apagando...",
          success: "Meta apagada com sucesso!",
          error: (err) => err.response?.data?.error || "Não foi possível apagar a meta.",
        });
        setGoals((current) => current.filter((g) => g.id !== goalId));
      } catch (error) {
        console.error("Erro ao apagar meta:", error);
      }
    }
  };

  const formatCurrency = (value) =>
    value != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", }).format(value) : 'N/A';

  const formatDate = (dateString) =>
     dateString ? new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC", }) : 'Sem prazo';


  if (loading) return <div className="p-4">Carregando metas...</div>; // Melhor feedback de loading

  return (
    <div className="container mx-auto p-4 md:p-8"> {/* Adicionado container */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Minhas Metas</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          + Nova Meta
        </button>
      </div>

      {/* Modal Criar/Editar Meta */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingGoal ? "Editar Meta" : "Adicionar Nova Meta"}>
        <GoalForm onSuccess={handleGoalSuccess} initialData={editingGoal} />
      </Modal>

      {/* --- NOVO MODAL DE APORTE --- */}
      <ContributeModal
          isOpen={isContributeModalOpen}
          onClose={closeModal}
          goal={contributingGoal}
          onSuccess={handleContributionSuccess}
      />
      {/* --------------------------- */}

      {goals.length === 0 ? (
        <p className="text-gray-500 text-center py-10">Nenhuma meta encontrada. Crie sua primeira meta!</p> // Mensagem melhorada
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            // Calcula percentual aqui para clareza
            const percentual = goal.valor_objetivo > 0 ? (parseFloat(goal.valor_atual) / parseFloat(goal.valor_objetivo)) * 100 : 0;
            const valorRestante = parseFloat(goal.valor_restante || 0); // Usa valor_restante calculado
            const aporteSugerido = parseFloat(goal.aporte_sugerido_mes || 0); // Usa aporte_sugerido

            return (
              <div key={goal.id} className="bg-white p-5 rounded-lg shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow duration-200"> {/* Melhor espaçamento e efeito hover */}
                <div> {/* Conteúdo principal */}
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{goal.titulo}</h3>
                        <div className="flex items-center gap-3">
                            {/* --- BOTÃO APORTAR --- */}
                            {goal.status !== 'completed' && ( // Só mostra se não estiver completa
                                <button
                                    onClick={() => handleContribute(goal)}
                                    className="text-green-500 hover:text-green-700"
                                    title="Adicionar Aporte"
                                >
                                    <FaPlusCircle size={18}/>
                                </button>
                            )}
                            {/* ------------------- */}
                            <button onClick={() => handleEdit(goal)} className="text-blue-500 hover:text-blue-700" title="Editar Meta"> <FaEdit size={16}/> </button>
                            <button onClick={() => handleDelete(goal.id)} className="text-red-500 hover:text-red-700" title="Excluir Meta"> <FaTrash size={15}/> </button>
                        </div>
                    </div>
                     <div className="flex justify-between items-center mb-3 text-sm text-gray-500">
                        <span>Prazo: {formatDate(goal.prazo)}</span>
                        {/* --- BADGE DE STATUS --- */}
                        <StatusBadge status={goal.status} />
                        {/* --------------------- */}
                     </div>
                    <div className="mb-3">
                        <div className="flex justify-between text-gray-600 text-sm mb-1">
                            <span>{formatCurrency(goal.valor_atual)} / {formatCurrency(goal.valor_objetivo)}</span>
                            <span className="font-semibold">{percentual.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3"> {/* Barra mais fina */}
                            <div className="bg-green-500 h-3 rounded-full" style={{ width: `${Math.min(percentual, 100)}%` }}></div>
                        </div>
                    </div>
                 </div>

                 {/* Informações Calculadas (Upgrade 3) */}
                 <div className="mt-auto pt-3 border-t text-sm text-gray-600 space-y-1">
                    {valorRestante > 0 && (
                        <p>Faltam: <span className="font-semibold">{formatCurrency(valorRestante)}</span></p>
                    )}
                    {aporteSugerido > 0 && isFinite(aporteSugerido) && ( // Mostra sugestão apenas se aplicável
                        <p>Sugestão mensal: <span className="font-semibold">{formatCurrency(aporteSugerido)}</span></p>
                    )}
                     {goal.status === 'completed' && (
                         <p className="font-semibold text-green-600">Meta Concluída!</p>
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