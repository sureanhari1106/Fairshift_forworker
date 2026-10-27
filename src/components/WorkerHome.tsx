import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FairShiftStore } from '../services/store';
import {
  Clock,
  Mic,
  FileEdit,
  AlertTriangle,
  Receipt,
  PhoneCall,
  ChevronRight,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Sparkles,
  MessageSquareOff,
  QrCode,
  HardHat,
  Factory,
} from 'lucide-react';

interface WorkerHomeProps {
  onNavigate: (tab: string) => void;
  onOpenSpeakRequest: () => void;
}

export const WorkerHome: React.FC<WorkerHomeProps> = ({ onNavigate, onOpenSpeakRequest }) => {
  const { t, currentWorker, sector } = useApp();

  const [shiftState, setShiftState] = useState<'clocked_in' | 'clocked_out' | 'on_break'>('clocked_in');

  const requests = FairShiftStore.getRequests().filter((r) => r.workerId === currentWorker.id);
  const pendingRequests = requests.filter(
    (r) => r.status === 'under_review' || r.status === 'more_info_requested' || r.status === 'submitted'
  );
  const latestApprovedRequest = requests.find((r) => r.status === 'approved');

  const payslips = FairShiftStore.getPayroll(currentWorker.id);
  const latestPayslip = payslips[0];

  const safetyReports = FairShiftStore.getSafetyReports().filter(
    (s) => s.reporterId === currentWorker.id || s.sector === sector
  );

  return (
    <div className="space-y-4 pb-20 sm:pb-8 max-w-4xl mx-auto px-3 sm:px-4 pt-3">
      {/* Sector & Worksite Active Context Bar */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 rounded-2xl p-4 text-white shadow-lg border border-teal-800/80">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600/40 border border-teal-400/40 flex items-center justify-center text-amber-300">
              {sector === 'construction' ? <HardHat className="w-5 h-5" /> : <Factory className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                {sector === 'construction' ? t.sectorConstruction : t.sectorFactory}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xs">
                {currentWorker.site}
              </h2>
            </div>
          </div>

          {/* Shift Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                shiftState === 'clocked_in'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-stone-500/20 text-stone-300 border border-stone-500/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{shiftState === 'clocked_in' ? t.clockedIn : t.clockedOut}</span>
            </span>
          </div>
        </div>

        {/* Working Hours Bar & Shift Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-teal-800/60 text-xs">
          <div>
            <span className="text-teal-300/80 block text-[11px]">{t.todayHours}</span>
            <span className="font-bold text-base text-white">6h 15m</span>
            <span className="text-[10px] text-teal-400 ml-1">(Started 07:30 AM)</span>
          </div>
          <div>
            <span className="text-teal-300/80 block text-[11px]">{t.weekHours}</span>
            <span className="font-bold text-base text-white">38.5 hrs</span>
            <span className="text-[10px] text-teal-400 ml-1">/ 44h cap</span>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
            <button
              onClick={() => onNavigate('attendance')}
              className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-semibold flex items-center justify-center gap-1.5 transition text-xs shadow-sm"
            >
              <QrCode className="w-4 h-4" />
              <span>{t.actionClock}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fatigue & Overwork Advisory Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-700" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
              {t.safetyAlerts}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-semibold">
              Rule 10H-Max
            </span>
          </div>
          <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
            {t.fatigueWarning}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => onNavigate('safety')}
              className="text-xs font-semibold text-amber-900 underline hover:text-amber-800"
            >
              Log Fatigue or Request Relief &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Action Needed: More Info Requested by Manager */}
      {pendingRequests.some((r) => r.status === 'more_info_requested') && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs animate-in fade-in">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-800 flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-rose-700" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              Manager Action Required
            </span>
            <p className="text-xs text-rose-900 mt-0.5">
              The administrator has requested additional details on your dispute:
              <strong className="block text-rose-950 font-semibold mt-0.5">
                "{pendingRequests.find((r) => r.status === 'more_info_requested')?.title}"
              </strong>
            </p>
            <button
              onClick={() => onNavigate('requests')}
              className="mt-2 px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold"
            >
              Respond to Manager &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Primary Voice-First & Quick Action Buttons */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2.5 px-1">
          {t.quickActions}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Big Speak Request button */}
          <button
            onClick={onOpenSpeakRequest}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-800 to-teal-950 text-white shadow-md hover:shadow-lg hover:from-teal-700 hover:to-teal-900 transition flex flex-col items-center justify-center text-center group border border-teal-700/60"
            style={{ minHeight: '90px' }}
          >
            <div className="w-11 h-11 rounded-full bg-teal-500/30 flex items-center justify-center text-teal-200 mb-2 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6 text-teal-200" />
            </div>
            <span className="text-xs font-bold leading-tight">{t.actionVoice}</span>
            <span className="text-[10px] text-teal-300 mt-0.5">Hold &amp; Speak (தமிழ் / EN)</span>
          </button>

          {/* Fix a Record */}
          <button
            onClick={() => onNavigate('requests')}
            className="p-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 shadow-xs hover:shadow-md transition flex flex-col items-center justify-center text-center group"
            style={{ minHeight: '90px' }}
          >
            <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center text-teal-800 mb-2 group-hover:scale-110 transition-transform">
              <FileEdit className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-stone-900 leading-tight">{t.actionRequest}</span>
            <span className="text-[10px] text-stone-500 mt-0.5">Punch, OT or Wage Dispute</span>
          </button>

          {/* Safety & Hazard Report */}
          <button
            onClick={() => onNavigate('safety')}
            className="p-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 shadow-xs hover:shadow-md transition flex flex-col items-center justify-center text-center group"
            style={{ minHeight: '90px' }}
          >
            <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 mb-2 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-stone-900 leading-tight">{t.actionSafety}</span>
            <span className="text-[10px] text-stone-500 mt-0.5">Scaffold, Gear &amp; Machine</span>
          </button>

          {/* Confidential Anonymous Voice/Text */}
          <button
            onClick={() => onNavigate('anonymous')}
            className="p-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 shadow-xs hover:shadow-md transition flex flex-col items-center justify-center text-center group"
            style={{ minHeight: '90px' }}
          >
            <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 mb-2 group-hover:scale-110 transition-transform">
              <MessageSquareOff className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-stone-900 leading-tight">{t.actionAnonymous}</span>
            <span className="text-[10px] text-stone-500 mt-0.5">100% ID-Free Feedback</span>
          </button>

          {/* Payslip & Salary Transparency */}
          <button
            onClick={() => onNavigate('payslip')}
            className="p-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 shadow-xs hover:shadow-md transition flex flex-col items-center justify-center text-center group"
            style={{ minHeight: '90px' }}
          >
            <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 mb-2 group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-stone-900 leading-tight">{t.navPayslip}</span>
            <span className="text-[10px] text-stone-500 mt-0.5">Itemized Deductions</span>
          </button>

          {/* Emergency SOS Hotlines */}
          <button
            onClick={() => onNavigate('emergency')}
            className="p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-xs hover:shadow-md transition flex flex-col items-center justify-center text-center group"
            style={{ minHeight: '90px' }}
          >
            <div className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-rose-900 leading-tight">{t.actionEmergency}</span>
            <span className="text-[10px] text-rose-700 mt-0.5">First Aider &amp; Trauma 108</span>
          </button>
        </div>
      </div>

      {/* Latest Payslip Quick Overview Card */}
      {latestPayslip && (
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-teal-700" />
              <h3 className="font-bold text-sm text-stone-900">{t.latestPayslip}</h3>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">
              {latestPayslip.payPeriod}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs text-stone-500 block">{t.netPayable}</span>
              <span className="text-xl font-extrabold text-stone-900 font-mono">
                ${latestPayslip.netPayable.toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium block">
                &bull; Base ($16/hr) + OT (8.5h @ 1.5x)
              </span>
            </div>
            <button
              onClick={() => onNavigate('payslip')}
              className="px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
            >
              <span>Inspect Breakdown</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Outstanding Requests Card */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-sm text-stone-900">{t.outstandingRequests}</h3>
          </div>
          <button
            onClick={() => onNavigate('requests')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-0.5"
          >
            <span>View All ({requests.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-6 text-stone-500 text-xs">
            No active disputes. All attendance and salary records are up to date.
          </div>
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 2).map((req) => (
              <div
                key={req.id}
                onClick={() => onNavigate('requests')}
                className="p-3 rounded-xl border border-stone-200 hover:border-teal-400 bg-stone-50/50 hover:bg-stone-50 transition cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-bold text-stone-500">
                      {req.refNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'more_info_requested'
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : req.status === 'under_review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 truncate">{req.title}</h4>
                  <p className="text-[11px] text-stone-500 line-clamp-1">{req.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SDG 8 Transparency & Demo Badge */}
      <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span className="text-[11px]">
            Supporting <strong>UN Sustainable Development Goal 8</strong>: Decent Work, Wage Transparency &amp; Worker Safety.
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-teal-200/80 text-teal-900 font-mono text-[10px] font-bold flex-shrink-0">
          DEMO DATA
        </span>
      </div>
    </div>
  );
};
