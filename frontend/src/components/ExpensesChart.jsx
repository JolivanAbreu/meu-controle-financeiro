// frontend/src/components/ExpensesChart.jsx

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector, Label } from 'recharts';

// Cores
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943', '#8884D8', '#82CA9D'];

// Função para processar os dados das despesas por CATEGORIA PRINCIPAL
const processCategoryData = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const categoryTotals = transactions
    .filter(t => t.tipo === 'despesa' && t.subcategory?.category) // Filtra despesas com categoria principal válida
    .reduce((acc, t) => {
      // Usa o nome da CATEGORIA PAI
      const categoryName = t.subcategory.category.name;
      const value = parseFloat(t.valor);

      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += value;
      return acc;
    }, {});

  // Converte para { name: 'Categoria', value: 123.45 } e ordena
  return Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

// Formatação para Tooltip
const formatCurrencyTooltip = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Formatação para Label central
const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Componente para renderizar setor ativo (opcional, para destaque)
const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  // Posições para linhas e texto fora da pizza
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 12;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      {/* Texto central (opcional) */}
      {/* <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>{payload.name}</text> */}
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
      {/* Linha e texto de anotação */}
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#333">{`${payload.name}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={16} textAnchor={textAnchor} fill="#999">
        {`(R$ ${value.toFixed(2)} - ${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

function ExpensesChart({ transactions }) {
  const data = processCategoryData(transactions);
  const [activeIndex, setActiveIndex] = useState(0); // Estado para saber qual fatia está ativa

  // Calcula o total de despesas para exibir no centro (opcional)
  const totalDespesas = data.reduce((sum, entry) => sum + entry.value, 0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  if (data.length === 0) {
    return (
      <div className="text-center p-4 h-[300px] flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold mb-2">Despesas por Categoria</h3>
        <p className="text-gray-500">Nenhuma despesa registrada para exibir.</p>
      </div>
    );
  }

  return (
    <div className="h-[300px]"> {/* Altura fixa para o container */}
      <h3 className="text-xl font-semibold mb-2 text-center">Despesas por Categoria</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape} // Usa a forma ativa customizada
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65} // Aumenta o raio interno para Donut
            outerRadius={90} // Ajusta raio externo
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter} // Define a fatia ativa ao passar o mouse
            paddingAngle={1} // Pequeno espaço entre fatias
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
             {/* Label central opcional mostrando o total */}
            <Label value={formatCurrency(totalDespesas)} position="center" fontSize="16px" fontWeight="bold" fill="#666" />
          </Pie>
          {/* O Tooltip padrão pode ser redundante com o activeShape */}
          {/* <Tooltip formatter={formatCurrencyTooltip} /> */}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpensesChart;