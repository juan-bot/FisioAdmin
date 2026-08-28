import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, Appointment, Prescription, ProgressRecord, DashboardStats } from '../types';

export const CURRENT_THERAPIST = { id: 't1', name: 'Belén Peña' };

interface AppContextType {
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  progressRecords: ProgressRecord[];
  stats: DashboardStats;
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

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const today = new Date();
const todayISO = today.toISOString().split('T')[0];

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowISO = tomorrow.toISOString().split('T')[0];

const initialPatients: Patient[] = [
  {
    id: 'p1',
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@email.com',
    phone: '555-123-4567',
    dateOfBirth: '1992-05-15',
    gender: 'female',
    address: 'Av. Reforma 123, CDMX',
    emergencyContact: { name: 'Juan González', phone: '555-987-6543', relationship: 'Esposo' },
    medicalHistory: 'Hipertensión controlada',
    allergies: 'Penicilina',
    medications: 'Losartán',
    insuranceProvider: 'Seguro Médico',
    insuranceNumber: 'SMP-2024-001',
    notes: 'Paciente referida por ortopedia',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-08-20T14:00:00Z',
    status: 'active',
  },
  {
    id: 'p2',
    firstName: 'Carlos',
    lastName: 'Ramírez',
    email: 'carlos.ramirez@email.com',
    phone: '555-234-5678',
    dateOfBirth: '1985-11-03',
    gender: 'male',
    address: 'Calle 45 #23-45, Monterrey',
    emergencyContact: { name: 'Ana Ramírez', phone: '555-876-5432', relationship: 'Esposa' },
    medicalHistory: 'Lesión de rodilla izquierda en 2022',
    allergies: 'Ninguna',
    medications: 'Ibuprofeno ocasional',
    insuranceProvider: 'Seguro Médico',
    insuranceNumber: 'SMP-2024-002',
    notes: 'Recuperación post-cirugía de LCA',
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-08-22T10:30:00Z',
    status: 'active',
  },
  {
    id: 'p3',
    firstName: 'Ana',
    lastName: 'López',
    email: 'ana.lopez@email.com',
    phone: '555-345-6789',
    dateOfBirth: '1990-03-22',
    gender: 'female',
    address: 'Blvd. Principal 567, Guadalajara',
    emergencyContact: { name: 'Pedro López', phone: '555-765-4321', relationship: 'Hermano' },
    medicalHistory: 'Hernia lumbar L4-L5',
    allergies: 'Aspirina',
    medications: 'Ninguno',
    insuranceProvider: 'Seguro Médico',
    insuranceNumber: 'SMP-2024-003',
    notes: 'Tratamiento para dolor lumbar crónico',
    createdAt: '2026-03-05T11:00:00Z',
    updatedAt: '2026-08-25T16:00:00Z',
    status: 'active',
  },
  {
    id: 'p4',
    firstName: 'Roberto',
    lastName: 'Martínez',
    email: 'roberto.martinez@email.com',
    phone: '555-456-7890',
    dateOfBirth: '1978-09-10',
    gender: 'male',
    address: 'Calle Los Pinos 45, Puebla',
    emergencyContact: { name: 'Laura Martínez', phone: '555-654-3210', relationship: 'Esposa' },
    medicalHistory: 'Diabetes tipo 2',
    allergies: 'Ninguna',
    medications: 'Metformina',
    insuranceProvider: 'Seguro Médico',
    insuranceNumber: 'SMP-2024-004',
    notes: 'Fascitis plantar derecha',
    createdAt: '2026-04-20T09:00:00Z',
    updatedAt: '2026-08-23T11:30:00Z',
    status: 'active',
  },
  {
    id: 'p5',
    firstName: 'Laura',
    lastName: 'Hernández',
    email: 'laura.hernandez@email.com',
    phone: '555-567-8901',
    dateOfBirth: '2000-07-28',
    gender: 'female',
    address: 'Av. Central 890, Toluca',
    emergencyContact: { name: 'Miguel Hernández', phone: '555-543-2109', relationship: 'Padre' },
    medicalHistory: 'Fractura de muñeca izquierda',
    allergies: 'Ninguna',
    medications: 'Ninguno',
    insuranceProvider: 'Seguro Médico',
    insuranceNumber: 'SMP-2024-005',
    notes: 'Perfil deportista, lesión en muñeca',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-08-26T09:00:00Z',
    status: 'active',
  },
  {
    id: 'p6',
    firstName: 'Jorge',
    lastName: 'Sánchez',
    email: 'jorge.sanchez@email.com',
    phone: '555-678-9012',
    dateOfBirth: '1965-01-14',
    gender: 'male',
    address: 'Calle Roble 12, Querétaro',
    emergencyContact: { name: 'Marta Sánchez', phone: '555-432-1098', relationship: 'Esposa' },
    medicalHistory: 'Artritis reumatoide',
    allergies: 'Sulfas',
    medications: 'Metotrexato',
    insuranceProvider: 'Seguro Médico',
    insuranceNumber: 'SMP-2024-006',
    notes: 'Dolor articular crónico',
    createdAt: '2026-01-30T08:00:00Z',
    updatedAt: '2026-08-18T15:00:00Z',
    status: 'active',
  },
  {
    id: 'p7',
    firstName: 'Daniela',
    lastName: 'Flores',
    email: 'daniela.flores@email.com',
    phone: '555-789-0123',
    dateOfBirth: '1995-04-18',
    gender: 'female',
    address: 'Calle Sol 34, León',
    emergencyContact: { name: 'Alejandro Flores', phone: '555-321-0987', relationship: 'Esposo' },
    medicalHistory: 'Lesión de manguito rotador',
    allergies: 'Ninguna',
    medications: 'Ninguno',
    insuranceProvider: 'Seguro Médico',
    insuranceNumber: 'SMP-2024-007',
    notes: 'Rehabilitación de hombro derecho',
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-08-24T13:00:00Z',
    status: 'active',
  },
  {
    id: 'p8',
    firstName: 'Miguel',
    lastName: 'Chávez',
    email: 'miguel.chavez@email.com',
    phone: '555-890-1234',
    dateOfBirth: '1988-08-01',
    gender: 'male',
    address: 'Blvd. Norte 678, Puebla',
    emergencyContact: { name: 'Carmen Chávez', phone: '555-210-9876', relationship: 'Madre' },
    medicalHistory: 'Tendinitis de Aquiles',
    allergies: 'Ninguna',
    medications: 'Ninguno',
    insuranceProvider: 'Seguro Médico',
    insuranceNumber: 'SMP-2024-008',
    notes: 'Atleta, lesión en tendón de Aquiles',
    createdAt: '2026-07-10T09:30:00Z',
    updatedAt: '2026-08-27T08:30:00Z',
    status: 'active',
  },
];

const initialAppointments: Appointment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    patientName: 'María González',
    date: todayISO,
    startTime: '09:00',
    endTime: '10:00',
    type: 'treatment',
    status: 'confirmed',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    notes: 'Terapia manual + ejercicios de movilidad',
      amount: 850,
    room: 'Sala 1',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-26T09:00:00Z',
  },
  {
    id: 'a2',
    patientId: 'p2',
    patientName: 'Carlos Ramírez',
    date: todayISO,
    startTime: '10:30',
    endTime: '11:30',
    type: 'treatment',
    status: 'scheduled',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    notes: 'Fortalecimiento muscular + electroterapia',
      amount: 800,
    room: 'Sala 2',
    createdAt: '2026-08-21T10:00:00Z',
    updatedAt: '2026-08-26T10:00:00Z',
  },
  {
    id: 'a3',
    patientId: 'p3',
    patientName: 'Ana López',
    date: todayISO,
    startTime: '12:00',
    endTime: '13:00',
    type: 'follow-up',
    status: 'scheduled',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    notes: 'Evaluación de progreso lumbar',
      amount: 500,
    room: 'Sala 3',
    createdAt: '2026-08-22T10:00:00Z',
    updatedAt: '2026-08-26T11:00:00Z',
  },
  {
    id: 'a4',
    patientId: 'p4',
    patientName: 'Roberto Martínez',
    date: tomorrowISO,
    startTime: '09:00',
    endTime: '10:00',
    type: 'treatment',
    status: 'confirmed',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    notes: 'Terapia manual focal',
      amount: 850,
    room: 'Sala 1',
    createdAt: '2026-08-23T10:00:00Z',
    updatedAt: '2026-08-26T12:00:00Z',
  },
  {
    id: 'a5',
    patientId: 'p5',
    patientName: 'Laura Hernández',
    date: tomorrowISO,
    startTime: '11:00',
    endTime: '12:00',
    type: 'evaluation',
    status: 'scheduled',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    notes: 'Evaluación inicial de muñeca',
      amount: 650,
    room: 'Sala 2',
    createdAt: '2026-08-24T10:00:00Z',
    updatedAt: '2026-08-26T13:00:00Z',
  },
  {
    id: 'a6',
    patientId: 'p6',
    patientName: 'Jorge Sánchez',
    date: todayISO,
    startTime: '15:00',
    endTime: '16:00',
    type: 'treatment',
    status: 'completed',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    notes: 'Terapia de calor + movilización articular',
      amount: 800,
    room: 'Sala 3',
    createdAt: '2026-08-25T10:00:00Z',
    updatedAt: '2026-08-26T15:00:00Z',
  },
  {
    id: 'a7',
    patientId: 'p7',
    patientName: 'Daniela Flores',
    date: tomorrowISO,
    startTime: '13:00',
    endTime: '14:00',
    type: 'treatment',
    status: 'confirmed',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    notes: 'Ejercicios de manguito rotador',
      amount: 850,
    room: 'Sala 1',
    createdAt: '2026-08-26T09:00:00Z',
    updatedAt: '2026-08-26T14:00:00Z',
  },
  {
    id: 'a8',
    patientId: 'p8',
    patientName: 'Miguel Chávez',
    date: tomorrowISO,
    startTime: '16:00',
    endTime: '17:00',
    type: 'treatment',
    status: 'scheduled',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    notes: 'Rehabilitación de Aquiles',
      amount: 800,
    room: 'Sala 2',
    createdAt: '2026-08-26T10:00:00Z',
    updatedAt: '2026-08-26T15:30:00Z',
  },
];

