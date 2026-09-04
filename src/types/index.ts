export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: string;
  allergies: string;
  medications: string;
  familyMedicalHistory: { member: string; condition: string }[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'discharged';
  therapistId: string;
  demographics?: {
    placeOfOrigin: string;
    education: string;
    occupation: string;
    maritalStatus: string;
    religion: string;
  };
  clinicalAssessment?: ClinicalAssessment;
}

export interface BilateralMeasurement {
  name: string;
  movement?: string;
  reference?: string;
  right: string;
  left: string;
}

export interface ClinicalAssessment {
  assessmentDate: string;
  therapistName: string;
  reasonForConsultation: string;
  nonPathologicalHistory: {
    smoking: string;
    alcohol: string;
    drugs: string;
    physicalActivity: string;
    mealsPerDay: string;
    housing: string;
  };
  gynecologicalHistory: {
    menarche: string;
    pregnancies: string;
    births: string;
    abortions: string;
  };
  pathologicalHistory: {
    diseases: string;
    detectionDate: string;
    trauma: string;
    hospitalizations: string;
    surgeries: string;
  };
  vitalSigns: {
    bloodPressure: string;
    heartRate: string;
    respiratoryRate: string;
    temperature: string;
    glucose: string;
    oxygenSaturation: string;
    height: string;
    weight: string;
  };
  painAssessment: {
    onset: string;
    location: string;
    radiation: string;
    characteristics: string;
    intensity: string;
    aggravatingFactors: string;
  };
  posturalFindings: string;
  gait: {
    independent: boolean;
    assistiveDevice: string;
    observations: string;
  };
  goniometry: BilateralMeasurement[];
  muscleStrength: BilateralMeasurement[];
  reflexes: BilateralMeasurement[];
  sensitivity: string;
  specialTests: string;
  physiotherapyDiagnosis: string;
  notes: string;
}

export interface TherapeuticReportData {
  date: string;
  addressee: string;
  diagnosis: string;
  clinicalStatus: string;
  recommendations: string[];
  returnPlan: string;
  therapistName: string;
  professionalLicense: string;
  clinicName: string;
  phone: string;
  email: string;
  address: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'evaluation' | 'treatment' | 'follow-up' | 're-evaluation';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  therapistId: string;
  therapistName: string;
  notes: string;
  sessionNote?: SessionNote;
  amount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionNote {
  arrivalStatus: string;
  painBefore: number | null;
  clinicalFindings: string;
  interventions: string;
  patientResponse: string;
  painAfter: number | null;
  homeInstructions: string;
  nextSessionPlan: string;
  alerts: string;
  completedAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  date: string;
  diagnosis: string;
  treatments: Treatment[];
  frequency: string;
  duration: string;
  notes: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: number;
  duration?: number;
  frequency: string;
  notes: string;
}

export interface ProgressRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  therapistId: string;
  therapistName: string;
  metrics: Metric[];
  painLevel: number;
  mobilityScore: number;
  strengthScore: number;
  functionalScore: number;
  notes: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  targetValue?: number;
  previousValue?: number;
  category: 'rom' | 'strength' | 'pain' | 'functional' | 'other';
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  pendingPrescriptions: number;
  completedSessionsThisMonth: number;
  revenueThisMonth: number;
  averageProgressScore: number;
}

export type UserRole = 'admin' | 'therapist' | 'pending';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  approved: boolean;
  disabled: boolean;
  createdAt: string;
  deletedAt?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}
