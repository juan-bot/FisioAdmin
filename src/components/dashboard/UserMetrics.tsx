import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

const COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

type TimeRange = 'week' | 'month' | 'year' | 'all';

export function UserMetrics({ therapistId }: { therapistId: string }) {
  const { appointments, patients } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredAppointments = useMemo(() => {
    let filtered = (appointments || []).filter(
      (a: any) => a.therapistId === therapistId && a.status === 'completed'
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
  }, [appointments, therapistId, timeRange, startDate, endDate]);

  const metrics = useMemo(() => {
    const totalSales = filteredAppointments.reduce((sum, a) => sum + parseFloat(String(a.amount || 0)), 0);
    const totalAppointments = filteredAppointments.length;
    const uniquePatients = new Set(filteredAppointments.map((a) => a.patientId)).size;
    return { totalSales, totalAppointments, uniquePatients };
  }, [filteredAppointments]);

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
      grouped[key] = (grouped[key] || 0) + parseFloat(String(a.amount || 0));
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

  const totalPatientsUnique = new Set(filteredAppointments.map((a: any) => a.patientId)).size;

  return (
    <Card className="space-y-6">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Métricas del Terapeuta</h3>
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
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <p className="text-sm text-gray-500 font-medium">Ventas Totales</p>
            <p className="text-2xl font-bold text-primary-dark mt-1">{metrics.totalSales?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) || '$0'}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border border-secondary/20">
            <p className="text-sm text-gray-500 font-medium">Citas Completadas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalAppointments}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20">
            <p className="text-sm text-gray-500 font-medium">Pacientes Únicos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalPatientsUnique}</p>
          </div>
        </div>

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
      </CardBody>
    </Card>
  );
}