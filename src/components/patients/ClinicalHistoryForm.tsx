import { FormEvent, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BilateralMeasurement, ClinicalAssessment, Patient } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

const goniometryTemplate: BilateralMeasurement[] = [
  ['Cervical', 'Flexión', '0°-45°'], ['Cervical', 'Extensión', '0°-45°'], ['Cervical', 'Inclinación', '0°-45°'], ['Cervical', 'Rotación', '0°-60°'],
  ['Hombro', 'Flexión', '0°-180°'], ['Hombro', 'Extensión', '0°-50°'], ['Hombro', 'Abducción', '0°-180°'], ['Hombro', 'Rotación interna', '0°-70°'], ['Hombro', 'Rotación externa', '0°-80°'],
  ['Codo', 'Flexión', '0°-140°'], ['Antebrazo', 'Pronación', '0°-85°'], ['Antebrazo', 'Supinación', '0°-90°'],
  ['Muñeca', 'Flexión', '0°-85°'], ['Muñeca', 'Extensión', '0°-90°'], ['Dorso lumbar', 'Flexión', '0°-105°'], ['Dorso lumbar', 'Extensión', '0°-60°'],
  ['Cadera', 'Flexión', '0°-120°'], ['Cadera', 'Extensión', '0°-30°'], ['Cadera', 'Abducción', '0°-90°'], ['Cadera', 'Rotación interna', '0°-45°'], ['Cadera', 'Rotación externa', '0°-60°'],
  ['Rodilla', 'Flexión', '0°-140°'], ['Rodilla', 'Extensión', '0°-10°'], ['Tobillo', 'Flexión plantar', '0°-50°'], ['Tobillo', 'Flexión dorsal', '0°-30°'], ['Tobillo', 'Inversión', '0°-30°'], ['Tobillo', 'Eversión', '0°-15°'],
].map(([name, movement, reference]) => ({ name, movement, reference, right: '', left: '' }));

const reflexTemplate: BilateralMeasurement[] = ['Bicipital', 'Braquiorradial', 'Tricipital', 'Rotuliano', 'Aquileo']
  .map(name => ({ name, right: '', left: '', reference: '0 a ++++' }));

function emptyAssessment(therapistName: string): ClinicalAssessment {
  return {
    assessmentDate: new Date().toISOString().split('T')[0], therapistName, reasonForConsultation: '',
    nonPathologicalHistory: { smoking: '', alcohol: '', drugs: '', physicalActivity: '', mealsPerDay: '', housing: '' },
    gynecologicalHistory: { menarche: '', pregnancies: '', births: '', abortions: '' },
    pathologicalHistory: { diseases: '', detectionDate: '', trauma: '', hospitalizations: '', surgeries: '' },
    vitalSigns: { bloodPressure: '', heartRate: '', respiratoryRate: '', temperature: '', glucose: '', oxygenSaturation: '', height: '', weight: '' },
    painAssessment: { onset: '', location: '', radiation: '', characteristics: '', intensity: '', aggravatingFactors: '' },
    posturalFindings: '', gait: { independent: true, assistiveDevice: '', observations: '' },
    goniometry: goniometryTemplate, muscleStrength: [], reflexes: reflexTemplate,
    sensitivity: '', specialTests: '', physiotherapyDiagnosis: '', notes: '',
  };
}

const steps = ['Antecedentes', 'Valoración física', 'Mediciones', 'Diagnóstico'];
const fieldClass = 'input';
const labelClass = 'label';

