import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CATEGORIES, DEFAULT_POCKETS, ROUND_PRESETS } from '../data/defaultPockets';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  RotateCcw, 
  HelpCircle, 
  Sparkles,
  Sliders,
  Eye,
  EyeOff,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { formatMoney, calculateAllocation } from '../utils/allocationEngine';

export function PocketManager({ pockets, setPockets, folders = [], setFolders = () => {}, incomeAmounts = { round10: 6000, round25: 6000, special: 5000 } }) {
  const [editingPocket, setEditingPocket] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [openedFolderId, setOpenedFolderId] = useState(null);
  const editorRef = useRef(null);
  const editorOpen = isAddingNew || editingPocket !== null;
  useEffect(() => {
    if (!editorOpen) return;
    const previousOverflow = document.body.style.overflow;
    editorRef.current.showModal();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [editorOpen]);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    categoryId: 'squirrel',
    emoji: '💰',
    description: '',
    isActive: true,
    suballocations: [],
    rules: {
      round10: { mode: 'percent_remaining', value: 5 },
      round25: { mode: 'percent_remaining', value: 5 },
      special: { mode: 'percent_remaining', value: 5 }
    }
  });

  const base10 = incomeAmounts?.round10 || 6000;
  const base25 = incomeAmounts?.round25 || 6000;
  const baseSpecial = incomeAmounts?.special || 5000;

  // Calculate live preview allocations for all 3 modes
  const r10Alloc = useMemo(() => calculateAllocation(base10, 'round10', pockets, folders), [base10, pockets, folders]);
  const r25Alloc = useMemo(() => calculateAllocation(base25, 'round25', pockets, folders), [base25, pockets, folders]);
  const specAlloc = useMemo(() => calculateAllocation(baseSpecial, 'special', pockets, folders), [baseSpecial, pockets, folders]);

  // Helper to get estimated amount for an existing pocket in a mode
  const getEstimatedAmount = (pocketId, mode) => {
    let resultList = [];
    if (mode === 'round10') resultList = r10Alloc.pocketResults;
    else if (mode === 'round25') resultList = r25Alloc.pocketResults;
    else resultList = specAlloc.pocketResults;

    const match = resultList.find(p => p.id === pocketId);
    return match ? match.allocatedAmount : 0;
  };

  // Helper to get live breakdown & remaining stats for current formData being edited
  const getFormModeStats = (mode) => {
    const rootIncome = mode === 'round10' ? base10 : mode === 'round25' ? base25 : baseSpecial;
    const currentCalculation = mode === 'round10' ? r10Alloc : mode === 'round25' ? r25Alloc : specAlloc;
    const baseIncome = formData.folderId
      ? (currentCalculation.folderResults.find(folder => folder.id === formData.folderId)?.allocatedAmount || 0)
      : rootIncome;
    const tempPockets = formData.folderId
      ? [...pockets.filter(p => p.folderId === formData.folderId && p.id !== formData.id), formData]
      : [...pockets.filter(p => !p.folderId && p.id !== formData.id), ...folders, formData];

    let fixedSum = 0;
    let pctSum = 0;

    tempPockets.filter(p => p.isActive).forEach(p => {
      const rule = p.rules?.[mode] || { mode: 'percent_remaining', value: 0 };
      if (rule.mode === 'fixed') fixedSum += Number(rule.value) || 0;
      else pctSum += Number(rule.value) || 0;
    });

    const fixedUsed = Math.min(baseIncome, Math.max(0, fixedSum));
    const availForPct = Math.max(0, baseIncome - fixedUsed);
    const roundedPctSum = Math.round(pctSum * 10) / 10;
    const percentUsed = Math.round((availForPct * Math.max(0, roundedPctSum) / 100) * 100) / 100;
    const remainingBaht = Math.round((availForPct - percentUsed) * 100) / 100;
    const remainingPct = baseIncome > 0 ? Math.round((remainingBaht / baseIncome) * 1000) / 10 : 0;
    const fixedPct = baseIncome > 0 ? Math.round((fixedUsed / baseIncome) * 1000) / 10 : 0;
    const allocatedPct = Math.round((100 - remainingPct) * 10) / 10;

    // Estimate for current pocket
    const currentRule = formData.rules?.[mode] || { mode: 'percent_remaining', value: 0 };
    const currentPocketAmount = currentRule.mode === 'fixed'
      ? Number(currentRule.value) || 0
      : Math.round(((Number(currentRule.value) || 0) / 100) * availForPct);

    return {
      baseIncome,
      fixedSum,
      fixedUsed,
      fixedPct,
      availForPct,
      pctSum: allocatedPct,
      percentRuleSum: roundedPctSum,
      percentUsed,
      remainingPct,
      remainingBaht,
      allocatedPct,
      currentPocketAmount
    };
  };

  const handleStartAdd = () => {
    const newId = 'p_' + Date.now();
    setFormData({
      id: newId,
      name: '',
      categoryId: selectedCategoryFilter !== 'all' ? selectedCategoryFilter : 'squirrel',
      folderId: openedFolderId || '',
      emoji: '💰',
      description: '',
      isActive: true,
      suballocations: [],
      rules: {
        round10: { mode: 'percent_remaining', value: 5 },
        round25: { mode: 'percent_remaining', value: 5 },
        special: { mode: 'percent_remaining', value: 5 }
      }
    });
    setIsAddingNew(true);
    setEditingPocket(null);
  };

  const handleStartEdit = (pocket) => {
    setFormData(JSON.parse(JSON.stringify(pocket)));
    setEditingPocket(pocket.id);
    setIsAddingNew(false);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('กรุณากรอกชื่อ Cloud Pocket');
      return;
    }

    const parentFolder = folders.find(folder => folder.id === formData.folderId);
    const pocketToSave = parentFolder ? { ...formData, categoryId: parentFolder.categoryId } : formData;
    if (isAddingNew) {
      setPockets(prev => [...prev, pocketToSave]);
      setIsAddingNew(false);
    } else {
      setPockets(prev => prev.map(p => p.id === formData.id ? pocketToSave : p));
      setEditingPocket(null);
    }
  };

  const handleDelete = (pocketId) => {
    if (window.confirm('คุณต้องการลบ Cloud Pocket นี้ใช่หรือไม่?')) {
      setPockets(prev => prev.filter(p => p.id !== pocketId));
    }
  };

  const handleToggleActive = (pocketId) => {
    setPockets(prev => prev.map(p => {
      if (p.id === pocketId) {
        return { ...p, isActive: !p.isActive };
      }
      return p;
    }));
  };

  const handleResetToDefault = () => {
    if (window.confirm('ต้องการรีเซ็ตกระเป๋าทั้งหมดกลับเป็นค่าเริ่มต้นตามที่กำหนดไว้หรือไม่?')) {
      setPockets(DEFAULT_POCKETS);
      setFolders([]);
      setOpenedFolderId(null);
    }
  };

  const handleResetAllRulesToZero = () => {
    if (window.confirm('คุณต้องการรีเซ็ตสัดส่วน (%) และยอดเงิน (Fixed) ของทุกกระเป๋าให้เป็น 0 ทั้ง 3 โหมด (รอบ 10, รอบ 25, เงินพิเศษ) เพื่อเริ่มจัดสรรใหม่หรือไม่? (รายชื่อกระเป๋าเดิมจะยังคงอยู่ครบ)')) {
      setPockets(prev => prev.map(p => ({
        ...p,
        rules: {
          round10: { mode: 'percent_remaining', value: 0 },
          round25: { mode: 'percent_remaining', value: 0 },
          special: { mode: 'percent_remaining', value: 0 }
        }
      })));
      setFolders(prev => prev.map(folder => ({ ...folder, rules: Object.fromEntries(['round10', 'round25', 'special'].map(mode => [mode, { mode: 'percent_remaining', value: 0 }])) })));
    }
  };

  const handleResetSingleModeRulesToZero = (mode) => {
    const modeName = mode === 'round10' ? 'รอบ 10' : mode === 'round25' ? 'รอบ 25' : 'เงินพิเศษ';
    if (window.confirm(`คุณต้องการรีเซ็ตสัดส่วนและยอดเงินของทุกกระเป๋าใน "${modeName}" เป็น 0 หรือไม่?`)) {
      setPockets(prev => prev.map(p => ({
        ...p,
        rules: {
          ...p.rules,
          [mode]: { mode: 'percent_remaining', value: 0 }
        }
      })));
      setFolders(prev => prev.map(folder => ({ ...folder, rules: { ...folder.rules, [mode]: { mode: 'percent_remaining', value: 0 } } })));
    }
  };

  const filteredPockets = pockets.filter(p => openedFolderId
    ? p.folderId === openedFolderId
    : !p.folderId && (selectedCategoryFilter === 'all' || p.categoryId === selectedCategoryFilter));
  const filteredFolders = folders.filter(folder => !openedFolderId && (selectedCategoryFilter === 'all' || folder.categoryId === selectedCategoryFilter));
  const activeFolder = folders.find(folder => folder.id === openedFolderId);
  const addFolder = () => {
    const name = window.prompt('ตั้งชื่อ Folder เช่น 1Life');
    if (!name?.trim()) return;
    const categoryId = selectedCategoryFilter === 'all' ? 'squirrel' : selectedCategoryFilter;
    const blankRules = Object.fromEntries(['round10', 'round25', 'special'].map(mode => [mode, { mode: 'percent_remaining', value: 0 }]));
    setFolders(prev => [...prev, { id: `folder_${Date.now()}`, name: name.trim(), categoryId, emoji: '📁', isActive: true, rules: blankRules }]);
  };
  const updateFolder = (folderId, updater) => setFolders(prev => prev.map(folder => folder.id === folderId ? updater(folder) : folder));
  const deleteFolder = (folder) => {
    if (!window.confirm(`ลบ Folder “${folder.name}”? กระเป๋าภายในจะยังอยู่และกลับไปจัดสรรจากเงินเดือนโดยตรง`)) return;
    setFolders(prev => prev.filter(item => item.id !== folder.id));
    setPockets(prev => prev.map(pocket => pocket.folderId === folder.id ? { ...pocket, folderId: '' } : pocket));
    setOpenedFolderId(null);
  };
  const availablePocketsForFolder = activeFolder
    ? pockets.filter(pocket => !pocket.folderId && pocket.categoryId === activeFolder.categoryId)
    : [];
  const movePocketIntoFolder = (pocket) => {
    setPockets(prev => prev.map(item => item.id === pocket.id ? { ...item, folderId: activeFolder.id } : item));
  };

  // Render stats for each mode in form
  const r10FormStats = getFormModeStats('round10');
  const r25FormStats = getFormModeStats('round25');
  const specFormStats = getFormModeStats('special');
  const activeFolderAllocations = activeFolder
    ? [r10Alloc, r25Alloc, specAlloc].map(result => result.folderResults.find(folder => folder.id === activeFolder.id))
    : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>⚙️</span>
              <span>จัดการ Cloud Pockets & กฎการกระจายเงิน</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              กำหนดสัดส่วน %, ยอด Fix Cost และดูสัดส่วนคงเหลือ/ยอดเงินที่แบ่งได้แบบ Real-time
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleStartAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{activeFolder ? `เพิ่ม Cloud Pocket ใน ${activeFolder.name}` : 'เพิ่มกระเป๋าใหม่'}</span>
            </button>

            <button onClick={addFolder}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /><span>สร้าง Folder</span>
            </button>

            <button
              onClick={handleResetAllRulesToZero}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
              title="ล้างสัดส่วนและยอดเงินของทุกกระเป๋าเป็น 0 (เก็บรายชื่อไว้)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>เซ็ตทุกกระเป๋าเป็น 0</span>
            </button>

            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
              title="รีเซ็ตเป็นค่าเริ่มต้นโรงงาน"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
            </button>
          </div>
        </div>

        {/* Allocation Rules Check Matrix */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Round 10 */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            r10Alloc.summary.unallocatedAmount > 0 ? 'bg-blue-50/70 border-blue-200' : r10Alloc.summary.totalPercentConfigured > 100 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200/70'
          }`}>
            <div>
              <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>🗓️ รอบ 10 (ฐาน {formatMoney(base10)})</span>
                <span className={`font-bold px-1.5 py-0.5 rounded ${
                  r10Alloc.summary.totalPercentConfigured === 100 ? 'text-emerald-700 bg-emerald-100' : 'text-amber-800 bg-amber-100'
                }`}>
                  รวม {r10Alloc.summary.totalPercentConfigured}%
                </span>
              </div>
              <div className="flex justify-between text-slate-500 mt-1">
                <span>Fixed: <b>{formatMoney(r10Alloc.summary.totalFixed)}</b></span>
                <span>เหลือแบ่งได้: <b className="text-slate-700">{formatMoney(r10Alloc.summary.unallocatedAmount)}</b></span>
              </div>
            </div>
            
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">สัดส่วนรอบ 10</span>
              <button
                type="button"
                onClick={() => handleResetSingleModeRulesToZero('round10')}
                className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>รีเซ็ตเป็น 0%</span>
              </button>
            </div>
          </div>

          {/* Round 25 */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            r25Alloc.summary.unallocatedAmount > 0 ? 'bg-blue-50/70 border-blue-200' : r25Alloc.summary.totalPercentConfigured > 100 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200/70'
          }`}>
            <div>
              <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>📅 รอบ 25 (ฐาน {formatMoney(base25)})</span>
                <span className={`font-bold px-1.5 py-0.5 rounded ${
                  r25Alloc.summary.totalPercentConfigured === 100 ? 'text-emerald-700 bg-emerald-100' : 'text-amber-800 bg-amber-100'
                }`}>
                  รวม {r25Alloc.summary.totalPercentConfigured}%
                </span>
              </div>
              <div className="flex justify-between text-slate-500 mt-1">
                <span>Fixed: <b>{formatMoney(r25Alloc.summary.totalFixed)}</b></span>
                <span>เหลือแบ่งได้: <b className="text-slate-700">{formatMoney(r25Alloc.summary.unallocatedAmount)}</b></span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">สัดส่วนรอบ 25</span>
              <button
                type="button"
                onClick={() => handleResetSingleModeRulesToZero('round25')}
                className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>รีเซ็ตเป็น 0%</span>
              </button>
            </div>
          </div>

          {/* Special */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            specAlloc.summary.unallocatedAmount > 0 ? 'bg-blue-50/70 border-blue-200' : specAlloc.summary.totalPercentConfigured > 100 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200/70'
          }`}>
            <div>
              <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>✨ เงินพิเศษ (ฐาน {formatMoney(baseSpecial)})</span>
                <span className={`font-bold px-1.5 py-0.5 rounded ${
                  specAlloc.summary.totalPercentConfigured === 100 ? 'text-emerald-700 bg-emerald-100' : 'text-amber-800 bg-amber-100'
                }`}>
                  รวม {specAlloc.summary.totalPercentConfigured}%
                </span>
              </div>
              <div className="flex justify-between text-slate-500 mt-1">
                <span>Fixed: <b>{formatMoney(specAlloc.summary.totalFixed)}</b></span>
                <span>เหลือแบ่งได้: <b className="text-slate-700">{formatMoney(specAlloc.summary.unallocatedAmount)}</b></span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">สัดส่วนเงินพิเศษ</span>
              <button
                type="button"
                onClick={() => handleResetSingleModeRulesToZero('special')}
                className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>รีเซ็ตเป็น 0%</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategoryFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          ทั้งหมด ({pockets.length + folders.length})
        </button>

        {CATEGORIES.map(cat => {
          const count = pockets.filter(p => p.categoryId === cat.id).length + folders.filter(folder => folder.categoryId === cat.id).length;
          const isSelected = selectedCategoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                isSelected
                  ? `${cat.bgColor} ${cat.textColor} font-bold border ${cat.borderColor}`
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {activeFolder && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-3">
          <div className="min-w-0"><p className="text-xs text-indigo-500">อยู่ใน Folder · ยอดที่จัดสรรจากเงินเดือนต่อเดือน</p><p className="font-bold text-indigo-900">{activeFolder.emoji} {activeFolder.name} · {formatMoney((activeFolderAllocations[0]?.allocatedAmount || 0) + (activeFolderAllocations[1]?.allocatedAmount || 0))}</p><p className="mt-1 text-[11px] text-indigo-700">รอบ 10 {formatMoney(activeFolderAllocations[0]?.allocatedAmount || 0)} · รอบ 25 {formatMoney(activeFolderAllocations[1]?.allocatedAmount || 0)} · เงินพิเศษ {formatMoney(activeFolderAllocations[2]?.allocatedAmount || 0)}</p><p className="mt-1 rounded-lg bg-white/70 px-2 py-1 text-[11px] text-indigo-800">คงเหลือใน Folder: รอบ 10 ใช้ {formatMoney(activeFolderAllocations[0]?.childAllocated || 0)} / {formatMoney(activeFolderAllocations[0]?.allocatedAmount || 0)} · เหลือ {formatMoney(Math.max(0, (activeFolderAllocations[0]?.allocatedAmount || 0) - (activeFolderAllocations[0]?.childAllocated || 0)))} · รอบ 25 ใช้ {formatMoney(activeFolderAllocations[1]?.childAllocated || 0)} / {formatMoney(activeFolderAllocations[1]?.allocatedAmount || 0)} · เหลือ {formatMoney(Math.max(0, (activeFolderAllocations[1]?.allocatedAmount || 0) - (activeFolderAllocations[1]?.childAllocated || 0)))} · พิเศษเหลือ {formatMoney(Math.max(0, (activeFolderAllocations[2]?.allocatedAmount || 0) - (activeFolderAllocations[2]?.childAllocated || 0)))}</p></div>
          <button onClick={() => setOpenedFolderId(null)} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-indigo-700 border border-indigo-200">← กลับไปหน้า Folder</button>
        </div>
      )}

      {activeFolder && filteredPockets.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-white p-6 text-center">
          <div className="text-3xl">📂</div>
          <h3 className="mt-2 font-bold text-slate-800">Folder นี้ยังไม่มี Cloud Pocket</h3>
          <p className="mt-1 text-sm text-slate-500">เพิ่มรายการที่จะเห็นใน MAKE และ Checklist เช่น MAKE, TrueMoney หรือเงินสด</p>
          <button onClick={handleStartAdd} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> เพิ่ม Cloud Pocket ใน {activeFolder.name}
          </button>
        </div>
      )}

      {activeFolder && availablePocketsForFolder.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-slate-800">ย้าย Cloud Pocket ที่มีอยู่เข้า {activeFolder.name}</h3>
          <p className="mt-1 text-xs text-slate-500">ย้ายแล้วกฎเดิมของ Pocket จะใช้แบ่งจากยอด Folder นี้</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {availablePocketsForFolder.map(pocket => <button key={pocket.id} onClick={() => movePocketIntoFolder(pocket)} className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100">
              {pocket.emoji} {pocket.name} <span className="ml-1">+ เข้า Folder</span>
            </button>)}
          </div>
        </section>
      )}

      {!openedFolderId && filteredFolders.length > 0 && (
        <section className="space-y-3">
          <div><h3 className="font-bold text-slate-800">📁 Folders <span className="text-xs font-normal text-slate-500">รับเงินจัดสรรจากเงินเดือน แล้วแบ่งต่อให้ Cloud Pocket ด้านใน</span></h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFolders.map(folder => {
              const allocations = [r10Alloc, r25Alloc, specAlloc].map(result => result.folderResults.find(item => item.id === folder.id));
              const folderCategory = CATEGORIES.find(category => category.id === folder.categoryId);
              const folderPockets = pockets.filter(pocket => pocket.folderId === folder.id);
              return <article key={folder.id} className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm">
                <button onClick={() => setOpenedFolderId(folder.id)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-2"><span className="font-bold text-slate-800">{folder.emoji || '📁'} {folder.name}</span><span className="text-indigo-600 text-xs font-semibold">เปิด Folder →</span></div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500"><span>{folderCategory?.emoji} {folderCategory?.name}</span><span>รวมเงินเดือน {formatMoney((allocations[0]?.allocatedAmount || 0) + (allocations[1]?.allocatedAmount || 0))}</span></div>
                  <div className="mt-1 text-[11px] text-slate-500">รอบ 10 {formatMoney(allocations[0]?.allocatedAmount)} · รอบ 25 {formatMoney(allocations[1]?.allocatedAmount)} · เงินพิเศษ {formatMoney(allocations[2]?.allocatedAmount)}</div>
                  <div className="mt-2 rounded-lg bg-indigo-50 px-2.5 py-2 text-xs text-indigo-800">
                    {folderPockets.length === 0 ? 'ยังไม่มี Cloud Pocket ใน Folder นี้' : `Cloud Pocket ใน Folder (${folderPockets.length}): ${folderPockets.map(pocket => pocket.name).join(' · ')}`}
                  </div>
                  {allocations.some(item => item?.unallocatedAmount > 0) && <div className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">เงินคงเหลือใน Folder: {allocations.map((item, index) => `${['10','25','พิเศษ'][index]} ${formatMoney(item?.unallocatedAmount || 0)}`).join(' · ')}</div>}
                </button>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2" onClick={event => event.stopPropagation()}>
                  {['round10', 'round25', 'special'].map((mode, index) => {
                    const rule = folder.rules?.[mode] || { mode: 'percent_remaining', value: 0 };
                    const modeName = ['รอบ 10', 'รอบ 25', 'พิเศษ'][index];
                    return <div key={mode} className="rounded-xl bg-slate-50 border border-slate-100 p-2">
                      <label className="text-[10px] text-slate-500">{modeName} · ยอด {formatMoney(allocations[index]?.allocatedAmount || 0)}</label>
                      <div className="mt-1 flex gap-1">
                        <select aria-label={`${folder.name} ${modeName} รูปแบบ`} value={rule.mode} onChange={event => updateFolder(folder.id, current => ({ ...current, rules: { ...current.rules, [mode]: { ...rule, mode: event.target.value } } }))} className="w-16 rounded border border-slate-200 bg-white px-1 py-1 text-[10px]">
                          <option value="fixed">฿ คงที่</option><option value="percent_remaining">% เปอร์เซ็นต์</option>
                        </select>
                        <input aria-label={`${folder.name} ${modeName} จำนวน`} type="number" min="0" max={rule.mode === 'fixed' ? undefined : '100'} step={rule.mode === 'fixed' ? '1' : '0.1'} value={rule.mode === 'percent_remaining' && rule.value > 100 ? 100 : rule.value || ''} placeholder="0" onChange={event => updateFolder(folder.id, current => ({ ...current, rules: { ...current.rules, [mode]: { ...rule, value: event.target.value === '' ? 0 : Math.min(rule.mode === 'percent_remaining' ? 100 : Infinity, Number(event.target.value)) } } }))} className="min-w-0 w-full rounded border border-slate-200 px-2 py-1 text-xs" />
                      </div>
                    </div>;
                  })}
                </div>
                <div className="mt-2 flex justify-end gap-1">
                  <button onClick={() => { const name = window.prompt('แก้ไขชื่อ Folder', folder.name); if (name?.trim()) updateFolder(folder.id, current => ({ ...current, name: name.trim() })); }} className="rounded-lg px-2.5 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50">เปลี่ยนชื่อ</button>
                  <button onClick={() => deleteFolder(folder)} className="rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50">ลบ Folder</button>
                </div>
              </article>;
            })}
          </div>
        </section>
      )}

      {/* Add / Edit Pocket Modal / Form */}
      {(isAddingNew || editingPocket) && (
        <dialog ref={editorRef} aria-label="แก้ไข Cloud Pocket"
          onCancel={() => { setIsAddingNew(false); setEditingPocket(null); }}
          className="m-auto w-[calc(100%-1rem)] max-w-3xl max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl p-0 backdrop:bg-black/50">
        <form
          onSubmit={handleSaveForm}
          className="bg-white rounded-2xl border-2 border-amber-400 p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>{isAddingNew ? '✨ เพิ่ม Cloud Pocket ใหม่' : '✏️ แก้ไข Cloud Pocket'}</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingPocket(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            
            {/* Emoji picker */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">ไอคอน</label>
              <input
                type="text"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                className="w-full text-center py-2 text-2xl bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                maxLength={4}
              />
            </div>

            {/* Name */}
            <div className="sm:col-span-5">
              <label className="text-xs font-semibold text-slate-600 block mb-1">ชื่อ Cloud Pocket *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น ค่ากิน, กยศ., Next Gen"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category */}
            <div className="sm:col-span-5">
              <label className="text-xs font-semibold text-slate-600 block mb-1">หมวดหมู่หลัก (5 สัตว์)</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name} ({c.thName})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-12">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Folder (ถ้ามี) · กฎของ Pocket จะคิดจากยอดใน Folder</label>
              <select value={formData.folderId || ''} onChange={e => {
                const folder = folders.find(item => item.id === e.target.value);
                setFormData({ ...formData, folderId: e.target.value, ...(folder ? { categoryId: folder.categoryId } : {}) });
              }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500">
                <option value="">ไม่อยู่ใน Folder · จัดสรรจากเงินเดือนโดยตรง</option>
                {folders.map(folder => <option key={folder.id} value={folder.id}>{folder.emoji || '📁'} {folder.name}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="sm:col-span-12">
              <label className="text-xs font-semibold text-slate-600 block mb-1">คำอธิบายเพิ่มเติม / เป้าหมาย</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="เช่น ค่ากินรายปักษ์, ออมทอง, พอร์ตเทรด XM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Purpose breakdown inside this pocket */}
            {!formData.folderId && <div className="sm:col-span-12 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">รายการย่อยในกระเป๋านี้</h4>
                  <p className="text-[11px] text-slate-500">ระบุว่าเงินแต่ละรอบเตรียมไว้ทำอะไร เช่น ค่าบ้าน หรือ MSFT</p>
                </div>
                <button type="button" onClick={() => setFormData({
                  ...formData,
                  suballocations: [...(formData.suballocations || []), { id: `sub_${Date.now()}`, name: '', round10: 0, round25: 0, special: 0 }]
                })} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                  <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
                </button>
              </div>

              {(formData.suballocations || []).length > 0 && <>
                <div className="hidden sm:grid grid-cols-[minmax(120px,1fr)_repeat(3,minmax(72px,100px))_32px] gap-2 px-2 mb-1 text-[10px] font-semibold text-slate-500">
                  <span>รายการ / เป้าหมาย</span><span>รอบ 10</span><span>รอบ 25</span><span>เงินพิเศษ</span><span />
                </div>
                <div className="space-y-2">
                  {(formData.suballocations || []).map((item) => (
                    <div key={item.id} className="grid grid-cols-2 sm:grid-cols-[minmax(120px,1fr)_repeat(3,minmax(72px,100px))_32px] gap-2 items-center rounded-xl bg-slate-50 p-2 border border-slate-200">
                      <input type="text" value={item.name} placeholder="เช่น ค่าบ้าน / MSFT" aria-label="ชื่อรายการย่อย"
                        onChange={(e) => setFormData({ ...formData, suballocations: formData.suballocations.map(row => row.id === item.id ? { ...row, name: e.target.value } : row) })}
                        className="col-span-2 sm:col-span-1 min-w-0 px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500" />
                      {['round10', 'round25', 'special'].map((mode, index) => {
                        const title = ['10', '25', 'พิเศษ'][index];
                        return <label key={mode} className="min-w-0">
                          <span className="sm:hidden text-[10px] text-slate-500 block mb-0.5">รอบ{title}</span>
                          <input type="number" min="0" step="1" value={!item[mode] ? '' : item[mode]} placeholder="0" aria-label={`${item.name || 'รายการย่อย'} รอบ${title}`}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/^0+(?=\d)/, '');
                              setFormData({ ...formData, suballocations: formData.suballocations.map(row => row.id === item.id ? { ...row, [mode]: raw === '' ? 0 : Number(raw) } : row) });
                            }}
                            className="w-full min-w-0 px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono-numeric focus:outline-none focus:border-amber-500" />
                        </label>;
                      })}
                      <button type="button" aria-label={`ลบรายการ ${item.name || 'ย่อย'}`} onClick={() => setFormData({ ...formData, suballocations: formData.suballocations.filter(row => row.id !== item.id) })}
                        className="col-span-2 sm:col-span-1 justify-self-end sm:justify-self-center p-2 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    ['round10', 'รอบวันที่ 10', r10FormStats.currentPocketAmount],
                    ['round25', 'รอบวันที่ 25', r25FormStats.currentPocketAmount],
                    ['special', 'เงินพิเศษ', specFormStats.currentPocketAmount]
                  ].map(([mode, label, pocketAmount]) => {
                    const subTotal = (formData.suballocations || []).reduce((sum, item) => sum + (Number(item[mode]) || 0), 0);
                    const difference = Math.round((subTotal - pocketAmount) * 100) / 100;
                    const matches = Math.abs(difference) < 0.01;
                    return <div key={mode} className={`rounded-lg border p-2 text-[10px] ${matches ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                      <span className="block font-semibold">{label}: {formatMoney(subTotal)} / {formatMoney(pocketAmount)}</span>
                      <span>{matches ? '✓ ยอดย่อยตรงกับกระเป๋า' : difference > 0 ? `เกิน ${formatMoney(difference)}` : `ยังไม่ได้แจกแจง ${formatMoney(Math.abs(difference))}`}</span>
                    </div>;
                  })}
                </div>
              </>}
            </div>}

          </div>

          {/* Allocation Rules for 3 modes with Live Remaining % & Remaining Baht */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ตั้งค่าสูตรการกระจายเงิน (3 โหมด)
              </h4>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  rules: {
                    round10: { mode: 'percent_remaining', value: 0 },
                    round25: { mode: 'percent_remaining', value: 0 },
                    special: { mode: 'percent_remaining', value: 0 }
                  }
                })}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 transition-colors"
                title="ล้างสัดส่วนและยอดเงินของกระเป๋านี้เป็น 0 ทั้ง 3 โหมด"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างทั้ง 3 รอบเป็น 0</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* --- ROUND 10 --- */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      🗓️ รอบวันที่ 10
                    </span>
                    <span className="text-xs font-bold font-mono-numeric text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      ≈ {formatMoney(r10FormStats.currentPocketAmount)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <select
                      value={formData.rules.round10.mode}
                      onChange={(e) => setFormData({
                        ...formData,
                        rules: {
                          ...formData.rules,
                          round10: { ...formData.rules.round10, mode: e.target.value }
                        }
                      })}
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="percent_remaining">% ของเงินที่เหลือ</option>
                      <option value="fixed">Fixed ยอดคงที่ (บาท)</option>
                    </select>

                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.rules.round10.value === 0 ? '' : formData.rules.round10.value}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/^0+(?=\d)/, '');
                          setFormData({
                            ...formData,
                            rules: {
                              ...formData.rules,
                              round10: { ...formData.rules.round10, value: raw === '' ? 0 : Number(raw) }
                            }
                          });
                        }}
                        className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-bold font-mono-numeric focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                        {formData.rules.round10.mode === 'fixed' ? '฿' : '%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remaining % and Baht Badge */}
                <div className={`text-[11px] p-2 rounded-lg border leading-tight ${
                  r10FormStats.remainingPct === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : r10FormStats.remainingPct > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-semibold flex items-center justify-between">
                    <span>สัดส่วนรวม: {r10FormStats.pctSum}%</span>
                    <span>{r10FormStats.remainingPct === 0 ? '✅ ครบ 100%' : r10FormStats.remainingPct > 0 ? `เหลืออีก ${r10FormStats.remainingPct}%` : `เกินมา ${Math.abs(r10FormStats.remainingPct)}%`}</span>
                  </div>
                  <div className="text-[10px] mt-1 space-y-0.5 opacity-90">
                    <div>Fixed {formatMoney(r10FormStats.fixedUsed)} ({r10FormStats.fixedPct}%) · เปอร์เซ็นต์ตั้งไว้ {r10FormStats.percentRuleSum}% = {formatMoney(r10FormStats.percentUsed)}</div>
                    {r10FormStats.remainingPct > 0
                      ? `ยังเหลือแบ่งได้อีก ≈ ${formatMoney(r10FormStats.remainingBaht)}`
                      : r10FormStats.remainingPct < 0
                      ? `ยอดเงินเกินงบ ≈ ${formatMoney(Math.abs(r10FormStats.remainingBaht))}`
                      : 'ยอดจัดสรรลงตัวพอดี 100%'}
                  </div>
                </div>
              </div>

              {/* --- ROUND 25 --- */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      📅 รอบวันที่ 25
                    </span>
                    <span className="text-xs font-bold font-mono-numeric text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      ≈ {formatMoney(r25FormStats.currentPocketAmount)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <select
                      value={formData.rules.round25.mode}
                      onChange={(e) => setFormData({
                        ...formData,
                        rules: {
                          ...formData.rules,
                          round25: { ...formData.rules.round25, mode: e.target.value }
                        }
                      })}
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="percent_remaining">% ของเงินที่เหลือ</option>
                      <option value="fixed">Fixed ยอดคงที่ (บาท)</option>
                    </select>

                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.rules.round25.value === 0 ? '' : formData.rules.round25.value}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/^0+(?=\d)/, '');
                          setFormData({
                            ...formData,
                            rules: {
                              ...formData.rules,
                              round25: { ...formData.rules.round25, value: raw === '' ? 0 : Number(raw) }
                            }
                          });
                        }}
                        className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-bold font-mono-numeric focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                        {formData.rules.round25.mode === 'fixed' ? '฿' : '%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remaining % and Baht Badge */}
                <div className={`text-[11px] p-2 rounded-lg border leading-tight ${
                  r25FormStats.remainingPct === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : r25FormStats.remainingPct > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-semibold flex items-center justify-between">
                    <span>สัดส่วนรวม: {r25FormStats.pctSum}%</span>
                    <span>{r25FormStats.remainingPct === 0 ? '✅ ครบ 100%' : r25FormStats.remainingPct > 0 ? `เหลืออีก ${r25FormStats.remainingPct}%` : `เกินมา ${Math.abs(r25FormStats.remainingPct)}%`}</span>
                  </div>
                  <div className="text-[10px] mt-1 space-y-0.5 opacity-90">
                    <div>Fixed {formatMoney(r25FormStats.fixedUsed)} ({r25FormStats.fixedPct}%) · เปอร์เซ็นต์ตั้งไว้ {r25FormStats.percentRuleSum}% = {formatMoney(r25FormStats.percentUsed)}</div>
                    {r25FormStats.remainingPct > 0
                      ? `ยังเหลือแบ่งได้อีก ≈ ${formatMoney(r25FormStats.remainingBaht)}`
                      : r25FormStats.remainingPct < 0
                      ? `ยอดเงินเกินงบ ≈ ${formatMoney(Math.abs(r25FormStats.remainingBaht))}`
                      : 'ยอดจัดสรรลงตัวพอดี 100%'}
                  </div>
                </div>
              </div>

              {/* --- SPECIAL --- */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      ✨ เงินพิเศษ
                    </span>
                    <span className="text-xs font-bold font-mono-numeric text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      ≈ {formatMoney(specFormStats.currentPocketAmount)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <select
                      value={formData.rules.special.mode}
                      onChange={(e) => setFormData({
                        ...formData,
                        rules: {
                          ...formData.rules,
                          special: { ...formData.rules.special, mode: e.target.value }
                        }
                      })}
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="percent_remaining">% ของเงินที่เหลือ</option>
                      <option value="fixed">Fixed ยอดคงที่ (บาท)</option>
                    </select>

                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.rules.special.value === 0 ? '' : formData.rules.special.value}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/^0+(?=\d)/, '');
                          setFormData({
                            ...formData,
                            rules: {
                              ...formData.rules,
                              special: { ...formData.rules.special, value: raw === '' ? 0 : Number(raw) }
                            }
                          });
                        }}
                        className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-bold font-mono-numeric focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                        {formData.rules.special.mode === 'fixed' ? '฿' : '%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remaining % and Baht Badge */}
                <div className={`text-[11px] p-2 rounded-lg border leading-tight ${
                  specFormStats.remainingPct === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : specFormStats.remainingPct > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-semibold flex items-center justify-between">
                    <span>สัดส่วนรวม: {specFormStats.pctSum}%</span>
                    <span>{specFormStats.remainingPct === 0 ? '✅ ครบ 100%' : specFormStats.remainingPct > 0 ? `เหลืออีก ${specFormStats.remainingPct}%` : `เกินมา ${Math.abs(specFormStats.remainingPct)}%`}</span>
                  </div>
                  <div className="text-[10px] mt-1 space-y-0.5 opacity-90">
                    <div>Fixed {formatMoney(specFormStats.fixedUsed)} ({specFormStats.fixedPct}%) · เปอร์เซ็นต์ตั้งไว้ {specFormStats.percentRuleSum}% = {formatMoney(specFormStats.percentUsed)}</div>
                    {specFormStats.remainingPct > 0
                      ? `ยังเหลือแบ่งได้อีก ≈ ${formatMoney(specFormStats.remainingBaht)}`
                      : specFormStats.remainingPct < 0
                      ? `ยอดเงินเกินงบ ≈ ${formatMoney(Math.abs(specFormStats.remainingBaht))}`
                      : 'ยอดจัดสรรลงตัวพอดี 100%'}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingPocket(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20"
            >
              บันทึกกระเป๋า
            </button>
          </div>
        </form>
        </dialog>
      )}

      {/* Pocket List Table/Card Grid with Baht Amount Pill */}
      <div className="space-y-3">
        {activeFolder && filteredPockets.length > 0 && <h3 className="font-bold text-slate-800">Cloud Pockets ใน {activeFolder.name} <span className="text-xs font-normal text-slate-500">กฎจะคำนวณจากยอด Folder</span></h3>}
        {filteredPockets.map((pocket) => {
          const category = CATEGORIES.find(c => c.id === pocket.categoryId);
          const r10Amt = getEstimatedAmount(pocket.id, 'round10');
          const r25Amt = getEstimatedAmount(pocket.id, 'round25');
          const specAmt = getEstimatedAmount(pocket.id, 'special');

          return (
            <div
              key={pocket.id}
              className={`bg-white rounded-2xl border p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                !pocket.isActive ? 'opacity-50 bg-slate-50/80 border-slate-200' : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <span className="text-2xl flex-shrink-0">{pocket.emoji || '📁'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm sm:text-base">
                      {pocket.name}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${category?.badgeBg} ${category?.textColor}`}>
                      {category?.emoji} {category?.name}
                    </span>
                    {!pocket.isActive && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
                        ปิดใช้งาน
                      </span>
                    )}
                  </div>
                  {pocket.description && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {pocket.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Middle Rules Display with BOTH % and Estimated Baht Amount */}
              <div className="flex items-center gap-2 text-xs text-slate-600 overflow-x-auto py-1">
                {/* Round 10 */}
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/70 whitespace-nowrap">
                  <span className="text-slate-400 mr-1 text-[11px]">รอบ 10:</span>
                  <span className="font-bold font-mono-numeric text-slate-800">
                    {pocket.rules?.round10?.mode === 'fixed' ? `฿${pocket.rules.round10.value}` : `${pocket.rules?.round10?.value || 0}%`}
                  </span>
                  <span className="text-amber-700 font-bold font-mono-numeric ml-1.5 text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                    ≈ {formatMoney(r10Amt)}
                  </span>
                </div>

                {/* Round 25 */}
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/70 whitespace-nowrap">
                  <span className="text-slate-400 mr-1 text-[11px]">รอบ 25:</span>
                  <span className="font-bold font-mono-numeric text-slate-800">
                    {pocket.rules?.round25?.mode === 'fixed' ? `฿${pocket.rules.round25.value}` : `${pocket.rules?.round25?.value || 0}%`}
                  </span>
                  <span className="text-amber-700 font-bold font-mono-numeric ml-1.5 text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                    ≈ {formatMoney(r25Amt)}
                  </span>
                </div>

                {/* Special */}
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/70 whitespace-nowrap">
                  <span className="text-slate-400 mr-1 text-[11px]">เงินพิเศษ:</span>
                  <span className="font-bold font-mono-numeric text-slate-800">
                    {pocket.rules?.special?.mode === 'fixed' ? `฿${pocket.rules.special.value}` : `${pocket.rules?.special?.value || 0}%`}
                  </span>
                  <span className="text-amber-700 font-bold font-mono-numeric ml-1.5 text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                    ≈ {formatMoney(specAmt)}
                  </span>
                </div>
              </div>

              {/* Right Action buttons */}
              <div className="flex items-center justify-end gap-1 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => handleToggleActive(pocket.id)}
                  title={pocket.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                  className={`p-2 rounded-lg text-xs transition-colors ${
                    pocket.isActive ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  {pocket.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleStartEdit(pocket)}
                  className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="แก้ไขกระเป๋า"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(pocket.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="ลบกระเป๋า"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
