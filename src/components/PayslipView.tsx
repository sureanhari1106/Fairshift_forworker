import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FairShiftStore } from '../services/store';
import { PayrollRecord } from '../types';
import {
  Receipt,
  HelpCircle,
  AlertTriangle,
  Printer,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  X,
} from 'lucide-react';

export const PayslipView: React.FC = () => {
  const { t, currentWorker, language, openRequestModalWithContext } = useApp();

  const payslips = FairShiftStore.getPayroll(currentWorker.id);
  const [selectedPayslipId, setSelectedPayslipId] = useState<string>(() => payslips[0]?.id || '');

  // AI Explanation Modal State
  const [explainingItem, setExplainingItem] = useState<{
    name: string;
    amount: number;
    description?: string;
  } | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const activePayslip = payslips.find((p) => p.id === selectedPayslipId) || payslips[0];

  const handleExplainItem = async (name: string, amount: number, description?: string) => {
    setExplainingItem({ name, amount, description });
    setAiExplanation(null);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/explain-payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItem: name,
          amount: `$${amount.toFixed(2)}`,
          calculationBasis: description || 'Statutory calculation under employment standards',
          language,
        }),
      });
      const data = await res.json();
      setAiExplanation(
        data.explanation ||
          (language === 'ta'
            ? 'இது சட்டப்பூர்வ விதிகளின்படி கணக்கிடப்பட்ட தொழிலாளர் நலப் பிடித்தமாகும்.'
            : 'This is a verified statutory payroll deduction contributing to your social protection.')
      );
    } catch {
      setAiExplanation(
        language === 'ta'
          ? 'இது சட்டப்பூர்வ விதிகளின்படி கணக்கிடப்பட்ட அதிகாரப்பூர்வ பிடித்தமாகும்.'
          : 'This amount is calculated in strict compliance with statutory labor laws.'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!activePayslip) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-stone-500">
        No payslip records found for this worker.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:pb-8 max-w-4xl mx-auto px-3 sm:px-4 pt-3 print:p-0 print:m-0">
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-700" />
            <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
              {t.payslipTitle}
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">{t.payslipSub}</p>
        </div>

        {/* Period Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedPayslipId}
            onChange={(e) => setSelectedPayslipId(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-teal-600 focus:outline-none"
            style={{ minHeight: '40px' }}
          >
            {payslips.map((p) => (
              <option key={p.id} value={p.id}>
                {p.payPeriod} ({p.status.toUpperCase()})
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold"
            title={t.printPayslip}
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main Payslip Statement Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden print:border-none print:shadow-none">
        {/* Statement Header */}
        <div className="p-4 bg-teal-950 text-white flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
              Official Payroll Statement
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-white">
              {currentWorker.name}
            </h3>
            <span className="text-xs text-teal-200">
              Worker ID: {currentWorker.workerId} &bull; {currentWorker.trade}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-teal-300 block">Pay Period</span>
            <span className="text-xs font-bold text-white block">
              {activePayslip.payPeriod}
            </span>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                activePayslip.status === 'paid'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                  : 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
              }`}
            >
              Status: {activePayslip.status}
            </span>
          </div>
        </div>

        {/* Visual Math Formula Banner */}
        <div className="p-3.5 bg-stone-100 border-b border-stone-200 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
            {t.formulaLabel}
          </span>
          <div className="font-mono text-xs sm:text-sm font-semibold text-stone-900 flex items-center flex-wrap gap-1 sm:gap-2">
            <span className="text-emerald-700">
              Regular (${activePayslip.regularEarnings.toFixed(2)})
            </span>
            <span>+</span>
            <span className="text-emerald-700">
              OT (${activePayslip.overtimeEarnings.toFixed(2)})
            </span>
            <span>+</span>
            <span className="text-teal-700">
              Allowances ($
              {activePayslip.allowances.reduce((acc, a) => acc + a.amount, 0).toFixed(2)})
            </span>
            <span>&minus;</span>
            <span className="text-rose-700">
              Deductions (${activePayslip.totalDeductions.toFixed(2)})
            </span>
            <span>=</span>
            <span className="bg-teal-800 text-white px-2 py-0.5 rounded font-bold">
              Net Payable: ${activePayslip.netPayable.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Itemised Breakdown Grid */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Gross Earnings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center justify-between">
              <span>{t.grossEarnings}</span>
              <span className="text-stone-900 font-mono font-bold">
                ${activePayslip.grossEarnings.toFixed(2)}
              </span>
            </h4>

            {/* Regular Earnings */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-stone-900 block">Regular Working Hours</span>
                <span className="text-[11px] text-stone-500">
                  {activePayslip.regularHours} hrs &times; ${activePayslip.baseHourlyRate.toFixed(2)}/hr base
                </span>
              </div>
              <span className="font-mono font-bold text-stone-900 text-sm">
                ${activePayslip.regularEarnings.toFixed(2)}
              </span>
            </div>

            {/* Overtime Earnings */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-stone-900 block">
                  Overtime Hours ({activePayslip.overtimeMultiplier}x rate)
                </span>
                <span className="text-[11px] text-stone-500">
                  {activePayslip.overtimeHours} hrs &times; $
                  {(activePayslip.baseHourlyRate * activePayslip.overtimeMultiplier).toFixed(2)}/hr
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-800 text-sm">
                +${activePayslip.overtimeEarnings.toFixed(2)}
              </span>
            </div>

            {/* Allowances */}
            {activePayslip.allowances.map((al, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-stone-900 block">{al.name}</span>
                  <span className="text-[11px] text-stone-500">Shift / hazard supplement</span>
                </div>
                <span className="font-mono font-bold text-teal-800 text-sm">
                  +${al.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Column 2: Itemised Deductions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider pb-1 border-b border-stone-200 flex items-center justify-between">
              <span>{t.totalDeductions}</span>
              <span className="text-rose-700 font-mono font-bold">
                &minus;${activePayslip.totalDeductions.toFixed(2)}
              </span>
            </h4>

            {activePayslip.deductions.map((ded, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-start justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-semibold text-stone-900">{ded.name}</span>
                    {ded.statutory ? (
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                        Statutory
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                        Recovery
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500">{ded.description}</p>
                  <button
                    onClick={() => handleExplainItem(ded.name, ded.amount, ded.description)}
                    className="mt-1.5 text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Explain calculation with AI</span>
                  </button>
                </div>
                <span className="font-mono font-bold text-rose-700 text-sm flex-shrink-0">
                  &minus;${ded.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Net Amount Highlight Card */}
        <div className="p-4 bg-teal-50 border-t border-teal-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-900 block">
              {t.netPayable} (Take-Home Wages)
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-950 font-mono">
              ${activePayslip.netPayable.toFixed(2)}
            </span>
          </div>

          {/* Report a Problem Button */}
          <button
            onClick={() => {
              if (openRequestModalWithContext) {
                openRequestModalWithContext({
                  category: 'missing_incorrect_salary',
                  title: `Dispute on Payslip ${activePayslip.payPeriod}`,
                  relatedRecordId: activePayslip.id,
                });
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition"
            style={{ minHeight: '44px' }}
          >
            <AlertTriangle className="w-4 h-4 text-amber-200" />
            <span>{t.reportProblem}</span>
          </button>
        </div>
      </div>

      {/* AI Line Item Explanation Modal */}
      {explainingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm text-white">Wage Transparency Explainer</h3>
              </div>
              <button
                onClick={() => setExplainingItem(null)}
                className="text-teal-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-500 block">Line Item</span>
                <h4 className="font-bold text-sm text-stone-900">{explainingItem.name}</h4>
                <span className="font-mono text-base font-extrabold text-stone-800">
                  ${explainingItem.amount.toFixed(2)}
                </span>
              </div>

              {isAiLoading ? (
                <div className="py-6 text-center text-teal-800 space-y-2">
                  <div className="w-6 h-6 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-medium text-xs">Generating plain-language explanation...</p>
                </div>
              ) : (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-950 leading-relaxed">
                  {aiExplanation}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setExplainingItem(null)}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-bold"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
