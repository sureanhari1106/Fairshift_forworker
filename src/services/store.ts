import {
  WorkerRequestItem,
  SafetyReportItem,
  AnonymousFeedbackItem,
  PayrollRecord,
  AttendanceRecord,
  SkillItem,
  EmergencyContact,
  OfflineQueueItem,
  Sector,
  TimelineEntry,
} from '../types';
import {
  db,
  auth,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  REQUESTS: 'fairshift_requests',
  SAFETY_REPORTS: 'fairshift_safety_reports',
  ANONYMOUS_FEEDBACK: 'fairshift_anonymous_feedback',
  PAYROLL: 'fairshift_payroll',
  ATTENDANCE: 'fairshift_attendance',
  SKILLS: 'fairshift_skills',
  OFFLINE_QUEUE: 'fairshift_offline_queue',
  ACTIVE_SECTOR: 'fairshift_active_sector',
  LANGUAGE: 'fairshift_language',
  SIMULATED_OFFLINE: 'fairshift_simulated_offline',
};

// Realistic initial demo seed data (clearly tagged as DEMO)
export const SEED_REQUESTS: WorkerRequestItem[] = [
  {
    id: 'req-001',
    refNumber: 'REQ-2026-8491',
    workerId: 'worker-karthik',
    workerName: 'Karthik Raja',
    sector: 'construction',
    category: 'missed_clock_in_out',
    title: 'Missed evening punch-out due to optical QR scanner freeze',
    description: 'On Oct 24, the site exit terminal 2 screen went black around 18:30. Foreman Murugan saw me leaving with the scaffolding crew. Please adjust my exit time to 18:30.',
    originalLanguage: 'en',
    relevantDate: '2026-10-24',
    status: 'under_review',
    urgency: 'normal',
    createdAt: '2026-10-24T19:15:00Z',
    updatedAt: '2026-10-25T08:30:00Z',
    adminNotes: 'Checked turnstile video backup. Murugan confirmed departure.',
    timeline: [
      {
        timestamp: '2026-10-24T19:15:00Z',
        actor: 'Karthik Raja (Worker)',
        action: 'Request submitted via mobile app.',
      },
      {
        timestamp: '2026-10-25T08:30:00Z',
        actor: 'Admin Senthil (Manager)',
        action: 'Status updated to Under Review. Contacting site supervisor for muster check.',
      },
    ],
    aiAnalysis: {
      summary: 'Worker missed checkout at 18:30 due to site scanner failure; supervisor witness mentioned.',
      missingDetails: ['Exact turnstile gate number'],
    },
  },
  {
    id: 'req-002',
    refNumber: 'REQ-2026-8492',
    workerId: 'worker-karthik',
    workerName: 'Karthik Raja',
    sector: 'construction',
    category: 'incorrect_overtime',
    title: 'Sunday concrete pour overtime logged at 1.0x instead of 1.5x',
    description: 'I worked 6 hours overtime on Sunday Oct 18 for the bridge deck pour. The payslip shows 1.0x base rate instead of statutory Sunday 1.5x rate.',
    originalLanguage: 'ta',
    relevantDate: '2026-10-18',
    status: 'more_info_requested',
    urgency: 'urgent',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-21T14:00:00Z',
    adminNotes: 'Please provide foreman overtime docket slip or photo of muster sheet.',
    timeline: [
      {
        timestamp: '2026-10-20T10:00:00Z',
        actor: 'Karthik Raja (Worker)',
        action: 'Request submitted.',
      },
      {
        timestamp: '2026-10-21T14:00:00Z',
        actor: 'Payroll Officer Anita',
        action: 'More information requested: Please upload photo of yellow shift docket signed by shift engineer.',
      },
    ],
  },
  {
    id: 'req-003',
    refNumber: 'REQ-2026-3101',
    workerId: 'worker-priya',
    workerName: 'Priya Sundaram',
    sector: 'manufacturing',
    category: 'incorrect_deduction_allowance',
    title: 'Safety gear deduction duplicated on October first-half payslip',
    description: 'A deduction of $30 for safety boots was charged on both September 30 payslip and October 15 payslip. The boot replacement was only received once.',
    originalLanguage: 'ta',
    relevantDate: '2026-10-15',
    status: 'approved',
    urgency: 'normal',
    createdAt: '2026-10-16T11:20:00Z',
    updatedAt: '2026-10-17T16:00:00Z',
    adminNotes: 'Stores verified single item issue. $30 reimbursement credit approved for next pay run.',
    resolutionReason: 'Store ledger error verified. Refund of $30 processed to upcoming cycle.',
    timeline: [
      {
        timestamp: '2026-10-16T11:20:00Z',
        actor: 'Priya Sundaram (Worker)',
        action: 'Dispute submitted regarding duplicate boot deduction.',
      },
      {
        timestamp: '2026-10-17T16:00:00Z',
        actor: 'HR Lead David',
        action: 'Approved correction. Audit record #AUD-9122 generated.',
      },
    ],
  },
];

