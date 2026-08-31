import React, { useRef } from 'react';
import { Calculator, CheckSquare, Settings, History, Download, Upload, RotateCcw, Sparkles, Coins } from 'lucide-react';

export function Header({ activeTab, setActiveTab, onExport, onImport, onResetDefaults, activeLoanCount = 0 }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          onImport(data);
        } catch (err) {
          alert('ไฟล์สำรองไม่ถูกต้อง (JSON Invalid)');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <img
              src="./icon-192.png"
              alt="Money Planner"
              className="w-10 h-10 rounded-2xl object-cover shadow-md shadow-emerald-900/20 flex-shrink-0 border border-slate-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  Money Planner
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Cloud Pocket
                </span>
              </div>
              <p className="text-xs text-slate-500">
                ระบบคำนวณและกระจายเงินเดือน (รอบ 10 / 25) & เงินพิเศษ
              </p>
            </div>
          </div>

          {/* Action Tools (Backup, Restore, Reset) */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
            <button
              onClick={onExport}
              title="สำรองข้อมูลเป็นไฟล์ JSON"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="กู้คืนข้อมูลจากไฟล์ JSON"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restore</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={onResetDefaults}
              title="รีเซ็ตค่าเริ่มต้น (กระเป๋า 5 หมวดหมู่)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ต</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium text-xs sm:text-sm rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'border-amber-500 text-amber-600 bg-amber-50/50 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>คำนวณ & วางแผน</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium text-xs sm:text-sm rounded-t-xl border-b-2 transition-all whitespace-nowrap relative ${
              activeTab === 'checklist'
                ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>ผู้ช่วยโอนเงิน MAKE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab('loans')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium text-xs sm:text-sm rounded-t-xl border-b-2 transition-all whitespace-nowrap relative ${
              activeTab === 'loans'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>ยืมเงินตัวเอง & คืน</span>
            {activeLoanCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {activeLoanCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('manager')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium text-xs sm:text-sm rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'manager'
                ? 'border-amber-500 text-amber-600 bg-amber-50/50 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>จัดการกระเป๋า & กฎ</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium text-xs sm:text-sm rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 bg-blue-50/50 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติการจัดสรร</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
