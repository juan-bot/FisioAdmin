import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { AppointmentForm } from './AppointmentForm';
import { getAppointmentTypeLabel, formatTime, formatCurrency } from '../../utils/format';
import { Appointment } from '../../types';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Calendar() {
  const { appointments, deleteAppointment } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deleteConfirm, setDeleteConfirm] = useState<Appointment | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = useMemo(() => new Date(year, month, 1), [year, month]);
  const firstDayOfWeek = useMemo(() => (firstDay.getDay() + 6) % 7, [firstDay]);
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  const appointmentMap = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach(a => {
      const list = map.get(a.date) || [];
      list.push(a);
      map.set(a.date, list);
    });
    return map;
  }, [appointments]);

  const formatISO = useCallback((day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }, [year, month]);

  const selectedDayAppointments = useMemo(() => {
    const list = appointmentMap.get(selectedDate) || [];
    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointmentMap, selectedDate]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  const daysWithAppointments = useMemo(() => {
    const map = new Map<number, Appointment[]>();
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = formatISO(day);
      const list = appointmentMap.get(iso);
      if (list && list.length > 0) {
        map.set(day, list);
      }
    }
    return map;
  }, [formatISO, appointmentMap, daysInMonth]);

  const navigateMonth = useCallback((direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  }, [year, month]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      evaluation: 'bg-clay-light text-clay border-clay',
      treatment: 'bg-primary-light text-primary border-primary',
      'follow-up': 'bg-secondary-light text-secondary-dark border-secondary',
      're-evaluation': 'bg-accent-light text-accent-hover border-accent',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-success',
      completed: 'bg-primary',
      cancelled: 'bg-danger',
      'no-show': 'bg-warning',
      scheduled: 'bg-gray-400',
    };
    return colors[status] || 'bg-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      'no-show': 'No asistió',
      scheduled: 'Programada',
    };
    return labels[status] || status;
  };

  const statusBadgeMap: Record<string, string> = {
    scheduled: 'badge-info',
    confirmed: 'badge-success',
    completed: 'badge-secondary',
    cancelled: 'badge-danger',
    'no-show': 'badge-warning',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendario</h2>
          <p className="text-gray-500">Gestiona las citas por fecha</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={goToToday}>Hoy</Button>
          <Button onClick={() => { setEditingAppointment(null); setShowForm(true); }}>+ Nueva Cita</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{MONTHS[month]} {year}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                  {calendarDays.map((day, index) => {
                    if (day === null) return <div key={`empty-${index}`} className="min-h-20 rounded-lg" />;
                    const dayAppointments = daysWithAppointments.get(day) || [];
                    const iso = formatISO(day);
                    const isToday = iso === todayISO;
                    const isSelected = iso === selectedDate;

                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDate(iso)}
                        className={`min-h-24 rounded-lg border p-1.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary-light'
                            : isToday
                              ? 'border-primary bg-primary-light/50'
                              : 'border-gray-200 hover:border-primary'
                        }`}
                      >
                        <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-gray-600'}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayAppointments.slice(0, 3).map(a => (
                            <div
                              key={a.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded truncate ${getTypeColor(a.type)}`}
                              title={`${a.patientName} - ${a.startTime}`}
                            >
                              {a.startTime} {a.patientName.split(' ')[0]}
                            </div>
                          ))}
                          {dayAppointments.length > 3 && (
                            <div className="text-[10px] text-gray-400 font-medium px-1">
                              +{dayAppointments.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex gap-4 mt-4 text-xs text-gray-600">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-clay inline-block" /> Evaluación</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary inline-block" /> Tratamiento</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary inline-block" /> Seguimiento</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent inline-block" /> Re-evaluación</span>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedDate ? new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selecciona un día'}
            </h3>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">{selectedDayAppointments.length} citas</p>
              {selectedDate && (
                <button
                  onClick={() => { setEditingAppointment(null); setShowForm(true); }}
                  className="text-xs text-primary hover:text-primary font-medium"
                >
                  + Agregar
                </button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {selectedDayAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay citas para este día</p>
            ) : (
              <div className="space-y-3">
                {selectedDayAppointments.map(a => (
                  <div key={a.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(a.status)}`} />
                        <span className="text-sm font-semibold text-gray-900">{formatTime(a.startTime)}</span>
                        <span className="text-xs text-gray-500">- {formatTime(a.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingAppointment(a); setShowForm(true); }}
                          className="p-1 text-gray-400 hover:text-primary hover:bg-white rounded transition-colors"
                          title="Editar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(a)}
                          className="p-1 text-gray-400 hover:text-danger hover:bg-white rounded transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-2">{a.patientName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${getTypeColor(a.type)}`}>{getAppointmentTypeLabel(a.type)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Terapeuta: {a.therapistName}</p>
                    {a.amount ? <p className="text-xs text-gray-500 mt-1">💰 {formatCurrency(a.amount)}</p> : null}
                    {a.notes && <p className="text-xs text-gray-500 mt-1">📝 {a.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardBody>

          <div className="px-6 py-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar estado</label>
            <div className="flex gap-2 flex-wrap">
               {['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'].map(status => {
                const activeCount = selectedDayAppointments.filter(a => a.status === status).length;
                return (
                  <span key={status} className={`badge ${statusBadgeMap[status]} text-xs`}>
                    {getStatusLabel(status)} ({activeCount})
                  </span>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {showForm && (
        <AppointmentForm
          appointment={editingAppointment}
          onClose={() => { setShowForm(false); setEditingAppointment(null); }}
        />
      )}

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar Cita" size="sm">
        <p className="text-gray-700">
          ¿Seguro que quieres eliminar la cita de <strong>{deleteConfirm?.patientName}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => { if (deleteConfirm) deleteAppointment(deleteConfirm.id); setDeleteConfirm(null); }}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}