export const SEED_SAFETY_REPORTS: SafetyReportItem[] = [
  {
    id: 'safe-001',
    refNumber: 'SAFE-2026-101',
    reporterId: 'worker-karthik',
    reporterName: 'Karthik Raja',
    sector: 'construction',
    worksiteName: 'Metro Viaduct Pier 14 (Level 3 Scaffolding)',
    reportType: 'hazard',
    category: 'Scaffolding & Work-at-Height',
    description: 'Two loose toe-boards and unpinned coupling clamp on the northern access ladder platform at 12m height. Risk of falling tools onto ground crew.',
    urgency: 'high',
    immediateHelpNeeded: false,
    status: 'investigating',
    createdAt: '2026-10-25T14:10:00Z',
    immediateGuidance: 'Ladder barricaded with red hazard tape. Ground exclusion zone established.',
  },
  {
    id: 'safe-002',
    refNumber: 'SAFE-2026-102',
    reporterId: 'worker-karthik',
    reporterName: 'Karthik Raja',
    sector: 'construction',
    worksiteName: 'Apex Tower Foundation Pit B',
    reportType: 'fatigue',
    category: 'Excessive Consecutive Hours',
    description: 'Third consecutive 12-hour concrete pour shift in 34°C heat. Experiencing extreme dizziness and muscle cramps while operating rebar tie.',
    urgency: 'high',
    immediateHelpNeeded: true,
    status: 'mitigated',
    createdAt: '2026-10-26T15:30:00Z',
    hoursWorked: 12.5,
    restHours: 6.0,
    immediateGuidance: 'Worker relieved from heavy rebar duty. Sent to air-conditioned rest station with hydration salts.',
  },
  {
    id: 'safe-003',
    refNumber: 'SAFE-2026-201',
    reporterId: 'worker-priya',
    reporterName: 'Priya Sundaram',
    sector: 'manufacturing',
    worksiteName: 'Unit 3 Stamping Floor (Hydraulic Press 4)',
    reportType: 'hazard',
    category: 'Machine Guarding & Interlocks',
    description: 'Optical safety light curtain on Press #4 flickers intermittently. The press cycle occasionally fails to halt when reaching past the barrier.',
    urgency: 'immediate_danger',
    immediateHelpNeeded: true,
    status: 'investigating',
    createdAt: '2026-10-26T09:15:00Z',
    immediateGuidance: 'Lockout-Tagout (LOTO) activated on main isolator switch. Maintenance team dispatched.',
  },
];

export const SEED_ANONYMOUS_FEEDBACK: AnonymousFeedbackItem[] = [
  {
    id: 'anon-001',
    sector: 'construction',
    category: 'Safety Culture & Equipment',
    feedbackText: 'Drinking water stations at Viaduct Pier 12 are frequently empty by 13:00 during high-heat days. Workers are hesitant to ask supervisors for extra water breaks.',
    sentiment: 'concern',
    createdAt: '2026-10-22T13:45:00Z',
  },
  {
    id: 'anon-002',
    sector: 'manufacturing',
    category: 'Workload & Rest Intervals',
    feedbackText: 'Break bells on the evening shift are cut short by 5 minutes to clean machines, leaving only 15 minutes to eat lunch. Please ensure full 30-minute rest.',
    sentiment: 'concern',
    createdAt: '2026-10-23T20:10:00Z',
  },
  {
    id: 'anon-003',
    sector: 'construction',
    category: 'Wage Transparency',
    feedbackText: 'The overtime rate for night shift scaffolding work is clear on the board, but the deduction for PPE replacement needs simpler explanations in Tamil.',
    sentiment: 'neutral',
    createdAt: '2026-10-24T16:00:00Z',
  },
];

