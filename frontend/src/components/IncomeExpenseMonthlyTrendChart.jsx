import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

function IncomeExpenseMonthlyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <p className="text-center text-ink-soft text-sm py-10">
        Dados insuficientes para o gráfico de tendência.
      </p>
    );
  }

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#C9CFC5" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#4B5B59" }}
            axisLine={{ stroke: "#C9CFC5" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `R$ ${Math.round(v / 1000)}k`}
            tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#4B5B59" }}
            width={54}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => formatCurrency(value)}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #C9CFC5",
              fontFamily: "IBM Plex Sans, sans-serif",
              fontSize: 13,
            }}
          />
          <Legend
            formatter={(value) => (value === "receitas" ? "Receitas" : "Despesas")}
            wrapperStyle={{
              fontFamily: "IBM Plex Sans, sans-serif",
              fontSize: 12.5,
              color: "#4B5B59",
            }}
          />
          <Line
            type="monotone"
            dataKey="receitas"
            stroke="#3E6B52"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="despesas"
            stroke="#A2432E"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default IncomeExpenseMonthlyTrendChart;