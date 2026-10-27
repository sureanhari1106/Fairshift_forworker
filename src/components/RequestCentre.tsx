import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FairShiftStore } from '../services/store';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import {
  RequestCategory,
  RequestStatus,
  WorkerRequestItem,
  TimelineEntry,
} from '../types';
import {
  Mic,
  MicOff,
  Volume2,
  FileText,
  Sparkles,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  Paperclip,
  Check,
  ChevronDown,
  Info,
  ChevronRight,
  Filter,
  MessageSquare,
} from 'lucide-react';

export const RequestCentre: React.FC = () => {
  const {
    t,
    currentWorker,
    sector,
    language,
    isOnline,
    prefilledRequestData,
    clearPrefilledRequestData,
  } = useApp();

  // Mode: 'speak' or 'type'
  const [activeMode, setActiveMode] = useState<'speak' | 'type'>('speak');

  // Form Fields
  const [category, setCategory] = useState<RequestCategory>('missed_clock_in_out');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [relevantDate, setRelevantDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [relatedRecordId, setRelatedRecordId] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');
  const [preferredResponseLang, setPreferredResponseLang] = useState<string>(language);

  // AI Assist State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    summary?: string;
    category?: string;
    missingDetails?: string[];
    translation?: string;
  } | null>(null);

  // Status & Detail View
  const [selectedRequest, setSelectedRequest] = useState<WorkerRequestItem | null>(null);
  const [workerReplyText, setWorkerReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Speech Hook
  const {
    isRecording,
    transcript,
    setTranscript,
    audioUrl,
    audioBase64,
    error: speechError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useSpeechRecognition({
    language: language === 'ta' ? 'ta-IN' : 'en-US',
    onTranscriptChange: (text) => {
      // Sync spoken words to description
      setDescription(text);
      if (!title && text.length > 5) {
        setTitle(text.slice(0, 40) + '...');
      }
    },
  });

  // Handle prefilled data from other screens (e.g. from Payslip "Report a problem")
  useEffect(() => {
    if (prefilledRequestData) {
      if (prefilledRequestData.category) {
        setCategory(prefilledRequestData.category as RequestCategory);
      }
      if (prefilledRequestData.title) {
        setTitle(prefilledRequestData.title);
      }
      if (prefilledRequestData.relatedRecordId) {
        setRelatedRecordId(prefilledRequestData.relatedRecordId);
      }
      setActiveMode('type');
      clearPrefilledRequestData();
    }
  }, [prefilledRequestData, clearPrefilledRequestData]);

  // Request Categories List
  const CATEGORIES: { id: RequestCategory; label: string }[] = [
    { id: 'missed_clock_in_out', label: t.catMissedClock },
    { id: 'incorrect_attendance_hours', label: t.catIncorrectHours },
    { id: 'missing_incorrect_salary', label: t.catMissingSalary },
    { id: 'incorrect_overtime', label: t.catIncorrectOT },
    { id: 'missing_payslip', label: t.catMissingPayslip },
    { id: 'incorrect_deduction_allowance', label: t.catIncorrectDeduction },
    { id: 'leave_shift_correction', label: t.catLeaveShiftCorrection },
    { id: 'profile_info_correction', label: t.catProfileCorrection },
    { id: 'missing_training_skill', label: t.catMissingTraining },
    { id: 'workplace_safety_issue', label: t.catWorkplaceSafety },
    { id: 'other_request', label: t.catOtherRequest },
  ];

  // AI Assistant trigger
  const handleAiAssist = async () => {
    if (!description && !title) return;
    setIsAiAnalyzing(true);
    setAiSuggestions(null);

    try {
      const res = await fetch('/api/ai/assist-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || transcript,
          sector,
          currentLanguage: language,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSuggestions({
          summary: data.summary,
          category: data.category,
          missingDetails: data.missingDetails,
          translation: data.translation,
        });

        // Optionally apply suggested category if worker wishes
        if (data.category && CATEGORIES.some((c) => c.id === data.category)) {
          setCategory(data.category as RequestCategory);
        }
      }
    } catch (err) {
      console.warn('AI assist call failed:', err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit Request
  const handleSubmitRequest = async (isDraft: boolean = false) => {
    if (!title && !description) {
      alert('Please provide a title or description for your request.');
      return;
    }

    setIsSubmitting(true);
    const uniqueRef = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const newRequest: WorkerRequestItem = {
      id: `req-${Date.now()}`,
      refNumber: uniqueRef,
      workerId: currentWorker.id,
      workerName: currentWorker.name,
      sector,
      category,
      title: title || (description.slice(0, 50) + '...'),
      description,
      originalLanguage: language,
      relevantDate,
      relatedRecordId: relatedRecordId || undefined,
      voiceNoteAudioBase64: audioBase64 || undefined,
      transcript: transcript || undefined,
      editedTranscript: transcript ? description : undefined,
      status: isDraft ? 'draft' : isOnline ? 'submitted' : 'waiting_to_send',
      urgency,
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: [
        {
          timestamp: nowIso,
          actor: `${currentWorker.name} (Worker)`,
          action: isDraft
            ? 'Draft created and saved locally.'
            : isOnline
            ? 'Request submitted to administrator inbox (Cloud Firestore).'
            : 'Saved in offline queue (will auto-sync on reconnect).',
        },
      ],
      aiAnalysis: aiSuggestions
        ? {
            summary: aiSuggestions.summary || '',
            missingDetails: aiSuggestions.missingDetails || [],
            translation: aiSuggestions.translation,
          }
        : undefined,
    };

    try {
      if (isOnline && !isDraft) {
        await FairShiftStore.addRequestToFirestore(newRequest);
        setSuccessBanner(
          language === 'ta'
            ? `கோரிக்கை ${uniqueRef} Cloud Firestore-ல் வெற்றிகரமாக உறுதிசெய்யப்பட்டது!`
            : `Request ${uniqueRef} confirmed by Cloud Firestore! Awaiting administrator review.`
        );
      } else {
        // Offline queue
        FairShiftStore.addToOfflineQueue({
          id: newRequest.id,
          type: 'request',
          createdAt: nowIso,
          status: 'saved_locally',
          data: newRequest,
          retryCount: 0,
        });
        FairShiftStore.addRequest(newRequest);
        setSuccessBanner(
          language === 'ta'
            ? `இணையம் இல்லாததால் கோரிக்கை ${uniqueRef} சாதனத்தில் பாதுகாப்பாக சேமிக்கப்பட்டது.`
            : `Saved locally! Request ${uniqueRef} queued on device and will transmit when online.`
        );
      }

      // Reset Form
      setTitle('');
      setDescription('');
      setRelatedRecordId('');
      setAiSuggestions(null);
      resetRecording();
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert('Firestore submission failed: ' + (err?.message || 'Check connection'));
    } finally {
      setIsSubmitting(false);
    }

    // Auto scroll to history
    setTimeout(() => {
      const el = document.getElementById('submitted-requests-list');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  // Worker sends response to manager when "more_info_requested"
  const handleWorkerSendMoreInfo = async (reqId: string) => {
    if (!workerReplyText.trim()) return;

    const timelineEntry: TimelineEntry = {
      timestamp: new Date().toISOString(),
      actor: `${currentWorker.name} (Worker)`,
      action: 'Worker provided additional information requested by manager.',
      notes: workerReplyText,
    };

    await FairShiftStore.updateRequestInFirestore(
      reqId,
      {
        status: 'submitted',
        workerResponse: workerReplyText,
      },
      timelineEntry
    );

    setWorkerReplyText('');
    setSuccessBanner('Additional information confirmed by Cloud Firestore.');
    const refreshed = FairShiftStore.getRequests().find((r) => r.id === reqId) || null;
    setSelectedRequest(refreshed);
  };

  // Get filtered requests for current worker
  const allWorkerRequests = FairShiftStore.getRequests().filter(
    (r) => r.workerId === currentWorker.id
  );
  const filteredRequests = allWorkerRequests.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-4 pb-24 sm:pb-8 max-w-4xl mx-auto px-3 sm:px-4 pt-3">
      {/* Title & UN SDG 8 Intro */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
              {t.requestCentreTitle}
            </h2>
            <p className="text-xs text-stone-600 mt-1">{t.requestCentreSub}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
            Official Dispute Form
          </span>
        </div>

        {/* Legal & Regulatory Disclaimer */}
        <div className="mt-3 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px] sm:text-xs text-amber-900">
            {t.disclaimerNotice}
          </p>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* Mode Selector: Speak vs Type Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-stone-200 shadow-xs flex items-center gap-1">
        <button
          onClick={() => setActiveMode('speak')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeMode === 'speak'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          style={{ minHeight: '44px' }}
        >
          <Mic className="w-4 h-4" />
          <span>{t.speakRequest}</span>
          <span className="hidden sm:inline text-[10px] opacity-80 font-normal">
            (Voice-First)
          </span>
        </button>

        <button
          onClick={() => setActiveMode('type')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeMode === 'type'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          style={{ minHeight: '44px' }}
        >
          <FileText className="w-4 h-4" />
          <span>{t.typeRequest}</span>
        </button>
      </div>

      {/* Main Request Creation Card */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-4">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            {t.selectCategory} <span className="text-rose-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as RequestCategory)}
            className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
            style={{ minHeight: '44px' }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Voice Note Section (if Speak Mode) */}
        {activeMode === 'speak' && (
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-teal-700" />
                <span>{t.voiceNote}</span>
              </span>
              <span className="text-[11px] text-teal-700 font-medium">
                {language === 'ta' ? 'தமிழ் பேச்சு ஆதரவு' : 'English Speech Supported'}
              </span>
            </div>

            {/* Big Mic Button */}
            <div className="flex flex-col items-center justify-center py-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-200'
                    : 'bg-teal-700 text-white hover:bg-teal-800'
                }`}
                style={{ minHeight: '48px', minWidth: '48px' }}
                aria-label={isRecording ? t.stopRecording : t.recordVoice}
              >
                {isRecording ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
              </button>
              <span className="text-xs font-semibold text-teal-900 mt-3">
                {isRecording ? t.recording : t.recordVoice}
              </span>
              <span className="text-[11px] text-teal-700 mt-0.5">
                {isRecording ? 'Tap again when finished' : 'Speak clearly in your preferred language'}
              </span>
            </div>

            {speechError && (
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>{speechError}</span>
              </div>
            )}

            {/* Audio Playback if recorded */}
            {audioUrl && (
              <div className="p-3 bg-white rounded-xl border border-teal-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
                  <audio controls src={audioUrl} className="h-8 max-w-[200px] sm:max-w-xs" />
                </div>
                <button
                  onClick={resetRecording}
                  className="text-stone-500 hover:text-stone-800 text-xs font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.reRecord}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Short Title */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            {t.requestTitle} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.requestTitlePlaceholder}
            className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
            style={{ minHeight: '44px' }}
          />
        </div>

        {/* Description / Editable Transcript */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              {activeMode === 'speak' ? t.transcriptLabel : t.requestDesc}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-stone-500">{t.transcriptHelp}</span>
          </div>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.requestDescPlaceholder}
            className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-teal-600 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Date & Related Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              {t.relevantDate}
            </label>
            <input
              type="date"
              value={relevantDate}
              onChange={(e) => setRelevantDate(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              {t.relatedRecord}
            </label>
            <input
              type="text"
              value={relatedRecordId}
              onChange={(e) => setRelatedRecordId(e.target.value)}
              placeholder="e.g. PAY-OCT-2026 or ATT-1024"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900"
              style={{ minHeight: '44px' }}
            />
          </div>
        </div>

        {/* AI Request Assistant Trigger */}
        <div className="pt-2 border-t border-stone-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={handleAiAssist}
              disabled={isAiAnalyzing || (!title && !description)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-indigo-800 text-white text-xs font-bold flex items-center gap-2 hover:opacity-95 transition disabled:opacity-50 shadow-xs"
              style={{ minHeight: '40px' }}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isAiAnalyzing ? t.aiAnalyzing : t.aiAssistBtn}</span>
            </button>
            <span className="text-[11px] text-stone-500 italic">{t.aiDisclaimer}</span>
          </div>

          {/* AI Suggestions Box */}
          {aiSuggestions && (
            <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>FairShift AI Assistance Output</span>
              </div>
              {aiSuggestions.summary && (
                <p>
                  <strong>Summary:</strong> {aiSuggestions.summary}
                </p>
              )}
              {aiSuggestions.missingDetails && aiSuggestions.missingDetails.length > 0 && (
                <div className="text-amber-900 bg-amber-100/70 p-2 rounded-lg">
                  <strong>Recommended Details to Add:</strong>
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                    {aiSuggestions.missingDetails.map((det, i) => (
                      <li key={i}>{det}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiSuggestions.translation && (
                <div className="p-2 rounded-lg bg-white border border-indigo-100">
                  <strong className="block text-[11px] text-indigo-700">
                    Bilingual Translation (English &harr; தமிழ்):
                  </strong>
                  <p className="text-stone-800 mt-0.5">{aiSuggestions.translation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit & Save Draft Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2.5">
          <button
            onClick={() => handleSubmitRequest(true)}
            className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold flex items-center gap-1.5"
            style={{ minHeight: '44px' }}
          >
            <Save className="w-4 h-4 text-stone-600" />
            <span>{t.saveDraftBtn}</span>
          </button>

          <button
            onClick={() => handleSubmitRequest(false)}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            style={{ minHeight: '44px' }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Confirming with Firestore...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-teal-300" />
                <span>{t.submitRequestBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Submitted Requests List & Lifecycle Section */}
      <div id="submitted-requests-list" className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm text-stone-900">{t.requestHistory}</h3>
            <span className="text-xs text-stone-500">
              {allWorkerRequests.length} total disputes logged
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {['all', 'under_review', 'more_info_requested', 'approved', 'submitted'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap transition ${
                  filterStatus === st
                    ? 'bg-teal-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs">
            No requests found matching the selected filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const isSelected = selectedRequest?.id === req.id;
              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border transition overflow-hidden ${
                    isSelected ? 'border-teal-600 ring-2 ring-teal-600/20 shadow-md' : 'border-stone-200 bg-white hover:border-teal-300'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => setSelectedRequest(isSelected ? null : req)}
                    className="p-3.5 bg-stone-50/50 hover:bg-stone-50 cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-teal-900 bg-teal-100/70 px-2 py-0.5 rounded">
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
                              : req.status === 'waiting_to_send'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-stone-200 text-stone-800'
                          }`}
                        >
                          {req.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                        {req.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-semibold text-teal-700 hidden sm:inline">
                        {isSelected ? 'Close' : t.viewDetails}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-stone-500 transition-transform ${
                          isSelected ? 'rotate-180 text-teal-700' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Request Timeline & Details */}
                  {isSelected && (
                    <div className="p-4 border-t border-stone-200 bg-white space-y-4 text-xs animate-in fade-in">
                      {/* Description & Spoken Audio */}
                      <div className="p-3 bg-stone-50 rounded-xl space-y-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500 block">
                            Description
                          </span>
                          <p className="text-stone-800 mt-0.5 leading-relaxed whitespace-pre-wrap">
                            {req.description}
                          </p>
                        </div>

                        {req.voiceNoteAudioBase64 && (
                          <div className="pt-2 border-t border-stone-200">
                            <span className="text-[10px] font-bold text-stone-500 block mb-1">
                              Recorded Voice Note
                            </span>
                            <audio
                              controls
                              src={`data:audio/webm;base64,${req.voiceNoteAudioBase64}`}
                              className="h-8 w-full max-w-sm"
                            />
                          </div>
                        )}
                      </div>

                      {/* Official Administrator Response Banner */}
                      {req.adminNotes && (
                        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-teal-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                            <span>Administrator Follow-up Note</span>
                          </span>
                          <p className="text-xs text-teal-900 leading-relaxed">
                            {req.adminNotes}
                          </p>
                          {req.resolutionReason && (
                            <p className="text-[11px] text-teal-800 font-semibold pt-1 border-t border-teal-200/60">
                              Resolution Action: {req.resolutionReason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* If More Info Requested: Worker Response Input */}
                      {req.status === 'more_info_requested' && (
                        <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-300 space-y-2.5">
                          <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
                            <HelpCircle className="w-4 h-4 text-rose-600" />
                            <span>Provide Requested Information to Manager</span>
                          </div>
                          <textarea
                            rows={3}
                            value={workerReplyText}
                            onChange={(e) => setWorkerReplyText(e.target.value)}
                            placeholder="Type details, shift docket numbers, or witness names requested by the manager..."
                            className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleWorkerSendMoreInfo(req.id)}
                            className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Reply to Administrator</span>
                          </button>
                        </div>
                      )}

                      {/* Interactive Audit Timeline */}
                      <div>
                        <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
                          Audit Trail &amp; Status Timeline
                        </span>
                        <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                          {req.timeline.map((entry, idx) => (
                            <div key={idx} className="relative pl-6">
                              <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-teal-600 border-2 border-white ring-2 ring-teal-200" />
                              <div className="text-[11px] font-bold text-stone-900">
                                {entry.action}
                              </div>
                              <div className="text-[10px] text-stone-500 flex items-center gap-2 mt-0.5">
                                <span>{entry.actor}</span>
                                <span>&bull;</span>
                                <span>{new Date(entry.timestamp).toLocaleString()}</span>
                              </div>
                              {entry.notes && (
                                <p className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg mt-1 border border-stone-200">
                                  "{entry.notes}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
