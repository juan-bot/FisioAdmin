import { useApp } from '../../context/AppContext';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { getStatusLabel, formatTime, formatCurrency, getAppointmentTypeLabel } from '../../utils/format';

function StatCard({ title, value, subtitle, icon, color }: { title: string; value: string | number; subtitle?: string; icon: string; color: string }) {
  return (
    <Card>
      <CardBody className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white text-2xl`}>
          {icon}
        </div>
      </CardBody>
    </Card>
  );
}

function ProgressChart() {
  const data = [
    { month: 'Mar', patients: 28 },
    { month: 'Abr', patients: 35 },
    { month: 'May', patients: 42 },
    { month: 'Jun', patients: 48 },
    { month: 'Jul', patients: 55 },
    { month: 'Ago', patients: 62 },
  ];

  const max = Math.max(...data.map(d => d.patients));
  const monthlyRevenue = [42000, 45000, 48000, 51000, 47000, 48500];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Pacientes por Mes</h3>
        <p className="text-sm text-gray-500">Últimos 6 meses</p>
      </CardHeader>
      <CardBody>
        <div className="flex items-end gap-4 h-48">
          {data.map((d, i) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">{d.patients}</span>
              <div
                className="w-full rounded-t-lg bg-primary hover:bg-primary transition-colors"
                style={{ height: `${(d.patients / max) * 160}px` }}
              />
              <span className="text-xs text-gray-500">{d.month}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function RevenueChart() {
  const data = [
    { month: 'Mar', revenue: 42000 },
    { month: 'Abr', revenue: 45000 },
    { month: 'May', revenue: 48000 },
    { month: 'Jun', revenue: 51000 },
    { month: 'Jul', revenue: 47000 },
    { month: 'Ago', revenue: 48500 },
  ];

  const max = Math.max(...data.map(d => d.revenue));

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Ingresos Mensuales</h3>
        <p className="text-sm text-gray-500">Últimos 6 meses</p>
      </CardHeader>
      <CardBody>
        <div className="flex items-end gap-4 h-48">
          {data.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">{formatCurrency(d.revenue)}</span>
              <div
                className="w-full rounded-t-lg bg-secondary hover:bg-secondary-hover transition-colors"
                style={{ height: `${(d.revenue / max) * 160}px` }}
              />
              <span className="text-xs text-gray-500">{d.month}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export default function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { appointments, patients, stats } = useApp();

  const todayAppointments = appointments
    .filter(a => a.date === new Date().toISOString().split('T')[0])
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const recentPatients = patients.slice(0, 5);

  const upcomingAppointments = todayAppointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed');

  const appointmentsByType = todayAppointments.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel Principal</h2>
          <p className="text-gray-500">Resumen general de la clínica y citas de hoy</p>
        </div>
        <button
          onClick={() => onNavigate('appointments')}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium"
        >
          + Nueva Cita
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pacientes Totales" value={stats.totalPatients} subtitle={`${stats.activePatients} activos`} icon="👥" color="bg-primary" />
        <StatCard title="Citas Hoy" value={stats.appointmentsToday} subtitle={`${stats.appointmentsThisWeek} esta semana`} icon="📅" color="bg-secondary" />
        <StatCard title="Recetas Activas" value={stats.pendingPrescriptions} subtitle="Pendientes de atender" icon="💊" color="bg-accent" />
        <StatCard title="Ingresos del Mes" value={formatCurrency(stats.revenueThisMonth)} subtitle={`${stats.completedSessionsThisMonth} sesiones`} icon="💰" color="bg-clay" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressChart />
        <RevenueChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Citas de Hoy</h3>
            <p className="text-sm text-gray-500">{todayAppointments.length} citas programadas</p>
          </CardHeader>
          <CardBody>
            {todayAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay citas programadas para hoy</p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{formatTime(a.startTime)}</p>
                        <p className="text-xs text-gray-500">{formatTime(a.endTime)}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary font-bold">
                        {a.patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.patientName}</p>
                        <p className="text-xs text-gray-500">{getAppointmentTypeLabel(a.type)} · {a.therapistName}</p>
                      </div>
                    </div>
                    <span className={`badge ${a.status === 'scheduled' ? 'badge-info' : 'badge-success'}`}>
                      {getStatusLabel(a.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Pacientes Recientes</h3>
            <p className="text-sm text-gray-500">Últimos pacientes registrados</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {recentPatients.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => onNavigate('patients')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-gray-500">{p.phone}</p>
                    </div>
                  </div>
                  <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                    {getStatusLabel(p.status)}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Distribución de Citas por Tipo</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(appointmentsByType).map(([type, count]) => (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">{getAppointmentTypeLabel(type)}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}