export const SEED_PAYROLL: PayrollRecord[] = [
  {
    id: 'pay-001',
    workerId: 'worker-karthik',
    workerName: 'Karthik Raja',
    sector: 'construction',
    payPeriod: 'Oct 01, 2026 – Oct 15, 2026',
    paymentDate: '2026-10-20',
    status: 'paid',
    baseHourlyRate: 16.0,
    regularHours: 40.0,
    regularEarnings: 640.0,
    overtimeHours: 8.5,
    overtimeMultiplier: 1.5,
    overtimeEarnings: 204.0,
    allowances: [
      { name: 'Site Hazard & Height Allowance', amount: 50.0 },
      { name: 'Certified Heavy PPE Allowance', amount: 25.0 },
    ],
    deductions: [
      {
        name: 'Statutory Employees Provident Fund (EPF 12%)',
        amount: 76.8,
        statutory: true,
        description: 'Mandatory social security savings for retirement under labor law.',
      },
      {
        name: 'Employees State Insurance (ESI 1.75%)',
        amount: 14.77,
        statutory: true,
        description: 'Full medical and injury coverage for you and family.',
      },
      {
        name: 'Safety Footwear Partial Recovery',
        amount: 30.0,
        statutory: false,
        description: 'Subsidised rate for ASTM F2413 steel-toe work boots.',
      },
    ],
    grossEarnings: 919.0,
    totalDeductions: 121.57,
    netPayable: 797.43,
  },
  {
    id: 'pay-002',
    workerId: 'worker-karthik',
    workerName: 'Karthik Raja',
    sector: 'construction',
    payPeriod: 'Sep 16, 2026 – Sep 30, 2026',
    paymentDate: '2026-10-05',
    status: 'paid',
    baseHourlyRate: 16.0,
    regularHours: 40.0,
    regularEarnings: 640.0,
    overtimeHours: 6.0,
    overtimeMultiplier: 1.5,
    overtimeEarnings: 144.0,
    allowances: [
      { name: 'Site Hazard Allowance', amount: 50.0 },
    ],
    deductions: [
      {
        name: 'Statutory EPF (12%)',
        amount: 76.8,
        statutory: true,
        description: 'Statutory provident fund deduction.',
      },
      {
        name: 'ESI Medical Insurance',
        amount: 13.72,
        statutory: true,
        description: 'Statutory health and injury insurance.',
      },
    ],
    grossEarnings: 834.0,
    totalDeductions: 90.52,
    netPayable: 743.48,
  },
  {
    id: 'pay-003',
    workerId: 'worker-priya',
    workerName: 'Priya Sundaram',
    sector: 'manufacturing',
    payPeriod: 'Oct 01, 2026 – Oct 15, 2026',
    paymentDate: '2026-10-20',
    status: 'disputed',
    baseHourlyRate: 15.5,
    regularHours: 40.0,
    regularEarnings: 620.0,
    overtimeHours: 6.0,
    overtimeMultiplier: 1.5,
    overtimeEarnings: 139.5,
    allowances: [
      { name: 'Night Shift Differential Allowance', amount: 45.0 },
      { name: 'Zero-Defect Quality Incentive', amount: 35.0 },
    ],
    deductions: [
      {
        name: 'Statutory EPF (12%)',
        amount: 74.4,
        statutory: true,
        description: 'Retirement fund contribution matching employer.',
      },
      {
        name: 'ESI Healthcare Contribution',
        amount: 14.69,
        statutory: true,
        description: 'State medical coverage.',
      },
      {
        name: 'Safety Boots Deduction (Disputed - Duplicate)',
        amount: 30.0,
        statutory: false,
        description: 'Deduction under active review via Request REQ-2026-3101.',
      },
    ],
    grossEarnings: 839.5,
    totalDeductions: 119.09,
    netPayable: 720.41,
  },
];

