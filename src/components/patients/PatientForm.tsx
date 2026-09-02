import { useState, FormEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Patient } from '../../types';

interface PatientFormProps {
  patient: Patient | null;
  onClose: () => void;
}

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
  notes: '',
  status: 'active' as Patient['status'],
};

export function PatientForm({ patient, onClose }: PatientFormProps) {
  const { addPatient, updatePatient, currentTherapist } = useApp();
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
        notes: patient.notes,
        status: patient.status,
      };
    }
    return emptyForm;
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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