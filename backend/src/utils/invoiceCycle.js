function safeDate(year, monthIndex, day) {
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDayOfMonth));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getCurrentCycle(diaFechamento, now = new Date()) {
  const closingThisMonth = safeDate(now.getFullYear(), now.getMonth(), diaFechamento);
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let cycleEndDate;
  let prevClosing;

  if (nowDateOnly <= closingThisMonth) {
    cycleEndDate = closingThisMonth;
    const prevMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevClosing = safeDate(prevMonthRef.getFullYear(), prevMonthRef.getMonth(), diaFechamento);
  } else {
    const nextMonthRef = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    cycleEndDate = safeDate(nextMonthRef.getFullYear(), nextMonthRef.getMonth(), diaFechamento);
    prevClosing = closingThisMonth;
  }

  const cycleStart = addDays(prevClosing, 1);
  const cycleEnd = new Date(
    cycleEndDate.getFullYear(),
    cycleEndDate.getMonth(),
    cycleEndDate.getDate(),
    23, 59, 59, 999
  );
  return { cycleStart, cycleEnd };
}

function getCycleForClosingMonth(diaFechamento, year, monthIndex) {
  const closing = safeDate(year, monthIndex, diaFechamento);
  const prevMonthRef = new Date(year, monthIndex - 1, 1);
  const prevClosing = safeDate(prevMonthRef.getFullYear(), prevMonthRef.getMonth(), diaFechamento);
  const cycleStart = addDays(prevClosing, 1);
  const cycleEnd = new Date(closing.getFullYear(), closing.getMonth(), closing.getDate(), 23, 59, 59, 999);
  return { cycleStart, cycleEnd };
}

function getPastCycles(diaFechamento, count, now = new Date()) {
  const current = getCurrentCycle(diaFechamento, now);
  const cycles = [current];
  let refYear = current.cycleEnd.getFullYear();
  let refMonth = current.cycleEnd.getMonth();

  for (let i = 1; i < count; i++) {
    refMonth -= 1;
    if (refMonth < 0) {
      refMonth = 11;
      refYear -= 1;
    }
    cycles.unshift(getCycleForClosingMonth(diaFechamento, refYear, refMonth));
  }

  return cycles;
}

module.exports = {
  safeDate,
  addDays,
  getCurrentCycle,
  getCycleForClosingMonth,
  getPastCycles,
};