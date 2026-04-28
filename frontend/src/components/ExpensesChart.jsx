import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF4560",
];

const ExpensesChart = ({ transactions }) => {
  // Agrupa despesas por categoria e calcula o total geral
  const { data, totalDespesas } = useMemo(() => {
    const categoriesMap = transactions
      .filter((t) => t.tipo === "despesa")
      .reduce((acc, t) => {
        const categoryName = t.subcategory?.category?.name || "Outros";
        acc[categoryName] = (acc[categoryName] || 0) + parseFloat(t.valor);
        return acc;
      }, {});

    const chartData = Object.keys(categoriesMap).map((name) => ({
      name,
      value: categoriesMap[name],
    }));

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return { data: chartData, totalDespesas: total };
  }, [transactions]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 italic">
        Nenhuma despesa para este período.
      </div>
    );
  }

  return (
    <div className="relative w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={105}
            paddingAngle={5}
            dataKey="value"
            animationDuration={800}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(value)}
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>

      {/* Texto no centro do Donut */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-gray-400 text-sm font-medium">Total</span>
        <span className="text-xl font-bold text-gray-800">
          {formatCurrency(totalDespesas)}
        </span>
      </div>
    </div>
  );
};

export default ExpensesChart;