const initialPrescriptions: Prescription[] = [
  {
    id: 'r1',
    patientId: 'p1',
    patientName: 'María González',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    date: '2026-08-01',
    diagnosis: 'Síndrome del manguito rotador derecho',
    treatments: [
      {
        id: 'tr1',
        name: 'Ejercicios de Codman',
        description: 'Péndulos para movilidad de hombro',
        sets: 3,
        reps: 15,
        duration: 10,
        frequency: '2 veces al día',
        notes: 'Realizar suavemente, sin forzar',
      },
      {
        id: 'tr2',
        name: 'Movilización escapular',
        description: 'Ejercicios de retracción y protracción',
        sets: 3,
        reps: 12,
        frequency: 'Diario',
        notes: 'Con banda elástica ligera',
      },
    ],
    frequency: 'Sesión de terapia 2 veces por semana',
    duration: '8 semanas',
    notes: 'Evaluar progreso cada 2 semanas',
    status: 'active',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'r2',
    patientId: 'p2',
    patientName: 'Carlos Ramírez',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    date: '2026-08-10',
    diagnosis: 'Reconstrucción LCA + Meniscectomía',
    treatments: [
      {
        id: 'tr3',
        name: 'Cuádriceps isométrico',
        description: 'Contracción isométrica del cuádriceps',
        sets: 4,
        reps: 10,
        duration: 5,
        frequency: '3 veces al día',
        notes: 'Mantener contracción 5 segundos',
      },
      {
        id: 'tr4',
        name: 'Elevación de pierna recta',
        description: 'Fortalecimiento sin flexión de rodilla',
        sets: 3,
        reps: 12,
        frequency: '2 veces al día',
        notes: 'No superar 30° de flexión',
      },
    ],
    frequency: 'Sesión de terapia 3 veces por semana',
    duration: '12 semanas',
    notes: 'Fase 2 de rehabilitación post-operatoria',
    status: 'active',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z',
  },
  {
    id: 'r3',
    patientId: 'p3',
    patientName: 'Ana López',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    date: '2026-08-05',
    diagnosis: 'Hernia discal lumbar L4-L5',
    treatments: [
      {
        id: 'tr5',
        name: 'Estiramiento lumbar',
        description: 'Estiramiento de columna lumbar',
        sets: 3,
        reps: 5,
        duration: 30,
        frequency: '3 veces al día',
        notes: 'Mantener cada estiramiento 30 segundos',
      },
      {
        id: 'tr6',
        name: 'Estabilización lumbar',
        description: 'Ejercicios de core para estabilización',
        sets: 3,
        reps: 10,
        frequency: 'Diario',
        notes: 'Contracción abdominal suave',
      },
    ],
    frequency: 'Terapia manual + ejercicios diarios',
    duration: '6 semanas',
    notes: 'Evitar flexión repetida de columna',
    status: 'active',
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: '2026-08-05T10:00:00Z',
  },
];

