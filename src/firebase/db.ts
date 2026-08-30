import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  where,
} from 'firebase/firestore';
import { db } from './config';
import {
  Patient,
  Appointment,
  Prescription,
  ProgressRecord,
  UserProfile,
} from '../types';

const patientsCol = collection(db, 'patients');
const appointmentsCol = collection(db, 'appointments');
const prescriptionsCol = collection(db, 'prescriptions');
const progressCol = collection(db, 'progressRecords');
const usersCol = collection(db, 'users');

export async function fetchPatients(): Promise<Patient[]> {
  const snap = await getDocs(query(patientsCol, orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Patient, 'id'>) }));
}

export async function createPatient(data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(patientsCol, { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  return ref.id;
}

export async function updatePatientDoc(id: string, data: Partial<Patient>): Promise<void> {
  await updateDoc(doc(patientsCol, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deletePatientDoc(id: string): Promise<void> {
  await deleteDoc(doc(patientsCol, id));
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const snap = await getDocs(query(appointmentsCol, orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Appointment, 'id'>) }));
}

export async function createAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(appointmentsCol, { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  return ref.id;
}

export async function updateAppointmentDoc(id: string, data: Partial<Appointment>): Promise<void> {
  await updateDoc(doc(appointmentsCol, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteAppointmentDoc(id: string): Promise<void> {
  await deleteDoc(doc(appointmentsCol, id));
}

export async function fetchPrescriptions(): Promise<Prescription[]> {
  const snap = await getDocs(query(prescriptionsCol, orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Prescription, 'id'>) }));
}

export async function createPrescription(data: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(prescriptionsCol, { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  return ref.id;
}

export async function updatePrescriptionDoc(id: string, data: Partial<Prescription>): Promise<void> {
  await updateDoc(doc(prescriptionsCol, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deletePrescriptionDoc(id: string): Promise<void> {
  await deleteDoc(doc(prescriptionsCol, id));
}

export async function fetchProgressRecords(): Promise<ProgressRecord[]> {
  const snap = await getDocs(query(progressCol, orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ProgressRecord, 'id'>) }));
}

export async function createProgressRecord(data: Omit<ProgressRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(progressCol, { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  return ref.id;
}

export async function updateProgressRecordDoc(id: string, data: Partial<ProgressRecord>): Promise<void> {
  await updateDoc(doc(progressCol, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteProgressRecordDoc(id: string): Promise<void> {
  await deleteDoc(doc(progressCol, id));
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(usersCol, uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...(snap.data() as Omit<UserProfile, 'uid'>) };
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(usersCol, profile.uid), profile);
}

export async function isFirstUser(): Promise<boolean> {
  const snap = await getDocs(query(usersCol, limit(1)));
  return snap.empty;
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(query(usersCol, orderBy('createdAt', 'asc')));
  return snap.docs.map(d => ({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
}

export async function approveUser(uid: string): Promise<void> {
  await updateDoc(doc(usersCol, uid), { approved: true, role: 'therapist' });
}

export async function updateUserRole(uid: string, role: UserProfile['role']): Promise<void> {
  await updateDoc(doc(usersCol, uid), { role });
}

export async function deleteUserDoc(uid: string): Promise<void> {
  const batch = writeBatch(db);

  const prescriptionsSnap = await getDocs(query(prescriptionsCol, where('therapistId', '==', uid)));
  prescriptionsSnap.docs.forEach(d => batch.delete(doc(prescriptionsCol, d.id)));

  const appointmentsSnap = await getDocs(query(appointmentsCol, where('therapistId', '==', uid)));
  appointmentsSnap.docs.forEach(d => batch.delete(doc(appointmentsCol, d.id)));

  const progressSnap = await getDocs(query(progressCol, where('therapistId', '==', uid)));
  progressSnap.docs.forEach(d => batch.delete(doc(progressCol, d.id)));

  batch.delete(doc(usersCol, uid));

  await batch.commit();
}

export async function disableUser(uid: string): Promise<void> {
  await updateDoc(doc(usersCol, uid), { disabled: true });
}

export async function enableUser(uid: string): Promise<void> {
  await updateDoc(doc(usersCol, uid), { disabled: false });
}

export async function softDeleteUser(uid: string): Promise<void> {
  await updateDoc(doc(usersCol, uid), { 
    deletedAt: new Date().toISOString(),
    disabled: true 
  });
}

const settingsCol = collection(db, 'settings');

export async function fetchBudget(): Promise<number> {
  const snap = await getDoc(doc(settingsCol, 'budget'));
  return snap.exists() ? (snap.data().amount as number) : 0;
}

export async function saveBudget(amount: number): Promise<void> {
  await setDoc(doc(settingsCol, 'budget'), { amount, updatedAt: new Date().toISOString() });
}

export { serverTimestamp };
