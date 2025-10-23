import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label
} from 'recharts';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função para processar os dados das transações
const processTrendData = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const dailyTotals = transactions.reduce((acc, t) => {
    // Usar data completa para agrupar, mas formatar para exibição
    const dateKey = format(parseISO(t.data), 'yyyy-MM-dd');
    const value = parseFloat(t.valor);

    if (!acc[dateKey]) {
      acc[dateKey] = { date: dateKey, receita: 0, despesa: 0 };
    }

    if (t.tipo === 'receita') {
      acc[dateKey].receita += value;
    } else {
      acc[dateKey].despesa += value;
    }
    return acc;
  }, {});

  // Converter para array e ordenar por data
  return Object.values(dailyTotals).sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Formatar data para o eixo X
const formatDateTick = (tickItem) => {
  try {
    return format(parseISO(tickItem), 'dd/MM', { locale: ptBR });
  } catch (e) {
    return tickItem; // Fallback
  }
};

// Formatar valor para o Tooltip e Eixo Y
const formatCurrencyTick = (value) => `R$ ${value.toFixed(0)}`;

function IncomeExpenseTrendChart({ transactions }) {
  const data = processTrendData(transactions);

  if (data.length === 0) {
      return <p className="text-center text-gray-500">Dados insuficientes para o gráfico de tendência.</p>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
       <h3 className="text-lg font-semibold mb-4 text-center">Receitas x Despesas (Diário)</h3>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
             dataKey="date"
             tickFormatter={formatDateTick}
             angle={-45} // Inclinar labels se houver muitos
             textAnchor="end"
             height={50} // Aumentar altura para labels inclinados
             interval="preserveStartEnd" // Garante mostrar primeiro e último
             minTickGap={10} // Espaçamento mínimo
             />
          <YAxis tickFormatter={formatCurrencyTick} width={80}>
             <Label value="Valor (R$)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
          </YAxis>
          <Tooltip
            formatter={(value, name) => [`R$ ${value.toFixed(2)}`, name === 'receita' ? 'Receita' : 'Despesa']}
            labelFormatter={(label) => format(parseISO(label), 'PPP', { locale: ptBR })}
          />
          <Legend verticalAlign="top" height={36} formatter={(value) => value === 'receita' ? 'Receitas' : 'Despesas'}/>
          <Line type="monotone" dataKey="receita" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} name="Receita" />
          <Line type="monotone" dataKey="despesa" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} name="Despesa" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default IncomeExpenseTrendChart;