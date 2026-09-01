import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { AuthScreen } from './components/auth/AuthScreen';
import { Users } from './components/admin/Users';
import Dashboard from './components/dashboard/Dashboard';
import Patients from './components/patients/Patients';
import PatientDetail from './components/patients/PatientDetail';
import Appointments from './components/appointments/Appointments';
import Calendar from './components/appointments/Calendar';
import Prescriptions from './components/prescriptions/Prescriptions';
import Progress from './components/progress/Progress';
import Metrics from './components/dashboard/Metrics';
import { Finance } from './components/dashboard/Finance';

const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  patients: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  appointments: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  prescriptions: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  progress: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  metrics: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm0 0h6v-2a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  finanzas: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .405-3 1.5s1.343 1.5 3 1.5 3 .405 3 1.5 1.343 1.5 3 1.5M12 8c1.657 0 3-.405 3-1.5S13.343 5 12 5 9 5.405 9 6.5 10.343 8 12 8zm0 13c-2.485 0-4.5-1.567-4.5-3.5s2.015-3.5 4.5-3.5 4.5 1.567 4.5 3.5-2.015 3.5-4.5 3.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18" />
    </svg>
  ),
};

const baseNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
  { id: 'patients', label: 'Pacientes', icon: icons.patients },
  { id: 'appointments', label: 'Citas', icon: icons.appointments },
  { id: 'calendar', label: 'Calendario', icon: icons.calendar },
  { id: 'prescriptions', label: 'Recetas', icon: icons.prescriptions },
  { id: 'progress', label: 'Progreso', icon: icons.progress },
  { id: 'metrics', label: 'Métricas', icon: icons.metrics },
  { id: 'finanzas', label: 'Finanzas', icon: icons.finanzas },
];

function MainContent() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewingPatientId, setViewingPatientId] = useState<string | null>(null);

  const navItems = isAdmin
    ? [...baseNavItems, { id: 'users', label: 'Usuarios', icon: icons.users }]
    : baseNavItems;

  const handlePatientsHeader = () => {
    setActiveTab('patients');
    setViewingPatientId(null);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setViewingPatientId(null);
  };

  const handleViewPatient = (id: string) => {
    setViewingPatientId(id);
    setActiveTab('patient-detail');
  };

  const renderContent = () => {
    if (viewingPatientId && activeTab === 'patient-detail') {
      return <PatientDetail patientId={viewingPatientId} onBack={handlePatientsHeader} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleTabChange} />;
      case 'patients':
        return <Patients onViewPatient={handleViewPatient} />;
      case 'appointments':
        return <Appointments />;
      case 'calendar':
        return <Calendar />;
      case 'prescriptions':
        return <Prescriptions />;
      case 'progress':
        return <Progress />;
      case 'metrics':
        return <Metrics />;
      case 'finanzas':
        return <Finance />;
      case 'users':
        return <Users />;
      default:
        return <Dashboard onNavigate={handleTabChange} />;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      <Sidebar navItems={navItems} activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="lg:pl-64 pt-14 lg:pt-0 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1 overflow-y-auto">
          <Header className="sticky top-0 z-10" />
          <div className="mt-6">{renderContent()}</div>
        </div>
        <Footer />
      </main>
    </div>
  );
}

function Header({ className }: { className?: string }) {
  return (
      <header className={`flex items-center justify-between lg:justify-end gap-4 bg-gray-50 dark:bg-[#16221a] ${className || ''}`}>
        <div className="lg:hidden pl-12">
          <h2 className="text-xl font-bold text-primary-dark dark:text-white">FisioAdmin</h2>
        </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-200 dark:bg-[#16221a] dark:border-[#2c4730]">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">Hoy</p>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}

function PendingScreen() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent-light text-accent mx-auto mb-4 flex items-center justify-center text-2xl">⏳</div>
        <h1 className="text-xl font-bold text-gray-900">Cuenta pendiente de aprobación</h1>
        <p className="text-sm text-gray-500 mt-2">
          Tu registro fue recibido. El administrador debe aprobar tu acceso antes de que puedas usar el sistema.
        </p>
        <button onClick={() => logout()} className="mt-6 text-sm text-primary font-medium hover:underline">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function Root() {
  const { status } = useAuth();

  if (status === 'loading') return <LoadingScreen message="Cargando..." />;
  if (status === 'unauthenticated') return <AuthScreen />;
  if (status === 'pending') return <PendingScreen />;

  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
