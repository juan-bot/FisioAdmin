import { useState, FormEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Patient } from '../../types';

interface FamilyHistoryEntry {
  member: string;
  condition: string;
}

interface PatientFormProps {
  patient: Patient | null;
  onClose: () => void;
}

const memberOptions = [
  'Abuelo', 'Abuela', 'Padre', 'Madre', 'Hermano', 'Hermana', 'Tío', 'Tía', 'Primo', 'Prima', 'Hijo', 'Hija', 'Otro'
];

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: 'female' as Patient['gender'],
  address: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelationship: '',
  medicalHistory: '',
  allergies: '',
  medications: '',
  familyMedicalHistory: [] as FamilyHistoryEntry[],
  notes: '',
  status: 'active' as Patient['status'],
};

export function PatientForm({ patient, onClose }: PatientFormProps) {
  const { addPatient, updatePatient, currentTherapist } = useApp();
  const initialHistory = patient && Array.isArray(patient.familyMedicalHistory)
    ? patient.familyMedicalHistory
    : [];
  const [form, setForm] = useState(() => {
    if (patient) {
      return {
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        emergencyName: patient.emergencyContact.name,
        emergencyPhone: patient.emergencyContact.phone,
        emergencyRelationship: patient.emergencyContact.relationship,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies,
        medications: patient.medications,
        familyMedicalHistory: initialHistory,
        notes: patient.notes,
        status: patient.status,
      };
    }
    return emptyForm;
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'phone' || name === 'emergencyPhone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      const formatted = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
      setForm(prev => ({ ...prev, [name]: formatted }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleHistoryChange = (index: number, field: 'member' | 'condition', value: string) => {
    setForm(prev => {
      const newHistory = [...prev.familyMedicalHistory];
      newHistory[index] = { ...newHistory[index], [field]: value };
      return { ...prev, familyMedicalHistory: newHistory };
    });
  };

  const addHistoryEntry = () => {
    setForm(prev => ({
      ...prev,
      familyMedicalHistory: [...prev.familyMedicalHistory, { member: '', condition: '' }],
    }));
  };

  const removeHistoryEntry = (index: number) => {
    setForm(prev => ({
      ...prev,
      familyMedicalHistory: prev.familyMedicalHistory.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone) {
      setError('Campos obligatorios: Nombre, Apellido y Teléfono');
      return;
    }

    const patientData = {
      ...(!patient && { therapistId: currentTherapist.id }),
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      dateOfBirth: form.dateOfBirth || new Date().toISOString().split('T')[0],
      gender: form.gender,
      address: form.address,
      emergencyContact: {
        name: form.emergencyName,
        phone: form.emergencyPhone,
        relationship: form.emergencyRelationship,
      },
      medicalHistory: form.medicalHistory,
      allergies: form.allergies,
      medications: form.medications,
      familyMedicalHistory: form.familyMedicalHistory,
      notes: form.notes,
      status: form.status,
    };

    if (patient) {
      updatePatient(patient.id, patientData);
    } else {
      addPatient(patientData);
    }
    onClose();
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Modal isOpen onClose={onClose} title={patient ? 'Editar Paciente' : 'Nuevo Paciente'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 bg-danger-light border border-danger text-danger rounded-lg text-sm">{error}</div>}

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 text-primary">Información Personal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input name="firstName" className={inputClass} value={form.firstName} onChange={handleChange} placeholder="Nombre" />
            </div>
            <div>
              <label className={labelClass}>Apellido *</label>
              <input name="lastName" className={inputClass} value={form.lastName} onChange={handleChange} placeholder="Apellido" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input name="email" type="email" className={inputClass} value={form.email} onChange={handleChange} placeholder="email@ejemplo.com" />
            </div>
            <div>
              <label className={labelClass}>Teléfono *</label>
              <input name="phone" className={inputClass} value={form.phone} onChange={handleChange} placeholder="555-123-4567" />
            </div>
            <div>
              <label className={labelClass}>Fecha de nacimiento</label>
              <input name="dateOfBirth" type="date" className={inputClass} value={form.dateOfBirth} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Género</label>
              <select name="gender" className={inputClass} value={form.gender} onChange={handleChange}>
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Dirección</label>
              <input name="address" className={inputClass} value={form.address} onChange={handleChange} placeholder="Calle, número, ciudad" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 text-primary">Contacto de Emergencia</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Nombre</label>
              <input name="emergencyName" className={inputClass} value={form.emergencyName} onChange={handleChange} placeholder="Nombre completo" />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input name="emergencyPhone" className={inputClass} value={form.emergencyPhone} onChange={handleChange} placeholder="555-XXX-XXXX" />
            </div>
            <div>
              <label className={labelClass}>Relación</label>
              <input name="emergencyRelationship" className={inputClass} value={form.emergencyRelationship} onChange={handleChange} placeholder="Esposo/a, Padre, etc." />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 text-primary">Información Médica</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Historial Médico</label>
              <textarea name="medicalHistory" rows={3} className={inputClass} value={form.medicalHistory} onChange={handleChange} placeholder="Historial médico relevante..." />
            </div>
            <div>
              <label className={labelClass}>Alergias</label>
              <input name="allergies" className={inputClass} value={form.allergies} onChange={handleChange} placeholder="Si no tiene, escribir 'Ninguna'" />
            </div>
            <div>
              <label className={labelClass}>Medicamentos</label>
              <input name="medications" className={inputClass} value={form.medications} onChange={handleChange} placeholder="Medicamentos actuales" />
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select name="status" className={inputClass} value={form.status} onChange={handleChange}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="discharged">Dado de alta</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 text-primary">Antecedentes Familiares</h3>
          <div className="space-y-2">
            {form.familyMedicalHistory.map((entry, index) => (
              <div key={index} className="flex gap-2 items-start">
                <select
                  className={inputClass + ' flex-1'}
                  value={entry.member}
                  onChange={(e) => handleHistoryChange(index, 'member', e.target.value)}
                >
                  <option value="">Seleccionar miembro</option>
                  {memberOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <input
                  className={inputClass + ' flex-1'}
                  value={entry.condition}
                  onChange={(e) => handleHistoryChange(index, 'condition', e.target.value)}
                  placeholder="Condición (ej. diabetes, hipertensión)"
                />
                <button
                  type="button"
                  onClick={() => removeHistoryEntry(index)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors flex-shrink-0 mt-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addHistoryEntry}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar antecedente
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Notas</label>
          <textarea name="notes" rows={3} className={inputClass} value={form.notes} onChange={handleChange} placeholder="Notas adicionales..." />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{patient ? 'Guardar Cambios' : 'Crear Paciente'}</Button>
        </div>
      </form>
    </Modal>
  );
}