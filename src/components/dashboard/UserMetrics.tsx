import { useState, useEffect, useMemo } from 'react';
import { repository } from '../../data/repository';
import type { Appointment, Patient, ProgressRecord, UserActivity } from '../../types';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { formatCurrency } from '../../utils/format';
import { formatLastActivity, formatTimestamp } from '../../utils/activity';
import { isAppointmentPaid, needsPayment, paymentDateOf } from '../../utils/appointmentWorkflow';

const COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

type TimeRange = 'week' | 'month' | 'year' | 'all' | 'custom';

function parseAmount(val: number | null | undefined): number {
  if (val == null) return 0;
  const n = parseFloat(String(val));
  return isNaN(n) ? 0 : n;
}

function parseCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
}

function getRange(range: TimeRange, startDate: string, endDate: string) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  if (range === 'week') start.setDate(end.getDate() - 6);
  if (range === 'month') start.setMonth(end.getMonth() - 1);
  if (range === 'year') start.setFullYear(end.getFullYear() - 1);
  if (range === 'all') start.setTime(0);
  if (range === 'custom') {
    if (!startDate || !endDate) return null;
    const customStart = parseCalendarDate(startDate);
    const customEnd = parseCalendarDate(endDate);
    customEnd.setHours(23, 59, 59, 999);
    return { start: customStart, end: customEnd };
  }
  return { start, end };
}

