import { useState, FormEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Appointment } from '../../types';

interface AppointmentFormProps {
  appointment: Appointment | null;
  onClose: () => void;
}

export function AppointmentForm({ appointment, onClose }: AppointmentFormProps) {
  const { patients, addAppointment, updateAppointment, currentTherapist } = useApp();
  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      patientId: appointment?.patientId || '',
      date: appointment?.date || today,
      startTime: appointment?.startTime || '09:00',
      endTime: appointment?.endTime || '10:00',
      type: appointment?.type || 'treatment' as Appointment['type'],
      status: appointment?.status || 'scheduled' as Appointment['status'],
      notes: appointment?.notes || '',
      amount: appointment?.amount != null ? String(appointment.amount) : '',
    };
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.patientId) {
      setError('Selecciona un paciente');
      return;
    }
    if (!form.startTime || !form.endTime) {
      setError('Indica el horario de la cita');
      return;
    }
    if (form.endTime <= form.startTime) {
      setError('La hora final debe ser mayor que la hora inicial');
      return;
    }

    const patient = patients.find(p => p.id === form.patientId);

    const appointmentData = {
      patientId: form.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      type: form.type,
      status: form.status,
      therapistId: currentTherapist.id,
      therapistName: currentTherapist.name,
      notes: form.notes,
      amount: form.amount ? Number(form.amount) : 0,
    };

    if (appointment) {
      updateAppointment(appointment.id, appointmentData);
    } else {
      addAppointment(appointmentData);
    }
    onClose();
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Modal isOpen onClose={onClose} title={appointment ? 'Editar Cita' : 'Nueva Cita'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 bg-danger-light border border-danger text-danger rounded-lg text-sm">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Paciente *</label>
            <select name="patientId" className={inputClass} value={form.patientId} onChange={handleChange}>
              <option value="">Selecciona un paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Fecha</label>
            <input name="date" type="date" className={inputClass} value={form.date} onChange={handleChange} />
          </div>

          <div>
            <label className={labelClass}>Hora inicio</label>
            <input name="startTime" type="time" className={inputClass} value={form.startTime} onChange={handleChange} />
          </div>

          <div>
            <label className={labelClass}>Hora fin</label>
            <input name="endTime" type="time" className={inputClass} value={form.endTime} onChange={handleChange} />
          </div>

          <div>
            <label className={labelClass}>Tipo de cita</label>
            <select name="type" className={inputClass} value={form.type} onChange={handleChange}>
              <option value="evaluation">Evaluación</option>
              <option value="treatment">Tratamiento</option>
              <option value="follow-up">Seguimiento</option>
              <option value="re-evaluation">Re-evaluación</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Estado</label>
            <select name="status" className={inputClass} value={form.status} onChange={handleChange}>
              <option value="scheduled">Programada</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no-show">No asistió</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Monto cobrado (MXN)</label>
            <input name="amount" type="number" min="0" step="0.01" className={inputClass} value={form.amount} onChange={handleChange} placeholder="0.00" />
          </div>

          <div className="sm:col-span-2">
            <textarea name="notes" rows={3} className={inputClass} value={form.notes} onChange={handleChange} placeholder="Notas sobre la cita..." />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{appointment ? 'Guardar Cambios' : 'Programar Cita'}</Button>
        </div>
      </form>
    </Modal>
  );
}