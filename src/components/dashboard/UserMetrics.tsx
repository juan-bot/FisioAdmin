import { useState, useEffect, useMemo } from 'react';
import { fetchAppointmentsByTherapist, fetchPatientsByTherapist, fetchProgressRecordsByTherapist } from '../../firebase/db';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

const COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

type TimeRange = 'week' | 'month' | 'year' | 'all' | 'custom';

function parseAmount(val: any): number {
  if (val == null) return 0;
  const n = parseFloat(String(val));
  return isNaN(n) ? 0 : n;
}

export function UserMetrics({ therapistId, therapistName }: { therapistId: string; therapistName?: string }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [progressRecords, setProgressRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([fetchAppointmentsByTherapist(therapistId), fetchPatientsByTherapist(therapistId), fetchProgressRecordsByTherapist(therapistId)])
      .then(([appointmentData, patientData, progressData]) => { if (active) { setAppointments(appointmentData); setPatients(patientData); setProgressRecords(progressData); } })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [therapistId, refreshTick]);

  const filteredAppointments = useMemo(() => {
    let filtered = (appointments || []).filter(
      (a: any) => a.status !== 'cancelled' && a.status !== 'no-show'
    );

    const now = new Date();
    let rangeStart: Date;
    let rangeEnd = now;

    switch (timeRange) {
      case 'week':
        rangeStart = new Date(now);
        rangeStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        rangeStart = new Date(now);
        rangeStart.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        rangeStart = new Date(now);
        rangeStart.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        rangeStart = new Date(0);
        break;
    }

    if (timeRange === 'custom' && startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
    }

    filtered = filtered.filter((a: any) => {
      const dt = new Date(a.date);
      return dt >= rangeStart && dt <= rangeEnd;
    });

    return filtered;
  }, [appointments, timeRange, startDate, endDate]);

  const metrics = useMemo(() => {
    const completed = filteredAppointments.filter(a => a.status === 'completed');
    // El sistema registra el cobro como monto en la cita; aún no existe un estado de pago separado.
    const totalSales = filteredAppointments.reduce((sum, a) => sum + parseAmount(a.amount), 0);
    const totalAppointments = filteredAppointments.length;
    const uniquePatients = new Set(filteredAppointments.map((a: any) => a.patientId)).size;
    const documentedSessions = completed.filter(a => a.sessionNote).length;
    const attendanceRate = totalAppointments ? Math.round((completed.length / totalAppointments) * 100) : 0;
    const notesWithPain = completed.filter(a => a.sessionNote?.painBefore !== null && a.sessionNote?.painAfter !== null);
    const averagePainChange = notesWithPain.length ? Math.round((notesWithPain.reduce((sum, a) => sum + (a.sessionNote.painAfter - a.sessionNote.painBefore), 0) / notesWithPain.length) * 10) / 10 : null;
    return { totalSales, totalAppointments, uniquePatients, completedSessions: completed.length, documentedSessions, attendanceRate, averagePainChange };
  }, [filteredAppointments]);

  const clinicalMetrics = useMemo(() => {
    const relevant = progressRecords.filter(record => filteredAppointments.some(appointment => appointment.patientId === record.patientId && appointment.date <= record.date));
    const averageRecovery = relevant.length ? Math.round(relevant.reduce((sum, record) => sum + (record.mobilityScore + record.strengthScore + record.functionalScore) / 3, 0) / relevant.length) : 0;
    return { activePatients: patients.filter(patient => patient.status === 'active').length, progressEntries: relevant.length, averageRecovery };
  }, [patients, progressRecords, filteredAppointments]);

  const salesByPeriod = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredAppointments.forEach((a: any) => {
      const date = new Date(a.date);
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
  }, [filteredAppointments, timeRange]);

  const appointmentsByPeriod = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredAppointments.forEach((a: any) => {
      const date = new Date(a.date);
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
    const patientsSet = new Set(filteredAppointments.map((a: any) => a.patientId));
    const patientsList = (patients || []).filter((p: any) => patientsSet.has(p.id));
    const male = patientsList.filter((p: any) => p.gender === 'male').length;
    const female = patientsList.filter((p: any) => p.gender === 'female').length;
    const other = patientsList.filter((p: any) => p.gender === 'other').length;
    return [
      { name: 'Masculino', value: male },
      { name: 'Femenino', value: female },
      { name: 'Otro', value: other },
    ].filter((d) => d.value > 0);
  }, [filteredAppointments, patients]);

  const totalPatientsUnique = useMemo(() => {
    return new Set(filteredAppointments.map((a: any) => a.patientId)).size;
  }, [filteredAppointments]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshTick(t => t + 1);
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <p className="text-center py-8 text-gray-500">Cargando métricas...</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="space-y-6">
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
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <p className="text-sm text-gray-500 font-medium">Ingresos registrados</p>
            <p className="text-2xl font-bold text-primary-dark mt-1">{metrics.totalSales > 0 ? metrics.totalSales.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '$0'}</p>
            <p className="mt-1 text-xs text-gray-500">Montos capturados en citas vigentes</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border border-secondary/20">
            <p className="text-sm text-gray-500 font-medium">Sesiones realizadas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.completedSessions}</p>
            <p className="mt-1 text-xs text-gray-500">{metrics.attendanceRate}% de asistencia</p>
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
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs font-semibold text-slate-400">Registros de evolución</p><p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{clinicalMetrics.progressEntries}</p></div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs font-semibold text-slate-400">Recuperación promedio</p><p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{clinicalMetrics.averageRecovery}%</p></div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs font-semibold text-slate-400">Cambio de dolor por sesión</p><p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{metrics.averagePainChange === null ? 'Sin datos' : `${metrics.averagePainChange > 0 ? '+' : ''}${metrics.averagePainChange}`}</p></div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay citas en el período seleccionado.
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
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={patientGenderData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
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