export function ClinicalHistoryForm({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { updatePatient, currentTherapist } = useApp();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [demographics, setDemographics] = useState(patient.demographics || { placeOfOrigin: '', education: '', occupation: '', maritalStatus: '', religion: '' });
  const [assessment, setAssessment] = useState<ClinicalAssessment>(() => patient.clinicalAssessment || emptyAssessment(currentTherapist.name));

  const completion = useMemo(() => {
    const values = [assessment.reasonForConsultation, assessment.vitalSigns.bloodPressure, assessment.painAssessment.location, assessment.physiotherapyDiagnosis];
    return Math.round((values.filter(Boolean).length / values.length) * 100);
  }, [assessment]);

  const updateSection = <K extends keyof ClinicalAssessment>(section: K, field: string, value: string | boolean) => {
    setAssessment(previous => ({ ...previous, [section]: { ...(previous[section] as object), [field]: value } }));
  };

  const updateMeasurement = (section: 'goniometry' | 'muscleStrength' | 'reflexes', index: number, field: keyof BilateralMeasurement, value: string) => {
    setAssessment(previous => ({ ...previous, [section]: previous[section].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  };

  const addMeasurement = (section: 'goniometry' | 'muscleStrength') => {
    setAssessment(previous => ({ ...previous, [section]: [...previous[section], { name: '', movement: '', reference: '', right: '', left: '' }] }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (step < steps.length - 1) { setStep(current => current + 1); return; }
    setSaving(true);
    await updatePatient(patient.id, { demographics, clinicalAssessment: assessment });
    setSaving(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Historia clínica y valoración" size="xl">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-500">Avance del expediente</span><span className="font-bold text-primary">{completion}%</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} /></div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {steps.map((label, index) => <button type="button" key={label} onClick={() => setStep(index)} className={`rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors ${step === index ? 'bg-primary text-white' : index < step ? 'bg-primary-light text-primary-dark' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{index + 1}. <span className="hidden sm:inline">{label}</span></button>)}
          </div>
        </div>

        {step === 0 && <div className="space-y-6 animate-fade-in">
          <Section title="Ficha de identificación" description="Datos complementarios del paciente.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[['placeOfOrigin', 'Lugar de origen'], ['education', 'Escolaridad'], ['occupation', 'Ocupación'], ['maritalStatus', 'Estado civil'], ['religion', 'Religión']].map(([field, label]) => <Field key={field} label={label}><input className={fieldClass} value={demographics[field as keyof typeof demographics]} onChange={e => setDemographics(previous => ({ ...previous, [field]: e.target.value }))} /></Field>)}
              <Field label="Fecha de valoración"><input type="date" className={fieldClass} value={assessment.assessmentDate} onChange={e => setAssessment(previous => ({ ...previous, assessmentDate: e.target.value }))} /></Field>
            </div>
          </Section>
          <Section title="Antecedentes personales no patológicos">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[['smoking', 'Tabaquismo'], ['alcohol', 'Consumo de alcohol'], ['drugs', 'Drogas'], ['physicalActivity', 'Actividad física'], ['mealsPerDay', 'Comidas por día'], ['housing', 'Vivienda']].map(([field, label]) => <Field key={field} label={label}><input className={fieldClass} value={assessment.nonPathologicalHistory[field as keyof typeof assessment.nonPathologicalHistory]} onChange={e => updateSection('nonPathologicalHistory', field, e.target.value)} placeholder="Sin antecedentes / detalle" /></Field>)}
            </div>
          </Section>
          <Section title="Antecedentes gineco-obstétricos" description="Completar cuando corresponda.">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[['menarche', 'Menarca'], ['pregnancies', 'Gestas'], ['births', 'Partos'], ['abortions', 'Abortos']].map(([field, label]) => <Field key={field} label={label}><input className={fieldClass} value={assessment.gynecologicalHistory[field as keyof typeof assessment.gynecologicalHistory]} onChange={e => updateSection('gynecologicalHistory', field, e.target.value)} /></Field>)}</div>
          </Section>
          <Section title="Antecedentes personales patológicos">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Enfermedades"><textarea rows={2} className={fieldClass} value={assessment.pathologicalHistory.diseases} onChange={e => updateSection('pathologicalHistory', 'diseases', e.target.value)} /></Field><Field label="Fecha de detección"><input className={fieldClass} value={assessment.pathologicalHistory.detectionDate} onChange={e => updateSection('pathologicalHistory', 'detectionDate', e.target.value)} /></Field><Field label="Traumatismos"><textarea rows={2} className={fieldClass} value={assessment.pathologicalHistory.trauma} onChange={e => updateSection('pathologicalHistory', 'trauma', e.target.value)} /></Field><Field label="Hospitalizaciones"><textarea rows={2} className={fieldClass} value={assessment.pathologicalHistory.hospitalizations} onChange={e => updateSection('pathologicalHistory', 'hospitalizations', e.target.value)} /></Field><Field label="Cirugías"><textarea rows={2} className={fieldClass} value={assessment.pathologicalHistory.surgeries} onChange={e => updateSection('pathologicalHistory', 'surgeries', e.target.value)} /></Field></div>
          </Section>
          <Field label="Motivo de consulta"><textarea rows={4} className={fieldClass} value={assessment.reasonForConsultation} onChange={e => setAssessment(previous => ({ ...previous, reasonForConsultation: e.target.value }))} placeholder="Síntomas, tiempo de evolución y objetivo del paciente" /></Field>
        </div>}

        {step === 1 && <div className="space-y-6 animate-fade-in">
          <Section title="Signos vitales">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[['bloodPressure', 'Tensión arterial', '120/80 mmHg'], ['heartRate', 'Frecuencia cardiaca', 'lpm'], ['respiratoryRate', 'Frecuencia respiratoria', 'rpm'], ['temperature', 'Temperatura', '°C'], ['glucose', 'Glucosa', 'mg/dL'], ['oxygenSaturation', 'Saturación O₂', '%'], ['height', 'Talla', 'cm'], ['weight', 'Peso', 'kg']].map(([field, label, placeholder]) => <Field key={field} label={label}><input className={fieldClass} value={assessment.vitalSigns[field as keyof typeof assessment.vitalSigns]} onChange={e => updateSection('vitalSigns', field, e.target.value)} placeholder={placeholder} /></Field>)}</div>
          </Section>
          <Section title="Evaluación del dolor">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[['onset', 'Aparición'], ['location', 'Localización'], ['radiation', 'Irradiación'], ['characteristics', 'Características'], ['intensity', 'Intensidad (0-10)'], ['aggravatingFactors', 'Agravantes y atenuantes']].map(([field, label]) => <Field key={field} label={label}><textarea rows={2} className={fieldClass} value={assessment.painAssessment[field as keyof typeof assessment.painAssessment]} onChange={e => updateSection('painAssessment', field, e.target.value)} /></Field>)}</div>
          </Section>
          <Section title="Evaluación postural" description="Registra hallazgos en vista lateral, posterior y anterior."><textarea rows={5} className={fieldClass} value={assessment.posturalFindings} onChange={e => setAssessment(previous => ({ ...previous, posturalFindings: e.target.value }))} placeholder="Ej. Vista posterior: hombro derecho elevado, inclinación pélvica..." /></Section>
          <Section title="Evaluación de la marcha"><label className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"><input type="checkbox" checked={assessment.gait.independent} onChange={e => updateSection('gait', 'independent', e.target.checked)} /> Marcha independiente</label><div className="grid gap-4 sm:grid-cols-2"><Field label="Aditamento"><input className={fieldClass} value={assessment.gait.assistiveDevice} onChange={e => updateSection('gait', 'assistiveDevice', e.target.value)} placeholder="Ninguno, bastón, andadera..." /></Field><Field label="Observaciones por fases"><textarea rows={3} className={fieldClass} value={assessment.gait.observations} onChange={e => updateSection('gait', 'observations', e.target.value)} placeholder="Choque de talón, apoyo, impulso, oscilación..." /></Field></div></Section>
        </div>}

        {step === 2 && <div className="space-y-6 animate-fade-in">
          <MeasurementSection title="Evaluación goniométrica" rows={assessment.goniometry} onChange={(index, field, value) => updateMeasurement('goniometry', index, field, value)} onAdd={() => addMeasurement('goniometry')} />
          <MeasurementSection title="Fuerza muscular" rows={assessment.muscleStrength} onChange={(index, field, value) => updateMeasurement('muscleStrength', index, field, value)} onAdd={() => addMeasurement('muscleStrength')} simple />
          <MeasurementSection title="Evaluación de reflejos" rows={assessment.reflexes} onChange={(index, field, value) => updateMeasurement('reflexes', index, field, value)} simple />
        </div>}

        {step === 3 && <div className="space-y-6 animate-fade-in">
          <Field label="Sensibilidad"><textarea rows={4} className={fieldClass} value={assessment.sensitivity} onChange={e => setAssessment(previous => ({ ...previous, sensitivity: e.target.value }))} placeholder="Área evaluada y respuesta: normal, alodinia, hiperestesia o hipoestesia" /></Field>
          <Field label="Pruebas especiales"><textarea rows={5} className={fieldClass} value={assessment.specialTests} onChange={e => setAssessment(previous => ({ ...previous, specialTests: e.target.value }))} placeholder="Nombre de prueba, lado y resultado" /></Field>
          <Field label="Diagnóstico fisioterapéutico"><textarea rows={5} className={fieldClass} value={assessment.physiotherapyDiagnosis} onChange={e => setAssessment(previous => ({ ...previous, physiotherapyDiagnosis: e.target.value }))} placeholder="Diagnóstico funcional y fisioterapéutico" /></Field>
          <Field label="Notas clínicas"><textarea rows={4} className={fieldClass} value={assessment.notes} onChange={e => setAssessment(previous => ({ ...previous, notes: e.target.value }))} /></Field>
        </div>}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={() => step === 0 ? onClose() : setStep(current => current - 1)}>{step === 0 ? 'Cancelar' : 'Anterior'}</Button>
          <Button type="submit" disabled={saving}>{step === steps.length - 1 ? saving ? 'Guardando...' : 'Guardar historia clínica' : 'Continuar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="mb-4"><h3 className="text-sm font-bold text-slate-950 dark:text-white">{title}</h3>{description && <p className="mt-1 text-xs text-slate-400">{description}</p>}</div>{children}</section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className={labelClass}>{label}</span>{children}</label>;
}

function MeasurementSection({ title, rows, onChange, onAdd, simple = false }: { title: string; rows: BilateralMeasurement[]; onChange: (index: number, field: keyof BilateralMeasurement, value: string) => void; onAdd?: () => void; simple?: boolean }) {
  return <Section title={title}><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400"><th className="px-2 py-2">{simple ? 'Músculo / reflejo' : 'Articulación'}</th>{!simple && <><th className="px-2 py-2">Movimiento</th><th className="px-2 py-2">Referencia</th></>}<th className="px-2 py-2">Derecho</th><th className="px-2 py-2">Izquierdo</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((row, index) => <tr key={`${row.name}-${row.movement}-${index}`}><td className="p-2"><input className="input min-w-32" value={row.name} onChange={e => onChange(index, 'name', e.target.value)} /></td>{!simple && <><td className="p-2"><input className="input min-w-32" value={row.movement || ''} onChange={e => onChange(index, 'movement', e.target.value)} /></td><td className="p-2"><input className="input min-w-24" value={row.reference || ''} onChange={e => onChange(index, 'reference', e.target.value)} /></td></>}<td className="p-2"><input className="input min-w-20" value={row.right} onChange={e => onChange(index, 'right', e.target.value)} /></td><td className="p-2"><input className="input min-w-20" value={row.left} onChange={e => onChange(index, 'left', e.target.value)} /></td></tr>)}</tbody></table></div>{onAdd && <button type="button" onClick={onAdd} className="mt-3 text-sm font-semibold text-primary">+ Agregar medición</button>}</Section>;
}
