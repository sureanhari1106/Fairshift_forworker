export type Sector = 'construction' | 'manufacturing';
export type UserRole = 'worker' | 'manager';

export type RequestCategory =
  | 'missed_clock_in_out'
  | 'incorrect_attendance_hours'
  | 'missing_incorrect_salary'
  | 'incorrect_overtime'
  | 'missing_payslip'
  | 'incorrect_deduction_allowance'
  | 'leave_shift_correction'
  | 'profile_info_correction'
  | 'missing_training_skill'
  | 'workplace_safety_issue'
  | 'other_request';

export type RequestStatus =
  | 'draft'
  | 'waiting_to_send'
  | 'submitted'
  | 'under_review'
  | 'more_info_requested'
  | 'approved'
  | 'rejected'
  | 'resolved';

export interface TimelineEntry {
  timestamp: string;
  actor: string;
  action: string;
  notes?: string;
  isInternal?: boolean;
}

export interface WorkerRequestItem {
  id: string;
  refNumber: string;
  workerId: string;
  workerName: string;
  sector: Sector;
  category: RequestCategory;
  title: string;
  description: string;
  originalLanguage: string;
  relevantDate: string;
  relatedRecordId?: string;
  voiceNoteAudioBase64?: string;
  transcript?: string;
  editedTranscript?: string;
  attachmentName?: string;
  attachmentData?: string;
  status: RequestStatus;
  urgency: 'normal' | 'urgent' | 'critical';
  createdAt: string;
  updatedAt: string;
  workerResponse?: string;
  adminNotes?: string;
  internalStaffNotes?: string;
  resolutionReason?: string;
  timeline: TimelineEntry[];
  aiAnalysis?: {
    summary: string;
    suggestedCategory?: string;
    missingDetails: string[];
    translation?: string;
  };
}

export type SafetyReportType = 'hazard' | 'injury' | 'fatigue' | 'near_miss';
export type SafetyUrgency = 'low' | 'medium' | 'high' | 'immediate_danger';
export type SafetyStatus = 'reported' | 'investigating' | 'mitigated' | 'resolved';

export interface SafetyReportItem {
  id: string;
  refNumber: string;
  reporterId?: string;
  reporterName?: string;
  sector: Sector;
  worksiteName: string;
  reportType: SafetyReportType;
  category: string;
  description: string;
  voiceNoteAudioBase64?: string;
  transcript?: string;
  urgency: SafetyUrgency;
  affectedBodyArea?: string;
  immediateHelpNeeded: boolean;
  status: SafetyStatus;
  createdAt: string;
  immediateGuidance?: string;
  managerFollowUp?: string;
  hoursWorked?: number;
  restHours?: number;
}

export interface AnonymousFeedbackItem {
  id: string;
  sector: Sector;
  category: string;
  feedbackText: string;
  createdAt: string;
  sentiment?: 'positive' | 'neutral' | 'concern' | 'urgent';
  // Note: NO workerId or identifiable fields allowed here!
}

export interface AllowanceItem {
  name: string;
  amount: number;
}

export interface DeductionItem {
  name: string;
  amount: number;
  statutory: boolean;
  description: string;
}

export interface PayrollRecord {
  id: string;
  workerId: string;
  workerName: string;
  sector: Sector;
  payPeriod: string;
  paymentDate: string;
  status: 'paid' | 'pending' | 'disputed';
  baseHourlyRate: number;
  regularHours: number;
  regularEarnings: number;
  overtimeHours: number;
  overtimeMultiplier: number;
  overtimeEarnings: number;
  allowances: AllowanceItem[];
  deductions: DeductionItem[];
  grossEarnings: number;
  totalDeductions: number;
  netPayable: number;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  sector: Sector;
  worksiteName: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  totalHours: number;
  overtimeHours: number;
  status: 'completed' | 'in_progress' | 'disputed' | 'corrected';
}

export interface SkillItem {
  id: string;
  workerId: string;
  skillName: string;
  category: string;
  issuingBody: string;
  issueDate: string;
  expiryDate?: string;
  isVerified: boolean;
  credentialId?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  location: string;
  sector: Sector;
  availableHours: string;
  lastVerified: string;
}

export interface OfflineQueueItem {
  id: string;
  type: 'request' | 'safety' | 'feedback';
  createdAt: string;
  status: 'saved_locally' | 'waiting_to_send' | 'sending' | 'synced' | 'failed';
  data: any;
  retryCount: number;
}
