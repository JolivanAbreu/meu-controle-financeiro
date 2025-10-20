// frontend/src/components/ExpensesChart.jsx

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function ExpensesChart({ transactions }) {
  const expenseData = transactions
    .filter((t) => t.tipo === "despesa")
    .reduce((acc, current) => {
      const existingCategory = acc.find(
        (item) => item.name === current.categoria
      );
      const value = parseFloat(current.valor);

      if (existingCategory) {
        existingCategory.value += value;
      } else {
        acc.push({ name: current.categoria, value });
      }
      return acc;
    }, []);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#AF19FF",
    "#FF1943",
  ];

  if (expenseData.length === 0) {
    return (
      <div className="text-center p-4">
        <h3 className="text-xl font-semibold">Gráfico de Despesas</h3>
        <p className="text-gray-500 mt-4">
          Nenhuma despesa registada para exibir no gráfico.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-center">
        Gráfico de Despesas por Categoria
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={expenseData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={(entry) => `${((entry.percent || 0) * 100).toFixed(0)}%`}
          >
            {expenseData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(value)
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpensesChart;
