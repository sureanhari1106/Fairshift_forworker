export type Language = 'en' | 'ta';

export interface Translations {
  appName: string;
  tagline: string;
  sectorConstruction: string;
  sectorFactory: string;
  switchSector: string;
  workerView: string;
  managerView: string;
  switchRole: string;
  online: string;
  offline: string;
  offlineNotice: string;
  syncQueue: string;
  draftsQueued: string;
  simulateOffline: string;
  simulateOnline: string;
  
  // Navigation
  navHome: string;
  navRequests: string;
  navPayslip: string;
  navSafety: string;
  navSkills: string;
  navAnonymous: string;
  navAttendance: string;
  navEmergency: string;
  
  // Worker Home
  shiftStatus: string;
  clockedIn: string;
  clockedOut: string;
  onBreak: string;
  currentWorksite: string;
  todayHours: string;
  weekHours: string;
  latestPayslip: string;
  netPay: string;
  outstandingRequests: string;
  pendingReviews: string;
  safetyAlerts: string;
  fatigueWarning: string;
  quickActions: string;
  actionClock: string;
  actionRequest: string;
  actionVoice: string;
  actionSafety: string;
  actionAnonymous: string;
  actionEmergency: string;

  // Request Centre
  requestCentreTitle: string;
  requestCentreSub: string;
  speakRequest: string;
  typeRequest: string;
  selectCategory: string;
  requestTitle: string;
  requestTitlePlaceholder: string;
  requestDesc: string;
  requestDescPlaceholder: string;
  relevantDate: string;
  relatedRecord: string;
  preferredLanguage: string;
  voiceNote: string;
  recordVoice: string;
  stopRecording: string;
  recording: string;
  reRecord: string;
  transcriptLabel: string;
  transcriptHelp: string;
  aiAssistBtn: string;
  aiAnalyzing: string;
  aiDisclaimer: string;
  submitRequestBtn: string;
  saveDraftBtn: string;
  disclaimerNotice: string;
  requestHistory: string;
  refNumber: string;
  statusLabel: string;
  viewDetails: string;
  allCategories: string;
  filterStatus: string;
  
  // Request Categories
  catMissedClock: string;
  catIncorrectHours: string;
  catMissingSalary: string;
  catIncorrectOT: string;
  catMissingPayslip: string;
  catIncorrectDeduction: string;
  catLeaveShiftCorrection: string;
  catProfileCorrection: string;
  catMissingTraining: string;
  catWorkplaceSafety: string;
  catOtherRequest: string;

  // Statuses
  statusDraft: string;
  statusWaiting: string;
  statusSubmitted: string;
  statusUnderReview: string;
  statusMoreInfo: string;
  statusApproved: string;
  statusRejected: string;
  statusResolved: string;

  // Payslip
  payslipTitle: string;
  payslipSub: string;
  selectPeriod: string;
  grossEarnings: string;
  totalDeductions: string;
  netPayable: string;
  formulaLabel: string;
  baseRate: string;
  regularHours: string;
  regularPay: string;
  otHours: string;
  otRate: string;
  otPay: string;
  allowances: string;
  deductionsItemized: string;
  reportProblem: string;
  explainLineItem: string;
  printPayslip: string;

  // Safety & Wellbeing
  safetyTitle: string;
  tabFatigue: string;
  tabIncidents: string;
  tabEmergency: string;
  reportFatigue: string;
  hoursWorkedToday: string;
  restHours: string;
  severityLevel: string;
  reportIncident: string;
  incidentType: string;
  affectedBodyArea: string;
  immediateHelpNeeded: string;
  emergencyTitle: string;
  callNow: string;
  firstAider: string;
  safetyOfficer: string;
  siteSupervisor: string;
  siteClinic: string;
  emergencyGuidance: string;

  // Anonymous Feedback
  anonTitle: string;
  anonSub: string;
  anonNotice: string;
  anonCategory: string;
  anonFeedbackPlaceholder: string;
  submitAnonBtn: string;
  anonSuccess: string;

