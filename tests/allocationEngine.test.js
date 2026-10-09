import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAllocation, calculateGroupStats, createAgentRulesFromLegacy } from '../src/utils/allocationEngine.js';

const emptyRules = () => Object.fromEntries(['round10', 'round25', 'special'].map(mode => [mode, { mode: 'percent_remaining', value: 0 }]));

test('splits salary into Agent then applies pocket rules within the Agent budget', () => {
  const pockets = [
    { id: 'life', categoryId: 'squirrel', isActive: true, rules: { round10: { mode: 'fixed', value: 100 } } },
    { id: 'true-money', categoryId: 'squirrel', isActive: true, rules: { round10: { mode: 'percent_remaining', value: 7 } } },
    { id: 'cash', categoryId: 'squirrel', isActive: true, rules: { round10: { mode: 'fixed', value: 30 } } }
  ];
  const allocation = calculateAllocation(1000, 'round10', pockets, [], {
    squirrel: { ...emptyRules(), round10: { mode: 'percent_remaining', value: 20 } }
  });

  assert.equal(allocation.agentResults.find(agent => agent.id === 'squirrel').allocatedAmount, 200);
  assert.deepEqual(Object.fromEntries(allocation.pocketResults.map(pocket => [pocket.id, pocket.allocatedAmount])), {
    life: 100,
    'true-money': 4.9,
    cash: 30
  });
  assert.equal(allocation.summary.totalAllocated, 134.9);
  assert.equal(allocation.summary.unallocatedAmount, 865.1);
});

test('caps combined percentage rules to the available pool', () => {
  const entries = [
    { id: 'a', isActive: true, rules: { round10: { mode: 'percent_remaining', value: 80 } } },
    { id: 'b', isActive: true, rules: { round10: { mode: 'percent_remaining', value: 80 } } }
  ];
  const stats = calculateGroupStats(1000, entries, 'round10', (entry, mode) => entry.rules[mode]);
  assert.equal(stats.percentConfigured, 160);
  assert.equal(stats.percentAllocated, 1000);
  assert.equal(stats.remaining, 0);
  assert.equal(stats.amounts.get('a'), 500);
  assert.equal(stats.amounts.get('b'), 500);
});

test('reports fixed requests above the pool and funds no more than the pool', () => {
  const stats = calculateGroupStats(6000, [
    { id: 'rent', isActive: true, rules: { round10: { mode: 'fixed', value: 100000 } } }
  ], 'round10', (entry, mode) => entry.rules[mode]);
  assert.equal(stats.fixedRequested, 100000);
  assert.equal(stats.amounts.get('rent'), 6000);
  assert.equal(stats.overBudget, 94000);
  assert.equal(stats.remaining, 0);
});

test('migrates mixed legacy Agent fixed and percentage rules at the current salary base', () => {
  const migrated = createAgentRulesFromLegacy([
    { id: 'rent', categoryId: 'squirrel', isActive: true, rules: { round10: { mode: 'fixed', value: 1500 } } },
    { id: 'food', categoryId: 'squirrel', isActive: true, rules: { round10: { mode: 'percent_remaining', value: 50 } } }
  ], [], { round10: 6000 });
  assert.deepEqual(migrated.squirrel.round10, { mode: 'percent_remaining', value: 62.5 });
});
