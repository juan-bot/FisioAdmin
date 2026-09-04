import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { AppointmentForm } from './AppointmentForm';
import { SessionNoteForm } from './SessionNoteForm';
import { getStatusLabel, getAppointmentTypeLabel, formatTime, formatCurrency } from '../../utils/format';
import { Appointment } from '../../types';

export default function Appointments({ initialCreate = false, initialPatientId = '', onInitialCreateHandled }: { initialCreate?: boolean; initialPatientId?: string; onInitialCreateHandled?: () => void }) {
  const { appointments, updateAppointment, deleteAppointment } = useApp();
  const [showForm, setShowForm] = useState(initialCreate);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [sessionAppointment, setSessionAppointment] = useState<Appointment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Appointment | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const filteredAppointments = useMemo(() =>
    appointments
      .filter(a => {
        const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
        const matchesType = filterType === 'all' || a.type === filterType;
        const matchesSearch = a.patientName.toLowerCase().includes(search.toLowerCase()) || a.therapistName.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesType && matchesSearch;
      })
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime)),
    [appointments, filterStatus, filterType, search]
  );

  const getStatusBadge = useCallback((status: string) => {
    const classes: Record<string, string> = {
      scheduled: 'badge-info',
      confirmed: 'badge-success',
      completed: 'badge-secondary',
      cancelled: 'badge-danger',
      'no-show': 'badge-warning',
    };
    return classes[status] || 'badge-secondary';
  }, []);

  const handleStatusChange = useCallback((appointment: Appointment, newStatus: Appointment['status']) => {
    updateAppointment(appointment.id, { status: newStatus });
  }, [updateAppointment]);

  const handleEdit = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  }, []);

  const handleDeleteConfirm = useCallback((a: Appointment) => {
    setDeleteConfirm(a);
  }, []);

  const handleDelete = useCallback(() => {
    if (deleteConfirm) {
      deleteAppointment(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, deleteAppointment]);

  return (
    <div className="space-y-6">
      <div className="page-heading flex items-end justify-between">
        <div>
          <p className="eyebrow">Agenda clínica</p>
          <h2 className="page-title mt-1">Citas</h2>
          <p className="page-subtitle">Programa, confirma y da seguimiento a cada sesión.</p>
        </div>
        <Button onClick={() => { setEditingAppointment(null); setShowForm(true); }}>+ Nueva Cita</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar por paciente o terapeuta..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="scheduled">Programada</option>
          <option value="confirmed">Confirmada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
          <option value="no-show">No asistió</option>
        </select>
        <select className="input sm:w-40" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">Todos los tipos</option>
          <option value="evaluation">Evaluación</option>
          <option value="treatment">Tratamiento</option>
          <option value="follow-up">Seguimiento</option>
          <option value="re-evaluation">Re-evaluación</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Citas</h3>
            <span className="text-sm text-gray-500">{filteredAppointments.length} citas</span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3 sm:hidden">
            {filteredAppointments.map(a => (
              <article key={a.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-sm font-bold text-primary-dark">{a.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-950 dark:text-white">{a.patientName}</p><p className="mt-1 text-xs text-slate-500">{new Date(a.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} · {formatTime(a.startTime)}</p></div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{a.amount ? formatCurrency(a.amount) : '—'}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <select value={a.status} onChange={(e) => handleStatusChange(a, e.target.value as Appointment['status'])} className={`badge cursor-pointer border-none ${getStatusBadge(a.status)}`}>
                    {['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'].map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                  </select>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSessionAppointment(a)} className="rounded-lg px-2 py-2 text-xs font-bold text-primary hover:bg-primary-light" aria-label={`Registrar sesión de ${a.patientName}`}>{a.sessionNote ? 'Ver sesión' : 'Sesión'}</button>
                    <button onClick={() => handleEdit(a)} className="rounded-lg p-2 text-slate-400 hover:bg-primary-light hover:text-primary" aria-label={`Editar cita de ${a.patientName}`}><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828z" /></svg></button>
                    <button onClick={() => handleDeleteConfirm(a)} className="rounded-lg p-2 text-slate-400 hover:bg-danger-light hover:text-danger" aria-label={`Eliminar cita de ${a.patientName}`}><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16" /></svg></button>
                  </div>
                </div>
              </article>
            ))}
            {filteredAppointments.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No se encontraron citas.</p>}
          </div>
          <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terapeuta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-sm">
                          {a.patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{a.patientName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{new Date(a.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{formatTime(a.startTime)} - {formatTime(a.endTime)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-info">{getAppointmentTypeLabel(a.type)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{a.therapistName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={a.status}
                          onChange={(e) => handleStatusChange(a, e.target.value as Appointment['status'])}
                          className={`badge cursor-pointer border-none ${getStatusBadge(a.status)}`}
                        >
                          {['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'].map(s => (
                            <option key={s} value={s}>{getStatusLabel(s)}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{a.amount ? formatCurrency(a.amount) : '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSessionAppointment(a)} className="rounded-lg px-2 py-1.5 text-xs font-bold text-primary hover:bg-primary-light" title={a.sessionNote ? 'Ver o editar nota de sesión' : 'Registrar nota de sesión'}>{a.sessionNote ? 'Ver sesión' : 'Sesión'}</button>
                        <button
                          onClick={() => handleEdit(a)}
                          className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(a)}
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
                {filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No se encontraron citas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {showForm && (
        <AppointmentForm
          appointment={editingAppointment}
          initialPatientId={initialPatientId}
          onClose={() => { setShowForm(false); setEditingAppointment(null); onInitialCreateHandled?.(); }}
        />
      )}
      {sessionAppointment && <SessionNoteForm appointment={sessionAppointment} onClose={() => setSessionAppointment(null)} />}

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar Cita" size="sm">
        <p className="text-gray-700">
          ¿Seguro que quieres eliminar la cita de <strong>{deleteConfirm?.patientName}</strong> del {deleteConfirm && new Date(deleteConfirm.date).toLocaleDateString('es-MX')}?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