  // Skill Passport
  skillPassportTitle: string;
  verifiedBadge: string;
  selfReportedBadge: string;
  addSkillBtn: string;

  // Manager
  managerDashboardTitle: string;
  inboxRequests: string;
  inboxSafety: string;
  kpiWorkers: string;
  kpiOvertime: string;
  kpiOpenRequests: string;
  kpiDisputes: string;
  approveBtn: string;
  rejectBtn: string;
  requestInfoBtn: string;
  internalNoteLabel: string;
  workerVisibleReply: string;
  resolutionReasonLabel: string;
  auditTrail: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'FairShift',
    tagline: 'Decent Work & Worker Voice Platform (UN SDG 8)',
    sectorConstruction: 'Construction Mode',
    sectorFactory: 'Factory / Manufacturing',
    switchSector: 'Switch Industry Sector',
    workerView: 'Worker Portal',
    managerView: 'Manager Dashboard',
    switchRole: 'Switch View',
    online: 'Online',
    offline: 'Offline (Local Cache Active)',
    offlineNotice: 'No internet connection. Changes will be saved locally and submitted automatically when reconnected.',
    syncQueue: 'Offline Queue',
    draftsQueued: 'drafts waiting to sync',
    simulateOffline: 'Simulate Offline Mode',
    simulateOnline: 'Restore Online Connection',

    // Nav
    navHome: 'Home',
    navRequests: 'Requests',
    navPayslip: 'Payslip',
    navSafety: 'Safety',
    navSkills: 'Skills',
    navAnonymous: 'Anonymous',
    navAttendance: 'Attendance',
    navEmergency: 'Emergency',

    // Home
    shiftStatus: 'Shift Status',
    clockedIn: 'Clocked In',
    clockedOut: 'Off Shift',
    onBreak: 'On Break',
    currentWorksite: 'Active Site',
    todayHours: "Today's Hours",
    weekHours: 'This Week',
    latestPayslip: 'Latest Payslip Summary',
    netPay: 'Net Payable',
    outstandingRequests: 'Your Open Requests',
    pendingReviews: 'requests under review',
    safetyAlerts: 'Safety & Fatigue Advisory',
    fatigueWarning: 'Shift length advisory: You have exceeded 10 consecutive hours. Rest interval recommended.',
    quickActions: 'Quick Actions',
    actionClock: 'Clock In / Out',
    actionRequest: 'Fix a Record',
    actionVoice: 'Speak Request',
    actionSafety: 'Report Hazard',
    actionAnonymous: 'Confidential Voice',
    actionEmergency: 'Emergency SOS',

    // Request Centre
    requestCentreTitle: 'Worker Request Centre',
    requestCentreSub: 'Dispute, correct, or update your attendance, wages, or records.',
    speakRequest: 'Speak a Request',
    typeRequest: 'Type a Request',
    selectCategory: 'Request Category',
    requestTitle: 'Short Summary',
    requestTitlePlaceholder: 'e.g., Missed evening punch-out due to scanner error',
    requestDesc: 'Detailed Description',
    requestDescPlaceholder: 'Describe clearly what happened, times, dates, and supervisors present...',
    relevantDate: 'Relevant Date / Shift',
    relatedRecord: 'Related Attendance or Payslip ID (Optional)',
    preferredLanguage: 'Preferred Response Language',
    voiceNote: 'Voice Note Recording',
    recordVoice: 'Hold / Tap to Record Voice Note',
    stopRecording: 'Stop Recording',
    recording: 'Recording audio...',
    reRecord: 'Record Again',
    transcriptLabel: 'Spoken Transcript (Editable)',
    transcriptHelp: 'You can review and edit this text before submitting to ensure complete accuracy.',
    aiAssistBtn: 'AI Assist & Translate',
    aiAnalyzing: 'AI reviewing details...',
    aiDisclaimer: 'AI suggestions are assistive only. You have full control before submitting.',
    submitRequestBtn: 'Submit Request to Manager',
    saveDraftBtn: 'Save Draft on Device',
    disclaimerNotice: 'Submitting a request does not automatically alter official payroll or attendance records. An authorized manager must review and approve corrections with an audit trail.',
    requestHistory: 'Your Submitted Requests',
    refNumber: 'Reference #',
    statusLabel: 'Status',
    viewDetails: 'Inspect & Timeline',
    allCategories: 'All Categories',
    filterStatus: 'Filter Status',

