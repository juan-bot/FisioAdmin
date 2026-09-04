import { FormEvent, useState } from 'react';
import { Appointment, SessionNote } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function SessionNoteForm({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { updateAppointment } = useApp();
  const [note, setNote] = useState<SessionNote>(() => ({
    arrivalStatus: appointment.sessionNote?.arrivalStatus || '',
    painBefore: appointment.sessionNote?.painBefore ?? null,
    clinicalFindings: appointment.sessionNote?.clinicalFindings || '',
    interventions: appointment.sessionNote?.interventions || '',
    patientResponse: appointment.sessionNote?.patientResponse || '',
    painAfter: appointment.sessionNote?.painAfter ?? null,
    homeInstructions: appointment.sessionNote?.homeInstructions || '',
    nextSessionPlan: appointment.sessionNote?.nextSessionPlan || '',
    alerts: appointment.sessionNote?.alerts || '',
    completedAt: appointment.sessionNote?.completedAt || new Date().toISOString(),
  }));
  const [error, setError] = useState('');
  const inputClass = 'input';
  const labelClass = 'mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200';

  const update = (field: keyof SessionNote, value: string | number | null) => setNote(current => ({ ...current, [field]: value }));
  const numberValue = (value: string) => value === '' ? null : Math.min(10, Math.max(0, Number(value)));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!note.arrivalStatus.trim() || !note.interventions.trim() || !note.patientResponse.trim()) {
      setError('Registra cómo llegó, qué se hizo y cómo respondió el paciente.');
      return;
    }
    await updateAppointment(appointment.id, { sessionNote: note, status: 'completed' });
    onClose();
  };

  return <Modal isOpen onClose={onClose} title={`Nota de sesión · ${appointment.patientName}`} size="lg">
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl bg-primary-lighter p-4 text-sm text-primary-dark dark:bg-slate-800 dark:text-slate-200"><strong>{new Date(appointment.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> · {appointment.startTime}–{appointment.endTime}. Al guardar, la cita se marca como completada.</div>
      {error && <div className="rounded-xl border border-danger bg-danger-light p-3 text-sm text-danger">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={labelClass}>¿Cómo llegó el paciente? *</label><textarea className={inputClass} rows={3} value={note.arrivalStatus} onChange={e => update('arrivalStatus', e.target.value)} placeholder="Ej. Refiere menos dolor al caminar, con rigidez matutina." /></div>
        <div><label className={labelClass}>Hallazgos / valoración del día</label><textarea className={inputClass} rows={3} value={note.clinicalFindings} onChange={e => update('clinicalFindings', e.target.value)} placeholder="Movilidad, inflamación, marcha, tolerancia…" /></div>
        <div><label className={labelClass}>Dolor al inicio (0–10)</label><input type="number" min="0" max="10" className={inputClass} value={note.painBefore ?? ''} onChange={e => update('painBefore', numberValue(e.target.value))} /></div>
        <div><label className={labelClass}>Dolor al final (0–10)</label><input type="number" min="0" max="10" className={inputClass} value={note.painAfter ?? ''} onChange={e => update('painAfter', numberValue(e.target.value))} /></div>
      </div>
      <div><label className={labelClass}>¿Qué se realizó en la sesión? *</label><textarea className={inputClass} rows={3} value={note.interventions} onChange={e => update('interventions', e.target.value)} placeholder="Ej. Terapia manual, ejercicio terapéutico, crioterapia, educación…" /></div>
      <div><label className={labelClass}>Respuesta del paciente *</label><textarea className={inputClass} rows={3} value={note.patientResponse} onChange={e => update('patientResponse', e.target.value)} placeholder="Ej. Tolera el ejercicio, disminuye el dolor, sin eventos adversos…" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={labelClass}>Indicaciones en casa</label><textarea className={inputClass} rows={3} value={note.homeInstructions} onChange={e => update('homeInstructions', e.target.value)} placeholder="Ejercicios, cuidados o restricciones." /></div>
        <div><label className={labelClass}>Plan para la siguiente sesión</label><textarea className={inputClass} rows={3} value={note.nextSessionPlan} onChange={e => update('nextSessionPlan', e.target.value)} placeholder="Qué se revisará o progresará." /></div>
      </div>
      <div><label className={labelClass}>Alertas o notas importantes</label><input className={inputClass} value={note.alerts} onChange={e => update('alerts', e.target.value)} placeholder="Contraindicaciones, molestias, seguimiento médico…" /></div>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Guardar nota de sesión</Button></div>
    </form>
  </Modal>;
}
