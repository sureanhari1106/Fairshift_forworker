import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FairShiftStore } from '../services/store';
import { SafetyReportItem, SafetyUrgency, SafetyReportType } from '../types';
import {
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  PhoneCall,
  Flame,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  Eye,
  Camera,
  MapPin,
  HardHat,
  Factory,
} from 'lucide-react';

export const SafetySection: React.FC = () => {
  const { t, currentWorker, sector, isOnline, language } = useApp();

  const [activeTab, setActiveTab] = useState<'fatigue' | 'incidents' | 'emergency'>('fatigue');

  // Fatigue Form State
  const [shiftHours, setShiftHours] = useState(11.0);
  const [restHours, setRestHours] = useState(6.5);
  const [fatigueSeverity, setFatigueSeverity] = useState<'moderate' | 'high' | 'critical'>('high');
  const [fatigueSymptoms, setFatigueSymptoms] = useState('');
  const [fatigueActionRequested, setFatigueActionRequested] = useState('Rotational relief from height work');

  // Incident Form State
  const [incidentType, setIncidentType] = useState<SafetyReportType>('hazard');
  const [hazardCategory, setHazardCategory] = useState(
    sector === 'construction' ? 'Scaffolding & Work at Height' : 'Machine Guarding & Pinch Points'
  );
  const [incidentDesc, setIncidentDesc] = useState('');
  const [affectedBodyArea, setAffectedBodyArea] = useState('Back / Spine');
  const [urgency, setUrgency] = useState<SafetyUrgency>('high');
  const [immediateHelpNeeded, setImmediateHelpNeeded] = useState(false);
  const [siteLocation, setSiteLocation] = useState(currentWorker.site);

  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Safety Reports List
  const allReports = FairShiftStore.getSafetyReports().filter(
    (s) => s.reporterId === currentWorker.id || s.sector === sector
  );

  const emergencyContacts = FairShiftStore.getEmergencyContacts(sector);

  // Construction vs Factory Hazard Categories
  const HAZARDS_CONSTRUCTION = [
    'Scaffolding & Work at Height',
    'Structural Fall Hazard & Edge Protection',
    'Falling Objects & Debris Protection',
    'High Voltage & Electrical Wiring Exposure',
    'Heavy Machinery / Mobile Crane Clearance',
    'Trench & Excavation Collapse Risk',
    'PPE Non-Compliance or Damaged Harness',
    'Other Construction Hazard',
  ];

  const HAZARDS_FACTORY = [
    'Machine Guarding & Optical Curtain Failure',
    'Conveyor Belt & Roller Pinch Points',
    'Chemical Fume / Acid Splash Exposure',
    'Hydraulic & Pneumatic Pressure Leak',
    'High Noise / Vibrational Injury',
    'Electrical Panel & Lockout-Tagout (LOTO)',
    'Thermal Burns & Hot Tool Contact',
    'Other Factory Floor Hazard',
  ];

  // Submit Fatigue Report
  const handleSubmitFatigue = async () => {
    const ref = `FATIGUE-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const report: SafetyReportItem = {
      id: `safe-${Date.now()}`,
      refNumber: ref,
      reporterId: currentWorker.id,
      reporterName: currentWorker.name,
      sector,
      worksiteName: currentWorker.site,
      reportType: 'fatigue',
      category: 'Shift Fatigue & Rest Interval Violation',
      description: `Shift hours: ${shiftHours}h, Prior rest: ${restHours}h. Symptoms: ${fatigueSymptoms || 'Severe exhaustion/dizziness'}. Requested action: ${fatigueActionRequested}`,
      urgency: shiftHours > 12 || fatigueSeverity === 'critical' ? 'immediate_danger' : 'high',
      immediateHelpNeeded: fatigueSeverity === 'critical',
      status: 'reported',
      createdAt: nowIso,
      hoursWorked: shiftHours,
      restHours,
      immediateGuidance: 'Please step down from height or machinery immediately. Report to site first-aid shed for vitals check.',
    };

    try {
      if (isOnline) {
        await FairShiftStore.addSafetyReportToFirestore(report);
        setFeedbackBanner(`Fatigue report ${ref} confirmed by Cloud Firestore. Safety warden and supervisor alerted.`);
      } else {
        FairShiftStore.addToOfflineQueue({
          id: report.id,
          type: 'safety',
          createdAt: nowIso,
          status: 'saved_locally',
          data: report,
          retryCount: 0,
        });
        FairShiftStore.addSafetyReport(report);
        setFeedbackBanner(`Saved locally! Report ${ref} queued on device and will transmit upon reconnection.`);
      }
      setFatigueSymptoms('');
    } catch (err: any) {
      console.error('Safety report error:', err);
      alert('Firestore submission failed: ' + (err?.message || 'Check connection'));
    }
  };

  // Submit Incident / Hazard Report
  const handleSubmitIncident = async () => {
    if (!incidentDesc.trim()) {
      alert('Please describe the hazard or injury.');
      return;
    }

    const ref = `SAFE-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const report: SafetyReportItem = {
      id: `safe-${Date.now()}`,
      refNumber: ref,
      reporterId: currentWorker.id,
      reporterName: currentWorker.name,
      sector,
      worksiteName: siteLocation,
      reportType: incidentType,
      category: hazardCategory,
      description: incidentDesc,
      urgency,
      affectedBodyArea: incidentType === 'injury' ? affectedBodyArea : undefined,
      immediateHelpNeeded,
      status: 'reported',
      createdAt: nowIso,
      immediateGuidance:
        urgency === 'immediate_danger' || immediateHelpNeeded
          ? 'Imminent danger flagged: Cordon off zone immediately. Contact safety warden directly.'
          : 'Hazard logged. Safety inspection crew will inspect before next shift.',
    };

    try {
      if (isOnline) {
        await FairShiftStore.addSafetyReportToFirestore(report);
        setFeedbackBanner(`Incident report ${ref} confirmed by Cloud Firestore. Triage team notified.`);
      } else {
        FairShiftStore.addToOfflineQueue({
          id: report.id,
          type: 'safety',
          createdAt: nowIso,
          status: 'saved_locally',
          data: report,
          retryCount: 0,
        });
        FairShiftStore.addSafetyReport(report);
        setFeedbackBanner(`Report ${ref} saved on device. Will transmit upon reconnection.`);
      }

      setIncidentDesc('');
      setImmediateHelpNeeded(false);
    } catch (err: any) {
      console.error('Incident report error:', err);
      alert('Firestore report failed: ' + (err?.message || 'Check connection'));
    }
  };

  return (
    <div className="space-y-4 pb-24 sm:pb-8 max-w-4xl mx-auto px-3 sm:px-4 pt-3">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-700" />
            <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
              {t.safetyTitle}
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Fatigue monitoring, hazard mitigation, and immediate emergency contact directory.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
          {sector === 'construction' ? <HardHat className="w-3.5 h-3.5" /> : <Factory className="w-3.5 h-3.5" />}
          <span>{sector === 'construction' ? 'Construction Site' : 'Factory Floor'}</span>
        </span>
      </div>

      {feedbackBanner && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{feedbackBanner}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-emerald-700 font-bold text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* 3 Dedicated Sub-Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-stone-200 shadow-xs grid grid-cols-3 gap-1">
        <button
          onClick={() => setActiveTab('fatigue')}
          className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition text-center ${
            activeTab === 'fatigue'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          style={{ minHeight: '44px' }}
        >
          <Activity className="w-4 h-4 text-amber-300" />
          <span className="truncate">{t.tabFatigue}</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition text-center ${
            activeTab === 'incidents'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          style={{ minHeight: '44px' }}
        >
          <AlertTriangle className="w-4 h-4 text-rose-300" />
          <span className="truncate">{t.tabIncidents}</span>
        </button>

        <button
          onClick={() => setActiveTab('emergency')}
          className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition text-center ${
            activeTab === 'emergency'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
          style={{ minHeight: '44px' }}
        >
          <PhoneCall className="w-4 h-4" />
          <span className="truncate">{t.tabEmergency}</span>
        </button>
      </div>

      {/* SUB-PAGE A: FATIGUE & OVERWORK REPORTS */}
      {activeTab === 'fatigue' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Transparent Working-Hour Rules Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm">
              <Clock className="w-5 h-5 text-amber-700" />
              <span>Transparent Working-Hour &amp; Fatigue Thresholds</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Under UN SDG 8 and worksite regulations, consecutive work beyond <strong>10 hours</strong> or rest turnaround under <strong>8 hours</strong> represents an elevated accident risk. Reporting fatigue carries <strong>zero penalty</strong> and protects lives.
            </p>
          </div>

          {/* Fatigue Logging Form */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-stone-900 pb-2 border-b border-stone-200">
              {t.reportFatigue}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hours worked on current shift */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t.hoursWorkedToday}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="4"
                    max="16"
                    step="0.5"
                    value={shiftHours}
                    onChange={(e) => setShiftHours(parseFloat(e.target.value))}
                    className="flex-1 accent-teal-700"
                  />
                  <span className="font-mono font-bold text-sm px-2.5 py-1 bg-stone-100 rounded-lg text-stone-900">
                    {shiftHours} hrs
                  </span>
                </div>
                {shiftHours > 10 && (
                  <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                    &bull; Exceeds recommended 10h threshold!
                  </span>
                )}
              </div>

              {/* Rest interval */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t.restHours}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="3"
                    max="14"
                    step="0.5"
                    value={restHours}
                    onChange={(e) => setRestHours(parseFloat(e.target.value))}
                    className="flex-1 accent-teal-700"
                  />
                  <span className="font-mono font-bold text-sm px-2.5 py-1 bg-stone-100 rounded-lg text-stone-900">
                    {restHours} hrs
                  </span>
                </div>
                {restHours < 8 && (
                  <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                    &bull; Turnaround under 8 hours rest
                  </span>
                )}
              </div>
            </div>

            {/* Severity Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                {t.severityLevel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'moderate', label: 'Moderate Tiredness' },
                  { id: 'high', label: 'High / Dizziness' },
                  { id: 'critical', label: 'Critical / Unsafe to Continue' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFatigueSeverity(s.id as any)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                      fatigueSeverity === s.id
                        ? 'bg-amber-100 text-amber-950 border-amber-500 font-bold ring-2 ring-amber-400/20'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms Description */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Describe Symptoms &amp; Task Being Performed
              </label>
              <textarea
                rows={3}
                value={fatigueSymptoms}
                onChange={(e) => setFatigueSymptoms(e.target.value)}
                placeholder="e.g. Operating rebar tier in direct sun; experiencing heat exhaustion and blurred vision..."
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            {/* Requested Action */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Requested Mitigation
              </label>
              <select
                value={fatigueActionRequested}
                onChange={(e) => setFatigueActionRequested(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                style={{ minHeight: '44px' }}
              >
                <option value="Rotational relief from height work">Rotational relief from height / machine work</option>
                <option value="Mandatory 30-minute shaded hydration break">Mandatory 30-minute shaded hydration break</option>
                <option value="Early shift sign-off with replacement">Early shift sign-off with replacement</option>
                <option value="First-aid vitals check (heat stress)">First-aid vitals check (heat stress)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSubmitFatigue}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition"
                style={{ minHeight: '44px' }}
              >
                <Send className="w-4 h-4" />
                <span>Submit Fatigue Report to Safety Warden</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE B: INJURY & SAFETY INCIDENT REPORTS */}
      {activeTab === 'incidents' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Quick Notice */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                Separate from ordinary employment disputes. Managed confidentially by HSE personnel.
              </span>
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-stone-900 pb-2 border-b border-stone-200">
              {t.reportIncident}
            </h3>

            {/* Incident Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'hazard', label: 'Potential Hazard' },
                { id: 'injury', label: 'Injury Occurred' },
                { id: 'near_miss', label: 'Near Miss' },
              ].map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => setIncidentType(tp.id as any)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${
                    incidentType === tp.id
                      ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  {tp.label}
                </button>
              ))}
            </div>

            {/* Sector-Specific Hazard Category */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Hazard Classification ({sector === 'construction' ? 'Construction' : 'Factory'})
              </label>
              <select
                value={hazardCategory}
                onChange={(e) => setHazardCategory(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold"
                style={{ minHeight: '44px' }}
              >
                {(sector === 'construction' ? HAZARDS_CONSTRUCTION : HAZARDS_FACTORY).map((hz) => (
                  <option key={hz} value={hz}>
                    {hz}
                  </option>
                ))}
              </select>
            </div>

            {/* If Injury: Affected Body Area */}
            {incidentType === 'injury' && (
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider">
                  {t.affectedBodyArea}
                </label>
                <select
                  value={affectedBodyArea}
                  onChange={(e) => setAffectedBodyArea(e.target.value)}
                  className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs font-semibold text-rose-950"
                  style={{ minHeight: '44px' }}
                >
                  <option value="Head / Facial">Head / Facial</option>
                  <option value="Eyes (Dust/Chemical)">Eyes (Dust / Chemical Splash)</option>
                  <option value="Hand / Fingers (Pinch/Cut)">Hand / Fingers (Pinch / Cut)</option>
                  <option value="Back / Spine">Back / Spine</option>
                  <option value="Foot / Ankle (Puncture/Crush)">Foot / Ankle (Puncture / Crush)</option>
                  <option value="Multiple Areas">Multiple Areas</option>
                </select>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="immediateHelpCheck"
                    checked={immediateHelpNeeded}
                    onChange={(e) => setImmediateHelpNeeded(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded"
                  />
                  <label htmlFor="immediateHelpCheck" className="text-xs font-bold text-rose-900">
                    Immediate First Aid / Paramedic Dispatch Required
                  </label>
                </div>
              </div>
            )}

            {/* Worksite location */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Specific Worksite / Machine Location
              </label>
              <input
                type="text"
                value={siteLocation}
                onChange={(e) => setSiteLocation(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                style={{ minHeight: '44px' }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Detailed Observation
              </label>
              <textarea
                rows={4}
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                placeholder="State clearly what is dangerous, equipment tags, scaffolding levels, or chemical smells..."
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Urgency Radio */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Urgency Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'immediate_danger'] as SafetyUrgency[]).map((ug) => (
                  <button
                    key={ug}
                    type="button"
                    onClick={() => setUrgency(ug)}
                    className={`p-2 rounded-xl text-xs font-bold capitalize border text-center ${
                      urgency === ug
                        ? ug === 'immediate_danger'
                          ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400/30'
                          : 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                    style={{ minHeight: '40px' }}
                  >
                    {ug.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSubmitIncident}
                className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
                style={{ minHeight: '44px' }}
              >
                <Send className="w-4 h-4" />
                <span>Submit Safety Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE C: EMERGENCY CONTACTS & QUICK HELP */}
      {activeTab === 'emergency' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Imminent Danger Header Banner */}
          <div className="p-4 rounded-2xl bg-rose-600 text-white space-y-2 shadow-md">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-6 h-6 text-white animate-bounce" />
              <h3 className="font-extrabold text-sm sm:text-base">
                Life-Threatening Emergency &bull; Direct SOS
              </h3>
            </div>
            <p className="text-xs text-rose-100 leading-relaxed">
              {t.emergencyGuidance}
            </p>
            <div className="pt-1 flex items-center gap-2">
              <a
                href="tel:108"
                className="px-4 py-2 bg-white text-rose-700 rounded-xl font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Trauma Ambulance (108)</span>
              </a>
              <span className="text-[11px] text-rose-200">Free 24/7 Hotline</span>
            </div>
          </div>

          {/* Site Directory Cards with Tap-To-Call */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h4 className="font-bold text-xs text-stone-700 uppercase tracking-wider">
                {t.emergencyTitle} ({sector === 'construction' ? 'Construction Site' : 'Factory'})
              </h4>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Offline Cached: Oct 26, 06:00
              </span>
            </div>

            <div className="space-y-2.5">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                      {contact.role}
                    </span>
                    <h5 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                      {contact.name}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{contact.location}</span>
                      </span>
                      <span>&bull;</span>
                      <span className="text-emerald-700 font-medium">
                        {contact.availableHours}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                    className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm flex-shrink-0"
                    style={{ minHeight: '44px' }}
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-300" />
                    <span>{t.callNow}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Logged Reports Feed */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
        <h4 className="font-bold text-xs text-stone-700 uppercase tracking-wider">
          Active Safety Logs ({allReports.length})
        </h4>

        <div className="space-y-2.5">
          {allReports.map((rep) => (
            <div
              key={rep.id}
              className="p-3 rounded-xl border border-stone-200 bg-stone-50/40 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-stone-600 bg-stone-200/70 px-1.5 py-0.2 rounded text-[10px]">
                    {rep.refNumber}
                  </span>
                  <span className="font-bold text-stone-900">{rep.category}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    rep.urgency === 'immediate_danger'
                      ? 'bg-rose-100 text-rose-800 animate-pulse'
                      : rep.urgency === 'high'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {rep.urgency.replace('_', ' ')}
                </span>
              </div>
              <p className="text-stone-700 leading-relaxed">{rep.description}</p>
              {rep.immediateGuidance && (
                <div className="p-2 rounded-lg bg-teal-50 text-teal-900 text-[11px] font-medium border border-teal-200">
                  <strong>Guidance:</strong> {rep.immediateGuidance}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
