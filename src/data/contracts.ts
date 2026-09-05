import type {
  Appointment,
  Patient,
  Prescription,
  ProgressRecord,
  UserProfile,
} from '../types';

type NewRecord<T extends { id: string; createdAt: string; updatedAt: string }> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Port for application persistence. UI and business state depend on this
 * contract, never on a database SDK. A new provider only has to implement it.
 */
export interface ClinicRepository {
  fetchPatients(therapistId: string): Promise<Patient[]>;
  fetchPatientsByTherapist(therapistId: string): Promise<Patient[]>;
  fetchAllPatients(): Promise<Patient[]>;
  createPatient(data: NewRecord<Patient>): Promise<string>;
  updatePatient(id: string, data: Partial<Patient>): Promise<void>;
  deletePatient(id: string): Promise<void>;
  fetchAppointments(therapistId: string): Promise<Appointment[]>;
  fetchAppointmentsByTherapist(therapistId: string): Promise<Appointment[]>;
  fetchAllAppointments(): Promise<Appointment[]>;
  createAppointment(data: NewRecord<Appointment>): Promise<string>;
  updateAppointment(id: string, data: Partial<Appointment>): Promise<void>;
  deleteAppointment(id: string): Promise<void>;
  fetchPrescriptions(therapistId: string): Promise<Prescription[]>;
  createPrescription(data: NewRecord<Prescription>): Promise<string>;
  updatePrescription(id: string, data: Partial<Prescription>): Promise<void>;
  deletePrescription(id: string): Promise<void>;
  fetchProgressRecords(therapistId: string): Promise<ProgressRecord[]>;
  fetchProgressRecordsByTherapist(therapistId: string): Promise<ProgressRecord[]>;
  fetchAllProgressRecords(): Promise<ProgressRecord[]>;
  createProgressRecord(data: NewRecord<ProgressRecord>): Promise<string>;
  updateProgressRecord(id: string, data: Partial<ProgressRecord>): Promise<void>;
  deleteProgressRecord(id: string): Promise<void>;
  fetchUserProfile(uid: string): Promise<UserProfile | null>;
  createUserProfile(profile: UserProfile): Promise<void>;
  fetchUsers(): Promise<UserProfile[]>;
  approveUser(uid: string): Promise<void>;
  updateUserRole(uid: string, role: UserProfile['role']): Promise<void>;
  deleteUser(uid: string): Promise<void>;
  disableUser(uid: string): Promise<void>;
  enableUser(uid: string): Promise<void>;
  fetchBudget(): Promise<number>;
  saveBudget(amount: number): Promise<void>;
}
