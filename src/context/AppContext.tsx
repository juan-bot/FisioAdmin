/* eslint-disable react/only-export-components -- provider and hook intentionally share one module */
import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Patient, Appointment, Prescription, ProgressRecord, DashboardStats } from '../types';
import { useAuth } from './AuthContext';
import { notify } from '../utils/notify';
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
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePrescription: (id: string, data: Partial<Prescription>) => Promise<void>;
  deletePrescription: (id: string) => Promise<void>;
  addProgressRecord: (record: Omit<ProgressRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProgressRecord: (id: string, data: Partial<ProgressRecord>) => Promise<void>;
  deleteProgressRecord: (id: string) => Promise<void>;
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
      Promise.resolve().then(() => {
        setPatients([]);
        setAppointments([]);
        setPrescriptions([]);
        setProgressRecords([]);
        setLoading(false);
      });
      return;
    }
    let active = true;
    const therapistId = profile?.uid || '';
    Promise.all([
      fetchPatients(therapistId),
      fetchAppointments(therapistId),
      fetchPrescriptions(therapistId),
      fetchProgressRecords(therapistId),
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
  }, [status, profile?.uid]);

  const currentTherapist = useMemo(() => {
    if (!profile) return CURRENT_THERAPIST;
    const name = profile.displayName && !profile.displayName.includes('@')
      ? profile.displayName
      : profile.email?.split('@')[0] || 'Terapeuta';
    return { id: profile.uid, name };
  }, [profile]);

  const addPatient = useCallback(async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await createPatient(data);
      const now = new Date().toISOString();
      setPatients(prev => [{ ...data, id, createdAt: now, updatedAt: now }, ...prev]);
      notify('Paciente creado correctamente.');
    } catch (error) { notify('No fue posible crear al paciente.', 'error'); throw error; }
  }, []);

  const updatePatient = useCallback(async (id: string, data: Partial<Patient>) => {
    try { await updatePatientDoc(id, data); setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)); notify('Expediente actualizado.'); }
    catch (error) { notify('No fue posible actualizar el expediente.', 'error'); throw error; }
  }, []);

  const deletePatient = useCallback(async (id: string) => {
    try { await deletePatientDoc(id); setPatients(prev => prev.filter(p => p.id !== id)); notify('Paciente eliminado.'); }
    catch (error) { notify('No fue posible eliminar al paciente.', 'error'); throw error; }
  }, []);

  const addAppointment = useCallback(async (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try { const id = await createAppointment(data); const now = new Date().toISOString(); setAppointments(prev => [{ ...data, id, createdAt: now, updatedAt: now }, ...prev]); notify('Cita guardada correctamente.'); }
    catch (error) { notify('No fue posible guardar la cita.', 'error'); throw error; }
  }, []);

  const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>) => {
    try { await updateAppointmentDoc(id, data); setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a)); notify('Cita actualizada.'); }
    catch (error) { notify('No fue posible actualizar la cita.', 'error'); throw error; }
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    try { await deleteAppointmentDoc(id); setAppointments(prev => prev.filter(a => a.id !== id)); notify('Cita eliminada.'); }
    catch (error) { notify('No fue posible eliminar la cita.', 'error'); throw error; }
  }, []);

  const addPrescription = useCallback(async (data: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>) => {
    try { const id = await createPrescription(data); const now = new Date().toISOString(); setPrescriptions(prev => [{ ...data, id, createdAt: now, updatedAt: now }, ...prev]); notify('Plan terapéutico guardado.'); }
    catch (error) { notify('No fue posible guardar el plan terapéutico.', 'error'); throw error; }
  }, []);

  const updatePrescription = useCallback(async (id: string, data: Partial<Prescription>) => {
    try { await updatePrescriptionDoc(id, data); setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)); notify('Plan terapéutico actualizado.'); }
    catch (error) { notify('No fue posible actualizar el plan terapéutico.', 'error'); throw error; }
  }, []);

  const deletePrescription = useCallback(async (id: string) => {
    try { await deletePrescriptionDoc(id); setPrescriptions(prev => prev.filter(p => p.id !== id)); notify('Plan terapéutico eliminado.'); }
    catch (error) { notify('No fue posible eliminar el plan terapéutico.', 'error'); throw error; }
  }, []);

  const addProgressRecord = useCallback(async (data: Omit<ProgressRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try { const id = await createProgressRecord(data); const now = new Date().toISOString(); setProgressRecords(prev => [{ ...data, id, createdAt: now, updatedAt: now }, ...prev]); notify('Evolución clínica guardada.'); }
    catch (error) { notify('No fue posible guardar la evolución.', 'error'); throw error; }
  }, []);

  const updateProgressRecord = useCallback(async (id: string, data: Partial<ProgressRecord>) => {
    try { await updateProgressRecordDoc(id, data); setProgressRecords(prev => prev.map(r => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r)); notify('Evolución clínica actualizada.'); }
    catch (error) { notify('No fue posible actualizar la evolución.', 'error'); throw error; }
  }, []);

  const deleteProgressRecord = useCallback(async (id: string) => {
    try { await deleteProgressRecordDoc(id); setProgressRecords(prev => prev.filter(r => r.id !== id)); notify('Evolución clínica eliminada.'); }
    catch (error) { notify('No fue posible eliminar la evolución.', 'error'); throw error; }
  }, []);

  const stats = useMemo<DashboardStats>(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const appointmentsToday = appointments.filter(a => a.date === todayISO).length;
    const appointmentsThisWeek = appointments.filter(a => {
      const date = new Date(a.date);
      return date >= startOfWeek && date <= endOfWeek;
    }).length;
    const pendingPrescriptions = prescriptions.filter(p => p.status === 'active').length;
    const chargedAppointments = appointments.filter(a => {
      const d = new Date(a.date);
      return d >= monthStart && d <= monthEnd && a.status !== 'cancelled' && a.status !== 'no-show';
    });
    const revenueThisMonth = chargedAppointments.reduce((sum, a) => sum + (a.amount || 0), 0);
    const completedSessionsThisMonth = chargedAppointments.length;
    const averageProgressScore = progressRecords.length > 0
      ? Math.round(
          progressRecords.reduce((acc, r) => acc + (r.mobilityScore + r.strengthScore + r.functionalScore) / 3, 0) / progressRecords.length
        )
      : 0;

    return {
      totalPatients: patients.length,
      activePatients: patients.filter(p => p.status === 'active').length,
      appointmentsToday,
      appointmentsThisWeek,
      pendingPrescriptions,
      completedSessionsThisMonth,
      revenueThisMonth,
      averageProgressScore,
    };
  }, [appointments, prescriptions, progressRecords, patients]);

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
