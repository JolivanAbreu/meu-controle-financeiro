// frontend/src/components/ContributeModal.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { addGoalContribution } from '../services/goalService'; // Importar service
// Importar getAccounts para Upgrade 2
// import { getAccounts } from '../services/accountService';

function ContributeModal({ isOpen, onClose, goal, onSuccess }) {
    const [valor, setValor] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    // Estados para Upgrade 2
    // const [contaOrigemId, setContaOrigemId] = useState('');
    // const [accounts, setAccounts] = useState([]);

    // Resetar form quando modal abre ou fecha, ou goal muda
    useEffect(() => {
        if (isOpen) {
            setValor('');
            setData(new Date().toISOString().split('T')[0]);
            // setContaOrigemId(''); // Upgrade 2
            // Fetch accounts para Upgrade 2
        }
    }, [isOpen, goal]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!goal || !valor || !data) return;

        setLoading(true);
        const contributionData = {
            valor: parseFloat(valor),
            data,
            // conta_origem_id: contaOrigemId || null, // Upgrade 2
        };

        const promise = addGoalContribution(goal.id, contributionData);

        try {
            const response = await toast.promise(promise, {
                loading: 'Registrando aporte...',
                success: 'Aporte registrado com sucesso!',
                error: (err) => err.response?.data?.error || 'Falha ao registrar aporte.',
            });
            onSuccess(response.data); // Passa a meta ATUALIZADA para a página pai
        } catch (error) {
            console.error("Erro ao adicionar aporte:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !goal) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Aportar para: ${goal.titulo}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="aporteValor" className="block text-sm font-medium text-gray-700">Valor do Aporte (R$)</label>
                    <input
                        type="number"
                        id="aporteValor"
                        step="0.01"
                        required
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        placeholder="0,00"
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label htmlFor="aporteData" className="block text-sm font-medium text-gray-700">Data do Aporte</label>
                    <input
                        type="date"
                        id="aporteData"
                        required
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        max={new Date().toISOString().split("T")[0]} // Não permitir datas futuras
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                </div>

                {/* --- CAMPO CONTA ORIGEM (Upgrade 2) --- */}
                {/*
                {goal.accountId && ( // Mostra só se a meta estiver vinculada
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Conta de Origem (Opcional)</label>
                        <select value={contaOrigemId} onChange={(e) => setContaOrigemId(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md">
                            <option value="">Manual (Não mover fundos)</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                         <p className="text-xs text-gray-500 mt-1">Selecione para transferir automaticamente o valor desta conta para a conta da meta.</p>
                    </div>
                )}
                */}
                {/* ------------------------------------ */}


                <div className="flex justify-end pt-2 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Salvando...' : 'Salvar Aporte'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default ContributeModal;