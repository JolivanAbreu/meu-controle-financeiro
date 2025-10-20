// frontend/src/pages/ReportsPage.jsx

import { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import ExpensesChart from "../components/ExpensesChart";
import { FaDollarSign, FaArrowUp, FaArrowDown } from "react-icons/fa";

const getMesAtual = () => {
  const date = new Date();
  const primeiroDia = new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { primeiroDia, ultimoDia };
};

function ReportsPage() {
  const [startDate, setStartDate] = useState(getMesAtual().primeiroDia);
  const [endDate, setEndDate] = useState(getMesAtual().ultimoDia);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    const promise = api.get("/transactions", {
      params: { startDate, endDate },
    });

    try {
      setLoading(true);
      toast.promise(promise, {
        loading: "A gerar relatório...",
        success: "Relatório gerado com sucesso!",
        error: "Falha ao gerar o relatório.",
      });

      const response = await promise;
      setTransactions(response.data);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalReceitas = transactions
    .filter((t) => t.tipo === "receita")
    .reduce((acc, t) => acc + parseFloat(t.valor), 0);

  const totalDespesas = transactions
    .filter((t) => t.tipo === "despesa")
    .reduce((acc, t) => acc + parseFloat(t.valor), 0);

  const saldo = totalReceitas - totalDespesas;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Relatórios</h1>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Data de Início
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Data de Fim
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="px-4 py-2 h-11 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "A gerar..." : "Gerar Relatório"}
        </button>
      </div>

      {/* Resumos */}
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
            <p className="text-gray-600">Saldo</p>
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

      {/* Gráfico e Tabela */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <ExpensesChart transactions={transactions} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Detalhes das Transações
          </h2>
          {transactions.length === 0 ? (
            <p>Nenhuma transação encontrada para este período.</p>
          ) : (
            <div className="overflow-y-auto max-h-96">{}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
