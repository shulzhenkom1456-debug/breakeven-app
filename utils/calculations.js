// utils/calculations.js
const calculateBreakEvenUnits = (fixedCosts, unitPrice, variableCostPerUnit) => {
  const marginalProfit = unitPrice - variableCostPerUnit;
  if (marginalProfit <= 0) return Infinity;
  return fixedCosts / marginalProfit;
};

const calculateBreakEvenRevenue = (fixedCosts, unitPrice, variableCostPerUnit) => {
  const units = calculateBreakEvenUnits(fixedCosts, unitPrice, variableCostPerUnit);
  return units * unitPrice;
};

const calculateROAS = (grossRevenue, adSpend) => {
  if (adSpend === 0) return grossRevenue === 0 ? 0 : Infinity;
  return (grossRevenue / adSpend) * 100;
};

const calculateROI = (profit, investment) => {
  if (investment === 0) return profit === 0 ? 0 : Infinity;
  return ((profit - investment) / investment) * 100;
};

module.exports = {
  calculateBreakEvenUnits,
  calculateBreakEvenRevenue,
  calculateROAS,
  calculateROI
};