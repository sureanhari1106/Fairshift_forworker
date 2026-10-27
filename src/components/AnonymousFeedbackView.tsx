import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FairShiftStore } from '../services/store';
import { AnonymousFeedbackItem } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import {
  MessageSquareOff,
  ShieldCheck,
  Send,
  Lock,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export const AnonymousFeedbackView: React.FC = () => {
  const { t, sector, isOnline, language } = useApp();

  const [category, setCategory] = useState('Workplace Conditions & Facilities');
  const [feedbackText, setFeedbackText] = useState('');
  const [sentiment, setSentiment] = useState<'concern' | 'neutral' | 'urgent'>('concern');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    resetRecording,
    error: speechError,
  } = useSpeechRecognition({
    language: language === 'ta' ? 'ta-IN' : 'en-US',
    onTranscriptChange: (text) => setFeedbackText(text),
  });

  const CATEGORIES = [
    'Unfair Treatment & Discrimination',
    'Workplace Conditions & Facilities',
    'Safety Culture & Equipment Access',
    'Supervisor Communication & Respect',
    'Wage Transparency & Overtime Logging',
    'Workload, Shift Length & Rest Periods',
    'Improvement Suggestions & Ideas',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      alert('Please enter your feedback or speak into the microphone.');
      return;
    }

    const nowIso = new Date().toISOString();
    // STRICT SECURITY: We deliberately create this record WITHOUT workerId, userId, or name!
    const feedbackItem: AnonymousFeedbackItem = {
      id: `anon-${Date.now()}`,
      sector,
      category,
      feedbackText: feedbackText.trim(),
      sentiment,
      createdAt: nowIso,
    };

    if (isOnline) {
      await FairShiftStore.addAnonymousFeedbackToFirestore(feedbackItem);
    } else {
      FairShiftStore.addToOfflineQueue({
        id: feedbackItem.id,
        type: 'feedback',
        createdAt: nowIso,
        status: 'saved_locally',
        data: feedbackItem,
        retryCount: 0,
      });
      FairShiftStore.addAnonymousFeedback(feedbackItem);
    }

    setSubmittedSuccess(true);
    setFeedbackText('');
    resetRecording();
  };

  return (
    <div className="space-y-4 pb-24 sm:pb-8 max-w-4xl mx-auto px-3 sm:px-4 pt-3">
      {/* Title Card */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <MessageSquareOff className="w-5 h-5 text-indigo-700" />
          <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
            {t.anonTitle}
          </h2>
        </div>
        <p className="text-xs text-stone-600 mt-1">{t.anonSub}</p>

        {/* Anonymity Shield Banner */}
        <div className="mt-3 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-indigo-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-indigo-900 block">
              100% Guaranteed Identity Separation
            </span>
            <p className="text-[11px] leading-relaxed text-indigo-900/90">
              {t.anonNotice}
            </p>
          </div>
        </div>
      </div>

      {submittedSuccess ? (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-md text-center space-y-3 animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-stone-900">
            {t.anonSuccess}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Your feedback was delivered anonymously to the management dashboard as an aggregated theme. No history is stored on your worker account.
          </p>
          <button
            onClick={() => setSubmittedSuccess(false)}
            className="px-5 py-2.5 rounded-xl bg-teal-800 text-white font-bold text-xs"
          >
            Submit Another Concern
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              {t.anonCategory}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold text-stone-900"
              style={{ minHeight: '44px' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Input Assistance */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-indigo-700 text-white hover:bg-indigo-800'
                }`}
                title="Speak your anonymous concern"
                style={{ minHeight: '40px', minWidth: '40px' }}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  {isRecording ? 'Listening...' : 'Optional Voice Input'}
                </span>
                <span className="text-[10px] text-stone-500">
                  You can speak, then review and edit to scrub any personal names.
                </span>
              </div>
            </div>
            {isRecording && (
              <button
                type="button"
                onClick={stopRecording}
                className="text-xs text-rose-600 font-bold"
              >
                Stop
              </button>
            )}
          </div>

          {speechError && (
            <div className="p-2 rounded-lg bg-amber-50 text-amber-900 text-xs">
              {speechError}
            </div>
          )}

          {/* Text Area */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Your Concern or Feedback
            </label>
            <textarea
              rows={5}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={t.anonFeedbackPlaceholder}
              className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Severity / Sentiment */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Tone / Urgency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'concern', label: 'Concern / Issue' },
                { id: 'urgent', label: 'Urgent Intervention' },
                { id: 'neutral', label: 'Constructive Idea' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSentiment(st.id as any)}
                  className={`p-2 rounded-xl text-xs font-semibold border transition text-center ${
                    sentiment === st.id
                      ? 'bg-indigo-900 text-white border-indigo-900 font-bold'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                  style={{ minHeight: '40px' }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
              style={{ minHeight: '44px' }}
            >
              <Send className="w-4 h-4 text-indigo-300" />
              <span>{t.submitAnonBtn}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
