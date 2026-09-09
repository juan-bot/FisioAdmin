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
  const [closure, setClosure] = useState(() => ({
    amount: appointment.amount != null ? String(appointment.amount) : '',
    paymentStatus: appointment.paymentStatus || '' as Appointment['paymentStatus'] | '',
    paymentMethod: appointment.paymentMethod || '' as Appointment['paymentMethod'] | '',
    followUpStatus: appointment.followUpStatus || '' as Appointment['followUpStatus'] | '',
    followUpDate: appointment.followUpDate || '',
    followUpNote: appointment.followUpNote || '',
  }));
  const [saving, setSaving] = useState(false);
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
    if (!closure.paymentStatus) {
      setError('Confirma si la consulta fue cobrada, quedó pendiente o fue cortesía.');
      return;
    }
    const amount = closure.amount === '' ? null : Number(closure.amount);
    if (closure.paymentStatus === 'paid' && (!amount || amount <= 0 || !closure.paymentMethod)) {
      setError('Para marcar como cobrada, registra el monto y el método de pago.');
      return;
    }
    if (!closure.followUpStatus) {
      setError('Indica qué seguimiento requiere el paciente.');
      return;
    }
    if (closure.followUpStatus === 'pending' && !closure.followUpDate) {
      setError('Selecciona una fecha para recordar el seguimiento.');
      return;
    }
    setSaving(true);
    try {
      const updates: Partial<Appointment> = {
        sessionNote: note,
        status: 'completed',
        amount,
        paymentStatus: closure.paymentStatus,
        followUpStatus: closure.followUpStatus,
        followUpNote: closure.followUpNote.trim(),
      };
      if (closure.paymentStatus === 'paid') {
        updates.paymentMethod = closure.paymentMethod || undefined;
        updates.paidAt = appointment.paidAt || new Date().toISOString();
      }
      if (closure.followUpStatus === 'pending') updates.followUpDate = closure.followUpDate;
      await updateAppointment(appointment.id, updates);
      onClose();
    } catch {
      setError('No fue posible guardar el cierre de la sesión. Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
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
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
        <div className="mb-4"><p className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">1. Confirmar cobro *</p><p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">La sesión no se cerrará sin declarar el estado del cobro.</p></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={labelClass}>Estado</label><select className={inputClass} value={closure.paymentStatus} onChange={e => setClosure(current => ({ ...current, paymentStatus: e.target.value as Appointment['paymentStatus'] | '' }))}><option value="">Seleccionar…</option><option value="paid">Cobrado</option><option value="pending">Pendiente</option><option value="waived">Cortesía</option></select></div>
          <div><label className={labelClass}>Monto (MXN)</label><input type="number" min="0" step="0.01" className={inputClass} value={closure.amount} onChange={e => setClosure(current => ({ ...current, amount: e.target.value }))} placeholder="0.00" /></div>
          <div><label className={labelClass}>Método</label><select className={inputClass} disabled={closure.paymentStatus !== 'paid'} value={closure.paymentMethod} onChange={e => setClosure(current => ({ ...current, paymentMethod: e.target.value as Appointment['paymentMethod'] | '' }))}><option value="">Seleccionar…</option><option value="cash">Efectivo</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option></select></div>
        </div>
      </section>
      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
        <div className="mb-4"><p className="text-sm font-extrabold text-amber-900 dark:text-amber-200">2. Definir seguimiento *</p><p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Indica la siguiente acción para que el paciente no quede sin seguimiento.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelClass}>Acción</label><select className={inputClass} value={closure.followUpStatus} onChange={e => setClosure(current => ({ ...current, followUpStatus: e.target.value as Appointment['followUpStatus'] | '' }))}><option value="">Seleccionar…</option><option value="pending">Contactar después</option><option value="scheduled">Siguiente cita agendada</option><option value="completed">Seguimiento realizado</option><option value="not_required">No requiere seguimiento</option></select></div>
          <div><label className={labelClass}>Recordar el</label><input type="date" className={inputClass} disabled={closure.followUpStatus !== 'pending'} value={closure.followUpDate} onChange={e => setClosure(current => ({ ...current, followUpDate: e.target.value }))} /></div>
          <div className="sm:col-span-2"><label className={labelClass}>Nota de seguimiento</label><textarea className={inputClass} rows={2} value={closure.followUpNote} onChange={e => setClosure(current => ({ ...current, followUpNote: e.target.value }))} placeholder="Ej. Confirmar evolución y agendar nueva cita." /></div>
        </div>
      </section>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Cerrar sesión'}</Button></div>
    </form>
  </Modal>;
}
