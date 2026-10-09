import { CATEGORIES } from '../data/defaultPockets.js';

const MODES = ['round10', 'round25', 'special'];
const cleanMoney = value => Math.round(Math.max(0, Number(value) || 0) * 100) / 100;

function allocateGroup(total, mode, entries, getRule) {
  const base = cleanMoney(total);
  let remaining = base;
  let fixedTotal = 0;
  let requestedFixed = 0;
  let percentConfigured = 0;
  const amounts = new Map();
  const active = entries.filter(entry => entry.isActive !== false);

  // Fixed rules are funded first in display order; over-budget amounts are surfaced separately.
  active.forEach(entry => {
    const rule = getRule(entry, mode) || { mode: 'percent_remaining', value: 0 };
    if (rule.mode !== 'fixed') return;
    const requested = cleanMoney(rule.value);
    const amount = Math.min(remaining, requested);
    amounts.set(entry.id, amount);
    requestedFixed += requested;
    fixedTotal += amount;
    remaining = cleanMoney(remaining - amount);
  });

  const percentEntries = active.map(entry => ({ entry, rule: getRule(entry, mode) || { mode: 'percent_remaining', value: 0 } }))
    .filter(({ rule }) => rule.mode !== 'fixed');
  percentConfigured = percentEntries.reduce((sum, { rule }) => sum + Math.max(0, Number(rule.value) || 0), 0);
  const percentScale = percentConfigured > 100 ? 100 / percentConfigured : 1;
  let variableTotal = 0;
  percentEntries.forEach(({ entry, rule }) => {
    const pct = Math.max(0, Number(rule.value) || 0) * percentScale;
    const amount = cleanMoney(remaining * pct / 100);
    amounts.set(entry.id, amount);
    variableTotal += amount;
  });
  variableTotal = cleanMoney(variableTotal);
  return {
    amounts,
    fixedTotal: cleanMoney(fixedTotal),
    requestedFixed: cleanMoney(requestedFixed),
    variableTotal,
    percentConfigured: Math.round(percentConfigured * 10) / 10,
    unallocated: cleanMoney(Math.max(0, remaining - variableTotal))
  };
}

export function createAgentRulesFromLegacy(pockets = [], folders = [], baseAmounts = { round10: 6000, round25: 6000, special: 1000 }) {
  const folderIds = new Set(folders.map(folder => folder.id));
  const rootEntries = [
    ...pockets.filter(p => !p.folderId || !folderIds.has(p.folderId)),
    ...folders.filter(folder => folder.isActive !== false)
  ];
  return Object.fromEntries(CATEGORIES.map(category => [category.id, Object.fromEntries(MODES.map(mode => {
    const sameAgent = rootEntries.filter(item => item.categoryId === category.id && item.isActive !== false);
    const activeEntries = rootEntries.filter(item => item.isActive !== false);
    const allFixed = activeEntries.reduce((sum, item) => {
      const rule = item.rules?.[mode];
      return sum + (rule?.mode === 'fixed' ? Math.max(0, Number(rule.value) || 0) : 0);
    }, 0);
    const allPercent = activeEntries.reduce((sum, item) => {
      const rule = item.rules?.[mode];
      return sum + (rule && rule.mode !== 'fixed' ? Math.max(0, Number(rule.value) || 0) : 0);
    }, 0);
    const fixed = sameAgent.reduce((sum, item) => {
      const rule = item.rules?.[mode];
      return sum + (rule?.mode === 'fixed' ? Math.max(0, Number(rule.value) || 0) : 0);
    }, 0);
    const percent = sameAgent.reduce((sum, item) => {
      const rule = item.rules?.[mode];
      return sum + (rule && rule.mode !== 'fixed' ? Math.max(0, Number(rule.value) || 0) : 0);
    }, 0);
    const base = cleanMoney(baseAmounts?.[mode] ?? (mode === 'special' ? 1000 : 6000));
    const poolAfterFixed = Math.max(0, base - Math.min(base, allFixed));
    const percentScale = allPercent > 100 ? 100 / allPercent : 1;
    const legacyAmount = cleanMoney(Math.min(base, fixed) + poolAfterFixed * percent * percentScale / 100);
    const migratedRule = fixed > 0 && percent === 0
      ? { mode: 'fixed', value: cleanMoney(Math.min(base, fixed)) }
      : { mode: 'percent_remaining', value: base > 0 ? Math.min(100, Math.round((legacyAmount / base) * 1000) / 10) : 0 };
    return [mode, migratedRule];
  }))]));
}

