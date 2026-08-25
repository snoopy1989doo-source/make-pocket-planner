import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  RotateCcw, 
  CreditCard, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  TrendingDown,
  ArrowRight,
  Clock,
  DollarSign
} from 'lucide-react';
import { formatMoney } from '../utils/allocationEngine';

export function SelfLoanTracker({ loans, setLoans }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active'); // 'active' | 'completed' | 'all'
  const [quickPayModal, setQuickPayModal] = useState(null); // loan object
  const [customPayAmount, setCustomPayAmount] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    sourceName: 'Kept by krungsri',
    totalAmount: 1500,
    paidAmount: 0,
    repayMode: 'installment', // 'installment' | 'lump_sum'
    amountPerRound: 500,
    repaySchedule: 'all', // 'all' (ทุกรอบ 10 และ 25) | 'round10' (เฉพาะรอบ 10) | 'round25' (เฉพาะรอบ 25)
    note: ''
  });

  // Calculate payoff forecast (คำนวณว่าจะหมดรอบไหน)
  const calculatePayoffForecast = (loan) => {
    const remaining = Math.max(0, (Number(loan.totalAmount) || 0) - (Number(loan.paidAmount) || 0));
    if (remaining === 0) return { roundsLeft: 0, forecastText: 'คืนครบเรียบร้อยแล้ว 🎉' };

    const perRound = loan.repayMode === 'lump_sum' ? remaining : (Number(loan.amountPerRound) || remaining);
    if (perRound <= 0) return { roundsLeft: 0, forecastText: 'ยังไม่ได้ระบุยอดผ่อนต่องวด' };

    const roundsLeft = Math.ceil(remaining / perRound);

    // Calculate dates starting from today
    const now = new Date();
    let currentDay = now.getDate();
    let currentMonth = now.getMonth(); // 0-11
    let currentYear = now.getFullYear();

    let targetRounds = roundsLeft;
    let finalDay = 10;
    let finalMonth = currentMonth;
    let finalYear = currentYear;

    // Simulate upcoming rounds
    let nextRoundIs10 = currentDay < 10;
    let nextRoundIs25 = currentDay >= 10 && currentDay < 25;

    let roundCounter = 0;
    let tempMonth = currentMonth;
    let tempYear = currentYear;
    let currentStepIs10 = nextRoundIs10;

    if (!nextRoundIs10 && !nextRoundIs25) {
      // after 25th -> next is 10th next month
      tempMonth++;
      if (tempMonth > 11) {
        tempMonth = 0;
        tempYear++;
      }
      currentStepIs10 = true;
    } else if (nextRoundIs25) {
      currentStepIs10 = false;
    }

    while (roundCounter < targetRounds && roundCounter < 120) {
      if (loan.repaySchedule === 'all') {
        finalDay = currentStepIs10 ? 10 : 25;
        finalMonth = tempMonth;
        finalYear = tempYear;
        roundCounter++;

        if (currentStepIs10) {
          currentStepIs10 = false;
        } else {
          currentStepIs10 = true;
          tempMonth++;
          if (tempMonth > 11) {
            tempMonth = 0;
            tempYear++;
          }
        }
      } else if (loan.repaySchedule === 'round10') {
        finalDay = 10;
        finalMonth = tempMonth;
        finalYear = tempYear;
        roundCounter++;
        tempMonth++;
        if (tempMonth > 11) {
          tempMonth = 0;
          tempYear++;
        }
      } else if (loan.repaySchedule === 'round25') {
        finalDay = 25;
        finalMonth = tempMonth;
        finalYear = tempYear;
        roundCounter++;
        tempMonth++;
        if (tempMonth > 11) {
          tempMonth = 0;
          tempYear++;
        }
      }
    }

    const monthNames = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const thaiYear = (finalYear + 543).toString().slice(-2);
    const forecastText = `จะหมดในรอบวันที่ ${finalDay} ${monthNames[finalMonth]} ${thaiYear} (อีก ${roundsLeft} งวด)`;

    return {
      roundsLeft,
      forecastText
    };
  };

  const handleStartAdd = () => {
    setFormData({
      id: 'loan_' + Date.now(),
      title: 'คืน Kept',
      sourceName: 'Kept by krungsri',
      totalAmount: 1000,
      paidAmount: 0,
      repayMode: 'installment',
      amountPerRound: 500,
      repaySchedule: 'all',
      note: ''
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleStartEdit = (loan) => {
    setFormData(JSON.parse(JSON.stringify(loan)));
    setEditingId(loan.id);
    setIsAdding(false);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('กรุณาระบุชื่อรายการที่ยืม');
      return;
    }

    const total = Math.max(0, Number(formData.totalAmount) || 0);
    const paid = Math.max(0, Number(formData.paidAmount) || 0);
    const isCompleted = paid >= total && total > 0;

    const payload = {
      ...formData,
      totalAmount: total,
      paidAmount: paid,
      amountPerRound: Math.max(0, Number(formData.amountPerRound) || 0),
      isCompleted
    };

    if (isAdding) {
      setLoans(prev => [payload, ...prev]);
      setIsAdding(false);
    } else {
      setLoans(prev => prev.map(item => item.id === formData.id ? payload : item));
      setEditingId(null);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('คุณต้องการลบรายการยืมเงินนี้ใช่หรือไม่?')) {
      setLoans(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleQuickPayOneRound = (loan) => {
    const perRound = loan.repayMode === 'lump_sum' 
      ? (loan.totalAmount - loan.paidAmount) 
      : (loan.amountPerRound || loan.totalAmount);

    const newPaid = Math.min(loan.totalAmount, (loan.paidAmount || 0) + perRound);
    const isCompleted = newPaid >= loan.totalAmount;

    setLoans(prev => prev.map(item => {
      if (item.id === loan.id) {
        return {
          ...item,
          paidAmount: newPaid,
          isCompleted
        };
      }
      return item;
    }));
  };

  const handleApplyCustomPay = () => {
    if (!quickPayModal) return;
    const payAmt = Math.max(0, Number(customPayAmount) || 0);
    if (payAmt <= 0) {
      alert('กรุณากรอกยอดเงินที่ถูกต้อง');
      return;
    }

    const newPaid = Math.min(quickPayModal.totalAmount, (quickPayModal.paidAmount || 0) + payAmt);
    const isCompleted = newPaid >= quickPayModal.totalAmount;

    setLoans(prev => prev.map(item => {
      if (item.id === quickPayModal.id) {
        return {
          ...item,
          paidAmount: newPaid,
          isCompleted
        };
      }
      return item;
    }));

    setQuickPayModal(null);
    setCustomPayAmount('');
  };

  // Summary Metrics
  const activeLoans = loans.filter(l => !l.isCompleted);
  const completedLoans = loans.filter(l => l.isCompleted);

  const totalBorrowed = loans.reduce((sum, l) => sum + (Number(l.totalAmount) || 0), 0);
  const totalPaid = loans.reduce((sum, l) => sum + (Number(l.paidAmount) || 0), 0);
  const totalRemaining = Math.max(0, totalBorrowed - totalPaid);

  const filteredLoans = loans.filter(l => {
    if (filterStatus === 'active') return !l.isCompleted;
    if (filterStatus === 'completed') return l.isCompleted;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Banner & Summary */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 rounded-3xl text-white p-5 sm:p-7 shadow-lg shadow-indigo-900/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/40 text-indigo-200 text-xs font-semibold border border-indigo-400/30">
                Self-Loan & Repayment Tracker
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              💸 ระบบยืมเงินตัวเอง & ผ่อนคืน
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-0.5">
              บันทึกการดึงเงินสำรอง เช่น คืน Kept, เงินเย็น, หรือพอร์ตออม พร้อมคำนวณงวดหมดรอบให้อัตโนมัติ
            </p>
          </div>

          <button
            onClick={handleStartAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>เพิ่มรายการยืมเงิน</span>
          </button>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
            <span className="text-[11px] text-indigo-200 block">ยอดที่ยืมรวมทั้งหมด</span>
            <span className="text-lg sm:text-xl font-bold font-mono-numeric">
              {formatMoney(totalBorrowed)}
            </span>
            <span className="text-[10px] text-indigo-300 block mt-0.5">
              รวม {loans.length} รายการ
            </span>
          </div>

          <div className="bg-emerald-500/20 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-400/30">
            <span className="text-[11px] text-emerald-200 block">ชำระคืนตัวเองแล้ว</span>
            <span className="text-lg sm:text-xl font-bold font-mono-numeric text-emerald-300">
              {formatMoney(totalPaid)}
            </span>
            <span className="text-[10px] text-emerald-200 block mt-0.5">
              {completedLoans.length} รายการคืนครบแล้ว
            </span>
          </div>

          <div className="bg-amber-500/20 backdrop-blur-md p-3.5 rounded-2xl border border-amber-400/30">
            <span className="text-[11px] text-amber-200 block">คงเหลือที่ต้องคืน</span>
            <span className="text-lg sm:text-xl font-bold font-mono-numeric text-amber-300">
              {formatMoney(totalRemaining)}
            </span>
            <span className="text-[10px] text-amber-200 block mt-0.5">
              {activeLoans.length} รายการกำลังผ่อนคืน
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterStatus === 'active'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            กำลังผ่อนคืน ({activeLoans.length})
          </button>

          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterStatus === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            คืนครบแล้ว ({completedLoans.length})
          </button>

          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({loans.length})
          </button>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {(isAdding || editingId) && (
        <form
          onSubmit={handleSaveForm}
          className="bg-white rounded-3xl border-2 border-indigo-500 p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>{isAdding ? '✨ บันทึกการยืมเงินตัวเองใหม่' : '✏️ แก้ไขรายการยืมเงิน'}</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                ชื่อรายการที่ยืม * (เช่น คืน Kept, ยืมซ่อมรถ)
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="เช่น คืน Kept 500"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Source Name */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                ยืมมาจากบัญชี/กระเป๋าไหน
              </label>
              <input
                type="text"
                value={formData.sourceName}
                onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                placeholder="เช่น Kept, Cool Money, Ruby"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Total Borrowed */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                ยอดเงินที่ยืมทั้งหมด (บาท) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono-numeric focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Paid Amount */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                ชำระคืนไปแล้ว (บาท)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono-numeric focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Repay Mode */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                รูปแบบการคืนเงิน
              </label>
              <select
                value={formData.repayMode}
                onChange={(e) => setFormData({ ...formData, repayMode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="installment">ผ่อนจ่ายเป็นงวดๆ</option>
                <option value="lump_sum">คืนก้อนเดียวทั้งหมด</option>
              </select>
            </div>

            {/* Repay Schedule */}
            {formData.repayMode === 'installment' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    ผ่อนคืนงวดละ (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.amountPerRound}
                    onChange={(e) => setFormData({ ...formData, amountPerRound: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono-numeric focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    รอบที่ต้องการหักเงินคืน
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, repaySchedule: 'all' })}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        formData.repaySchedule === 'all'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ทุกรอบ (10 และ 25)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, repaySchedule: 'round10' })}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        formData.repaySchedule === 'round10'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      เฉพาะรอบวันที่ 10
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, repaySchedule: 'round25' })}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        formData.repaySchedule === 'round25'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      เฉพาะรอบวันที่ 25
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Note */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                บันทึกช่วยจำ (Note)
              </label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="เช่น ยืมมาจ่ายค่าซ่อมมือถือด่วน"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              บันทึกรายการ
            </button>
          </div>
        </form>
      )}

      {/* Loan Items List */}
      <div className="space-y-3">
        {filteredLoans.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mx-auto mb-3">
              💸
            </div>
            <h4 className="font-bold text-slate-800 text-base mb-1">
              ไม่มีรายการยืมเงินในตัวกรองนี้
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              คุณสามารถกดปุ่ม "เพิ่มรายการยืมเงิน" ด้านบน เพื่อวางแผนผ่อนคืนเงินตัวเองได้เลย
            </p>
          </div>
        ) : (
          filteredLoans.map((loan) => {
            const remaining = Math.max(0, (loan.totalAmount || 0) - (loan.paidAmount || 0));
            const progress = loan.totalAmount > 0 ? Math.min(100, Math.round(((loan.paidAmount || 0) / loan.totalAmount) * 100)) : 0;
            const forecast = calculatePayoffForecast(loan);

            return (
              <div
                key={loan.id}
                className={`bg-white rounded-3xl border p-4 sm:p-5 shadow-xs transition-all ${
                  loan.isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
                      loan.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {loan.isCompleted ? '✅' : '💸'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {loan.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                          ยืมจาก: {loan.sourceName || 'บัญชีสำรอง'}
                        </span>
                        {loan.isCompleted && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            คืนครบแล้ว 🎉
                          </span>
                        )}
                      </div>
                      {loan.note && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {loan.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block">ยอดคงเหลือที่ต้องคืน</span>
                      <span className={`text-base sm:text-lg font-bold font-mono-numeric ${
                        loan.isCompleted ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {formatMoney(remaining)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        (ยืม {formatMoney(loan.totalAmount)} • คืนแล้ว {formatMoney(loan.paidAmount)})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(loan)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>ความคืบหน้าการคืนเงิน</span>
                    <span className="font-bold font-mono-numeric">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        loan.isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Row: Forecast & Quick Pay Actions */}
                <div className="mt-3 pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/80 px-2.5 py-1.5 rounded-xl border border-indigo-100">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600" />
                    <span><b>กำหนดเสร็จ:</b> {forecast.forecastText}</span>
                  </div>

                  {!loan.isCompleted && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleQuickPayOneRound(loan)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>จ่ายคืน 1 งวด ({formatMoney(loan.repayMode === 'lump_sum' ? remaining : loan.amountPerRound)})</span>
                      </button>

                      <button
                        onClick={() => {
                          setQuickPayModal(loan);
                          setCustomPayAmount(remaining.toString());
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
                      >
                        ระบุยอดคืนเอง
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Custom Pay Modal */}
      {quickPayModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                💰 ระบุยอดชำระคืนสำหรับ "{quickPayModal.title}"
              </h3>
              <button
                onClick={() => setQuickPayModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs text-slate-500 block mb-1">
                ยอดคงเหลือทั้งหมด: <b>{formatMoney(quickPayModal.totalAmount - quickPayModal.paidAmount)}</b>
              </span>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">฿</span>
                <input
                  type="number"
                  min="1"
                  max={quickPayModal.totalAmount - quickPayModal.paidAmount}
                  value={customPayAmount}
                  onChange={(e) => setCustomPayAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border-2 border-indigo-200 rounded-xl text-lg font-bold font-mono-numeric focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setQuickPayModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleApplyCustomPay}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
              >
                ยืนยันการจ่ายคืน
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
