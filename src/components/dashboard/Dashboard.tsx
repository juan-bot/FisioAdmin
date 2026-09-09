import { ReactNode, useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useActivityTracking } from '../../utils/activity';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { formatCurrency, formatTime, getAppointmentTypeLabel, getStatusLabel } from '../../utils/format';
import { needsFollowUp, needsPayment } from '../../utils/appointmentWorkflow';

const MONTHS: Date[] = (() => {
  const values: Date[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) values.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  return values;
})();

const iconPaths: Record<string, ReactNode> = {
  patients: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18M8 15h.01M12 15h.01M16 15h.01" /></>,
  prescription: <><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4M9 12h6M9 16h4" /></>,
  revenue: <><circle cx="12" cy="12" r="9" /><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8M12 6v12" /></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
};

function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{iconPaths[name]}</svg>;
}

function StatCard({ title, value, subtitle, icon, tone }: { title: string; value: string | number; subtitle: string; icon: string; tone: string }) {
  return (
    <Card className="group">
      <CardBody className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{value}</p>
            <p className="mt-1.5 text-xs text-slate-400">{subtitle}</p>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}><Icon name={icon} /></div>
        </div>
        <div className="absolute inset-x-5 bottom-0 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform group-hover:scale-x-100" />
      </CardBody>
    </Card>
  );
}

const tooltipStyle = { color: 'var(--text-main)', background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '12px', boxShadow: '0 12px 28px rgba(0, 0, 0, .18)', fontSize: '12px' };

