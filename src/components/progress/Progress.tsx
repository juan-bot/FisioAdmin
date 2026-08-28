import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ProgressForm } from './ProgressForm';
import { formatDate } from '../../utils/format';
import { ProgressRecord } from '../../types';

function MetricTrendChart({ patientId }: { patientId: string }) {
  const { progressRecords } = useApp();
  const records = progressRecords
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (records.length === 0) return null;

  const metricNames = Array.from(new Set(records.flatMap(r => r.metrics.map(m => m.name))));
  const latestMetricValues = new Map<string, number[]>();

  records.forEach(r => {
    r.metrics.forEach(m => {
      if (!latestMetricValues.has(m.name)) latestMetricValues.set(m.name, []);
      latestMetricValues.get(m.name)!.push(m.value);
    });
  });

  if (metricNames.length === 0) return null;

  const maxValue = Math.max(...Array.from(latestMetricValues.values()).flat().map(v => v || 0));
  const chartHeight = 140;

  return (
    <div>
      {metricNames.map(metricName => {
        const values = latestMetricValues.get(metricName) || [];
        if (values.length < 2) return null;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = Math.max(max - min, 1);

        return (
          <div key={metricName} className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-700">{metricName}</p>
              <p className="text-xs text-gray-500">de {min} a {max}</p>
            </div>
            <div className="flex items-end gap-1 h-16">
              {values.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[9px] text-gray-500">{v}</span>
                  <div
                    className="w-full rounded-t bg-secondary"
                    style={{ height: `${(v / Math.max(maxValue, 1)) * 48}px` }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }).filter(Boolean)}
    </div>
  );
}

export default function Progress() {
  const { patients, progressRecords, addProgressRecord, updateProgressRecord, deleteProgressRecord } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProgressRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ProgressRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProgressRecord | null>(null);
  const [filterPatient, setFilterPatient] = useState('all');
  const [search, setSearch] = useState('');

  const filteredRecords = progressRecords
    .filter(r => {
      const matchesPatient = filterPatient === 'all' || r.patientId === filterPatient;
      const matchesSearch = r.patientName.toLowerCase().includes(search.toLowerCase());
      return matchesPatient && matchesSearch;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const averagePainByPatient = (patientId: string) => {
    const records = progressRecords.filter(r => r.patientId === patientId);
    if (records.length === 0) return 0;
    const latest = records.sort((a, b) => b.date.localeCompare(a.date))[0];
    return latest.painLevel;
  };

  const latestMobilityByPatient = (patientId: string) => {
    const records = progressRecords.filter(r => r.patientId === patientId);
    if (records.length === 0) return 0;
    const latest = records.sort((a, b) => b.date.localeCompare(a.date))[0];
    return latest.mobilityScore;
  };

  const overallAverage = filteredRecords.length > 0
    ? Math.round(filteredRecords.reduce((acc, r) => acc + ((r.mobilityScore + r.strengthScore + r.functionalScore) / 3), 0) / filteredRecords.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Seguimiento de Progreso</h2>
          <p className="text-gray-500">Registra y monitorea la evolución de los pacientes</p>
        </div>
        <Button onClick={() => { setEditingRecord(null); setShowForm(true); }}>+ Nuevo Registro</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-bold text-primary">{overallAverage}%</p>
            <p className="text-sm text-gray-500 mt-1">Promedio General</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-bold text-secondary-dark">{progressRecords.length}</p>
            <p className="text-sm text-gray-500 mt-1">Registros Totales</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-bold text-clay">{patients.length}</p>
            <p className="text-sm text-gray-500 mt-1">Pacientes</p>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por paciente..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-56" value={filterPatient} onChange={(e) => setFilterPatient(e.target.value)}>
          <option value="all">Todos los pacientes</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Registros de Evolución Clínica</h3>
            <span className="text-sm text-gray-500">{filteredRecords.length} registros</span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dolor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Movilidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuerza</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcional</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terapeuta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setViewingRecord(r)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-clay-light flex items-center justify-center text-clay font-semibold text-sm">
                          {r.patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{r.patientName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{formatDate(r.date)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold ${
                          r.painLevel <= 3 ? 'bg-success' : r.painLevel <= 6 ? 'bg-warning' : 'bg-danger'
                        }`}>
                          {r.painLevel}
                        </div>
                        <span className="text-xs text-gray-500">/10</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${r.mobilityScore}%` }} />
                        </div>
                        <span className="text-sm text-gray-700">{r.mobilityScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-secondary h-2 rounded-full" style={{ width: `${r.strengthScore}%` }} />
                        </div>
                        <span className="text-sm text-gray-700">{r.strengthScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-clay h-2 rounded-full" style={{ width: `${r.functionalScore}%` }} />
                        </div>
                        <span className="text-sm text-gray-700">{r.functionalScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{r.therapistName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditingRecord(r); setShowForm(true); }}
                          className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(r)}
                          className="p-1.5 text-gray-500 hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No se encontraron registros</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Panel de Progreso por Paciente</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map(p => {
              const patientRecords = progressRecords.filter(r => r.patientId === p.id);
              if (patientRecords.length === 0) return (
                <div key={p.id} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-gray-400 mt-1">Sin registros de progreso aún</p>
                </div>
              );
              const latest = patientRecords.sort((a, b) => b.date.localeCompare(a.date))[0];
              const first = patientRecords.sort((a, b) => a.date.localeCompare(b.date))[0];
              const change = latest.painLevel - first.painLevel;
              return (
                <div key={p.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                    <span className={`badge ${change <= 0 ? 'badge-success' : 'badge-warning'}`}>
                      {change < 0 ? `${Math.abs(change)} pts ↓` : change === 0 ? 'Sin cambio' : `${change} pts ↑`}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Dolor actual</span>
                      <span className="font-semibold text-gray-900">{latest.painLevel}/10</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Movilidad</span>
                      <span className="font-semibold text-gray-900">{latest.mobilityScore}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Fuerza</span>
                      <span className="font-semibold text-gray-900">{latest.strengthScore}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3">Actualizado: {formatDate(latest.date)}</p>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {showForm && (
        <ProgressForm
          record={editingRecord}
          onClose={() => { setShowForm(false); setEditingRecord(null); }}
        />
      )}

      <Modal isOpen={!!viewingRecord} onClose={() => setViewingRecord(null)} title="Detalle del Registro" size="lg">
        {viewingRecord && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{viewingRecord.patientName}</h4>
                <p className="text-sm text-gray-500">{formatDate(viewingRecord.date)} · {viewingRecord.therapistName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-3 rounded-lg text-center ${viewingRecord.painLevel <= 3 ? 'bg-success-light' : viewingRecord.painLevel <= 6 ? 'bg-warning-light' : 'bg-danger-light'}`}>
                <p className="text-2xl font-bold text-gray-900">{viewingRecord.painLevel}</p>
                <p className="text-xs text-gray-500">Dolor /10</p>
              </div>
              <div className="p-3 rounded-lg text-center bg-primary-light">
                <p className="text-2xl font-bold text-primary">{viewingRecord.mobilityScore}%</p>
                <p className="text-xs text-gray-500">Movilidad</p>
              </div>
              <div className="p-3 rounded-lg text-center bg-secondary-light">
                <p className="text-2xl font-bold text-secondary-dark">{viewingRecord.strengthScore}%</p>
                <p className="text-xs text-gray-500">Fuerza</p>
              </div>
              <div className="p-3 rounded-lg text-center bg-clay-light">
                <p className="text-2xl font-bold text-clay">{viewingRecord.functionalScore}%</p>
                <p className="text-xs text-gray-500">Funcional</p>
              </div>
            </div>

            {viewingRecord.metrics.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-3">Métricas Registradas</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingRecord.metrics.map(m => (
                    <div key={m.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.category === 'pain' ? 'Dolor' : m.category === 'rom' ? 'Rango de movimiento' : m.category}</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {m.value}<span className="text-xs text-gray-500"> {m.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notas clínicas</p>
              <p className="text-sm text-gray-700">{viewingRecord.notes || 'Sin notas registradas'}</p>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-3">Evolución de métricas</p>
              <MetricTrendChart patientId={viewingRecord.patientId} />
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar Registro" size="sm">
        <p className="text-gray-700">
          ¿Seguro que quieres eliminar este registro de progreso?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => { if (deleteConfirm) deleteProgressRecord(deleteConfirm.id); setDeleteConfirm(null); }}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}