    // Categories
    catMissedClock: '1. Missed clock-in or clock-out',
    catIncorrectHours: '2. Incorrect attendance or working hours',
    catMissingSalary: '3. Missing or incorrect salary payment',
    catIncorrectOT: '4. Incorrect overtime calculation',
    catMissingPayslip: '5. Missing payslip',
    catIncorrectDeduction: '6. Incorrect deduction or allowance',
    catLeaveShiftCorrection: '7. Leave or shift correction',
    catProfileCorrection: '8. Employment or profile correction',
    catMissingTraining: '9. Missing training or skill record',
    catWorkplaceSafety: '10. Workplace safety issue',
    catOtherRequest: '11. Other request',

    // Statuses
    statusDraft: 'Draft',
    statusWaiting: 'Waiting to Send',
    statusSubmitted: 'Submitted',
    statusUnderReview: 'Under Review',
    statusMoreInfo: 'More Info Requested',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    statusResolved: 'Resolved',

    // Payslip
    payslipTitle: 'Transparent Payslip & Wage Breakdown',
    payslipSub: 'Verify your earnings, overtime, allowances, and statutory deductions.',
    selectPeriod: 'Select Pay Period',
    grossEarnings: 'Gross Earnings',
    totalDeductions: 'Total Deductions',
    netPayable: 'Net Payable Amount',
    formulaLabel: 'Calculation Formula',
    baseRate: 'Base Hourly Rate',
    regularHours: 'Regular Hours',
    regularPay: 'Regular Pay',
    otHours: 'Overtime Hours',
    otRate: 'Overtime Multiplier',
    otPay: 'Overtime Pay',
    allowances: 'Allowances & Bonus',
    deductionsItemized: 'Itemised Deductions',
    reportProblem: 'Report a Problem with this Payslip',
    explainLineItem: 'Ask AI to Explain This Deduction',
    printPayslip: 'Print / Save Statement',

    // Safety & Wellbeing
    safetyTitle: 'Workplace Safety & Wellbeing',
    tabFatigue: 'Fatigue & Overwork',
    tabIncidents: 'Incidents & Hazards',
    tabEmergency: 'Emergency Contacts',
    reportFatigue: 'Log Fatigue / Overwork',
    hoursWorkedToday: 'Hours Worked on Current Shift',
    restHours: 'Rest Hours Since Last Shift',
    severityLevel: 'Exhaustion / Severity Level',
    reportIncident: 'Report Hazard or Injury',
    incidentType: 'Incident Type',
    affectedBodyArea: 'Affected Body Area (if injury)',
    immediateHelpNeeded: 'Immediate First Aid / Assistance Needed',
    emergencyTitle: 'Site Emergency Contacts & Hotlines',
    callNow: 'Call Now',
    firstAider: 'Certified First Aider',
    safetyOfficer: 'Site Safety Warden',
    siteSupervisor: 'Site Duty Supervisor',
    siteClinic: 'Nearest Medical Clinic',
    emergencyGuidance: 'For imminent danger to life or collapse, contact local emergency services immediately. Do not wait for app confirmation.',

