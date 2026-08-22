import { CATEGORIES } from '../data/defaultPockets';

/**
 * Calculates allocation for all pockets based on income and selected round mode
 * @param {number} totalIncome - Amount in THB
 * @param {string} mode - 'round10' | 'round25' | 'special'
 * @param {Array} pockets - List of pocket objects
 * @returns {Object} Calculation result with pocket amounts and category breakdown
 */
export function calculateAllocation(totalIncome, mode, pockets) {
  const income = Math.max(0, Number(totalIncome) || 0);
  const activePockets = pockets.filter(p => p.isActive);

  // 1. Separate fixed vs percentage rules for this mode
  let totalFixed = 0;
  const fixedAllocations = {};
  const percentAllocations = {};

  activePockets.forEach(pocket => {
    const rule = pocket.rules?.[mode] || { mode: 'percent_remaining', value: 0 };
    if (rule.mode === 'fixed') {
      const fixVal = Math.min(income, Number(rule.value) || 0);
      fixedAllocations[pocket.id] = fixVal;
      totalFixed += fixVal;
    }
  });

  // If fixed costs exceed income, we clamp
  const remainingForPercentage = Math.max(0, income - totalFixed);

  // 2. Compute percentage allocations
  let totalPercentAllocated = 0;
  let totalPercentConfigured = 0;

  activePockets.forEach(pocket => {
    const rule = pocket.rules?.[mode] || { mode: 'percent_remaining', value: 0 };
    if (rule.mode === 'percent_remaining') {
      const pct = Number(rule.value) || 0;
      totalPercentConfigured += pct;
      const amt = Math.round(((pct / 100) * remainingForPercentage) * 100) / 100;
      percentAllocations[pocket.id] = amt;
      totalPercentAllocated += amt;
    }
  });

  // 3. Assemble final pocket allocation list
  const pocketResults = activePockets.map(pocket => {
    const rule = pocket.rules?.[mode] || { mode: 'percent_remaining', value: 0 };
    const amount = rule.mode === 'fixed' 
      ? (fixedAllocations[pocket.id] || 0) 
      : (percentAllocations[pocket.id] || 0);

    const percentOfTotal = income > 0 ? (amount / income) * 100 : 0;

    return {
      ...pocket,
      allocatedAmount: amount,
      ruleUsed: rule,
      percentOfTotal: Math.round(percentOfTotal * 10) / 10
    };
  });

  // 4. Build category breakdown
  const categoryBreakdown = CATEGORIES.map(cat => {
    const categoryPockets = pocketResults.filter(p => p.categoryId === cat.id);
    const catTotal = categoryPockets.reduce((sum, p) => sum + p.allocatedAmount, 0);
    const catPercent = income > 0 ? (catTotal / income) * 100 : 0;

    return {
      ...cat,
      totalAllocated: Math.round(catTotal * 100) / 100,
      percentage: Math.round(catPercent * 10) / 10,
      pockets: categoryPockets
    };
  });

  const totalAllocated = pocketResults.reduce((sum, p) => sum + p.allocatedAmount, 0);
  const unallocatedAmount = Math.max(0, Math.round((income - totalAllocated) * 100) / 100);

  return {
    income,
    mode,
    pocketResults,
    categoryBreakdown,
    summary: {
      totalIncome: income,
      totalFixed: Math.round(totalFixed * 100) / 100,
      totalVariable: Math.round(totalPercentAllocated * 100) / 100,
      totalAllocated: Math.round(totalAllocated * 100) / 100,
      unallocatedAmount,
      totalPercentConfigured: Math.round(totalPercentConfigured * 10) / 10
    }
  };
}

/**
 * Format currency with THB symbol or commas
 */
export function formatMoney(amount, showDecimals = false) {
  if (amount === undefined || amount === null || isNaN(amount)) return '฿0';
  const num = Number(amount);
  return '฿' + num.toLocaleString('th-TH', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  });
}
