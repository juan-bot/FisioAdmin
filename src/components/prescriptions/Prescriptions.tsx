import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PrescriptionForm } from './PrescriptionForm';
import { formatDate } from '../../utils/format';
import { Prescription } from '../../types';
import { exportPrescriptionToPDF } from '../../utils/exportPrescription';

export default function Prescriptions() {
  const { prescriptions, updatePrescription, deletePrescription } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Prescription | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const filteredPrescriptions = useMemo(() =>
    prescriptions
      .filter(p => {
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchesSearch = p.patientName.toLowerCase().includes(search.toLowerCase()) || p.diagnosis.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => b.date.localeCompare(a.date)),
    [prescriptions, filterStatus, search]
  );

  const getStatusBadge = useCallback((status: string) => {
    const classes: Record<string, string> = {
      active: 'badge-success',
      completed: 'badge-info',
      cancelled: 'badge-secondary',
    };
    return classes[status] || 'badge-secondary';
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    const labels: Record<string, string> = {
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  }, []);

  const handleNewPrescription = useCallback(() => {
    setEditingPrescription(null);
    setShowForm(true);
  }, []);

  const handleView = useCallback((p: Prescription) => {
    setViewingPrescription(p);
  }, []);

  const handleEdit = useCallback((p: Prescription) => {
    setEditingPrescription(p);
    setShowForm(true);
  }, []);

  const handleDeleteConfirm = useCallback((p: Prescription) => {
    setDeleteConfirm(p);
  }, []);

  const handleMarkCompleted = useCallback(() => {
    if (viewingPrescription) {
      updatePrescription(viewingPrescription.id, { status: 'completed' });
      setViewingPrescription(null);
    }
  }, [viewingPrescription, updatePrescription]);

  const handleExportPDF = useCallback(() => {
    if (viewingPrescription) {
      exportPrescriptionToPDF(viewingPrescription);
    }
  }, [viewingPrescription]);

  const handleEditViewing = useCallback(() => {
    if (viewingPrescription) {
      setEditingPrescription(viewingPrescription);
      setShowForm(true);
      setViewingPrescription(null);
    }
  }, [viewingPrescription]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recetas</h2>
          <p className="text-gray-500">Crea y gestiona recetas de tratamiento</p>
        </div>
        <Button onClick={handleNewPrescription}>+ Nueva Receta</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por paciente o diagnóstico..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrescriptions.map(p => (
                  <Card key={p.id} className="hover:shadow-md transition-shadow">
                    <CardBody>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
                            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{p.patientName}</p>
                            <p className="text-xs text-gray-500">{formatDate(p.date)}</p>
                          </div>
                        </div>
                        <span className={`badge ${getStatusBadge(p.status)}`}>{getStatusLabel(p.status)}</span>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs text-gray-500 font-medium">Diagnóstico</p>
                        <p className="text-sm text-gray-900 mt-1">{p.diagnosis}</p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.treatments.slice(0, 2).map(t => (
                          <span key={t.id} className="badge badge-info">{t.name}</span>
                        ))}
                        {p.treatments.length > 2 && (
                          <span className="badge badge-secondary">+{p.treatments.length - 2} más</span>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-500">{p.therapistName}</p>
                        <p className="text-xs text-gray-500">{p.frequency}</p>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleView(p)}
                          className="flex-1 px-3 py-1.5 text-sm text-primary hover:bg-primary-light rounded-lg transition-colors border border-primary"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(p)}
                          className="px-3 py-1.5 text-sm text-danger hover:bg-danger-light rounded-lg transition-colors border border-danger"
                        >
                          Eliminar
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
        {filteredPrescriptions.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No se encontraron recetas
          </div>
        )}
      </div>

      {showForm && (
        <PrescriptionForm
          prescription={editingPrescription}
          onClose={() => { setShowForm(false); setEditingPrescription(null); }}
        />
      )}

      <Modal isOpen={!!viewingPrescription} onClose={() => setViewingPrescription(null)} title="Detalle de Receta" size="lg">
        {viewingPrescription && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{viewingPrescription.patientName}</h4>
                <p className="text-sm text-gray-500">Receta del {formatDate(viewingPrescription.date)}</p>
              </div>
              <span className={`badge ${getStatusBadge(viewingPrescription.status)}`}>{getStatusLabel(viewingPrescription.status)}</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Diagnóstico</p>
              <p className="text-base font-medium text-gray-900 mt-1">{viewingPrescription.diagnosis}</p>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-3">Tratamientos</h5>
              <div className="space-y-3">
                {viewingPrescription.treatments.map((t, index) => (
                  <div key={t.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{index + 1}. {t.name}</p>
                      <p className="text-xs text-gray-500">{t.frequency}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{t.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-600">
                      <span>Series: <strong>{t.sets}</strong></span>
                      <span>Repeticiones: <strong>{t.reps}</strong></span>
                      {t.duration && <span>Duración: <strong>{t.duration} min</strong></span>}
                    </div>
                    {t.notes && <p className="text-xs text-danger mt-2">⚠️ {t.notes}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm text-gray-700"><span className="font-semibold">Frecuencia:</span> {viewingPrescription.frequency}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Duración:</span> {viewingPrescription.duration}</p>
              {viewingPrescription.notes && (
                <p className="text-sm text-gray-700"><span className="font-semibold">Notas:</span> {viewingPrescription.notes}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              {viewingPrescription.status === 'active' && (
                <Button variant="secondary" onClick={handleMarkCompleted}>
                  Marcar como Completada
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleExportPDF}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar PDF
              </Button>
              <Button variant="outline" onClick={handleEditViewing}>
                Editar Receta
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar Receta" size="sm">
        <p className="text-gray-700">
          ¿Seguro que quieres eliminar la receta de <strong>{deleteConfirm?.patientName}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => { if (deleteConfirm) deletePrescription(deleteConfirm.id); setDeleteConfirm(null); }}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}