// backend/__tests__/invoiceCycle.test.js
//
// Testes da lógica de ciclo de fatura (backend/src/utils/invoiceCycle.js).
// Não dependem de banco de dados nem do app Express — só das funções puras.

const {
  safeDate,
  getCurrentCycle,
  getCycleForClosingMonth,
  getPastCycles,
} = require('../src/utils/invoiceCycle');

// Formata a data pelo calendário LOCAL (não por toISOString(), que converte
// para UTC e pode mostrar o dia seguinte para horários tarde da noite em
// fusos atrás de UTC, como o horário do Brasil).
function iso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

describe('safeDate', () => {
  it('mantém o dia informado quando ele existe no mês', () => {
    expect(iso(safeDate(2026, 6, 15))).toBe('2026-07-15'); // mês 6 = julho
  });

  it('limita o dia 31 ao último dia real de um mês de 30 dias', () => {
    expect(iso(safeDate(2026, 3, 31))).toBe('2026-04-30'); // abril
  });

  it('limita o dia 31 a 28 em fevereiro não bissexto', () => {
    expect(iso(safeDate(2026, 1, 31))).toBe('2026-02-28');
  });

  it('limita o dia 31 a 29 em fevereiro de ano bissexto', () => {
    expect(iso(safeDate(2028, 1, 31))).toBe('2028-02-29');
  });
});

describe('getCurrentCycle', () => {
  it('antes do fechamento: ciclo fecha no mês corrente', () => {
    const { cycleStart, cycleEnd } = getCurrentCycle(10, new Date(2026, 6, 5)); // 05/07
    expect(iso(cycleStart)).toBe('2026-06-11');
    expect(iso(cycleEnd)).toBe('2026-07-10');
  });

  it('depois do fechamento: ciclo fecha no mês seguinte', () => {
    const { cycleStart, cycleEnd } = getCurrentCycle(10, new Date(2026, 6, 15)); // 15/07
    expect(iso(cycleStart)).toBe('2026-07-11');
    expect(iso(cycleEnd)).toBe('2026-08-10');
  });

  it('no exato dia do fechamento, o ciclo ainda inclui esse dia', () => {
    const { cycleEnd } = getCurrentCycle(10, new Date(2026, 6, 10, 23, 0));
    expect(iso(cycleEnd)).toBe('2026-07-10');
  });

  it('fechamento dia 31 em fevereiro não bissexto: ciclo fecha em 28/02', () => {
    const { cycleStart, cycleEnd } = getCurrentCycle(31, new Date(2026, 1, 15)); // 15/02/2026
    expect(iso(cycleStart)).toBe('2026-02-01');
    expect(iso(cycleEnd)).toBe('2026-02-28');
  });

  it('fechamento dia 31 em ano bissexto: ciclo fecha em 29/02', () => {
    const { cycleEnd } = getCurrentCycle(31, new Date(2028, 1, 15)); // 15/02/2028
    expect(iso(cycleEnd)).toBe('2028-02-29');
  });

  it('logo após o fechamento de fevereiro (28), o próximo ciclo começa em 01/03', () => {
    const { cycleStart, cycleEnd } = getCurrentCycle(31, new Date(2026, 2, 1)); // 01/03/2026
    expect(iso(cycleStart)).toBe('2026-03-01');
    expect(iso(cycleEnd)).toBe('2026-03-31');
  });

  it('virada de ano: fechamento no início do mês, consultado em janeiro, referencia dezembro anterior', () => {
    const { cycleStart, cycleEnd } = getCurrentCycle(5, new Date(2026, 0, 2)); // 02/01/2026
    expect(iso(cycleStart)).toBe('2025-12-06');
    expect(iso(cycleEnd)).toBe('2026-01-05');
  });

  it('REGRESSÃO: uma transação lançada logo após o fechamento não deve cair no ciclo que acabou de fechar', () => {
    // Este é o cenário que gerou dúvida real durante o desenvolvimento:
    // fechamento dia 10, compra em 23/07 -> não pode estar no ciclo que fechou em 10/07.
    const cicloQueFechouDia10 = getCycleForClosingMonth(10, 2026, 6); // fecha 10/07
    const compraEm23_07 = new Date(2026, 6, 23);
    expect(compraEm23_07.getTime()).toBeGreaterThan(cicloQueFechouDia10.cycleEnd.getTime());

    // ...e deve cair no ciclo seguinte, que fecha em 10/08.
    const proximoCiclo = getCycleForClosingMonth(10, 2026, 7); // fecha 10/08
    expect(compraEm23_07.getTime()).toBeGreaterThanOrEqual(proximoCiclo.cycleStart.getTime());
    expect(compraEm23_07.getTime()).toBeLessThanOrEqual(proximoCiclo.cycleEnd.getTime());
  });
});

describe('getCycleForClosingMonth', () => {
  it('retorna o ciclo cujo fechamento cai no mês/ano pedido, independente da data atual', () => {
    const { cycleStart, cycleEnd } = getCycleForClosingMonth(10, 2026, 6); // fecha em julho/2026
    expect(iso(cycleStart)).toBe('2026-06-11');
    expect(iso(cycleEnd)).toBe('2026-07-10');
  });
});

describe('getPastCycles', () => {
  it('retorna a quantidade de ciclos pedida, em ordem cronológica crescente', () => {
    const cycles = getPastCycles(10, 6, new Date(2026, 6, 5));
    expect(cycles).toHaveLength(6);
    for (let i = 1; i < cycles.length; i++) {
      expect(cycles[i].cycleStart.getTime()).toBeGreaterThan(cycles[i - 1].cycleStart.getTime());
    }
  });

  it('os ciclos são consecutivos, sem lacunas nem sobreposição', () => {
    const cycles = getPastCycles(10, 4, new Date(2026, 6, 5));
    for (let i = 1; i < cycles.length; i++) {
      const fimAnterior = cycles[i - 1].cycleEnd; // 23:59:59.999 do dia de fechamento
      const inicioAtual = cycles[i].cycleStart; // 00:00:00.000 do dia seguinte
      const diffMs = inicioAtual.getTime() - fimAnterior.getTime();
      expect(diffMs).toBe(1); // adjacentes por 1 milissegundo = sem lacuna e sem sobreposição
    }
  });

  it('o último ciclo retornado é o ciclo em aberto na data de referência', () => {
    const now = new Date(2026, 6, 5);
    const cycles = getPastCycles(10, 3, now);
    const atual = getCurrentCycle(10, now);
    expect(iso(cycles[cycles.length - 1].cycleEnd)).toBe(iso(atual.cycleEnd));
  });

  it('funciona corretamente cruzando a virada de ano dentro da janela pedida', () => {
    const cycles = getPastCycles(31, 6, new Date(2026, 2, 15)); // março/2026, 6 meses pra trás cruza dez/2025
    const labels = cycles.map((c) => iso(c.cycleEnd));
    expect(labels).toContain('2025-10-31');
    expect(labels).toContain('2025-12-31');
    expect(labels).toContain('2026-02-28'); // fevereiro clampado corretamente mesmo dentro da série
  });
});