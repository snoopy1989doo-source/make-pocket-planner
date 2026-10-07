import { CATEGORIES } from '../data/defaultPockets';

function allocateGroup(total, mode, entries) {
  const base = Math.max(0, Number(total) || 0);
  let remaining = base;
  let fixedTotal = 0;
  let variableTotal = 0;
  let percentConfigured = 0;
  const amounts = new Map();

  entries.filter(entry => entry.isActive !== false).forEach(entry => {
    const rule = entry.rules?.[mode] || { mode: 'percent_remaining', value: 0 };
    if (rule.mode !== 'fixed') return;
    const amount = Math.min(remaining, Math.max(0, Number(rule.value) || 0));
    amounts.set(entry.id, amount);
    remaining -= amount;
    fixedTotal += amount;
  });

  entries.filter(entry => entry.isActive !== false).forEach(entry => {
    const rule = entry.rules?.[mode] || { mode: 'percent_remaining', value: 0 };
    if (rule.mode === 'fixed') return;
    const pct = Math.max(0, Number(rule.value) || 0);
    percentConfigured += pct;
    const amount = Math.round((base - fixedTotal) * Math.min(100, pct) / 100 * 100) / 100;
    amounts.set(entry.id, amount);
    variableTotal += amount;
  });

  return {
    amounts,
    fixedTotal,
    variableTotal,
    percentConfigured,
    unallocated: Math.max(0, Math.round((remaining - variableTotal) * 100) / 100)
  };
}

/** Salary is allocated to standalone pockets and folders first; a folder then allocates its own balance to its child pockets. */
export function calculateAllocation(totalIncome, mode, pockets, folders = []) {
  const income = Math.max(0, Number(totalIncome) || 0);
  const folderIds = new Set(folders.map(folder => folder.id));
  const activeFolders = folders.filter(folder => folder.isActive !== false);
  const directPockets = pockets.filter(p => p.isActive && (!p.folderId || !folderIds.has(p.folderId)));
  const rootEntries = [...directPockets, ...activeFolders];
  const rootAllocation = allocateGroup(income, mode, rootEntries);

  const pocketResults = [];
  const folderResults = activeFolders.map(folder => {
    const folderAmount = rootAllocation.amounts.get(folder.id) || 0;
    const children = pockets.filter(p => p.isActive && p.folderId === folder.id);
    const childAllocation = allocateGroup(folderAmount, mode, children);
    const childResults = children.map(pocket => {
      const amount = childAllocation.amounts.get(pocket.id) || 0;
      const result = {
        ...pocket,
        folderId: folder.id,
        folderName: folder.name,
        allocatedAmount: amount,
        ruleUsed: pocket.rules?.[mode] || { mode: 'percent_remaining', value: 0 },
        percentOfTotal: income > 0 ? Math.round(amount / income * 1000) / 10 : 0
      };
      pocketResults.push(result);
      return result;
    });
    return {
      ...folder,
      allocatedAmount: folderAmount,
      children: childResults,
      childAllocated: childResults.reduce((sum, p) => sum + p.allocatedAmount, 0),
      unallocatedAmount: childAllocation.unallocated,
      percentOfTotal: income > 0 ? Math.round(folderAmount / income * 1000) / 10 : 0
    };
  });

  directPockets.forEach(pocket => {
    const amount = rootAllocation.amounts.get(pocket.id) || 0;
    pocketResults.push({
      ...pocket,
      allocatedAmount: amount,
      ruleUsed: pocket.rules?.[mode] || { mode: 'percent_remaining', value: 0 },
      percentOfTotal: income > 0 ? Math.round(amount / income * 1000) / 10 : 0
    });
  });

  const categoryBreakdown = CATEGORIES.map(cat => {
    const categoryPockets = pocketResults.filter(p => p.categoryId === cat.id);
    const catTotal = categoryPockets.reduce((sum, p) => sum + p.allocatedAmount, 0);
    return {
      ...cat,
      totalAllocated: Math.round(catTotal * 100) / 100,
      percentage: income > 0 ? Math.round(catTotal / income * 1000) / 10 : 0,
      pockets: categoryPockets
    };
  });

  const transferTotal = pocketResults.reduce((sum, p) => sum + p.allocatedAmount, 0);
  const envelopeTotal = rootEntries.reduce((sum, item) => sum + (rootAllocation.amounts.get(item.id) || 0), 0);
  return {
    income,
    mode,
    pocketResults,
    folderResults,
    categoryBreakdown,
    summary: {
      totalIncome: income,
      totalFixed: Math.round(rootAllocation.fixedTotal * 100) / 100,
      totalVariable: Math.round(rootAllocation.variableTotal * 100) / 100,
      totalAllocated: Math.round(transferTotal * 100) / 100,
      totalBudgeted: Math.round(envelopeTotal * 100) / 100,
      unallocatedAmount: rootAllocation.unallocated,
      folderUnallocatedAmount: Math.round(folderResults.reduce((sum, folder) => sum + folder.unallocatedAmount, 0) * 100) / 100,
      totalPercentConfigured: Math.round(rootAllocation.percentConfigured * 10) / 10
    }
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