export const SEED_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-001',
    workerId: 'worker-karthik',
    workerName: 'Karthik Raja',
    sector: 'construction',
    worksiteName: 'Metro Viaduct Pier 14',
    date: '2026-10-26',
    clockInTime: '07:30 AM',
    totalHours: 6.5,
    overtimeHours: 0.0,
    status: 'in_progress',
  },
  {
    id: 'att-002',
    workerId: 'worker-karthik',
    workerName: 'Karthik Raja',
    sector: 'construction',
    worksiteName: 'Metro Viaduct Pier 14',
    date: '2026-10-25',
    clockInTime: '07:30 AM',
    clockOutTime: '06:30 PM',
    totalHours: 11.0,
    overtimeHours: 3.0,
    status: 'completed',
  },
  {
    id: 'att-003',
    workerId: 'worker-karthik',
    workerName: 'Karthik Raja',
    sector: 'construction',
    worksiteName: 'Metro Viaduct Pier 14',
    date: '2026-10-24',
    clockInTime: '07:30 AM',
    clockOutTime: '06:30 PM',
    totalHours: 11.0,
    overtimeHours: 3.0,
    status: 'disputed',
  },
  {
    id: 'att-004',
    workerId: 'worker-priya',
    workerName: 'Priya Sundaram',
    sector: 'manufacturing',
    worksiteName: 'Unit 3 Stamping Floor',
    date: '2026-10-26',
    clockInTime: '06:00 AM',
    clockOutTime: '02:30 PM',
    totalHours: 8.5,
    overtimeHours: 0.5,
    status: 'completed',
  },
];

export const SEED_SKILLS: SkillItem[] = [
  {
    id: 'sk-001',
    workerId: 'worker-karthik',
    skillName: 'Certified Scaffolder (Level 2 Advanced)',
    category: 'Work at Height',
    issuingBody: 'National Construction Safety Authority',
    issueDate: '2024-03-15',
    expiryDate: '2027-03-15',
    isVerified: true,
    credentialId: 'CERT-SCAF-8841',
  },
  {
    id: 'sk-002',
    workerId: 'worker-karthik',
    skillName: 'Rigging & Signalperson Certification',
    category: 'Heavy Lifting',
    issuingBody: 'Apex Crane & Rigging Institute',
    issueDate: '2025-01-10',
    expiryDate: '2028-01-10',
    isVerified: true,
    credentialId: 'RIG-2025-091',
  },
  {
    id: 'sk-003',
    workerId: 'worker-karthik',
    skillName: 'Standard First Aid & CPR Level C',
    category: 'Emergency Response',
    issuingBody: 'Red Cross Worker Safety Program',
    issueDate: '2025-06-20',
    expiryDate: '2027-06-20',
    isVerified: true,
    credentialId: 'FA-RC-55219',
  },
  {
    id: 'sk-004',
    workerId: 'worker-karthik',
    skillName: 'Rebar Tying & Formwork Placement',
    category: 'Structural Concrete',
    issuingBody: 'Self-Reported Experience (5+ Years)',
    issueDate: '2021-04-01',
    isVerified: false,
  },
];

export const SEED_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'em-001',
    name: 'Officer Rajesh Kumar',
    role: 'Site Safety Warden (Construction)',
    phone: '+91 98401 23456',
    location: 'Metro Viaduct Safety Shed 1',
    sector: 'construction',
    availableHours: '24/7 During Shifts',
    lastVerified: '2026-10-26 06:00',
  },
  {
    id: 'em-002',
    name: 'Nurse Lakshmi Narayanan',
    role: 'Certified Site Paramedic & First Aider',
    phone: '+91 98402 34567',
    location: 'Main Medical Portakabin',
    sector: 'construction',
    availableHours: '06:00 – 22:00',
    lastVerified: '2026-10-26 06:00',
  },
  {
    id: 'em-003',
    name: 'Supervisor Murugan',
    role: 'Construction Shift Supervisor',
    phone: '+91 98403 45678',
    location: 'Pier 14 Site Office',
    sector: 'construction',
    availableHours: 'Current Shift Lead',
    lastVerified: '2026-10-26 06:00',
  },
  {
    id: 'em-004',
    name: 'Er. Anand Varma',
    role: 'Factory HSE & Fire Safety Manager',
    phone: '+91 98405 67890',
    location: 'Factory Floor Admin Block',
    sector: 'manufacturing',
    availableHours: '24/7 Hotline',
    lastVerified: '2026-10-26 06:00',
  },
  {
    id: 'em-005',
    name: 'Industrial First Aid Unit',
    role: 'Factory On-Site Triage Station',
    phone: '+91 98406 78901',
    location: 'Unit 3 West Wing',
    sector: 'manufacturing',
    availableHours: 'All Production Shifts',
    lastVerified: '2026-10-26 06:00',
  },
  {
    id: 'em-006',
    name: 'Government General Hospital Emergency',
    role: 'Designated Trauma Centre',
    phone: '108 (or +91 44 2530 5000)',
    location: '2.8 km from worksite (8 mins via bypass)',
    sector: 'construction',
    availableHours: '24 Hours Emergency Service',
    lastVerified: '2026-10-26 00:00',
  },
];

