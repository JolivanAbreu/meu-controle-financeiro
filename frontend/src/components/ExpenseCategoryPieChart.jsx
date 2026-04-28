import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';

// Cores predefinidas (adicione mais se tiver muitas categorias)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF', '#8884D8', '#82CA9D'];

// Função para processar os dados das despesas por categoria principal
const processCategoryData = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const categoryTotals = transactions
    .filter(t => t.tipo === 'despesa' && t.subcategory?.category) // Filtra despesas com categoria válida
    .reduce((acc, t) => {
      const categoryName = t.subcategory.category.name;
      const value = parseFloat(t.valor);

      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += value;
      return acc;
    }, {});

  // Converte para o formato { name: 'Categoria', value: 123.45 }
  return Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Ordena do maior para o menor
};

// Componente para renderizar um setor ativo (opcional, para efeito visual)
const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>{payload.name}</text>
      <Sector
        cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
      />
      <Sector
        cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle}
        innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`R$ ${value.toFixed(2)}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`( ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


function ExpenseCategoryPieChart({ transactions }) {
  const data = processCategoryData(transactions);
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

   if (data.length === 0) {
      return <p className="text-center text-gray-500">Nenhuma despesa registrada para exibir no gráfico.</p>;
  }


  return (
    <div style={{ width: '100%', height: 350 }}>
      <h3 className="text-lg font-semibold mb-2 text-center">Despesas por Categoria</h3>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%" // Centro X
            cy="50%" // Centro Y
            innerRadius={60} // Raio interno (para fazer um "donut")
            outerRadius={90} // Raio externo
            fill="#8884d8"
            dataKey="value" // Chave dos dados que representa o valor
            onMouseEnter={onPieEnter}
            paddingAngle={2} // Espaço entre fatias
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
           <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
          {/* <Legend layout="vertical" verticalAlign="middle" align="right" /> */}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpenseCategoryPieChart;