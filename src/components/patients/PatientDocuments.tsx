import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Patient, TherapeuticReportData } from '../../types';
import { exportClinicalHistoryToPDF, exportTherapeuticReportToPDF } from '../../utils/exportClinicalDocuments';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function PatientDocuments({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { currentTherapist } = useApp();
  const [mode, setMode] = useState<'menu' | 'report'>('menu');
  const [report, setReport] = useState<TherapeuticReportData>({
    date: new Date().toISOString().split('T')[0], addressee: 'A quien corresponda:',
    diagnosis: patient.clinicalAssessment?.physiotherapyDiagnosis || '',
    clinicalStatus: '', recommendations: [''], returnPlan: '', therapistName: currentTherapist.name,
    professionalLicense: '', clinicName: 'FisioAdmin', phone: '', email: '', address: '',
  });

  const update = (field: keyof TherapeuticReportData, value: string) => setReport(previous => ({ ...previous, [field]: value }));
  const updateRecommendation = (index: number, value: string) => setReport(previous => ({ ...previous, recommendations: previous.recommendations.map((item, itemIndex) => itemIndex === index ? value : item) }));

  return (
    <Modal isOpen onClose={onClose} title={mode === 'menu' ? 'Documentos del paciente' : 'Nuevo informe fisioterapéutico'} size={mode === 'menu' ? 'lg' : 'xl'}>
      {mode === 'menu' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <DocumentOption icon="history" title="Historia clínica" description="Expediente completo con antecedentes, valoración, mediciones y diagnóstico." status={patient.clinicalAssessment ? 'Lista para exportar' : 'Falta completar la valoración'} onClick={() => exportClinicalHistoryToPDF(patient)} />
          <DocumentOption icon="report" title="Informe fisioterapéutico" description="Constancia personalizada para escuela, entrenador, trabajo u otro destinatario." status="Crear documento" onClick={() => setMode('report')} />
        </div>
      ) : (
        <form onSubmit={event => { event.preventDefault(); exportTherapeuticReportToPDF(patient, report); }} className="space-y-6">
          <div className="rounded-2xl bg-primary-lighter p-4 dark:bg-primary/10"><p className="text-xs font-semibold text-primary">Paciente</p><p className="mt-1 font-bold text-slate-950 dark:text-white">{patient.firstName} {patient.lastName}</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha"><input type="date" className="input" value={report.date} onChange={e => update('date', e.target.value)} /></Field>
            <Field label="Destinatario"><input className="input" value={report.addressee} onChange={e => update('addressee', e.target.value)} placeholder="A quien corresponda" /></Field>
            <Field label="Diagnóstico" full><textarea required rows={3} className="input" value={report.diagnosis} onChange={e => update('diagnosis', e.target.value)} placeholder="Condición por la que recibe tratamiento" /></Field>
            <Field label="Estado clínico e indicaciones generales" full><textarea rows={4} className="input" value={report.clinicalStatus} onChange={e => update('clinicalStatus', e.target.value)} placeholder="Qué actividades puede realizar y bajo qué condiciones" /></Field>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between"><label className="label">Recomendaciones</label><button type="button" onClick={() => setReport(previous => ({ ...previous, recommendations: [...previous.recommendations, ''] }))} className="text-xs font-bold text-primary">+ Agregar</button></div>
            <div className="space-y-2">{report.recommendations.map((recommendation, index) => <div key={index} className="flex gap-2"><input className="input" value={recommendation} onChange={e => updateRecommendation(index, e.target.value)} placeholder="Ej. Evitar temporalmente ejercicios que generen dolor" /><button type="button" aria-label="Eliminar recomendación" onClick={() => setReport(previous => ({ ...previous, recommendations: previous.recommendations.filter((_, itemIndex) => itemIndex !== index) }))} className="rounded-xl px-3 text-slate-400 hover:bg-danger-light hover:text-danger">×</button></div>)}</div>
          </div>
          <Field label="Plan de reincorporación"><textarea rows={3} className="input" value={report.returnPlan} onChange={e => update('returnPlan', e.target.value)} placeholder="Cómo y cuándo podrá retomar sus actividades" /></Field>
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="mb-4 text-sm font-bold text-slate-950 dark:text-white">Datos del profesional y la clínica</h3>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre del fisioterapeuta"><input required className="input" value={report.therapistName} onChange={e => update('therapistName', e.target.value)} /></Field><Field label="Cédula profesional"><input className="input" value={report.professionalLicense} onChange={e => update('professionalLicense', e.target.value)} /></Field><Field label="Nombre de la clínica"><input className="input" value={report.clinicName} onChange={e => update('clinicName', e.target.value)} /></Field><Field label="Teléfono"><input className="input" value={report.phone} onChange={e => update('phone', e.target.value)} /></Field><Field label="Email"><input type="email" className="input" value={report.email} onChange={e => update('email', e.target.value)} /></Field><Field label="Dirección"><input className="input" value={report.address} onChange={e => update('address', e.target.value)} /></Field></div>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-5 dark:border-slate-800"><Button type="button" variant="ghost" onClick={() => setMode('menu')}>Volver</Button><Button type="submit">Expedir informe PDF</Button></div>
        </form>
      )}
    </Modal>
  );
}

function DocumentOption({ icon, title, description, status, onClick }: { icon: 'history' | 'report'; title: string; description: string; status: string; onClick: () => void }) {
  return <button onClick={onClick} className="group rounded-2xl border border-slate-200 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:border-slate-800 dark:hover:border-primary/40"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary-dark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">{icon === 'history' ? <><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></> : <><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h8M8 17h5" /></>}</svg></div><h3 className="mt-4 font-bold text-slate-950 dark:text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p><p className="mt-4 text-xs font-bold text-primary">{status} →</p></button>;
}

function Field({ label, full = false, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <label className={`block ${full ? 'sm:col-span-2' : ''}`}><span className="label">{label}</span>{children}</label>;
}
