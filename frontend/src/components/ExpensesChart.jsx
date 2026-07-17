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
  "#3E6B52",
  "#6B8F7A",
  "#A2432E",
  "#C77B5F",
  "#2E4A5C",
  "#B8BFB3",
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
      <div className="flex h-64 items-center justify-center text-ink-soft italic text-sm">
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
              border: "1px solid #C9CFC5",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontFamily: "IBM Plex Sans, sans-serif",
              fontSize: "13px",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{
              fontFamily: "IBM Plex Sans, sans-serif",
              fontSize: "12.5px",
              color: "#4B5B59",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Texto no centro do Donut */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-ink-soft text-xs uppercase tracking-wider font-medium">
          Total
        </span>
        <span className="font-mono text-xl font-medium text-ink">
          {formatCurrency(totalDespesas)}
        </span>
      </div>
    </div>
  );
};

export default ExpensesChart;