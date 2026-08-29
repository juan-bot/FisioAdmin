import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { formatCurrency } from '../../utils/format';
import { fetchBudget, saveBudget } from '../../firebase/db';

export function Finance() {
  const { stats, appointments } = useApp();
  const [budget, setBudget] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchBudget().then(b => {
      setBudget(b);
      setInput(b ? String(b) : '');
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const value = Number(input) || 0;
    setSaving(true);
    setSaved(false);
    await saveBudget(value);
    setBudget(value);
    setSaving(false);
    setSaved(true);
  };

  const cumplimiento = budget > 0 ? Math.round((stats.revenueThisMonth / budget) * 100) : 0;
  const diferencia = stats.revenueThisMonth - budget;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthAppointments = appointments.filter(a => {
    const d = new Date(a.date);
    return d >= monthStart && d <= monthEnd && a.status !== 'cancelled' && a.status !== 'no-show';
  });
  const ordered = [...monthAppointments].sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define el presupuesto mensual y compara los ingresos reales del mes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 font-medium">Ingresos del Mes</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.revenueThisMonth)}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.completedSessionsThisMonth} sesiones cobradas</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 font-medium">Presupuesto</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(budget)}</p>
            <p className="text-xs text-gray-500 mt-1">{loading ? 'Cargando...' : budget > 0 ? 'Configurado' : 'Sin definir'}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 font-medium">Cumplimiento</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{cumplimiento}%</p>
            <p className={`text-xs mt-1 ${diferencia >= 0 ? 'text-success' : 'text-danger'}`}>
              {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)} vs presupuesto
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Presupuesto mensual</h3>
          <p className="text-sm text-gray-500">Se guarda automáticamente en Firebase</p>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto del presupuesto (MXN)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="60000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar presupuesto'}
            </button>
          </div>
          {saved && <p className="text-sm text-success mt-3">Presupuesto guardado correctamente.</p>}

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">Avance del mes</span>
              <span className="text-gray-500">{formatCurrency(stats.revenueThisMonth)} de {formatCurrency(budget)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${cumplimiento >= 100 ? 'bg-success' : cumplimiento >= 70 ? 'bg-warning' : 'bg-danger'}`}
                style={{ width: `${Math.min(cumplimiento, 100)}%` }}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Ingresos del mes por cita</h3>
          <p className="text-sm text-gray-500">{ordered.length} citas cobradas</p>
        </CardHeader>
        <CardBody>
          {ordered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No hay ingresos registrados este mes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Fecha</th>
                    <th className="text-left font-medium px-4 py-3">Paciente</th>
                    <th className="text-left font-medium px-4 py-3">Tipo</th>
                    <th className="text-right font-medium px-4 py-3">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ordered.map(a => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 text-gray-600">{new Date(a.date).toLocaleDateString('es-MX')}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{a.patientName}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{a.type}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(a.amount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
