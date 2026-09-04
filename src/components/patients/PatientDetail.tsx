import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PatientForm } from './PatientForm';
import { ClinicalHistoryForm } from './ClinicalHistoryForm';
import { PatientDocuments } from './PatientDocuments';
import { formatDate, getStatusLabel, getAppointmentTypeLabel, formatTime, formatCurrency, getInitials } from '../../utils/format';

function PatientProgressChart({ patientId }: { patientId: string }) {
  const { progressRecords } = useApp();
  const records = useMemo(() =>
    progressRecords
      .filter(r => r.patientId === patientId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [progressRecords, patientId]
  );

  const labels = useMemo(() => records.map(r => new Date(r.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })), [records]);
  const painData = useMemo(() => records.map(r => r.painLevel), [records]);
  const mobilityData = useMemo(() => records.map(r => r.mobilityScore), [records]);

  const maxVal = useMemo(() => Math.max(...painData, ...mobilityData, 10), [painData, mobilityData]);
  const chartHeight = 160;

  const getPainColor = useCallback((level: number) => {
    if (level <= 3) return 'bg-success';
    if (level <= 6) return 'bg-warning';
    return 'bg-danger';
  }, []);

  if (records.length < 2) {
    return <p className="text-gray-500 text-sm py-4">No hay suficientes datos de progreso para mostrar gráfica.</p>;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-4">Evolución del Paciente</h4>
      <div className="flex items-end gap-3 h-44">
        {records.map((r, i) => (
          <div key={r.id} className="flex-1 flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
            <div className="w-full flex flex-col items-center justify-end" style={{ height: chartHeight }}>
              <span className="text-[10px] text-gray-400">{r.painLevel}</span>
              <div
                className={`w-6 rounded-t ${getPainColor(r.painLevel)}`}
                style={{ height: `${(r.painLevel / maxVal) * (chartHeight / 2)}px` }}
                title={`Dolor: ${r.painLevel}/10`}
              />
              <div
                className="w-6 rounded-t bg-primary mt-0.5"
                style={{ height: `${(r.mobilityScore / maxVal) * (chartHeight / 2)}px` }}
                title={`Movilidad: ${r.mobilityScore}/100`}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">{labels[i]}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-600">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary inline-block" /> Movilidad</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-danger inline-block" /> Dolor (más bajo = mejor)</span>
      </div>
    </div>
  );
}

export default function PatientDetail({ patientId, onBack, onCreateAppointment, onCreateProgress, onCreatePrescription }: { patientId: string; onBack: () => void; onCreateAppointment: (patientId: string) => void; onCreateProgress: (patientId: string) => void; onCreatePrescription: (patientId: string) => void }) {
  const { patients, appointments, prescriptions, progressRecords, deletePatient } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClinicalHistory, setShowClinicalHistory] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  const patient = useMemo(() => patients.find(p => p.id === patientId), [patients, patientId]);

  const patientAppointments = useMemo(() =>
    patient ? appointments.filter(a => a.patientId === patientId).sort((a, b) => a.date.localeCompare(b.date)) : [],
    [appointments, patientId, patient]
  );

  const patientTotalCharged = useMemo(() =>
    patientAppointments.filter(a => a.status !== 'cancelled' && a.status !== 'no-show').reduce((sum, a) => sum + (a.amount || 0), 0),
    [patientAppointments]
  );

  const patientPrescriptions = useMemo(() =>
    prescriptions.filter(p => p.patientId === patientId),
    [prescriptions, patientId]
  );

  const patientProgress = useMemo(() =>
    progressRecords.filter(r => r.patientId === patientId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [progressRecords, patientId]
  );

  const latestProgress = useMemo(() => patientProgress[patientProgress.length - 1], [patientProgress]);

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Paciente no encontrado</p>
        <Button onClick={onBack} variant="outline" className="mt-4">Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            {getInitials(`${patient.firstName} ${patient.lastName}`)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${patient.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>{getStatusLabel(patient.status)}</span>
              <span className="text-sm text-gray-500">Registrado el {formatDate(patient.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onCreateAppointment(patient.id)}>Nueva cita</Button>
          <Button variant="outline" onClick={() => setShowClinicalHistory(true)}>{patient.clinicalAssessment ? 'Actualizar valoración' : 'Completar historia clínica'}</Button>
          <Button variant="outline" onClick={() => setShowDocuments(true)}>Documentos</Button>
          <Button variant="outline" onClick={() => setShowEdit(true)}>Editar</Button>
          <Button variant="ghost" className="text-danger" onClick={() => setShowDeleteConfirm(true)}>Eliminar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm text-gray-900">{patient.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                  <p className="text-sm text-gray-900">{patient.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Nacimiento</p>
                  <p className="text-sm text-gray-900">{formatDate(patient.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Dirección</p>
                  <p className="text-sm text-gray-900">{patient.address || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Género</p>
                  <p className="text-sm text-gray-900">{patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Otro'}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Contacto de Emergencia</h4>
                <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Nombre</p>
                    <p className="text-sm text-gray-900">{patient.emergencyContact.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                    <p className="text-sm text-gray-900">{patient.emergencyContact.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Relación</p>
                    <p className="text-sm text-gray-900">{patient.emergencyContact.relationship || '—'}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div><h3 className="text-lg font-semibold text-gray-900">Valoración fisioterapéutica</h3><p className="mt-1 text-xs text-slate-400">Antecedentes, exploración física y diagnóstico funcional</p></div>
              <button onClick={() => setShowClinicalHistory(true)} className="text-xs font-bold text-primary">{patient.clinicalAssessment ? 'Editar' : 'Completar'}</button>
            </CardHeader>
            <CardBody>
              {patient.clinicalAssessment ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-xs font-semibold text-slate-400">Motivo de consulta</p><p className="mt-2 text-sm text-slate-800 dark:text-slate-200">{patient.clinicalAssessment.reasonForConsultation || 'Sin registrar'}</p></div>
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-xs font-semibold text-slate-400">Diagnóstico fisioterapéutico</p><p className="mt-2 text-sm text-slate-800 dark:text-slate-200">{patient.clinicalAssessment.physiotherapyDiagnosis || 'Pendiente de diagnóstico'}</p></div>
                  <div className="sm:col-span-2 flex flex-wrap gap-2 text-xs"><span className="badge badge-info">TA {patient.clinicalAssessment.vitalSigns.bloodPressure || '—'}</span><span className="badge badge-info">Dolor {patient.clinicalAssessment.painAssessment.intensity || '—'}/10</span><span className="badge badge-secondary">{patient.clinicalAssessment.goniometry.filter(item => item.right || item.left).length} mediciones goniométricas</span></div>
                </div>
              ) : (
                <div className="py-5 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M6 3h9l3 3v15H6zM14 3v4h4M9 12h6M9 16h4" /></svg></div><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">La valoración clínica está pendiente</p><p className="mt-1 text-xs text-slate-400">Captura signos vitales, dolor, postura, marcha y mediciones.</p><Button className="mt-4" onClick={() => setShowClinicalHistory(true)}>Comenzar valoración</Button></div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Historial Médico</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Antecedentes</p>
                  <p className="text-sm text-gray-900 mt-1">{patient.medicalHistory || 'Sin antecedentes registrados'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Antecedentes Familiares</p>
                  {patient.familyMedicalHistory.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {patient.familyMedicalHistory.map((entry, i) => (
                        <p key={i} className="text-sm text-gray-900">
                          <span className="font-medium">{entry.member}:</span> {entry.condition}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">Sin antecedentes familiares</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Alergias</p>
                    <p className={`text-sm mt-1 ${patient.allergies && patient.allergies !== 'Ninguna' ? 'text-danger' : 'text-gray-900'}`}>{patient.allergies || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Medicamentos</p>
                    <p className="text-sm text-gray-900 mt-1">{patient.medications || '—'}</p>
                  </div>
                </div>
                {patient.notes && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Notas</p>
                    <p className="text-sm text-gray-900 mt-1">{patient.notes}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Citas</h3>
                <span className="text-sm text-gray-600">Total cobrado: <span className="font-semibold text-clay">{formatCurrency(patientTotalCharged)}</span></span>
              </div>
            </CardHeader>
            <CardBody>
              {patientAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No hay citas registradas</p>
              ) : (
                <div className="space-y-3">
                  {patientAppointments.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="text-center px-3 py-1 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm font-bold text-gray-900">{new Date(a.date).getDate()}</p>
                          <p className="text-[10px] text-gray-500 uppercase">{new Date(a.date).toLocaleDateString('es-MX', { month: 'short' })}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{getAppointmentTypeLabel(a.type)}</p>
                          <p className="text-xs text-gray-500">{formatTime(a.startTime)} - {formatTime(a.endTime)} · {a.therapistName}</p>
                          {a.notes && <p className="text-xs text-gray-500 mt-1">📝 {a.notes}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`badge ${a.status === 'confirmed' ? 'badge-success' : a.status === 'completed' ? 'badge-secondary' : a.status === 'cancelled' ? 'badge-danger' : a.status === 'no-show' ? 'badge-warning' : 'badge-info'}`}>
                          {getStatusLabel(a.status)}
                        </span>
                        {a.amount ? <span className="text-xs font-medium text-gray-900">{formatCurrency(a.amount)}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-gray-900">Bitácora de sesiones</h3><p className="mt-1 text-xs text-slate-400">Cómo llegó, qué se realizó y su respuesta en cada atención.</p></div><span className="badge badge-info">{patientAppointments.filter(item => item.sessionNote).length}</span></div>
            </CardHeader>
            <CardBody>
              {patientAppointments.filter(item => item.sessionNote).length === 0 ? <p className="py-4 text-center text-sm text-slate-500">Aún no hay notas de sesión. Regístralas desde Citas al terminar cada atención.</p> : <div className="space-y-4">{patientAppointments.filter(item => item.sessionNote).slice().reverse().map(item => {
                const note = item.sessionNote!;
                return <article key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(item.date)} · {getAppointmentTypeLabel(item.type)}</p><div className="flex gap-2 text-xs">{note.painBefore !== null && <span className="badge badge-warning">Dolor inicio {note.painBefore}/10</span>}{note.painAfter !== null && <span className="badge badge-success">Final {note.painAfter}/10</span>}</div></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Cómo llegó</p><p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{note.arrivalStatus}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Intervención</p><p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{note.interventions}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Respuesta</p><p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{note.patientResponse}</p></div>{note.nextSessionPlan && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Siguiente sesión</p><p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{note.nextSessionPlan}</p></div>}</div></article>;
              })}</div>}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Acciones rápidas</h3>
            </CardHeader>
            <CardBody className="grid gap-2">
              <Button className="w-full justify-center" onClick={() => onCreateAppointment(patient.id)}>Agendar cita</Button>
              <Button variant="outline" className="w-full justify-center" onClick={() => onCreateProgress(patient.id)}>Registrar evolución</Button>
              <Button variant="outline" className="w-full justify-center" onClick={() => onCreatePrescription(patient.id)}>Crear plan terapéutico</Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Resumen de Progreso</h3>
            </CardHeader>
            <CardBody>
              {latestProgress ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{latestProgress.painLevel}<span className="text-sm text-gray-500">/10</span></p>
                      <p className="text-xs text-gray-500">Nivel de Dolor</p>
                    </div>
                    <div className="p-3 bg-primary-light rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{latestProgress.mobilityScore}%</p>
                      <p className="text-xs text-gray-500">Movilidad</p>
                    </div>
                    <div className="p-3 bg-secondary-light rounded-lg text-center">
                      <p className="text-2xl font-bold text-secondary-dark">{latestProgress.strengthScore}%</p>
                      <p className="text-xs text-gray-500">Fuerza</p>
                    </div>
                    <div className="p-3 bg-clay-light rounded-lg text-center">
                      <p className="text-2xl font-bold text-clay">{latestProgress.functionalScore}%</p>
                      <p className="text-xs text-gray-500">Funcional</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">Actualizado: {formatDate(latestProgress.date)}</div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Sin datos de progreso registrados</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Recetas</h3>
            </CardHeader>
            <CardBody>
              {patientPrescriptions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No hay recetas registradas</p>
              ) : (
                <div className="space-y-3">
                  {patientPrescriptions.map(r => (
                    <div key={r.id} className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{new Date(r.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <span className={`badge ${r.status === 'active' ? 'badge-success' : r.status === 'completed' ? 'badge-info' : 'badge-secondary'}`}>{getStatusLabel(r.status)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{r.diagnosis}</p>
                      <p className="text-xs text-gray-500 mt-2">{r.treatments.length} tratamientos · {r.duration}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <PatientProgressChart patientId={patient.id} />
        </div>
      </div>

      {showEdit && <PatientForm patient={patient} onClose={() => setShowEdit(false)} />}
      {showClinicalHistory && <ClinicalHistoryForm patient={patient} onClose={() => setShowClinicalHistory(false)} />}
      {showDocuments && <PatientDocuments patient={patient} onClose={() => setShowDocuments(false)} />}

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Eliminar Paciente" size="sm">
        <p className="text-gray-700">
          ¿Estás seguro de que quieres eliminar a <strong>{patient.firstName} {patient.lastName}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
          <Button variant="danger" onClick={() => { deletePatient(patient.id); onBack(); }}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