function loadFromStorage<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return seed;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export class FairShiftStore {
  // Local cache reads
  static getRequests(): WorkerRequestItem[] {
    return loadFromStorage<WorkerRequestItem[]>(STORAGE_KEYS.REQUESTS, SEED_REQUESTS);
  }

  static saveRequests(items: WorkerRequestItem[]): void {
    saveToStorage(STORAGE_KEYS.REQUESTS, items);
  }

  static addRequest(request: WorkerRequestItem): void {
    const requests = this.getRequests();
    const updated = [request, ...requests];
    this.saveRequests(updated);
  }

  static updateRequest(id: string, updater: (req: WorkerRequestItem) => WorkerRequestItem): WorkerRequestItem | null {
    const requests = this.getRequests();
    const idx = requests.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const updated = updater(requests[idx]);
    requests[idx] = updated;
    this.saveRequests(requests);
    return updated;
  }

  static getSafetyReports(): SafetyReportItem[] {
    return loadFromStorage<SafetyReportItem[]>(STORAGE_KEYS.SAFETY_REPORTS, SEED_SAFETY_REPORTS);
  }

  static addSafetyReport(report: SafetyReportItem): void {
    const reports = this.getSafetyReports();
    const updated = [report, ...reports];
    saveToStorage(STORAGE_KEYS.SAFETY_REPORTS, updated);
  }

  static updateSafetyReport(id: string, updater: (item: SafetyReportItem) => SafetyReportItem): void {
    const reports = this.getSafetyReports();
    const idx = reports.findIndex((r) => r.id === id);
    if (idx !== -1) {
      reports[idx] = updater(reports[idx]);
      saveToStorage(STORAGE_KEYS.SAFETY_REPORTS, reports);
    }
  }

  static getAnonymousFeedback(): AnonymousFeedbackItem[] {
    return loadFromStorage<AnonymousFeedbackItem[]>(STORAGE_KEYS.ANONYMOUS_FEEDBACK, SEED_ANONYMOUS_FEEDBACK);
  }

  static addAnonymousFeedback(feedback: AnonymousFeedbackItem): void {
    const cleanItem: AnonymousFeedbackItem = {
      id: feedback.id,
      sector: feedback.sector,
      category: feedback.category,
      feedbackText: feedback.feedbackText,
      createdAt: feedback.createdAt,
      sentiment: feedback.sentiment || 'concern',
    };
    const items = this.getAnonymousFeedback();
    const updated = [cleanItem, ...items];
    saveToStorage(STORAGE_KEYS.ANONYMOUS_FEEDBACK, updated);
  }

  static getPayroll(workerId?: string): PayrollRecord[] {
    const all = loadFromStorage<PayrollRecord[]>(STORAGE_KEYS.PAYROLL, SEED_PAYROLL);
    if (!workerId) return all;
    return all.filter((p) => p.workerId === workerId);
  }

  static getAttendance(workerId?: string): AttendanceRecord[] {
    const all = loadFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
    if (!workerId) return all;
    return all.filter((a) => a.workerId === workerId);
  }

  static addAttendanceRecord(rec: AttendanceRecord): void {
    const all = this.getAttendance();
    saveToStorage(STORAGE_KEYS.ATTENDANCE, [rec, ...all]);
  }

  static getSkills(workerId?: string): SkillItem[] {
    const all = loadFromStorage<SkillItem[]>(STORAGE_KEYS.SKILLS, SEED_SKILLS);
    if (!workerId) return all;
    return all.filter((s) => s.workerId === workerId);
  }

  static addSkill(skill: SkillItem): void {
    const all = this.getSkills();
    saveToStorage(STORAGE_KEYS.SKILLS, [skill, ...all]);
  }

  static getEmergencyContacts(sector?: Sector): EmergencyContact[] {
    if (!sector) return SEED_EMERGENCY_CONTACTS;
    return SEED_EMERGENCY_CONTACTS.filter((c) => c.sector === sector || c.role.includes('Hospital'));
  }

  // Offline queue
  static getOfflineQueue(): OfflineQueueItem[] {
    return loadFromStorage<OfflineQueueItem[]>(STORAGE_KEYS.OFFLINE_QUEUE, []);
  }

  static saveOfflineQueue(items: OfflineQueueItem[]): void {
    saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, items);
  }

  static addToOfflineQueue(item: OfflineQueueItem): void {
    const queue = this.getOfflineQueue();
    if (!queue.some((q) => q.id === item.id)) {
      this.saveOfflineQueue([...queue, item]);
    }
  }

  static removeFromOfflineQueue(id: string): void {
    const queue = this.getOfflineQueue();
    this.saveOfflineQueue(queue.filter((q) => q.id !== id));
  }

  static clearOfflineQueue(): void {
    saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, []);
  }

  static getActiveSector(): Sector {
    return (localStorage.getItem(STORAGE_KEYS.ACTIVE_SECTOR) as Sector) || 'construction';
  }

  static setActiveSector(sector: Sector): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SECTOR, sector);
  }

  static isSimulatedOffline(): boolean {
    return localStorage.getItem(STORAGE_KEYS.SIMULATED_OFFLINE) === 'true';
  }

  static setSimulatedOffline(val: boolean): void {
    localStorage.setItem(STORAGE_KEYS.SIMULATED_OFFLINE, val ? 'true' : 'false');
  }

  static resetDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(SEED_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.SAFETY_REPORTS, JSON.stringify(SEED_SAFETY_REPORTS));
    localStorage.setItem(STORAGE_KEYS.ANONYMOUS_FEEDBACK, JSON.stringify(SEED_ANONYMOUS_FEEDBACK));
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(SEED_PAYROLL));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(SEED_ATTENDANCE));
    localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(SEED_SKILLS));
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
  }

  // --------------------------------------------------------------------------
  // FIRESTORE LIVE ASYNC PERSISTENCE (Confirmed Real Reads & Writes)
  // --------------------------------------------------------------------------

  // Add Worker Request to Firestore with confirmation
  static async addRequestToFirestore(request: WorkerRequestItem): Promise<boolean> {
    const path = `workerRequests/${request.id}`;
    try {
      // 1. Update local cache immediately for responsive feel
      this.addRequest(request);

      // 2. If authenticated, persist to Firestore
      if (auth.currentUser) {
        await setDoc(doc(db, 'workerRequests', request.id), {
          ...request,
          organizationId: 'org-metro-infra-01',
          workerId: auth.currentUser.uid,
          updatedAt: new Date().toISOString(),
        });
        return true;
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Update Worker Request in Firestore with Manager Decision & Audit Log
  static async updateRequestInFirestore(
    id: string,
    updates: Partial<WorkerRequestItem>,
    timelineEntry?: TimelineEntry
  ): Promise<boolean> {
    const path = `workerRequests/${id}`;
    try {
      this.updateRequest(id, (prev) => {
        const newTimeline = timelineEntry ? [...prev.timeline, timelineEntry] : prev.timeline;
        return {
          ...prev,
          ...updates,
          timeline: newTimeline,
          updatedAt: new Date().toISOString(),
        };
      });

      if (auth.currentUser) {
        const docRef = doc(db, 'workerRequests', id);
        await setDoc(docRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });

        // Record in audit log if privileged decision
        if (updates.status === 'approved' || updates.status === 'rejected') {
          const auditPath = 'auditLogs';
          const auditId = `aud-${Date.now()}`;
          await setDoc(doc(db, auditPath, auditId), {
            id: auditId,
            organizationId: 'org-metro-infra-01',
            actorId: auth.currentUser.uid,
            actionType: `REQUEST_${updates.status.toUpperCase()}`,
            targetEntity: 'WorkerRequest',
            targetId: id,
            details: updates.resolutionReason || updates.adminNotes || 'Manager resolution',
            timestamp: new Date().toISOString(),
          });
        }
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  // Add Safety Report to Firestore with confirmation
  static async addSafetyReportToFirestore(report: SafetyReportItem): Promise<boolean> {
    const path = `safetyReports/${report.id}`;
    try {
      this.addSafetyReport(report);

      if (auth.currentUser) {
        await setDoc(doc(db, 'safetyReports', report.id), {
          ...report,
          organizationId: 'org-metro-infra-01',
          reporterId: auth.currentUser.uid,
        });
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Add Anonymous Feedback to Firestore (Strictly sans worker identifiers)
  static async addAnonymousFeedbackToFirestore(feedback: AnonymousFeedbackItem): Promise<boolean> {
    const path = `anonymousFeedback/${feedback.id}`;
    try {
      const cleanFeedback: AnonymousFeedbackItem = {
        id: feedback.id,
        sector: feedback.sector,
        category: feedback.category,
        feedbackText: feedback.feedbackText,
        createdAt: feedback.createdAt,
        sentiment: feedback.sentiment || 'concern',
      };
      this.addAnonymousFeedback(cleanFeedback);

      if (auth.currentUser) {
        // Enforce zero workerId / authorId
        await setDoc(doc(db, 'anonymousFeedback', cleanFeedback.id), {
          id: cleanFeedback.id,
          organizationId: 'org-metro-infra-01',
          sector: cleanFeedback.sector,
          category: cleanFeedback.category,
          feedbackText: cleanFeedback.feedbackText,
          createdAt: cleanFeedback.createdAt,
          sentiment: cleanFeedback.sentiment,
        });
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Add Attendance Event to Firestore
  static async addAttendanceToFirestore(record: AttendanceRecord): Promise<boolean> {
    const path = `attendance/${record.id}`;
    try {
      this.addAttendanceRecord(record);

      if (auth.currentUser) {
        await setDoc(doc(db, 'attendance', record.id), {
          ...record,
          organizationId: 'org-metro-infra-01',
          workerId: auth.currentUser.uid,
        });
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Add Skill Passport item to Firestore
  static async addSkillToFirestore(skill: SkillItem): Promise<boolean> {
    const path = `skillPassport/${skill.id}`;
    try {
      this.addSkill(skill);

      if (auth.currentUser) {
        await setDoc(doc(db, 'skillPassport', skill.id), {
          ...skill,
          organizationId: 'org-metro-infra-01',
          workerId: auth.currentUser.uid,
        });
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Seed baseline organization and demo datasets into Firestore
  static async seedInitialDataToFirestore(): Promise<void> {
    if (!auth.currentUser) return;
    try {
      // 1. Organization
      await setDoc(
        doc(db, 'organizations', 'org-metro-infra-01'),
        {
          id: 'org-metro-infra-01',
          name: 'Metro Infrastructure & Apex Manufacturing Consortium',
          sector: 'construction',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 2. Worksites
      await setDoc(
        doc(db, 'worksites', 'site-pier-14'),
        {
          id: 'site-pier-14',
          organizationId: 'org-metro-infra-01',
          name: 'Metro Viaduct Pier 14 (Level 3 Scaffolding)',
          sector: 'construction',
          location: 'Outer Ring Corridor, Pier 14',
          safetyOfficer: 'Officer Rajesh Kumar',
          emergencyPhone: '+91 98401 23456',
        },
        { merge: true }
      );

      await setDoc(
        doc(db, 'worksites', 'site-factory-unit3'),
        {
          id: 'site-factory-unit3',
          organizationId: 'org-metro-infra-01',
          name: 'Unit 3 Stamping Floor (Line B)',
          sector: 'manufacturing',
          location: 'Heavy Press Bay 4',
          safetyOfficer: 'Er. Anand Varma',
          emergencyPhone: '+91 98405 67890',
        },
        { merge: true }
      );

      // 3. Emergency Contacts
      for (const contact of SEED_EMERGENCY_CONTACTS) {
        await setDoc(doc(db, 'emergencyContacts', contact.id), contact, { merge: true });
      }

      // 4. Payroll Records
      for (const pay of SEED_PAYROLL) {
        await setDoc(
          doc(db, 'payroll', pay.id),
          {
            ...pay,
            organizationId: 'org-metro-infra-01',
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('Initial Firestore seed attempt caught:', err);
    }
  }
}
