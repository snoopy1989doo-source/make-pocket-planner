import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DEFAULT_POCKETS, CATEGORIES, ROUND_PRESETS } from './data/defaultPockets';
import { calculateAllocation } from './utils/allocationEngine';
import { Header } from './components/Header';
import { AllocationCalculator } from './components/AllocationCalculator';
import { TransferChecklist } from './components/TransferChecklist';
import { SelfLoanTracker } from './components/SelfLoanTracker';
import { PocketManager } from './components/PocketManager';
import { HistoryLog } from './components/HistoryLog';

const DEFAULT_ROUND_DESCRIPTIONS = {
  round10: 'เงินเดือนครึ่งแรก หัก Fix Cost (1,500) และกระจายใช้จ่าย/ลงทุนครึ่งเดือนแรก',
  round25: 'เงินเดือนครึ่งหลัง หัก Fix Cost (1,500) + กยศ./หนี้ และกระจายใช้จ่าย/ลงทุนครึ่งเดือนหลัง',
  special: 'โบนัส, กำไรเทรด, งานนอก เติมค่ากินพิเศษ 10% + พอร์ตลงทุน Bee 40% + Shark 20% + Cat 20% + Rhino 10%'
};

const DEFAULT_LOANS = [
  {
    id: 'loan_1',
    title: 'คืน Kept',
    sourceName: 'Kept by krungsri',
    totalAmount: 1500,
    paidAmount: 500,
    repayMode: 'installment',
    amountPerRound: 500,
    repaySchedule: 'all',
    note: 'ยืมสำรองจ่ายฉุกเฉิน ทยอยคืนรอบละ 500',
    isCompleted: false
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [pockets, setPockets] = useLocalStorage('make_pockets_v3', DEFAULT_POCKETS);
  const [currentMode, setCurrentMode] = useLocalStorage('make_current_mode', 'round10');
  
  // Independent income amounts for each mode
  const [incomeAmounts, setIncomeAmounts] = useLocalStorage('make_income_amounts_v2', {
    round10: 6000,
    round25: 6000,
    special: 5000
  });

  // Custom editable pinned notes for each round
  const [roundDescriptions, setRoundDescriptions] = useLocalStorage('make_round_descriptions_v1', DEFAULT_ROUND_DESCRIPTIONS);

  // Self-loans tracker
  const [loans, setLoans] = useLocalStorage('make_self_loans_v1', DEFAULT_LOANS);

  const [history, setHistory] = useLocalStorage('make_history_v1', []);
  
  // Isolate checked state for each round so Round 25 doesn't affect Round 10!
  const [checkedPocketsByRound, setCheckedPocketsByRound] = useLocalStorage('make_checked_by_round_v2', {
    round10: {},
    round25: {},
    special: {}
  });

  // Get current active income amount for the selected mode
  const currentIncomeAmount = incomeAmounts[currentMode] !== undefined
    ? incomeAmounts[currentMode]
    : (currentMode === 'special' ? 5000 : 6000);

  const handleSetIncomeAmount = (amount) => {
    const num = Math.max(0, Number(amount) || 0);
    setIncomeAmounts(prev => ({
      ...prev,
      [currentMode]: num
    }));
  };

  const handleUpdateDescription = (mode, text) => {
    setRoundDescriptions(prev => ({
      ...prev,
      [mode]: text
    }));
  };

  const handleResetDescription = (mode) => {
    setRoundDescriptions(prev => ({
      ...prev,
      [mode]: DEFAULT_ROUND_DESCRIPTIONS[mode]
    }));
  };

  // Compute live allocation
  const calculation = useMemo(() => {
    return calculateAllocation(currentIncomeAmount, currentMode, pockets);
  }, [currentIncomeAmount, currentMode, pockets]);

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      app: 'Money Planner',
      version: '1.5',
      exportDate: new Date().toISOString(),
      pockets,
      currentMode,
      incomeAmounts,
      roundDescriptions,
      loans,
      checkedPocketsByRound,
      history
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `make-pocket-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (data) => {
    if (data && data.pockets && Array.isArray(data.pockets)) {
      setPockets(data.pockets);
      if (data.history) setHistory(data.history);
      if (data.incomeAmounts) setIncomeAmounts(data.incomeAmounts);
      if (data.roundDescriptions) setRoundDescriptions(data.roundDescriptions);
      if (data.loans) setLoans(data.loans);
      if (data.checkedPocketsByRound) setCheckedPocketsByRound(data.checkedPocketsByRound);
      if (data.currentMode) setCurrentMode(data.currentMode);
      alert('นำเข้าข้อมูลสำเร็จเรียบร้อย!');
    } else {
      alert('รูปแบบไฟล์ข้อมูลสำรองไม่ถูกต้อง');
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (window.confirm('คุณต้องการรีเซ็ตกระเป๋าและกฎทั้งหมดกลับเป็นค่าเริ่มต้น 5 หมวดหมู่ (Squirrel, Rhino, Cat, Bee, Shark) หรือไม่?')) {
      setPockets(DEFAULT_POCKETS);
      setCheckedPocketsByRound({
        round10: {},
        round25: {},
        special: {}
      });
      setIncomeAmounts({
        round10: 6000,
        round25: 6000,
        special: 5000
      });
      setRoundDescriptions(DEFAULT_ROUND_DESCRIPTIONS);
    }
  };

  // Save to history log
  const handleSaveToHistory = (entryData) => {
    const newEntry = {
      id: 'hist_' + Date.now(),
      timestamp: Date.now(),
      ...entryData
    };
    setHistory(prev => [newEntry, ...prev]);
  };

  const activeLoanCount = loans.filter(l => !l.isCompleted).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* App Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExport={handleExportBackup}
        onImport={handleImportBackup}
        onResetDefaults={handleResetDefaults}
        activeLoanCount={activeLoanCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'calculator' && (
          <AllocationCalculator
            currentMode={currentMode}
            setCurrentMode={setCurrentMode}
            incomeAmount={currentIncomeAmount}
            setIncomeAmount={handleSetIncomeAmount}
            calculation={calculation}
            roundDescriptions={roundDescriptions}
            onUpdateDescription={handleUpdateDescription}
            onResetDescription={handleResetDescription}
            onGoToChecklist={() => setActiveTab('checklist')}
            onSaveToHistory={handleSaveToHistory}
          />
        )}

        {activeTab === 'checklist' && (
          <TransferChecklist
            calculation={calculation}
            currentMode={currentMode}
            setCurrentMode={setCurrentMode}
            incomeAmount={currentIncomeAmount}
            setIncomeAmount={handleSetIncomeAmount}
            checkedPocketsByRound={checkedPocketsByRound}
            setCheckedPocketsByRound={setCheckedPocketsByRound}
            onBackToCalculator={() => setActiveTab('calculator')}
            onSaveToHistory={handleSaveToHistory}
          />
        )}

        {activeTab === 'loans' && (
          <SelfLoanTracker
            loans={loans}
            setLoans={setLoans}
          />
        )}

        {activeTab === 'manager' && (
          <PocketManager
            pockets={pockets}
            setPockets={setPockets}
            incomeAmounts={incomeAmounts}
          />
        )}

        {activeTab === 'history' && (
          <HistoryLog
            history={history}
            setHistory={setHistory}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12 text-center text-xs text-slate-400">
        <p className="flex items-center justify-center gap-1 flex-wrap">
          <span>Money Planner (MAKE Cloud Pocket)</span>
          <span>•</span>
          <span>🐿️ Squirrel</span>
          <span>•</span>
          <span>🦏 Rhino</span>
          <span>•</span>
          <span>🐱 Cat</span>
          <span>•</span>
          <span>🐝 Bee</span>
          <span>•</span>
          <span>🦈 Shark</span>
        </p>
      </footer>

    </div>
  );
}