    // Anonymous Feedback
    anonTitle: 'Confidential Anonymous Feedback',
    anonSub: 'Raise concerns safely without fear of retaliation.',
    anonNotice: 'Your identity is strictly protected. This feedback is never tagged with your worker ID, name, or account credentials. Managers see aggregated feedback themes only.',
    anonCategory: 'Feedback Category',
    anonFeedbackPlaceholder: 'Share your thoughts on working conditions, fair treatment, safety culture, or supervisor behavior...',
    submitAnonBtn: 'Send Anonymous Feedback',
    anonSuccess: 'Your feedback was received anonymously. Thank you for making our workplace fairer and safer.',

    // Skills
    skillPassportTitle: 'Worker Skill Passport',
    verifiedBadge: 'Verified Credential',
    selfReportedBadge: 'Self-Reported Skill',
    addSkillBtn: 'Add Certification or Skill',

    // Manager
    managerDashboardTitle: 'Manager & Administrator Dashboard',
    inboxRequests: 'Request Inbox',
    inboxSafety: 'Safety Triage',
    kpiWorkers: 'On-Site Today',
    kpiOvertime: 'Overtime Hours',
    kpiOpenRequests: 'Pending Requests',
    kpiDisputes: 'Wage Flags',
    approveBtn: 'Approve Correction',
    rejectBtn: 'Reject Request',
    requestInfoBtn: 'Request More Information',
    internalNoteLabel: 'Internal Staff Note (Confidential)',
    workerVisibleReply: 'Response to Worker',
    resolutionReasonLabel: 'Official Reason for Approval / Rejection',
    auditTrail: 'Compliance Audit Trail',
  },

  ta: {
    appName: 'ஃபேர்ஷிப்ட் (FairShift)',
    tagline: 'தொழிலாளர் குரல் மற்றும் கண்ணியமான பணி தளம் (UN SDG 8)',
    sectorConstruction: 'கட்டுமான தளம்',
    sectorFactory: 'தொழிற்சாலை / உற்பத்தி',
    switchSector: 'தொழில் துறையை மாற்றவும்',
    workerView: 'தொழிலாளர் பக்கம்',
    managerView: 'மேலாளர் பக்கம்',
    switchRole: 'பார்வையை மாற்றவும்',
    online: 'இணைப்பில் உள்ளது (Online)',
    offline: 'இணைப்பில்லை (Offline - உள்ளூர் சேமிப்பு)',
    offlineNotice: 'இணைய இணைப்பு இல்லை. தகவல்கள் சாதனத்தில் பத்திரமாக சேமிக்கப்பட்டு, இணைப்பு வந்ததும் அனுப்பப்படும்.',
    syncQueue: 'சேமிக்கப்பட்ட வரிசை',
    draftsQueued: 'அனுப்ப காத்திருக்கும் வரைவுகள்',
    simulateOffline: 'இணைப்பற்ற நிலையை சோதிக்கவும்',
    simulateOnline: 'இணைய இணைப்பை மீட்டெடுக்கவும்',

    // Nav
    navHome: 'முகப்பு',
    navRequests: 'கோரிக்கைகள்',
    navPayslip: 'சம்பள சீட்டு',
    navSafety: 'பாதுகாப்பு',
    navSkills: 'திறன்கள்',
    navAnonymous: 'ரகசிய கருத்து',
    navAttendance: 'வருகை பதிவு',
    navEmergency: 'அவசர உதவி',

    // Home
    shiftStatus: 'ஷிப்ட் நிலை',
    clockedIn: 'வேலையில் உள்ளார் (Clocked In)',
    clockedOut: 'வேலை முடிந்தது',
    onBreak: 'இடைவேளையில்',
    currentWorksite: 'தற்போதைய பணியிடம்',
    todayHours: 'இன்றைய வேலை நேரம்',
    weekHours: 'இந்த வாரம்',
    latestPayslip: 'சமீபத்திய சம்பள சுருக்கம்',
    netPay: 'வழங்கப்படும் நிகர தொகை',
    outstandingRequests: 'நிலுவையில் உள்ள கோரிக்கைகள்',
    pendingReviews: 'பரிசீலனையில் உள்ள கோரிக்கைகள்',
    safetyAlerts: 'பாதுகாப்பு & சோர்வு எச்சரிக்கை',
    fatigueWarning: 'வேலை நேர எச்சரிக்கை: நீங்கள் தொடர்ந்து 10 மணி நேரத்திற்கு மேல் வேலை செய்துள்ளீர்கள். ஓய்வு எடுக்க பரிந்துரைக்கப்படுகிறது.',
    quickActions: 'விரைவு செயல்கள்',
    actionClock: 'வருகை பதிவு',
    actionRequest: 'திருத்தம் கோர',
    actionVoice: 'குரல் மூலம் கோரிக்கை',
    actionSafety: 'ஆபத்தை தெரிவிக்க',
    actionAnonymous: 'பெயரற்ற கருத்து',
    actionEmergency: 'அவசர உதவி SOS',

    // Request Centre
    requestCentreTitle: 'தொழிலாளர் கோரிக்கை மையம்',
    requestCentreSub: 'வருகை, சம்பளம் அல்லது வேலை பதிவுகளில் உள்ள தவறுகளை திருத்த விண்ணப்பிக்கவும்.',
    speakRequest: 'பேசி பதிவு செய்ய',
    typeRequest: 'எழுதி பதிவு செய்ய',
    selectCategory: 'கோரிக்கை வகை',
    requestTitle: 'சுருக்கமான தலைப்பு',
    requestTitlePlaceholder: 'எ.கா: ஸ்கேனர் கோளாறு காரணமாக மாலை வெளியேறும் நேரம் பதிவாகவில்லை',
    requestDesc: 'விவரமான விளக்கம்',
    requestDescPlaceholder: 'நடந்ததை தெளிவாக கூறவும்: நேரம், தேதி, உடன் இருந்த மேற்பார்வையாளர்...',
    relevantDate: 'சம்பந்தப்பட்ட தேதி / ஷிப்ட்',
    relatedRecord: 'வருகை அல்லது சம்பள சீட்டு எண் (விருப்பத்தேர்வு)',
    preferredLanguage: 'பதில் எதிர்பார்க்கும் மொழி',
    voiceNote: 'குரல் பதிவு (Voice Note)',
    recordVoice: 'பேச அழுத்தவும் (Hold to Record)',
    stopRecording: 'பதிவை நிறுத்தவும்',
    recording: 'குரல் பதிவாகிறது...',
    reRecord: 'மீண்டும் பதிவு செய்',
    transcriptLabel: 'பேசிய உரை (திருத்தக்கூடியது)',
    transcriptHelp: 'அனுப்பும் முன் இந்த உரையை படித்து தேவைப்பட்டால் திருத்திக் கொள்ளலாம்.',
    aiAssistBtn: 'AI உதவி & மொழிபெயர்ப்பு',
    aiAnalyzing: 'AI சரிபார்க்கிறது...',
    aiDisclaimer: 'AI பரிந்துரைகள் உதவிக்கு மட்டுமே. சமர்ப்பிக்கும் முன் முழு உரிமை உங்களிடமே உள்ளது.',
    submitRequestBtn: 'மேலாளருக்கு சமர்ப்பிக்கவும்',
    saveDraftBtn: 'சாதனத்தில் சேமித்து வைக்கவும்',
    disclaimerNotice: 'கோரிக்கை சமர்ப்பிப்பது தானாக பதிவுகளை மாற்றாது. அங்கீகரிக்கப்பட்ட மேலாளர் பரிசீலித்து ஒப்புதல் அளித்த பின்னரே திருத்தம் செய்யப்படும்.',
    requestHistory: 'உங்கள் சமர்ப்பிக்கப்பட்ட கோரிக்கைகள்',
    refNumber: 'குறிப்பு எண் (Ref #)',
    statusLabel: 'நிலை',
    viewDetails: 'விவரங்கள் & காலவரிசை',
    allCategories: 'அனைத்து வகைகள்',
    filterStatus: 'நிலையை வடிகட்டவும்',

    // Categories
    catMissedClock: '1. வருகை அல்லது வெளியேறும் நேரம் தவறவிட்டது',
    catIncorrectHours: '2. தவறான வேலை நேரம் அல்லது வருகை',
    catMissingSalary: '3. சம்பள பாக்கி அல்லது தவறான தொகை',
    catIncorrectOT: '4. தவறான கூடுதல் நேர (OT) கணக்கீடு',
    catMissingPayslip: '5. சம்பள சீட்டு கிடைக்கவில்லை',
    catIncorrectDeduction: '6. தவறான பிடித்தம் அல்லது படிகள்',
    catLeaveShiftCorrection: '7. விடுப்பு அல்லது ஷிப்ட் திருத்தம்',
    catProfileCorrection: '8. தொழிலாளர் விவர திருத்தம்',
    catMissingTraining: '9. விடுபட்ட பயிற்சி அல்லது திறன் பதிவு',
    catWorkplaceSafety: '10. பணியிட பாதுகாப்பு பிரச்சனை',
    catOtherRequest: '11. பிற கோரிக்கைகள்',

    // Statuses
    statusDraft: 'வரைவு',
    statusWaiting: 'அனுப்ப காத்திருக்கிறது',
    statusSubmitted: 'சமர்ப்பிக்கப்பட்டது',
    statusUnderReview: 'பரிசீலனையில்',
    statusMoreInfo: 'கூடுதல் தகவல் தேவை',
    statusApproved: 'ஒப்புதல் அளிக்கப்பட்டது',
    statusRejected: 'நிராகரிக்கப்பட்டது',
    statusResolved: 'தீர்வு காணப்பட்டது',

    // Payslip
    payslipTitle: 'வெளிப்படையான சம்பள விவரம்',
    payslipSub: 'உங்கள் சம்பளம், கூடுதல் நேரம், படிகள் மற்றும் பிடித்தங்களை சரிபார்க்கவும்.',
    selectPeriod: 'சம்பள காலத்தை தேர்ந்தெடுக்கவும்',
    grossEarnings: 'மொத்த வருமானம்',
    totalDeductions: 'மொத்த பிடித்தங்கள்',
    netPayable: 'கையில் கிடைக்கும் நிகர சம்பளம்',
    formulaLabel: 'கணக்கீட்டு முறை',
    baseRate: 'அடிப்படை மணிநேர ஊதியம்',
    regularHours: 'சாதாரண வேலை நேரம்',
    regularPay: 'சாதாரண ஊதியம்',
    otHours: 'கூடுதல் நேரம் (OT)',
    otRate: 'கூடுதல் நேர விகிதம்',
    otPay: 'கூடுதல் நேர ஊதியம்',
    allowances: 'படிகள் & போனஸ்',
    deductionsItemized: 'பிடித்த விவரங்கள்',
    reportProblem: 'இந்த சம்பளத்தில் பிரச்சனை தெரிவிக்க',
    explainLineItem: 'AI விளக்கம் கேட்க',
    printPayslip: 'அச்சிட / பதிவிறக்க',

    // Safety & Wellbeing
    safetyTitle: 'பணியிட பாதுகாப்பு & நல்வாழ்வு',
    tabFatigue: 'அளவுக்கு அதிகமான சோர்வு',
    tabIncidents: 'விபத்துக்கள் & ஆபத்துகள்',
    tabEmergency: 'அவசர தொடர்புகள்',
    reportFatigue: 'சோர்வை பதிவு செய்ய',
    hoursWorkedToday: 'இன்றைய வேலை நேரம்',
    restHours: 'முந்தைய ஷிப்ட்க்கு பின் ஓய்வு நேரம்',
    severityLevel: 'சோர்வின் தீவிரம்',
    reportIncident: 'ஆபத்து அல்லது காயத்தை தெரிவிக்க',
    incidentType: 'சம்பவ வகை',
    affectedBodyArea: 'பாதிக்கப்பட்ட உடல் பகுதி (காயமடைந்தால்)',
    immediateHelpNeeded: 'உடனடி முதலுதவி தேவை',
    emergencyTitle: 'தள அவசர உதவி எண்கள்',
    callNow: 'உடனே அழைக்க',
    firstAider: 'சான்றளிக்கப்பட்ட முதலுதவியாளர்',
    safetyOfficer: 'தள பாதுகாப்பு அதிகாரி',
    siteSupervisor: 'பணி மேற்பார்வையாளர்',
    siteClinic: 'அருகிலுள்ள மருத்துவ மையம்',
    emergencyGuidance: 'உயிருக்கு ஆபத்தான சூழலில் உடனே அவசர சிகிச்சை சேவைகளை தொடர்பு கொள்ளவும். ஆப் பதிலுக்காக காத்திருக்க வேண்டாம்.',

    // Anonymous Feedback
    anonTitle: 'ரகசிய பெயரற்ற கருத்து',
    anonSub: 'எந்தவித பயமும் இன்றி உங்கள் நியாயமான கருத்துக்களை பகிருங்கள்.',
    anonNotice: 'உங்கள் அடையாளம் முற்றிலும் பாதுகாப்பானது. இதில் உங்கள் பெயர், தொழிலாளர் எண் அல்லது கணக்கு விவரங்கள் இணைக்கப்படாது. மேலாளர்களுக்கு ஒட்டுமொத்த கருத்துக்கள் மட்டுமே தெரியும்.',
    anonCategory: 'கருத்து வகை',
    anonFeedbackPlaceholder: 'பணிச்சூழல், நியாயமான நடத்தை, பாதுகாப்பு அல்லது மேற்பார்வையாளர் நடத்தை குறித்து உங்கள் கருத்தை பகிரவும்...',
    submitAnonBtn: 'ரகசியமாக அனுப்பவும்',
    anonSuccess: 'உங்கள் கருத்து பெயரின்றி வெற்றிகரமாக பெறப்பட்டது. பாதுகாப்பான பணியிடத்திற்கு நன்றி.',

    // Skills
    skillPassportTitle: 'தொழிலாளர் திறன் கடவுச்சீட்டு',
    verifiedBadge: 'சரிபார்க்கப்பட்ட சான்றிதழ்',
    selfReportedBadge: 'சுய தகவல் திறன்',
    addSkillBtn: 'புதிய சான்றிதழை சேர்க்க',

    // Manager
    managerDashboardTitle: 'மேலாளர் & நிர்வாகி கட்டுப்பாட்டு அறை',
    inboxRequests: 'கோரிக்கைகள் இன்பாக்ஸ்',
    inboxSafety: 'பாதுகாப்பு ஆய்வு',
    kpiWorkers: 'இன்றைய தொழிலாளர்கள்',
    kpiOvertime: 'கூடுதல் வேலை நேரம்',
    kpiOpenRequests: 'நிலுவை கோரிக்கைகள்',
    kpiDisputes: 'சம்பள புகார்கள்',
    approveBtn: 'திருத்தத்திற்கு ஒப்புதல் அளி',
    rejectBtn: 'நிராகரிக்கவும்',
    requestInfoBtn: 'கூடுதல் தகவல் கேட்கவும்',
    internalNoteLabel: 'அலுவலக குறிப்பு (தொழிலாளருக்கு தெரியாது)',
    workerVisibleReply: 'தொழிலாளருக்கான பதில்',
    resolutionReasonLabel: 'ஒப்புதல் / நிராகரிப்புக்கான அதிகாரப்பூர்வ காரணம்',
    auditTrail: 'தணிக்கை பதிவு (Audit Log)',
  },
};
