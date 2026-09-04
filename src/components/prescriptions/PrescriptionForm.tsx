import { useState, FormEvent, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Prescription, Treatment } from '../../types';

interface PrescriptionFormProps {
  prescription: Prescription | null;
  initialPatientId?: string;
  onClose: () => void;
}

const emptyTreatment: Omit<Treatment, 'id'> = {
  name: '',
  description: '',
  sets: 3,
  reps: 10,
  duration: 0,
  frequency: '',
  notes: '',
};

export function PrescriptionForm({ prescription, initialPatientId = '', onClose }: PrescriptionFormProps) {
  const { patients, addPrescription, updatePrescription } = useApp();
  const { profile, refreshProfile } = useAuth();

  const getTherapistName = (p: typeof profile) => {
    if (!p) return 'Terapeuta';
    if (p.displayName && !p.displayName.includes('@') && p.displayName.trim().split(/\s+/).length > 1) {
      return p.displayName;
    }
    return p.email?.split('@')[0] || 'Terapeuta';
  };

  const therapistId = profile?.uid || '';
  const therapistName = getTherapistName(profile);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const [form, setForm] = useState(() => ({
    patientId: prescription?.patientId || initialPatientId,
    date: prescription?.date || new Date().toISOString().split('T')[0],
    diagnosis: prescription?.diagnosis || '',
    frequency: prescription?.frequency || '',
    duration: prescription?.duration || '',
    notes: prescription?.notes || '',
    status: prescription?.status || 'active' as Prescription['status'],
  }));
  const [treatments, setTreatments] = useState<Treatment[]>(
    prescription?.treatments.map(t => ({ ...t })) || []
  );
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTreatmentChange = (index: number, field: string, value: string | number) => {
    setTreatments(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const addTreatment = () => {
    setTreatments(prev => [...prev, { ...emptyTreatment, id: `t-${Date.now()}` }]);
  };

  const removeTreatment = (index: number) => {
    setTreatments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.patientId) {
      setError('Selecciona un paciente');
      return;
    }
    if (!form.diagnosis) {
      setError('Ingresa el diagnóstico');
      return;
    }
    if (treatments.length === 0) {
      setError('Agrega al menos un tratamiento');
      return;
    }

    const patient = patients.find(p => p.id === form.patientId);

    const prescriptionData = {
      patientId: form.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
      therapistId,
      therapistName,
      date: form.date,
      diagnosis: form.diagnosis,
      treatments: treatments.map(t => ({
        ...t,
        duration: t.duration || undefined,
      })),
      frequency: form.frequency,
      duration: form.duration,
      notes: form.notes,
      status: form.status,
    };

    if (prescription) {
      await updatePrescription(prescription.id, prescriptionData);
    } else {
      await addPrescription(prescriptionData);
    }
    onClose();
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Modal isOpen onClose={onClose} title={prescription ? 'Editar Receta' : 'Nueva Receta'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 bg-danger-light border border-danger text-danger rounded-lg text-sm">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Paciente *</label>
            <select name="patientId" className={inputClass} value={form.patientId} onChange={handleChange}>
              <option value="">Selecciona un paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Diagnóstico *</label>
            <input name="diagnosis" className={inputClass} value={form.diagnosis} onChange={handleChange} placeholder="Ej: Síndrome del manguito rotador" />
          </div>

          <div>
            <label className={labelClass}>Fecha</label>
            <input name="date" type="date" className={inputClass} value={form.date} onChange={handleChange} />
          </div>

          <div>
            <label className={labelClass}>Estado</label>
            <select name="status" className={inputClass} value={form.status} onChange={handleChange}>
              <option value="active">Activa</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Frecuencia</label>
            <input name="frequency" className={inputClass} value={form.frequency} onChange={handleChange} placeholder="Ej: 3 veces por semana" />
          </div>

          <div>
            <label className={labelClass}>Duración</label>
            <input name="duration" className={inputClass} value={form.duration} onChange={handleChange} placeholder="Ej: 8 semanas" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 text-primary">Tratamientos</h3>
            <button
              type="button"
              onClick={addTreatment}
              className="text-sm text-primary hover:text-primary font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Agregar tratamiento
            </button>
          </div>

          {treatments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg">No hay tratamientos agregados</p>
          ) : (
            <div className="space-y-4">
              {treatments.map((t, index) => (
                <div key={t.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-900">Tratamiento {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeTreatment(index)}
                      className="text-danger hover:text-danger-hover text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Nombre del ejercicio *</label>
                      <input
                        className={inputClass}
                        value={t.name}
                        onChange={(e) => handleTreatmentChange(index, 'name', e.target.value)}
                        placeholder="Ej: Ejercicios de Codman"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Descripción</label>
                      <input
                        className={inputClass}
                        value={t.description}
                        onChange={(e) => handleTreatmentChange(index, 'description', e.target.value)}
                        placeholder="Descripción del ejercicio"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Series</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={t.sets}
                        onChange={(e) => handleTreatmentChange(index, 'sets', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Repeticiones</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={t.reps}
                        onChange={(e) => handleTreatmentChange(index, 'reps', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Duración (min)</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={t.duration || ''}
                        onChange={(e) => handleTreatmentChange(index, 'duration', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Frecuencia</label>
                      <input
                        className={inputClass}
                        value={t.frequency}
                        onChange={(e) => handleTreatmentChange(index, 'frequency', e.target.value)}
                        placeholder="Ej: 2 veces al día"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Notas / Precauciones</label>
                      <input
                        className={inputClass}
                        value={t.notes}
                        onChange={(e) => handleTreatmentChange(index, 'notes', e.target.value)}
                        placeholder="Ej: Realizar suavemente, sin forzar"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Notas generales de la receta</label>
          <textarea name="notes" rows={3} className={inputClass} value={form.notes} onChange={handleChange} placeholder="Instrucciones generales..." />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{prescription ? 'Guardar Cambios' : 'Crear Receta'}</Button>
        </div>
      </form>
    </Modal>
  );
}
