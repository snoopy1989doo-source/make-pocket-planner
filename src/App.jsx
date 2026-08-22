import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DEFAULT_POCKETS, CATEGORIES } from './data/defaultPockets';
import { calculateAllocation } from './utils/allocationEngine';
import { Header } from './components/Header';
import { AllocationCalculator } from './components/AllocationCalculator';
import { TransferChecklist } from './components/TransferChecklist';
import { PocketManager } from './components/PocketManager';
import { HistoryLog } from './components/HistoryLog';

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [pockets, setPockets] = useLocalStorage('make_pockets_v2', DEFAULT_POCKETS);
  const [currentMode, setCurrentMode] = useLocalStorage('make_current_mode', 'round10');
  const [incomeAmount, setIncomeAmount] = useLocalStorage('make_income_amount', 6000);
  const [history, setHistory] = useLocalStorage('make_history_v1', []);
  const [checkedPockets, setCheckedPockets] = useLocalStorage('make_checked_pockets', {});

  // Auto-migration check: If old single "p_zero1" with name "Zero 1-5" is present, update to separate Zero 1 - 5
  useEffect(() => {
    const hasOldZero = pockets.some(p => p.id === 'p_zero1' && p.name.includes('1-5'));
    if (hasOldZero) {
      setPockets(DEFAULT_POCKETS);
    }
  }, [pockets, setPockets]);

  // Compute live allocation
  const calculation = useMemo(() => {
    return calculateAllocation(incomeAmount, currentMode, pockets);
  }, [incomeAmount, currentMode, pockets]);

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      app: 'MAKE Pocket Planner',
      version: '1.1',
      exportDate: new Date().toISOString(),
      pockets,
      currentMode,
      incomeAmount,
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
      if (data.incomeAmount) setIncomeAmount(data.incomeAmount);
      if (data.currentMode) setCurrentMode(data.currentMode);
      alert('นำเข้าข้อมูลสำเร็จเรียบร้อย!');
    } else {
      alert('รูปแบบไฟล์ข้อมูลสำรองไม่ถูกต้อง');
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (window.confirm('คุณต้องการรีเซ็ตกระเป๋าและกฎทั้งหมดกลับเป็นค่าเริ่มต้น 5 หมวดหมู่ (Squirrel, Rhino, Cat, Bee [Zero 1-5], Shark) หรือไม่?')) {
      setPockets(DEFAULT_POCKETS);
      setCheckedPockets({});
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* App Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExport={handleExportBackup}
        onImport={handleImportBackup}
        onResetDefaults={handleResetDefaults}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'calculator' && (
          <AllocationCalculator
            currentMode={currentMode}
            setCurrentMode={setCurrentMode}
            incomeAmount={incomeAmount}
            setIncomeAmount={setIncomeAmount}
            calculation={calculation}
            onGoToChecklist={() => setActiveTab('checklist')}
            onSaveToHistory={handleSaveToHistory}
          />
        )}

        {activeTab === 'checklist' && (
          <TransferChecklist
            calculation={calculation}
            currentMode={currentMode}
            setCurrentMode={setCurrentMode}
            incomeAmount={incomeAmount}
            setIncomeAmount={setIncomeAmount}
            checkedPockets={checkedPockets}
            setCheckedPockets={setCheckedPockets}
            onBackToCalculator={() => setActiveTab('calculator')}
          />
        )}

        {activeTab === 'manager' && (
          <PocketManager
            pockets={pockets}
            setPockets={setPockets}
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
          <span>MAKE Cloud Pocket Salary & Income Planner</span>
          <span>•</span>
          <span>🐿️ Squirrel</span>
          <span>•</span>
          <span>🦏 Rhino</span>
          <span>•</span>
          <span>🐱 Cat</span>
          <span>•</span>
          <span>🐝 Bee (Zero 1-5)</span>
          <span>•</span>
          <span>🦈 Shark</span>
        </p>
      </footer>

    </div>
  );
}