export default function Dashboard({ onNavigate, onCreateAppointment, onManageSession, onViewPatient }: { onNavigate: (tab: string) => void; onCreateAppointment: (patientId?: string) => void; onManageSession: (appointmentId: string) => void; onViewPatient: (id: string) => void }) {
  const { appointments, patients, stats, currentTherapist } = useApp();
  const { trackClick } = useActivityTracking({ trackLifecycle: false });
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayAppointments = useMemo(() => appointments.filter(a => a.date === todayISO).sort((a, b) => a.startTime.localeCompare(b.startTime)), [appointments, todayISO]);
  const recentPatients = useMemo(() => patients.slice(0, 5), [patients]);
  const monthlyData = useMemo(() => MONTHS.map(date => ({
    month: date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''),
    pacientes: patients.filter(p => {
      const created = new Date(p.createdAt);
      return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth();
    }).length,
    ingresos: appointments.filter(a => {
      const appointmentDate = new Date(a.date);
      return appointmentDate.getFullYear() === date.getFullYear()
        && appointmentDate.getMonth() === date.getMonth()
        && !['cancelled', 'no-show'].includes(a.status)
        && Boolean(a.amount && a.amount > 0);
    }).reduce((sum, appointment) => sum + (appointment.amount || 0), 0),
  })), [appointments, patients]);
  const appointmentTypes = useMemo(() => appointments.reduce<Record<string, number>>((result, appointment) => {
    result[appointment.type] = (result[appointment.type] || 0) + 1;
    return result;
  }, {}), [appointments]);
  const typeTotal = Object.values(appointmentTypes).reduce((sum, value) => sum + value, 0);
  const nextAppointment = todayAppointments.find(a => a.status !== 'completed' && a.status !== 'cancelled');
  const pendingWork = useMemo(() => {
    const completed = appointments.filter(appointment => appointment.status === 'completed');
    const unpaid = completed.filter(needsPayment);
    const undocumented = completed.filter(appointment => !appointment.sessionNote);
    const followUps = completed.filter(appointment => needsFollowUp(appointment, todayISO));
    const patientsWithoutAppointment = patients.filter(patient => patient.status === 'active' && !appointments.some(appointment => appointment.patientId === patient.id && appointment.date >= todayISO && ['scheduled', 'confirmed'].includes(appointment.status)));
    return { unpaid, undocumented, followUps, patientsWithoutAppointment };
  }, [appointments, patients, todayISO]);
  const pendingCount = pendingWork.unpaid.length + pendingWork.undocumented.length + pendingWork.followUps.length + pendingWork.patientsWithoutAppointment.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-heading flex items-end justify-between">
        <div><p className="eyebrow">Vista general</p><h1 className="page-title mt-1">Tu clínica, hoy</h1><p className="page-subtitle">Todo lo importante para comenzar el día, {currentTherapist.name.split(' ')[0]}.</p></div>
        <button onClick={() => { trackClick("nueva_cita", "dashboard"); onCreateAppointment(); }} className="btn btn-primary shadow-brand"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>Nueva cita</button>
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-[#073f3c] px-6 py-7 text-white shadow-brand-lg sm:px-8">
        <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-emerald-200">Próximo en agenda</p>{nextAppointment ? <><p className="mt-3 text-2xl font-extrabold">{formatTime(nextAppointment.startTime)} · {nextAppointment.patientName}</p><p className="mt-1 text-sm text-white/60">{getAppointmentTypeLabel(nextAppointment.type)} con {nextAppointment.therapistName}</p></> : <><p className="mt-3 text-2xl font-extrabold">Tu agenda está libre</p><p className="mt-1 text-sm text-white/60">Aprovecha para dar seguimiento a tus pacientes.</p></>}</div>
          <button onClick={() => onNavigate('calendar')} className="inline-flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/15 sm:self-auto">Ver calendario <Icon name="arrow" className="h-4 w-4" /></button>
        </div>
      </section>

      {stats.totalPatients === 0 && <section className="rounded-3xl border border-primary/20 bg-primary-lighter/60 p-5 dark:bg-slate-900 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Primeros pasos</p><h2 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">Deja tu clínica lista en menos de 5 minutos</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">1. Registra un paciente · 2. Completa su valoración · 3. Agenda la primera cita.</p></div><button onClick={() => onNavigate('patients')} className="btn btn-primary shrink-0">Registrar paciente</button></div></section>}

      <Card className={pendingCount > 0 ? 'border-amber-200 dark:border-amber-900' : ''}>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="flex items-center gap-2"><h2 className="section-title">Pendientes de hoy</h2>{pendingCount > 0 && <span className="badge badge-danger">{pendingCount}</span>}</div><p className="mt-1 text-xs text-slate-400">Cobros y seguimientos que no deben quedar olvidados.</p></div>
          <button onClick={() => onNavigate('appointments')} className="text-xs font-bold text-primary hover:text-primary-hover">Revisar citas</button>
        </CardHeader>
        <CardBody>
          {pendingCount === 0 ? <div className="rounded-2xl bg-emerald-50 px-4 py-5 text-center dark:bg-emerald-950/20"><p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Todo está al día</p><p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">No hay cobros ni seguimientos vencidos.</p></div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button onClick={() => onNavigate('appointments')} className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm dark:border-rose-900 dark:bg-rose-950/20"><p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">{pendingWork.unpaid.length}</p><p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">Cobros pendientes</p><p className="mt-1 text-xs text-slate-500">Sesiones cerradas sin pago confirmado</p></button>
            <button onClick={() => onNavigate('appointments')} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm dark:border-amber-900 dark:bg-amber-950/20"><p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{pendingWork.followUps.length}</p><p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">Seguimientos</p><p className="mt-1 text-xs text-slate-500">Contactos programados para hoy o vencidos</p></button>
            <button onClick={() => onNavigate('appointments')} className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm dark:border-sky-900 dark:bg-sky-950/20"><p className="text-2xl font-extrabold text-sky-700 dark:text-sky-300">{pendingWork.undocumented.length}</p><p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">Notas clínicas</p><p className="mt-1 text-xs text-slate-500">Sesiones completadas sin nota</p></button>
            <button onClick={() => onNavigate('patients')} className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm dark:border-violet-900 dark:bg-violet-950/20"><p className="text-2xl font-extrabold text-violet-700 dark:text-violet-300">{pendingWork.patientsWithoutAppointment.length}</p><p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">Sin próxima cita</p><p className="mt-1 text-xs text-slate-500">Pacientes activos sin seguimiento agendado</p></button>
          </div>}
          {pendingWork.unpaid.length > 0 && <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4 dark:divide-slate-800 dark:border-slate-700">{pendingWork.unpaid.slice(0, 4).map(appointment => <div key={appointment.id} className="flex flex-wrap items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">Cobrar a {appointment.patientName}</p><p className="text-xs text-slate-400">{new Date(appointment.date).toLocaleDateString('es-MX')} · {appointment.amount ? formatCurrency(appointment.amount) : 'Monto sin registrar'}</p></div><button onClick={() => onManageSession(appointment.id)} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-200">Registrar cobro</button></div>)}</div>}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pacientes totales" value={stats.totalPatients} subtitle={`${stats.activePatients} activos actualmente`} icon="patients" tone="bg-primary-light text-primary-dark" />
        <StatCard title="Citas de hoy" value={stats.appointmentsToday} subtitle={`${stats.appointmentsThisWeek} durante esta semana`} icon="calendar" tone="bg-secondary-light text-secondary-dark" />
        <StatCard title="Recetas activas" value={stats.pendingPrescriptions} subtitle="Planes en seguimiento" icon="prescription" tone="bg-accent-light text-accent-hover" />
        <StatCard title="Ingresos del mes" value={formatCurrency(stats.revenueThisMonth)} subtitle={`${stats.completedSessionsThisMonth} sesiones registradas`} icon="revenue" tone="bg-clay-light text-clay" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3"><CardHeader className="flex items-center justify-between"><div><h2 className="section-title">Ingresos mensuales</h2><p className="mt-1 text-xs text-slate-400">Desempeño de los últimos 6 meses</p></div><span className="rounded-full bg-primary-lighter px-3 py-1 text-xs font-bold text-primary-dark">MXN</span></CardHeader><CardBody className="h-[290px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyData} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#14b8a6" stopOpacity=".32" /><stop offset="100%" stopColor="#14b8a6" stopOpacity=".02" /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => `$${Math.round(v / 1000)}k`} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatCurrency(Number(value)), 'Ingresos']} /><Area type="monotone" dataKey="ingresos" stroke="#14b8a6" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{ r: 5, fill: '#14b8a6', stroke: 'var(--surface-card)', strokeWidth: 3 }} /></AreaChart></ResponsiveContainer></CardBody></Card>
        <Card className="xl:col-span-2"><CardHeader><h2 className="section-title">Nuevos pacientes</h2><p className="mt-1 text-xs text-slate-400">Altas durante los últimos 6 meses</p></CardHeader><CardBody className="h-[290px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData} margin={{ top: 12, right: 4, left: -28, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={8} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--chart-cursor)' }} /><Bar dataKey="pacientes" name="Pacientes" fill="#38a6c9" radius={[7, 7, 2, 2]} maxBarSize={34} /></BarChart></ResponsiveContainer></CardBody></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3"><CardHeader className="flex items-center justify-between"><div><h2 className="section-title">Agenda de hoy</h2><p className="mt-1 text-xs text-slate-400">{todayAppointments.length} citas programadas</p></div><button onClick={() => onNavigate('appointments')} className="text-xs font-bold text-primary hover:text-primary-hover">Ver todas</button></CardHeader><CardBody>{todayAppointments.length === 0 ? <div className="py-8 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-lighter text-primary"><Icon name="calendar" /></div><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No hay citas programadas</p><p className="mt-1 text-xs text-slate-400">Las nuevas citas aparecerán aquí.</p></div> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{todayAppointments.slice(0, 5).map(appointment => <div key={appointment.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"><div className="w-14 shrink-0"><p className="text-sm font-extrabold text-primary-dark dark:text-primary">{formatTime(appointment.startTime)}</p><p className="text-[10px] text-slate-400">{formatTime(appointment.endTime)}</p></div><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{appointment.patientName.split(' ').map(word => word[0]).join('').slice(0, 2)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{appointment.patientName}</p><p className="truncate text-xs text-slate-400">{getAppointmentTypeLabel(appointment.type)}</p></div><span className={`badge ${appointment.status === 'scheduled' ? 'badge-info' : appointment.status === 'cancelled' ? 'badge-danger' : 'badge-success'}`}>{getStatusLabel(appointment.status)}</span></div>)}</div>}</CardBody></Card>
        <Card className="xl:col-span-2"><CardHeader className="flex items-center justify-between"><div><h2 className="section-title">Pacientes recientes</h2><p className="mt-1 text-xs text-slate-400">Últimos expedientes registrados</p></div><button onClick={() => onNavigate('patients')} className="text-xs font-bold text-primary">Ver todos</button></CardHeader><CardBody>{recentPatients.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">Aún no hay pacientes registrados.</p> : <div className="space-y-1">{recentPatients.map(patient => <button key={patient.id} onClick={() => onViewPatient(patient.id)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-xs font-bold text-primary-dark">{patient.firstName[0]}{patient.lastName[0]}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</p><p className="truncate text-xs text-slate-400">{patient.phone}</p></div><Icon name="arrow" className="h-4 w-4 text-slate-300" /></button>)}</div>}</CardBody></Card>
      </div>

      {typeTotal > 0 && <Card><CardHeader><h2 className="section-title">Distribución de servicios</h2><p className="mt-1 text-xs text-slate-400">Composición histórica de las citas</p></CardHeader><CardBody className="grid grid-cols-2 gap-5 md:grid-cols-4">{Object.entries(appointmentTypes).map(([type, count], index) => { const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-clay']; return <div key={type}><div className="flex items-end justify-between"><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{getAppointmentTypeLabel(type)}</p><p className="text-xl font-extrabold text-slate-950 dark:text-white">{Math.round((count / typeTotal) * 100)}%</p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${colors[index % colors.length]}`} style={{ width: `${(count / typeTotal) * 100}%` }} /></div><p className="mt-2 text-xs text-slate-400">{count} citas</p></div>; })}</CardBody></Card>}
    </div>
  );
}