const initialProgressRecords: ProgressRecord[] = [
  {
    id: 'pr1',
    patientId: 'p1',
    patientName: 'María González',
    date: '2026-08-01',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    metrics: [
      { id: 'm1', name: 'Flexión hombro', value: 90, unit: 'grados', targetValue: 180, category: 'rom' },
      { id: 'm2', name: 'Abducción hombro', value: 75, unit: 'grados', targetValue: 170, category: 'rom' },
      { id: 'm3', name: 'Rotación externa', value: 30, unit: 'grados', targetValue: 70, category: 'rom' },
    ],
    painLevel: 7,
    mobilityScore: 55,
    strengthScore: 50,
    functionalScore: 60,
    notes: 'Paciente reporta dolor agudo al elevar brazo. Limitación significativa en movimientos por encima de la cabeza.',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'pr2',
    patientId: 'p1',
    patientName: 'María González',
    date: '2026-08-15',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    metrics: [
      { id: 'm4', name: 'Flexión hombro', value: 120, unit: 'grados', targetValue: 180, category: 'rom' },
      { id: 'm5', name: 'Abducción hombro', value: 100, unit: 'grados', targetValue: 170, category: 'rom' },
      { id: 'm6', name: 'Rotación externa', value: 45, unit: 'grados', targetValue: 70, category: 'rom' },
    ],
    painLevel: 5,
    mobilityScore: 70,
    strengthScore: 65,
    functionalScore: 72,
    notes: 'Mejora notable en rango de movimiento. Paciente tolera mejor la terapia activa.',
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'pr3',
    patientId: 'p1',
    patientName: 'María González',
    date: '2026-08-27',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    metrics: [
      { id: 'm7', name: 'Flexión hombro', value: 150, unit: 'grados', targetValue: 180, category: 'rom' },
      { id: 'm8', name: 'Abducción hombro', value: 130, unit: 'grados', targetValue: 170, category: 'rom' },
      { id: 'm9', name: 'Rotación externa', value: 60, unit: 'grados', targetValue: 70, category: 'rom' },
    ],
    painLevel: 3,
    mobilityScore: 82,
    strengthScore: 78,
    functionalScore: 80,
    notes: 'Excelente evolución. Paciente realiza actividades diarias sin limitaciones significativas.',
    createdAt: '2026-08-27T10:00:00Z',
    updatedAt: '2026-08-27T10:00:00Z',
  },
  {
    id: 'pr4',
    patientId: 'p3',
    patientName: 'Ana López',
    date: '2026-08-10',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    metrics: [
      { id: 'm10', name: 'Flexión lumbar', value: 30, unit: 'grados', targetValue: 80, category: 'rom' },
      { id: 'm11', name: 'Extensión lumbar', value: 15, unit: 'grados', targetValue: 30, category: 'rom' },
    ],
    painLevel: 8,
    mobilityScore: 45,
    strengthScore: 55,
    functionalScore: 50,
    notes: 'Dolor agudo lumbar. Limitación para levantarse de la cama sin asistencia.',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z',
  },
  {
    id: 'pr5',
    patientId: 'p3',
    patientName: 'Ana López',
    date: '2026-08-25',
    therapistId: 't1',
    therapistName: 'Belén Peña',
    metrics: [
      { id: 'm12', name: 'Flexión lumbar', value: 50, unit: 'grados', targetValue: 80, category: 'rom' },
      { id: 'm13', name: 'Extensión lumbar', value: 22, unit: 'grados', targetValue: 30, category: 'rom' },
    ],
    painLevel: 5,
    mobilityScore: 68,
    strengthScore: 70,
    functionalScore: 72,
    notes: 'Progreso satisfactorio. Paciente realiza sus actividades diarias con mayor facilidad.',
    createdAt: '2026-08-25T10:00:00Z',
    updatedAt: '2026-08-25T10:00:00Z',
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>(initialProgressRecords);

  useEffect(() => {
    const savedData = localStorage.getItem('fisioadmin-data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.patients) setPatients(data.patients);
        if (data.appointments) setAppointments(data.appointments);
        if (data.prescriptions) setPrescriptions(data.prescriptions);
        if (data.progressRecords) setProgressRecords(data.progressRecords);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fisioadmin-data', JSON.stringify({
      patients,
      appointments,
      prescriptions,
      progressRecords,
    }));
  }, [patients, appointments, prescriptions, progressRecords]);

  const addPatient = (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newPatient: Patient = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setPatients([newPatient, ...patients]);
  };

  const updatePatient = (id: string, data: Partial<Patient>) => {
    setPatients(patients.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  };

  const deletePatient = (id: string) => {
    setPatients(patients.filter(p => p.id !== id));
  };

  const addAppointment = (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newAppointment: Appointment = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setAppointments([newAppointment, ...appointments]);
  };

  const updateAppointment = (id: string, data: Partial<Appointment>) => {
    setAppointments(appointments.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a));
  };

  const deleteAppointment = (id: string) => {
    setAppointments(appointments.filter(a => a.id !== id));
  };

  const addPrescription = (data: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newPrescription: Prescription = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setPrescriptions([newPrescription, ...prescriptions]);
  };

  const updatePrescription = (id: string, data: Partial<Prescription>) => {
    setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  };

  const deletePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const addProgressRecord = (data: Omit<ProgressRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newRecord: ProgressRecord = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setProgressRecords([newRecord, ...progressRecords]);
  };

  const updateProgressRecord = (id: string, data: Partial<ProgressRecord>) => {
    setProgressRecords(progressRecords.map(r => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r));
  };

  const deleteProgressRecord = (id: string) => {
    setProgressRecords(progressRecords.filter(r => r.id !== id));
  };

  const todayISOForStats = new Date().toISOString().split('T')[0];
  const appointmentsToday = appointments.filter(a => a.date === todayISOForStats).length;
  const appointmentsThisWeek = appointments.filter(a => {
    const date = new Date(a.date);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return date >= startOfWeek && date <= endOfWeek;
  }).length;
  const pendingPrescriptions = prescriptions.filter(p => p.status === 'active').length;

  const now = new Date();
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