/** Salary is split between Agents; each Agent's budget is then split among its Cloud Pockets. */
export function calculateAllocation(totalIncome, mode, pockets, folders = [], agentRules = null) {
  const income = cleanMoney(totalIncome);
  const agents = CATEGORIES.map(category => ({
    ...category,
    isActive: true,
    rules: agentRules?.[category.id] || createAgentRulesFromLegacy(pockets, folders)[category.id]
  }));
  const agentAllocation = allocateGroup(income, mode, agents, (agent, currentMode) => agent.rules?.[currentMode]);
  const pocketResults = [];
  const categoryBreakdown = agents.map(agent => {
    const agentAmount = agentAllocation.amounts.get(agent.id) || 0;
    const agentPockets = pockets.filter(p => p.categoryId === agent.id && p.isActive !== false);
    const childAllocation = allocateGroup(agentAmount, mode, agentPockets, (pocket, currentMode) => pocket.rules?.[currentMode]);
    const children = agentPockets.map(pocket => {
      const amount = childAllocation.amounts.get(pocket.id) || 0;
      const result = {
        ...pocket,
        folderId: undefined,
        folderName: undefined,
        allocatedAmount: amount,
        ruleUsed: pocket.rules?.[mode] || { mode: 'percent_remaining', value: 0 },
        agentBudget: agentAmount,
        percentOfTotal: income > 0 ? Math.round(amount / income * 1000) / 10 : 0
      };
      pocketResults.push(result);
      return result;
    });
    const totalAllocated = cleanMoney(children.reduce((sum, pocket) => sum + pocket.allocatedAmount, 0));
    return {
      ...agent,
      allocatedAmount: agentAmount,
      requestedFixed: agent.rules?.[mode]?.mode === 'fixed' ? cleanMoney(agent.rules[mode].value) : 0,
      childUnallocated: childAllocation.unallocated,
      childRequestedFixed: childAllocation.requestedFixed,
      childFixed: childAllocation.fixedTotal,
      childPercentConfigured: childAllocation.percentConfigured,
      totalAllocated,
      totalBudgeted: agentAmount,
      unallocatedAmount: childAllocation.unallocated,
      percentage: income > 0 ? Math.round(agentAmount / income * 1000) / 10 : 0,
      pockets: children
    };
  });
  const totalAllocated = cleanMoney(pocketResults.reduce((sum, pocket) => sum + pocket.allocatedAmount, 0));
  const childUnallocated = cleanMoney(categoryBreakdown.reduce((sum, agent) => sum + agent.childUnallocated, 0));
  return {
    income,
    mode,
    pocketResults,
    folderResults: [],
    agentResults: categoryBreakdown,
    categoryBreakdown,
    summary: {
      totalIncome: income,
      totalFixed: cleanMoney(categoryBreakdown.reduce((sum, agent) => sum + agent.childFixed, 0)),
      requestedFixed: cleanMoney(agentAllocation.requestedFixed + categoryBreakdown.reduce((sum, agent) => sum + agent.childRequestedFixed, 0)),
      totalVariable: cleanMoney(totalAllocated - categoryBreakdown.reduce((sum, agent) => sum + agent.childFixed, 0)),
      totalAllocated,
      totalBudgeted: cleanMoney(categoryBreakdown.reduce((sum, agent) => sum + agent.allocatedAmount, 0)),
      agentAllocatedPercent: income > 0 ? Math.round(categoryBreakdown.reduce((sum, agent) => sum + agent.allocatedAmount, 0) / income * 1000) / 10 : 0,
      unallocatedAmount: cleanMoney(agentAllocation.unallocated + childUnallocated),
      folderUnallocatedAmount: 0,
      totalPercentConfigured: agentAllocation.percentConfigured,
      agentFixed: agentAllocation.fixedTotal,
      agentPercentTotal: agentAllocation.percentConfigured,
      unallocatedToAgents: agentAllocation.unallocated,
      requestedFixedOverBudget: cleanMoney(Math.max(0, agentAllocation.requestedFixed - agentAllocation.fixedTotal) + categoryBreakdown.reduce((sum, agent) => sum + Math.max(0, agent.childRequestedFixed - agent.childFixed), 0))
    }
  };
}

export function calculateGroupStats(total, entries, mode, getRule) {
  const allocation = allocateGroup(total, mode, entries, getRule);
  const base = cleanMoney(total);
  const allocated = cleanMoney(allocation.fixedTotal + allocation.variableTotal);
  return {
    base,
    fixedRequested: allocation.requestedFixed,
    fixedAllocated: allocation.fixedTotal,
    percentConfigured: allocation.percentConfigured,
    percentAllocated: allocation.variableTotal,
    allocated,
    remaining: allocation.unallocated,
    overBudget: cleanMoney(Math.max(0, allocation.requestedFixed - allocation.fixedTotal)),
    allocatedPercent: base > 0 ? Math.round(allocated / base * 1000) / 10 : 0,
    remainingPercent: base > 0 ? Math.round(allocation.unallocated / base * 1000) / 10 : 0,
    amounts: allocation.amounts
  };
}

export function formatMoney(amount, showDecimals = false) {
  if (amount === undefined || amount === null || isNaN(amount)) return '฿0';
  const num = Number(amount);
  return '฿' + num.toLocaleString('th-TH', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  });
}
