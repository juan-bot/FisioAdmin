import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, Appointment, Prescription, ProgressRecord, DashboardStats } from '../types';
import { useAuth } from './AuthContext';
import {
  fetchPatients,
  createPatient,
  updatePatientDoc,
  deletePatientDoc,
  fetchAppointments,
  createAppointment,
  updateAppointmentDoc,
  deleteAppointmentDoc,
  fetchPrescriptions,
  createPrescription,
  updatePrescriptionDoc,
  deletePrescriptionDoc,
  fetchProgressRecords,
  createProgressRecord,
  updateProgressRecordDoc,
  deleteProgressRecordDoc,
} from '../firebase/db';

export const CURRENT_THERAPIST = { id: 't1', name: 'Belén Peña' };

interface AppContextType {
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  progressRecords: ProgressRecord[];
  stats: DashboardStats;
  currentTherapist: { id: string; name: string };
  loading: boolean;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePrescription: (id: string, data: Partial<Prescription>) => void;
  deletePrescription: (id: string) => void;
  addProgressRecord: (record: Omit<ProgressRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProgressRecord: (id: string, data: Partial<ProgressRecord>) => void;
  deleteProgressRecord: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { status, profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') {
      setPatients([]);
      setAppointments([]);
      setPrescriptions([]);
      setProgressRecords([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.all([
      fetchPatients(),
      fetchAppointments(),
      fetchPrescriptions(),
      fetchProgressRecords(),
    ])
      .then(([p, a, pr, pg]) => {
        if (!active) return;
        setPatients(p);
        setAppointments(a);
        setPrescriptions(pr);
        setProgressRecords(pg);
      })
      .catch((error) => {
        console.error('Error loading data from Firestore:', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status]);

  const currentTherapist = profile
    ? { id: profile.uid, name: profile.displayName || profile.email }
    : CURRENT_THERAPIST;

  const addPatient = async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await createPatient(data);
    const now = new Date().toISOString();
    setPatients(prev => [{ ...data, id, createdAt: now, updatedAt: now }, ...prev]);
  };

  const updatePatient = async (id: string, data: Partial<Patient>) => {
    await updatePatientDoc(id, data);
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  };

  const deletePatient = async (id: string) => {
    await deletePatientDoc(id);
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const addAppointment = async (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await createAppointment(data);
    const now = new Date().toISOString();
    setAppointments(prev => [{ ...data, id, createdAt: now, updatedAt: now }, ...prev]);
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    await updateAppointmentDoc(id, data);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a));
  };

  const deleteAppointment = async (id: string) => {
    await deleteAppointmentDoc(id);
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const addPrescription = async (data: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await createPrescription(data);
    const now = new Date().toISOString();
    setPrescriptions(prev => [{ ...data, id, createdAt: now, updatedAt: now }, ...prev]);
  };

  const updatePrescription = async (id: string, data: Partial<Prescription>) => {
    await updatePrescriptionDoc(id, data);
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  };

  const deletePrescription = async (id: string) => {
    await deletePrescriptionDoc(id);
    setPrescriptions(prev => prev.filter(p => p.id !== id));
  };

  const addProgressRecord = async (data: Omit<ProgressRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await createProgressRecord(data);
    const now = new Date().toISOString();
    setProgressRecords(prev => [{ ...data, id, createdAt: now, updatedAt: now }, ...prev]);
  };

  const updateProgressRecord = async (id: string, data: Partial<ProgressRecord>) => {
    await updateProgressRecordDoc(id, data);
    setProgressRecords(prev => prev.map(r => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r));
  };

  const deleteProgressRecord = async (id: string) => {
    await deleteProgressRecordDoc(id);
    setProgressRecords(prev => prev.filter(r => r.id !== id));
  };

  const todayISOForStats = new Date().toISOString().split('T')[0];
  const now = new Date();
  const appointmentsToday = appointments.filter(a => a.date === todayISOForStats).length;
  const appointmentsThisWeek = appointments.filter(a => {
    const date = new Date(a.date);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return date >= startOfWeek && date <= endOfWeek;
  }).length;
  const pendingPrescriptions = prescriptions.filter(p => p.status === 'active').length;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthAppointments = appointments.filter(a => {
    const d = new Date(a.date);
    return d >= monthStart && d <= monthEnd;
  });
  const chargedAppointments = monthAppointments.filter(a => a.status !== 'cancelled' && a.status !== 'no-show');
  const revenueThisMonth = chargedAppointments.reduce((sum, a) => sum + (a.amount || 0), 0);
  const completedSessionsThisMonth = chargedAppointments.length;

  const stats: DashboardStats = {
    totalPatients: patients.length,
    activePatients: patients.filter(p => p.status === 'active').length,
    appointmentsToday,
    appointmentsThisWeek,
    pendingPrescriptions,
    completedSessionsThisMonth,
    revenueThisMonth,
    averageProgressScore: 72,
  };

  return (
    <AppContext.Provider value={{
      patients,
      appointments,
      prescriptions,
      progressRecords,
      stats,
      currentTherapist,
      loading,
      addPatient,
      updatePatient,
      deletePatient,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      addPrescription,
      updatePrescription,
      deletePrescription,
      addProgressRecord,
      updateProgressRecord,
      deleteProgressRecord,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