export function UserMetrics({ therapistId, therapistName }: { therapistId: string; therapistName?: string }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activityError, setActivityError] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([repository.fetchAppointmentsByTherapist(therapistId), repository.fetchPatientsByTherapist(therapistId), repository.fetchProgressRecordsByTherapist(therapistId)])
      .then(([appointmentData, patientData, progressData]) => { if (active) { setAppointments(appointmentData); setPatients(patientData); setProgressRecords(progressData); } })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [therapistId, refreshTick]);

  useEffect(() => {
    let active = true;
    repository.fetchUserActivities(therapistId)
      .then(data => { if (active) { setActivities(data); setActivityError(''); } })
      .catch((error: unknown) => {
        console.error('No se pudo obtener la actividad del terapeuta:', error);
        if (active) {
          setActivities([]);
          setActivityError('No se pudo cargar la actividad. Verifica que las reglas e índice de Firestore estén publicados.');
        }
      })
      .finally(() => { if (active) setActivitiesLoading(false); });
    return () => { active = false; };
  }, [therapistId, refreshTick]);

  const selectedRange = useMemo(() => getRange(timeRange, startDate, endDate), [timeRange, startDate, endDate]);
  const appointmentsInRange = useMemo(() => !selectedRange ? [] : appointments.filter(appointment => {
    const date = parseCalendarDate(appointment.date);
    return date >= selectedRange.start && date <= selectedRange.end;
  }), [appointments, selectedRange]);
  const filteredAppointments = useMemo(() => appointmentsInRange.filter(appointment => appointment.status !== 'cancelled' && appointment.status !== 'no-show'), [appointmentsInRange]);
  const filteredProgress = useMemo(() => !selectedRange ? [] : progressRecords.filter(record => {
    const date = parseCalendarDate(record.date);
    return date >= selectedRange.start && date <= selectedRange.end;
  }), [progressRecords, selectedRange]);
  const paidAppointmentsInRange = useMemo(() => !selectedRange ? [] : appointments
    .filter(appointment => {
      const paidAt = paymentDateOf(appointment);
      return isAppointmentPaid(appointment) && paidAt >= selectedRange.start && paidAt <= selectedRange.end;
    })
    .sort((a, b) => paymentDateOf(b).getTime() - paymentDateOf(a).getTime()), [appointments, selectedRange]);
  const appointmentsWithRecordedAmount = useMemo(() => filteredAppointments.filter(appointment => parseAmount(appointment.amount) > 0), [filteredAppointments]);

  const metrics = useMemo(() => {
    const completed = filteredAppointments.filter(a => a.status === 'completed');
    const totalSales = appointmentsWithRecordedAmount.reduce((sum, a) => sum + parseAmount(a.amount), 0);
    const totalAppointments = filteredAppointments.length;
    const uniquePatients = new Set(filteredAppointments.map(a => a.patientId)).size;
    const documentedSessions = completed.filter(a => a.sessionNote).length;
    const noShows = appointmentsInRange.filter(a => a.status === 'no-show').length;
    const attendedOrMissed = completed.length + noShows;
    const attendanceRate = attendedOrMissed ? Math.round((completed.length / attendedOrMissed) * 100) : null;
    const pendingSessions = appointmentsInRange.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length;
    const averageTicket = appointmentsWithRecordedAmount.length ? totalSales / appointmentsWithRecordedAmount.length : 0;
    const notesWithPain = completed.filter(a => Number.isFinite(a.sessionNote?.painBefore) && Number.isFinite(a.sessionNote?.painAfter));
    const averagePainChange = notesWithPain.length
      ? Math.round((notesWithPain.reduce((sum, a) => sum + ((a.sessionNote?.painAfter ?? 0) - (a.sessionNote?.painBefore ?? 0)), 0) / notesWithPain.length) * 10) / 10
      : null;
    return { totalSales, totalAppointments, uniquePatients, completedSessions: completed.length, documentedSessions, attendanceRate, averagePainChange, noShows, pendingSessions, averageTicket };
  }, [filteredAppointments, appointmentsInRange, appointmentsWithRecordedAmount]);

  const clinicalMetrics = useMemo(() => {
    const relevant = filteredProgress;
    const averageRecovery = relevant.length ? Math.round(relevant.reduce((sum, record) => sum + (record.mobilityScore + record.strengthScore + record.functionalScore) / 3, 0) / relevant.length) : 0;
    return { activePatients: patients.filter(patient => patient.status === 'active').length, progressEntries: relevant.length, averageRecovery };
  }, [patients, filteredProgress]);

  const amountBreakdown = useMemo(() => {
    const completedAppointments = filteredAppointments.filter(a => a.status === 'completed');
    const paidCompletedAppointments = completedAppointments.filter(isAppointmentPaid);
    const withoutAmount = completedAppointments.filter(needsPayment);
    const totalCharged = paidAppointmentsInRange.reduce((sum, a) => sum + parseAmount(a.amount), 0);
    return {
      completedCount: completedAppointments.length,
      paidCompletedCount: paidCompletedAppointments.length,
      withAmountCount: paidAppointmentsInRange.length,
      withoutAmountCount: withoutAmount.length,
      totalCharged,
      paidAppointments: paidAppointmentsInRange,
      appointmentsWithoutAmount: withoutAmount.map(a => ({ id: a.id, patientName: a.patientName, date: a.date, type: a.type })),
    };
  }, [filteredAppointments, paidAppointmentsInRange]);

  const salesByPeriod = useMemo(() => {
    const grouped: Record<string, number> = {};
    appointmentsWithRecordedAmount.forEach(a => {
      const date = parseCalendarDate(a.date);
      let key: string;
      switch (timeRange) {
        case 'week':
          key = date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
          break;
        case 'month':
          key = date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
          break;
        case 'year':
          key = date.toLocaleDateString('es-MX', { month: 'short' });
          break;
        default:
          key = date.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
      }
      grouped[key] = (grouped[key] || 0) + parseAmount(a.amount);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [appointmentsWithRecordedAmount, timeRange]);

  const appointmentsByPeriod = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredAppointments.forEach(a => {
      const date = parseCalendarDate(a.date);
      let key: string;
      switch (timeRange) {
        case 'week':
          key = date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
          break;
        case 'month':
          key = date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
          break;
        case 'year':
          key = date.toLocaleDateString('es-MX', { month: 'short' });
          break;
        default:
          key = date.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
      }
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredAppointments, timeRange]);

  const patientGenderData = useMemo(() => {
    const male = patients.filter(patient => patient.gender === 'male').length;
    const female = patients.filter(patient => patient.gender === 'female').length;
    const other = patients.filter(patient => patient.gender === 'other').length;
    const total = male + female + other;
    if (total === 0) return [];
    return [
      { name: 'Masculino', value: male },
      { name: 'Femenino', value: female },
      { name: 'Otro', value: other },
    ].filter((d) => d.value > 0);
  }, [patients]);

  const totalPatientsUnique = useMemo(() => {
    return new Set(filteredAppointments.map(a => a.patientId)).size;
  }, [filteredAppointments]);

  const activitySummary = useMemo(() => {
    const activitiesInRange = !selectedRange ? [] : activities.filter(activity => {
      const timestamp = new Date(activity.timestamp);
      return timestamp >= selectedRange.start && timestamp <= selectedRange.end;
    });
    const clicks = activitiesInRange.filter(a => a.action === 'click');
    const pageViews = activitiesInRange.filter(a => a.action === 'page_view');
    const logins = activitiesInRange.filter(a => a.action === 'login');
    const lastActivity = activitiesInRange.length > 0 ? activitiesInRange[0].timestamp : null;
    const activeDays = new Set(activitiesInRange.map(a => new Date(a.timestamp).toLocaleDateString('en-CA'))).size;
    const sessions = new Set(logins.map(a => a.sessionId)).size;
    return { clicks: clicks.length, pageViews: pageViews.length, logins: logins.length, activeDays, lastActivity, totalSessions: sessions, recentActivities: activitiesInRange.slice(0, 10) };
  }, [activities, selectedRange]);

  const handleRefresh = () => {
    setLoading(true);
    setActivitiesLoading(true);
    setRefreshTick(t => t + 1);
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">Cargando métricas...</div>
    );
  }

  return (
    <Card className="space-y-6 border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div><h3 className="text-lg font-semibold text-gray-900">Métricas del terapeuta</h3>{therapistName && <p className="mt-1 text-sm text-slate-500">{therapistName}</p>}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="year">Último año</option>
              <option value="all">Todo</option>
              <option value="custom">Rango personalizado</option>
            </select>
            {timeRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </>
            )}
            <Button variant="ghost" onClick={handleRefresh} className="px-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <p className="text-sm text-gray-500 font-medium">Ingresos registrados</p>
            <p className="text-2xl font-bold text-primary-dark mt-1">{formatCurrency(metrics.totalSales)}</p>
            <p className="mt-1 text-xs text-gray-500">Montos capturados en citas vigentes del período</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border border-secondary/20">
            <p className="text-sm text-gray-500 font-medium">Sesiones realizadas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.completedSessions}</p>
            <p className="mt-1 text-xs text-gray-500">{metrics.attendanceRate === null ? 'Sin sesiones cerradas' : `${metrics.attendanceRate}% de asistencia`}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20">
            <p className="text-sm text-gray-500 font-medium">Pacientes activos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{clinicalMetrics.activePatients}</p>
            <p className="mt-1 text-xs text-gray-500">{totalPatientsUnique} atendidos en el período</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-clay/10 to-clay/5 rounded-xl border border-clay/20">
            <p className="text-sm text-gray-500 font-medium">Notas de sesión</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.documentedSessions}/{metrics.completedSessions}</p>
            <p className="mt-1 text-xs text-gray-500">{metrics.completedSessions ? Math.round((metrics.documentedSessions / metrics.completedSessions) * 100) : 0}% documentadas</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-sky-500/10 to-sky-500/5 rounded-xl border border-sky-500/20">
            <p className="text-sm text-gray-500 font-medium">Agenda pendiente</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.pendingSessions}</p>
            <p className="mt-1 text-xs text-gray-500">{metrics.noShows} inasistencias</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-xl border border-violet-500/20">
            <p className="text-sm text-gray-500 font-medium">Ticket promedio</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.averageTicket)}</p>
            <p className="mt-1 text-xs text-gray-500">Por cita con monto</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs font-semibold text-slate-400">Registros de evolución</p><p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{clinicalMetrics.progressEntries}</p></div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs font-semibold text-slate-400">Recuperación promedio</p><p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{clinicalMetrics.averageRecovery}%</p></div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs font-semibold text-slate-400">Cambio de dolor por sesión</p><p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{metrics.averagePainChange === null ? 'Sin datos' : `${metrics.averagePainChange > 0 ? '+' : ''}${metrics.averagePainChange}`}</p></div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs font-semibold text-slate-400">Pacientes atendidos</p><p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{metrics.uniquePatients}</p><p className="mt-1 text-[10px] text-slate-400">En el período</p></div>
        </div>

        <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20">
            <p className="text-sm text-gray-500 font-medium">Clicks registrados</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{activitySummary.clicks}</p>
            <p className="mt-1 text-xs text-gray-500">Interacciones en el sistema</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-xl border border-cyan-500/20">
            <p className="text-sm text-gray-500 font-medium">Páginas visitadas</p>
            <p className="text-2xl font-bold text-cyan-700 mt-1">{activitySummary.pageViews}</p>
            <p className="mt-1 text-xs text-gray-500">Navegaciones registradas</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-500/20">
            <p className="text-sm text-gray-500 font-medium">Última actividad</p>
            <p className="text-lg font-bold text-amber-700 mt-1">{activitySummary.lastActivity ? formatLastActivity(activitySummary.lastActivity) : 'Sin actividad'}</p>
            <p className="mt-1 text-xs text-gray-500">{activitySummary.activeDays} días de uso en este período</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-rose-500/10 to-rose-500/5 rounded-xl border border-rose-500/20">
            <p className="text-sm text-gray-500 font-medium">Sesiones iniciadas</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{activitySummary.totalSessions}</p>
            <p className="mt-1 text-xs text-gray-500">{activitySummary.logins} accesos registrados</p>
          </div>
        </div>

        {activitiesLoading ? (
          <div className="text-center py-6 text-sm text-gray-500">Cargando actividad...</div>
        ) : activityError ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {activityError}
          </div>
        ) : activitySummary.recentActivities.length > 0 ? (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Últimas acciones</h4>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Usuario</th>
                      <th className="text-left px-4 py-3 font-medium">Acción</th>
                      <th className="text-left px-4 py-3 font-medium">Detalle</th>
                      <th className="text-left px-4 py-3 font-medium">Página</th>
                      <th className="text-left px-4 py-3 font-medium">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activitySummary.recentActivities.map(activity => (
                      <tr key={activity.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{activity.userName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${activity.action === 'click' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {activity.action === 'click' ? 'Click' : activity.action === 'login' ? 'Inicio de sesión' : activity.action === 'page_view' ? 'Navegación' : activity.action === 'app_active' ? 'Aplicación activa' : 'En segundo plano'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{activity.details}</td>
                        <td className="px-4 py-3 text-gray-500">{activity.page || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{formatTimestamp(activity.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No hay actividad registrada para este terapeuta.
          </div>
        )}

        {filteredAppointments.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Resumen de montos cobrados</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20">
                <p className="text-sm text-gray-500 font-medium">Total cobrado</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(amountBreakdown.totalCharged)}</p>
                <p className="mt-1 text-xs text-gray-500">{amountBreakdown.withAmountCount} sesiones cobradas</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl border border-red-500/20">
                <p className="text-sm text-gray-500 font-medium">Sin monto registrado</p>
                <p className="text-2xl font-bold text-red-700 mt-1">{amountBreakdown.withoutAmountCount}</p>
                <p className="mt-1 text-xs text-gray-500">Sesiones cerradas sin cobro</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-sky-500/10 to-sky-500/5 rounded-xl border border-sky-500/20">
                <p className="text-sm text-gray-500 font-medium">Ticket promedio</p>
                <p className="text-2xl font-bold text-sky-700 mt-1">{amountBreakdown.withAmountCount ? formatCurrency(amountBreakdown.totalCharged / amountBreakdown.withAmountCount) : '$0'}</p>
                <p className="mt-1 text-xs text-gray-500">Por cita con monto</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-500/20">
                <p className="text-sm text-gray-500 font-medium">% Cobrado</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{amountBreakdown.completedCount ? Math.round((amountBreakdown.paidCompletedCount / amountBreakdown.completedCount) * 100) : 0}%</p>
                <p className="mt-1 text-xs text-gray-500">De sesiones completadas</p>
              </div>
            </div>
            {amountBreakdown.paidAppointments.length > 0 && (
              <div className="mb-4 overflow-hidden rounded-xl border border-emerald-200 bg-white">
                <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3"><p className="text-sm font-semibold text-emerald-800">Pagos contabilizados ({amountBreakdown.paidAppointments.length})</p></div>
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3 text-left font-medium">Paciente</th><th className="px-4 py-3 text-left font-medium">Fecha de pago</th><th className="px-4 py-3 text-left font-medium">Método</th><th className="px-4 py-3 text-right font-medium">Monto</th></tr></thead><tbody className="divide-y divide-slate-100">{amountBreakdown.paidAppointments.slice(0, 20).map(appointment => <tr key={appointment.id}><td className="px-4 py-3 font-medium text-slate-900">{appointment.patientName}</td><td className="px-4 py-3 text-slate-500">{paymentDateOf(appointment).toLocaleDateString('es-MX')}</td><td className="px-4 py-3 text-slate-500">{appointment.paymentMethod === 'cash' ? 'Efectivo' : appointment.paymentMethod === 'card' ? 'Tarjeta' : appointment.paymentMethod === 'transfer' ? 'Transferencia' : 'Sin especificar'}</td><td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(parseAmount(appointment.amount))}</td></tr>)}</tbody></table></div>
              </div>
            )}
            {amountBreakdown.appointmentsWithoutAmount.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">Sesiones con cobro pendiente ({amountBreakdown.appointmentsWithoutAmount.length})</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Paciente</th>
                        <th className="text-left px-4 py-3 font-medium">Fecha</th>
                        <th className="text-left px-4 py-3 font-medium">Tipo</th>
                        <th className="text-right px-4 py-3 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {amountBreakdown.appointmentsWithoutAmount.slice(0, 10).map(a => (
                        <tr key={a.id}>
                          <td className="px-4 py-3 font-medium text-gray-900">{a.patientName}</td>
                          <td className="px-4 py-3 text-gray-500">{new Date(a.date).toLocaleDateString('es-MX')}</td>
                          <td className="px-4 py-3 text-gray-500 capitalize">{a.type}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">Pendiente de cobro</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {filteredAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {timeRange === 'custom' && !selectedRange ? 'Selecciona fecha inicial y final para ver el análisis.' : 'No hay citas vigentes en el período seleccionado.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Ventas por período</h4>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={salesByPeriod}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value: number) => [`$${value}`, 'Ventas']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Citas por período</h4>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={appointmentsByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {patientGenderData.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Distribución por género</h4>
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={patientGenderData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}>
                        {patientGenderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
