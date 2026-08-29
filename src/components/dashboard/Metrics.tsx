import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { formatCurrency, getAppointmentTypeLabel } from '../../utils/format';
import { Patient } from '../../types';

function LineChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = Math.max(max - min, 1);

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((value - min + 5) / (range + 10)) * 90;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div>
      <svg viewBox="0 0 100 100" className="w-full h-48" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((value, i) => {
          const [x, y] = points.split(' ')[i].split(',').map(Number);
          return <circle key={i} cx={x} cy={y} r="2" fill={color} />;
        })}
      </svg>
      <div className="flex justify-between mt-2">
        {labels.map((label, i) => (
          <span key={i} className="text-[10px] text-gray-500">{label}</span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string; dot: string }[] }) {
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;

  let cumulative = 0;
  const circles = segments.map(s => {
    const start = cumulative;
    cumulative += s.value;
    return { ...s, start, end: cumulative };
  });

  const circumference = 2 * Math.PI * 45;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 120" className="w-40 h-40 -rotate-90">
        <circle cx="60" cy="60" r="45" fill="none" stroke="#f3f4f6" strokeWidth="12" />
        {circles.map((s, i) => {
          const dashLength = (s.value / total) * circumference;
          return (
            <circle
              key={i}
              cx="60"
              cy="60"
              r="45"
              fill="none"
               stroke={s.color as string}
              strokeWidth="12"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-((s.start / total) * circumference)}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="flex gap-3 mt-4 flex-wrap justify-center">
        {segments.map(s => (
          <span key={s.label} className="flex items-center gap-1 text-xs text-gray-600">
            <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
            {s.label} ({total ? Math.round((s.value / total) * 100) : 0}%)
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Metrics() {
  const { patients, appointments, progressRecords, stats } = useApp();
  const [timeRange, setTimeRange] = useState('month');

  const months: Date[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  const monthLabels = months.map(d => d.toLocaleDateString('es-MX', { month: 'short' }));

  const monthlyPatients = months.map(d =>
    patients.filter(p => {
      const dt = new Date(p.createdAt);
      return dt.getFullYear() === d.getFullYear() && dt.getMonth() === d.getMonth();
    }).length
  );

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const weekLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const weeklySessions = weekLabels.map((_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return appointments.filter(a => {
      const dt = new Date(a.date);
      return dt >= weekStart && dt < weekEnd && dt.getDay() === (i + 1) % 7;
    }).length;
  });

  const appointmentTypes = appointments.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeColor: Record<string, { color: string; dot: string }> = {
    evaluation: { color: 'var(--color-clay)', dot: 'bg-clay' },
    treatment: { color: 'var(--color-primary)', dot: 'bg-primary' },
    'follow-up': { color: 'var(--color-secondary)', dot: 'bg-secondary' },
    're-evaluation': { color: 'var(--color-accent)', dot: 'bg-accent' },
  };
  const donutSegments = Object.entries(appointmentTypes).map(([type, value]) => ({
    label: getAppointmentTypeLabel(type),
    value,
    ...(typeColor[type] || { color: 'var(--color-primary)', dot: 'bg-primary' }),
  }));

  const patientWithMostProgress = progressRecords.length > 0
    ? [...new Set(progressRecords.map(r => r.patientId))].length
    : 0;

  const averagePain = progressRecords.length > 0
    ? Math.round(progressRecords.reduce((acc, r) => acc + r.painLevel, 0) / progressRecords.length * 10) / 10
    : 0;

  const averageRecovery = progressRecords.length > 0
    ? Math.round(progressRecords.reduce((acc, r) => acc + ((r.mobilityScore + r.strengthScore + r.functionalScore) / 3), 0) / progressRecords.length * 10) / 10
    : 0;

  const budgetVsActual = {
    budget: 60000,
    actual: stats.revenueThisMonth,
  };
  const budgetPercentage = Math.round((budgetVsActual.actual / budgetVsActual.budget) * 100);

  const patientsByAge = patients.reduce((acc: Record<string, number>, p: Patient) => {
    const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
    const range = age < 18 ? '<18' : age < 30 ? '18-29' : age < 45 ? '30-44' : age < 60 ? '45-59' : '60+';
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {});

  const byTherapist = appointments.reduce((acc: Record<string, { sessions: number; patients: Set<string> }>, a) => {
    if (!acc[a.therapistName]) acc[a.therapistName] = { sessions: 0, patients: new Set() };
    acc[a.therapistName].sessions += 1;
    acc[a.therapistName].patients.add(a.patientId);
    return acc;
  }, {});
  const specialists = Object.entries(byTherapist).map(([name, data]) => ({
    name,
    patients: data.patients.size,
    sessions: data.sessions,
  }));

  const totalAppointments = appointments.length || 1;
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
  const noShowAppointments = appointments.filter(a => a.status === 'no-show').length;
  const attendanceRate = Math.round((completedAppointments / totalAppointments) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Métricas y Análisis</h2>
          <p className="text-gray-500">Indicadores de desempeño de la clínica</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 font-medium">Pacientes Activos</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activePatients}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.totalPatients} en total</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 font-medium">Sesiones Completadas</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedSessionsThisMonth}</p>
            <p className="text-xs text-gray-500 mt-1">Este mes</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 font-medium">Promedio Dolor</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{averagePain}<span className="text-base text-gray-500">/10</span></p>
            <p className="text-xs text-gray-500 mt-1">{progressRecords.length} registros</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 font-medium">Tasa de Recuperación</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{Math.round(averageRecovery)}%</p>
            <p className="text-xs text-gray-500 mt-1">{progressRecords.length} evaluaciones</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Evolución de Pacientes</h3>
            <p className="text-sm text-gray-500">Crecimiento mensual de pacientes</p>
          </CardHeader>
          <CardBody>
            <LineChart data={monthlyPatients} labels={monthLabels} color="var(--color-primary)" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Distribución de Citas</h3>
            <p className="text-sm text-gray-500">Por tipo de atención</p>
          </CardHeader>
          <CardBody>
            <DonutChart />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Sesiones por Día</h3>
            <p className="text-sm text-gray-500">Citas semanales</p>
          </CardHeader>
          <CardBody>
            <div className="flex items-end gap-3 h-48">
              {weeklySessions.map((v, i) => {
                const max = Math.max(...weeklySessions);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">{v}</span>
                    <div
                      className="w-full rounded-t-lg bg-primary hover:bg-primary transition-colors"
                      style={{ height: `${(v / max) * 150}px` }}
                    />
                    <span className="text-xs text-gray-500">{weekLabels[i]}</span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Ingresos vs Presupuesto</h3>
            <p className="text-sm text-gray-500">{now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(budgetVsActual.actual)}</p>
                <p className="text-sm text-gray-500 mt-1">de {formatCurrency(budgetVsActual.budget)} presupuesto</p>
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${budgetPercentage >= 90 ? 'bg-success-light text-success' : budgetPercentage >= 70 ? 'bg-warning-light text-warning' : 'bg-danger-light text-danger'}`}>
                {budgetPercentage}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${budgetPercentage >= 90 ? 'bg-success' : budgetPercentage >= 70 ? 'bg-warning' : 'bg-danger'}`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Meta alcanzada: {budgetPercentage}%</span>
              <span>Faltan: {formatCurrency(budgetVsActual.budget - budgetVsActual.actual)}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Desempeño por Especialista</h3>
        </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {specialists.length === 0 && (
                <p className="text-sm text-gray-500 col-span-full">No hay sesiones registradas.</p>
              )}
              {specialists.map(s => {
                const maxSessions = Math.max(...specialists.map(sp => sp.sessions), 1);
                return (
                  <div key={s.name} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.sessions} sesiones · {s.patients} pacientes</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${(s.sessions / maxSessions) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Demografía por Edad</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {Object.entries(patientsByAge).map(([range, count]) => {
                const total = patients.length || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={range}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{range} años</span>
                      <span className="text-gray-500">{count} pacientes ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">KPIs Clave</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Tasa de asistencia</span>
                <span className="text-sm font-semibold text-secondary-dark">{attendanceRate}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Citas completadas</span>
                <span className="text-sm font-semibold text-success">{completedAppointments}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Citas canceladas</span>
                <span className="text-sm font-semibold text-warning">{cancelledAppointments}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">No asistieron</span>
                <span className="text-sm font-semibold text-danger">{noShowAppointments}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Pacientes con progreso</span>
                <span className="text-sm font-semibold text-primary">{patientWithMostProgress}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}