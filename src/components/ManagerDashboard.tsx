import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FairShiftStore } from '../services/store';
import {
  WorkerRequestItem,
  SafetyReportItem,
  AnonymousFeedbackItem,
  RequestStatus,
  TimelineEntry,
} from '../types';
import {
  Briefcase,
  Users,
  Clock,
  FileText,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  Eye,
  Send,
  MessageSquareOff,
  Sparkles,
  Volume2,
  HardHat,
  Factory,
  ChevronRight,
  ChevronDown,
  Lock,
  Calendar,
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { t, sector, setSector, language } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'safety' | 'anonymous' | 'settings'>('requests');

  // Request Inbox State
  const [requests, setRequests] = useState<WorkerRequestItem[]>(() => FairShiftStore.getRequests());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [inspectingRequest, setInspectingRequest] = useState<WorkerRequestItem | null>(null);

  // Manager Action Form State
  const [staffNote, setStaffNote] = useState('');
  const [workerResponse, setWorkerResponse] = useState('');
  const [resolutionReason, setResolutionReason] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  // Safety Inbox State
  const [safetyReports, setSafetyReports] = useState<SafetyReportItem[]>(() =>
    FairShiftStore.getSafetyReports()
  );

  // Anonymous Feedback State
  const [anonymousItems, setAnonymousItems] = useState<AnonymousFeedbackItem[]>(() =>
    FairShiftStore.getAnonymousFeedback()
  );

  const refreshAll = () => {
    setRequests(FairShiftStore.getRequests());
    setSafetyReports(FairShiftStore.getSafetyReports());
    setAnonymousItems(FairShiftStore.getAnonymousFeedback());
  };

  // KPIs
  const totalOpenRequests = requests.filter((r) => r.status === 'submitted' || r.status === 'under_review').length;
  const wageDisputeCount = requests.filter((r) => r.category.includes('salary') || r.category.includes('overtime')).length;
  const pendingSafetyCount = safetyReports.filter((s) => s.status === 'reported' || s.status === 'investigating').length;
  const fatigueAlertsCount = safetyReports.filter((s) => s.reportType === 'fatigue').length;

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.refNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSector = r.sector === sector;
    return matchesSearch && matchesCategory && matchesStatus && matchesSector;
  });

  // Action: Manager updates status (Approve, Reject, Request More Info)
  const handleManagerDecision = async (status: RequestStatus) => {
    if (!inspectingRequest) return;
    if (status === 'approved' && !resolutionReason.trim()) {
      alert('Please provide an official audit reason for approving this correction.');
      return;
    }
    if (status === 'rejected' && !resolutionReason.trim()) {
      alert('Please provide an official audit reason for rejecting this request.');
      return;
    }

    const nowIso = new Date().toISOString();
    const newTimelineEntry: TimelineEntry = {
      timestamp: nowIso,
      actor: 'Manager Senthil (Administrator)',
      action:
        status === 'approved'
          ? 'Request approved. Payroll/Attendance adjustment authorized in Cloud Firestore.'
          : status === 'rejected'
          ? 'Request rejected with official justification.'
          : 'Additional information requested from worker.',
      notes: workerResponse || resolutionReason,
    };

    try {
      await FairShiftStore.updateRequestInFirestore(
        inspectingRequest.id,
        {
          status,
          updatedAt: nowIso,
          adminNotes: workerResponse || resolutionReason,
          internalStaffNotes: staffNote ? staffNote : inspectingRequest.internalStaffNotes,
          resolutionReason: resolutionReason ? resolutionReason : inspectingRequest.resolutionReason,
        },
        newTimelineEntry
      );

      const refreshed = FairShiftStore.getRequests().find((r) => r.id === inspectingRequest.id) || null;
      setInspectingRequest(refreshed);
      refreshAll();
      setStaffNote('');
      setWorkerResponse('');
      setResolutionReason('');
      alert(`Request ${inspectingRequest.refNumber} successfully updated to ${status.toUpperCase()} in Firestore.`);
    } catch (err: any) {
      console.error('Decision update error:', err);
      alert('Failed to update request in Firestore: ' + (err?.message || 'Check permissions'));
    }
  };

  // AI Translate Request Description for Manager
  const handleTranslateDescription = async (text: string) => {
    setIsTranslating(true);
    setTranslatedText(null);
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage: 'en',
        }),
      });
      const data = await res.json();
      setTranslatedText(data.translatedText || text);
    } catch {
      setTranslatedText('Translation unavailable.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 sm:pb-8 max-w-6xl mx-auto px-3 sm:px-6 pt-3">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-extrabold text-white">
                {t.managerDashboardTitle}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">
                Admin Audit Level
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Review worker claims, authorize attendance &amp; wage corrections, and triage site hazards.
            </p>
          </div>
        </div>

        {/* Sector Switcher for Manager */}
        <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
          <button
            onClick={() => setSector('construction')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              sector === 'construction'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Construction</span>
          </button>
          <button
            onClick={() => setSector('manufacturing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              sector === 'manufacturing'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Factory</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500 block">Active On-Site</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-stone-900">48</span>
            <span className="text-xs text-emerald-700 font-semibold">100% Muster</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500 block">Pending Requests</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-amber-700">{totalOpenRequests}</span>
            <span className="text-xs text-stone-500">Requires Review</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500 block">Wage / OT Disputes</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-rose-700">{wageDisputeCount}</span>
            <span className="text-xs text-rose-600 font-semibold">High Priority</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-stone-500 block">Fatigue Alerts</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-amber-800">{fatigueAlertsCount}</span>
            <span className="text-xs text-amber-700 font-semibold">&gt;10h Shifts</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-stone-200 shadow-xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'requests'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          style={{ minHeight: '40px' }}
        >
          <FileText className="w-4 h-4" />
          <span>Request Inbox ({filteredRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('safety')}
          className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'safety'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          style={{ minHeight: '40px' }}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Safety &amp; Hazards ({safetyReports.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('anonymous')}
          className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'anonymous'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          style={{ minHeight: '40px' }}
        >
          <MessageSquareOff className="w-4 h-4" />
          <span>Anonymous Themes ({anonymousItems.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: REQUEST INBOX */}
      {activeSubTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in">
          {/* Requests List Column */}
          <div className="lg:col-span-5 space-y-3">
            {/* Search & Filters */}
            <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-xs space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search worker name, title, or REQ-..."
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="more_info_requested">More Info Requested</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setInspectingRequest(req)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer text-xs ${
                    inspectingRequest?.id === req.id
                      ? 'border-teal-700 bg-teal-50/50 shadow-sm'
                      : 'border-stone-200 bg-white hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[10px] text-teal-900 bg-teal-100/80 px-1.5 py-0.2 rounded">
                      {req.refNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'more_info_requested'
                          ? 'bg-rose-100 text-rose-800'
                          : req.status === 'under_review'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 truncate">{req.title}</h4>
                  <div className="text-[11px] text-stone-500 flex items-center justify-between mt-1">
                    <span className="font-semibold text-stone-800">{req.workerName}</span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspecting Request Detail & Decision Panel */}
          <div className="lg:col-span-7">
            {inspectingRequest ? (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-md p-4 space-y-4 text-xs">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-stone-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded">
                        {inspectingRequest.refNumber}
                      </span>
                      <span className="text-stone-500 text-[11px]">
                        Submitted {new Date(inspectingRequest.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-stone-900 mt-1">
                      {inspectingRequest.title}
                    </h3>
                    <span className="text-stone-600 font-semibold block mt-0.5">
                      Worker: {inspectingRequest.workerName} &bull; Sector: {inspectingRequest.sector}
                    </span>
                  </div>
                </div>

                {/* Original Description & Audio */}
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[10px] text-stone-500">
                      Worker Statement (Original Language: {inspectingRequest.originalLanguage.toUpperCase()})
                    </span>
                    <button
                      onClick={() => handleTranslateDescription(inspectingRequest.description)}
                      disabled={isTranslating}
                      className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isTranslating ? 'Translating...' : 'Translate to English'}</span>
                    </button>
                  </div>
                  <p className="text-stone-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {inspectingRequest.description}
                  </p>

                  {translatedText && (
                    <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-950 mt-2">
                      <strong className="block text-[10px] uppercase text-teal-800">
                        AI Verified Translation:
                      </strong>
                      <p className="mt-0.5 text-xs">{translatedText}</p>
                    </div>
                  )}

                  {inspectingRequest.voiceNoteAudioBase64 && (
                    <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
                      <audio
                        controls
                        src={`data:audio/webm;base64,${inspectingRequest.voiceNoteAudioBase64}`}
                        className="h-8 w-full max-w-xs"
                      />
                    </div>
                  )}
                </div>

                {/* AI Assistant Summary Box */}
                {inspectingRequest.aiAnalysis && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1 text-indigo-950">
                    <div className="flex items-center gap-1 font-bold text-indigo-900">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>AI Advisory Checklist</span>
                    </div>
                    <p className="text-xs">{inspectingRequest.aiAnalysis.summary}</p>
                    {inspectingRequest.aiAnalysis.missingDetails.length > 0 && (
                      <span className="text-[11px] text-indigo-800 block">
                        Missing verification items: {inspectingRequest.aiAnalysis.missingDetails.join(', ')}
                      </span>
                    )}
                  </div>
                )}

                {/* Worker Response (if provided) */}
                {inspectingRequest.workerResponse && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
                    <strong className="block text-[10px] uppercase text-blue-800 font-bold">
                      Worker Follow-Up Information Received:
                    </strong>
                    <p className="text-xs mt-0.5">{inspectingRequest.workerResponse}</p>
                  </div>
                )}

                {/* Decision Actions Area */}
                <div className="p-4 rounded-xl bg-stone-100 border border-stone-300 space-y-3">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                    Authorised Administrator Action &amp; Audit Trail
                  </h4>

                  {/* Internal Staff Note */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      {t.internalNoteLabel}
                    </label>
                    <input
                      type="text"
                      value={staffNote}
                      onChange={(e) => setStaffNote(e.target.value)}
                      placeholder="e.g. Checked turnstile CCTV camera 4, supervisor Murugan concurred."
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>

                  {/* Worker Visible Reply */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      {t.workerVisibleReply}
                    </label>
                    <input
                      type="text"
                      value={workerResponse}
                      onChange={(e) => setWorkerResponse(e.target.value)}
                      placeholder="e.g. Your punch-out has been adjusted to 18:30 in payroll run #4."
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>

                  {/* Audit Reason */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      {t.resolutionReasonLabel} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={resolutionReason}
                      onChange={(e) => setResolutionReason(e.target.value)}
                      placeholder="Mandatory compliance justification recorded in audit log..."
                      className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs"
                    />
                  </div>

                  {/* Decision Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 flex-wrap">
                    <button
                      onClick={() => handleManagerDecision('more_info_requested')}
                      className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-4 h-4 text-stone-600" />
                      <span>{t.requestInfoBtn}</span>
                    </button>

                    <button
                      onClick={() => handleManagerDecision('rejected')}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{t.rejectBtn}</span>
                    </button>

                    <button
                      onClick={() => handleManagerDecision('approved')}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.approveBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Audit Timeline */}
                <div>
                  <span className="font-bold uppercase text-[10px] text-stone-500 block mb-2">
                    Request Event Log
                  </span>
                  <div className="space-y-2">
                    {inspectingRequest.timeline.map((entry, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                        <div className="flex items-center justify-between text-[10px] text-stone-500">
                          <span className="font-bold text-stone-800">{entry.actor}</span>
                          <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-stone-900 mt-0.5">{entry.action}</p>
                        {entry.notes && (
                          <p className="text-[11px] text-stone-600 italic mt-0.5">"{entry.notes}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 text-xs">
                Select a worker request from the inbox to inspect details, audio recordings, and render decisions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SAFETY TRIAGE */}
      {activeSubTab === 'safety' && (
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <h3 className="font-bold text-sm text-stone-900">
              Active Safety Incidents &amp; Fatigue Alerts ({safetyReports.length})
            </h3>
            <span className="text-xs text-stone-500">
              Sector: {sector === 'construction' ? 'Construction Site' : 'Factory Floor'}
            </span>
          </div>

          <div className="space-y-3">
            {safetyReports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-700 bg-stone-200 px-2 py-0.5 rounded">
                      {report.refNumber}
                    </span>
                    <span className="font-bold text-stone-900 text-sm">{report.category}</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      report.urgency === 'immediate_danger'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : report.urgency === 'high'
                        ? 'bg-amber-500 text-slate-950 font-extrabold'
                        : 'bg-stone-200 text-stone-800'
                    }`}
                  >
                    {report.urgency.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-stone-800 leading-relaxed text-xs sm:text-sm">
                  {report.description}
                </p>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between flex-wrap gap-2 text-stone-500 text-[11px]">
                  <span>Worksite: <strong>{report.worksiteName}</strong></span>
                  <span>Logged: {new Date(report.createdAt).toLocaleString()}</span>
                  <span className="font-bold text-teal-800 uppercase">
                    Status: {report.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ANONYMOUS FEEDBACK THEMES */}
      {activeSubTab === 'anonymous' && (
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-4 animate-in fade-in">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-700 flex-shrink-0" />
            <span>
              <strong>Aggregated Worker Sentiment:</strong> Worker identifiers are completely scrubbed at the database layer. No user accounts or IDs are associated with these entries.
            </span>
          </div>

          <div className="space-y-3">
            {anonymousItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                    {item.category}
                  </span>
                  <span className="text-stone-400 text-[10px]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-stone-800 leading-relaxed text-xs sm:text-sm">
                  "{item.feedbackText}"
                </p>
                <div className="text-[10px] text-stone-400 font-mono">
                  Anonymous Feedback &bull; ID-Free
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
