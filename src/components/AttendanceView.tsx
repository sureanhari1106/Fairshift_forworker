import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FairShiftStore } from '../services/store';
import { AttendanceRecord } from '../types';
import {
  QrCode,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  History,
  FileEdit,
  Scan,
  Camera,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { t, currentWorker, sector, openRequestModalWithContext } = useApp();

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(() =>
    FairShiftStore.getAttendance(currentWorker.id)
  );

  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Today's record
  const todayIso = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceLogs.find((a) => a.date === todayIso);
  const isClockedIn = todayRecord && !todayRecord.clockOutTime;

  const handleSimulateScan = (type: 'clock_in' | 'clock_out') => {
    setIsScanning(true);
    setScanMessage(null);

    setTimeout(async () => {
      setIsScanning(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (type === 'clock_in') {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}`,
          workerId: currentWorker.id,
          workerName: currentWorker.name,
          sector,
          worksiteName: currentWorker.site,
          date: todayIso,
          clockInTime: timeStr,
          totalHours: 0,
          overtimeHours: 0,
          status: 'in_progress',
        };
        await FairShiftStore.addAttendanceToFirestore(newRecord);
        setScanMessage(`Clock-in confirmed by Cloud Firestore at ${timeStr} for ${currentWorker.site}`);
      } else {
        // Clock out
        const all = FairShiftStore.getAttendance();
        const updated = all.map((a) => {
          if (a.workerId === currentWorker.id && a.date === todayIso && !a.clockOutTime) {
            return {
              ...a,
              clockOutTime: timeStr,
              totalHours: 8.5,
              overtimeHours: 0.5,
              status: 'completed' as const,
            };
          }
          return a;
        });
        localStorage.setItem('fairshift_attendance', JSON.stringify(updated));
        setScanMessage(`Clock-out verified at ${timeStr}. 8.5 hours recorded.`);
      }

      setAttendanceLogs(FairShiftStore.getAttendance(currentWorker.id));
    }, 1200);
  };

  return (
    <div className="space-y-4 pb-24 sm:pb-8 max-w-4xl mx-auto px-3 sm:px-4 pt-3">
      {/* Title */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-700" />
            <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
              Worksite Attendance &amp; QR Terminal
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Server-timestamped check-in with physical site geofence verification.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
          Terminal ID: TRM-SITE-04
        </span>
      </div>

      {scanMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{scanMessage}</span>
        </div>
      )}

      {/* Live Scanner Terminal Simulator */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 rounded-2xl p-6 text-white shadow-lg border border-teal-800 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>{currentWorker.site}</span>
        </div>

        {/* QR Animation Frame */}
        <div className="relative w-48 h-48 mx-auto bg-slate-800/80 rounded-2xl border-2 border-dashed border-teal-500/60 flex items-center justify-center overflow-hidden shadow-inner">
          {isScanning ? (
            <div className="flex flex-col items-center justify-center text-teal-300 space-y-2">
              <Scan className="w-12 h-12 animate-pulse text-teal-400" />
              <span className="text-xs font-mono">Verifying QR Token...</span>
              <div className="w-24 h-1 bg-teal-400/40 rounded-full overflow-hidden">
                <div className="w-full h-full bg-teal-400 animate-progress" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-teal-300/80 space-y-2 p-4">
              <QrCode className="w-20 h-20 text-teal-400/90" />
              <span className="text-[10px] text-teal-200 uppercase font-mono tracking-wider">
                Hold phone to site terminal
              </span>
            </div>
          )}

          {/* Scanner corner markers */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-teal-400" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-teal-400" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-teal-400" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-teal-400" />
        </div>

        <p className="text-xs text-teal-200/80 max-w-sm mx-auto">
          Simulated dynamic QR attendance terminal for evaluation. Validates physical presence and shift assignments.
        </p>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {!isClockedIn ? (
            <button
              onClick={() => handleSimulateScan('clock_in')}
              disabled={isScanning}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2"
              style={{ minHeight: '44px' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simulate Clock-In Scan</span>
            </button>
          ) : (
            <button
              onClick={() => handleSimulateScan('clock_out')}
              disabled={isScanning}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2"
              style={{ minHeight: '44px' }}
            >
              <Clock className="w-4 h-4" />
              <span>Simulate Clock-Out Scan</span>
            </button>
          )}
        </div>
      </div>

      {/* Missed Punch? Correction Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-center justify-between flex-wrap gap-2 shadow-xs">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-amber-900">
              Did you miss a punch-in or punch-out?
            </h4>
            <p className="text-xs text-amber-800">
              Submit an attendance dispute directly to your supervisor without penalty.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (openRequestModalWithContext) {
              openRequestModalWithContext({
                category: 'missed_clock_in_out',
                title: 'Missed terminal punch correction request',
                relatedRecordId: `ATT-${todayIso}`,
              });
            }
          }}
          className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          style={{ minHeight: '40px' }}
        >
          <FileEdit className="w-4 h-4" />
          <span>Request Punch Correction</span>
        </button>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <h3 className="font-bold text-xs text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4 text-stone-500" />
            <span>Attendance History &amp; Working Hours</span>
          </h3>
          <span className="text-xs text-stone-500">
            {attendanceLogs.length} shifts recorded
          </span>
        </div>

        <div className="space-y-2.5">
          {attendanceLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-stone-900">{log.date}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : log.status === 'disputed'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-200 text-stone-800'
                    }`}
                  >
                    {log.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-stone-600 text-[11px] flex items-center gap-3">
                  <span>In: <strong>{log.clockInTime}</strong></span>
                  <span>Out: <strong>{log.clockOutTime || 'Ongoing'}</strong></span>
                  <span>&bull;</span>
                  <span>{log.worksiteName}</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-mono font-bold text-sm text-stone-900 block">
                  {log.totalHours.toFixed(1)} hrs
                </span>
                {log.overtimeHours > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700">
                    +{log.overtimeHours}h OT
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
