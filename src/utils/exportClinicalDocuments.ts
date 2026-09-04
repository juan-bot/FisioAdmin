import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, TherapeuticReportData } from '../types';
import { formatDate } from './format';

const teal: [number, number, number] = [8, 127, 114];
const tealDark: [number, number, number] = [7, 63, 60];
const ink: [number, number, number] = [23, 33, 43];
const muted: [number, number, number] = [100, 116, 139];
const soft: [number, number, number] = [241, 250, 248];

function addPageHeader(doc: jsPDF, title: string, subtitle?: string) {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(...tealDark);
  doc.rect(0, 0, width, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('FisioAdmin', 16, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('GESTIÓN CLÍNICA', 16, 19);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, width - 16, 13, { align: 'right' });
  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(190, 235, 227);
    doc.text(subtitle, width - 16, 19, { align: 'right' });
  }
}

function addFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 229, 232);
    doc.line(16, height - 14, width - 16, height - 14);
    doc.setTextColor(...muted);
    doc.setFontSize(7.5);
    doc.text('Documento generado con FisioAdmin', 16, height - 8);
    doc.text(`Página ${page} de ${pages}`, width - 16, height - 8, { align: 'right' });
  }
}

function sectionTitle(doc: jsPDF, title: string, y: number) {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(...soft);
  doc.roundedRect(16, y, width - 32, 9, 2, 2, 'F');
  doc.setTextColor(...tealDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(title.toUpperCase(), 20, y + 6);
  return y + 13;
}

function infoTable(doc: jsPDF, rows: string[][], startY: number) {
  autoTable(doc, {
    body: rows,
    startY,
    theme: 'grid',
    margin: { left: 16, right: 16, bottom: 20 },
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.8, textColor: ink, lineColor: [224, 231, 235], lineWidth: 0.2 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: muted, cellWidth: 35 }, 2: { fontStyle: 'bold', textColor: muted, cellWidth: 35 } },
  });
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
}

export function exportClinicalHistoryToPDF(patient: Patient) {
  const assessment = patient.clinicalAssessment;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const name = `${patient.firstName} ${patient.lastName}`;
  addPageHeader(doc, 'HISTORIA CLÍNICA', assessment ? `Valoración: ${formatDate(assessment.assessmentDate)}` : 'Expediente del paciente');
  let y = sectionTitle(doc, 'Ficha de identificación', 36);
  y = infoTable(doc, [
    ['Paciente', name, 'Teléfono', patient.phone || '—'],
    ['Nacimiento', formatDate(patient.dateOfBirth), 'Lugar de origen', patient.demographics?.placeOfOrigin || '—'],
    ['Dirección', patient.address || '—', 'Ocupación', patient.demographics?.occupation || '—'],
    ['Escolaridad', patient.demographics?.education || '—', 'Estado civil', patient.demographics?.maritalStatus || '—'],
    ['Email', patient.email || '—', 'Religión', patient.demographics?.religion || '—'],
  ], y);

  y = sectionTitle(doc, 'Antecedentes heredofamiliares', y);
  const familyRows = patient.familyMedicalHistory?.length ? patient.familyMedicalHistory.map(item => [item.condition, item.member]) : [['Sin antecedentes registrados', '—']];
  autoTable(doc, { head: [['Enfermedad', 'Parentesco']], body: familyRows, startY: y, margin: { left: 16, right: 16 }, theme: 'striped', headStyles: { fillColor: teal, fontSize: 8 }, styles: { fontSize: 8, cellPadding: 2.5 } });
  y = (doc as any).lastAutoTable.finalY + 6;

  if (assessment) {
    y = sectionTitle(doc, 'Antecedentes personales', y);
    y = infoTable(doc, [
      ['Enfermedades', assessment.pathologicalHistory.diseases || patient.medicalHistory || '—', 'Detección', assessment.pathologicalHistory.detectionDate || '—'],
      ['Traumatismos', assessment.pathologicalHistory.trauma || '—', 'Cirugías', assessment.pathologicalHistory.surgeries || '—'],
      ['Hospitalizaciones', assessment.pathologicalHistory.hospitalizations || '—', 'Medicamentos', patient.medications || '—'],
      ['Tabaquismo', assessment.nonPathologicalHistory.smoking || '—', 'Alcohol', assessment.nonPathologicalHistory.alcohol || '—'],
      ['Actividad física', assessment.nonPathologicalHistory.physicalActivity || '—', 'Alergias', patient.allergies || '—'],
    ], y);
    y = sectionTitle(doc, 'Motivo de consulta', y);
    doc.setTextColor(...ink); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(doc.splitTextToSize(assessment.reasonForConsultation || 'Sin información registrada.', 170), 18, y);

    doc.addPage(); addPageHeader(doc, 'VALORACIÓN FÍSICA', name); y = sectionTitle(doc, 'Signos vitales', 36);
    y = infoTable(doc, [
      ['Tensión arterial', assessment.vitalSigns.bloodPressure || '—', 'Frecuencia cardiaca', assessment.vitalSigns.heartRate || '—'],
      ['Frecuencia respiratoria', assessment.vitalSigns.respiratoryRate || '—', 'Temperatura', assessment.vitalSigns.temperature || '—'],
      ['Glucosa', assessment.vitalSigns.glucose || '—', 'Saturación O₂', assessment.vitalSigns.oxygenSaturation || '—'],
      ['Talla', assessment.vitalSigns.height || '—', 'Peso', assessment.vitalSigns.weight || '—'],
    ], y);
    y = sectionTitle(doc, 'Evaluación del dolor', y);
    y = infoTable(doc, [
      ['Aparición', assessment.painAssessment.onset || '—', 'Localización', assessment.painAssessment.location || '—'],
      ['Irradiación', assessment.painAssessment.radiation || '—', 'Intensidad', assessment.painAssessment.intensity || '—'],
      ['Características', assessment.painAssessment.characteristics || '—', 'Agravantes', assessment.painAssessment.aggravatingFactors || '—'],
    ], y);
    y = sectionTitle(doc, 'Postura y marcha', y);
    y = infoTable(doc, [
      ['Hallazgos posturales', assessment.posturalFindings || '—'],
      ['Marcha', assessment.gait.independent ? 'Independiente' : `Con aditamento: ${assessment.gait.assistiveDevice || 'no especificado'}`],
      ['Observaciones', assessment.gait.observations || '—'],
    ], y);

    doc.addPage(); addPageHeader(doc, 'MEDICIONES CLÍNICAS', name);
    const measurementTable = (title: string, rows: typeof assessment.goniometry, startY: number) => {
      const nextY = sectionTitle(doc, title, startY);
      autoTable(doc, { head: [['Articulación / grupo', 'Movimiento', 'Referencia', 'Derecho', 'Izquierdo']], body: rows.map(row => [row.name, row.movement || '—', row.reference || '—', row.right || '—', row.left || '—']), startY: nextY, margin: { left: 16, right: 16, bottom: 20 }, theme: 'grid', headStyles: { fillColor: teal, fontSize: 7.5 }, styles: { fontSize: 7.2, cellPadding: 1.8, lineColor: [224, 231, 235] } });
      return (doc as any).lastAutoTable.finalY + 6;
    };
    y = measurementTable('Evaluación goniométrica', assessment.goniometry.filter(row => row.right || row.left), 36);
    if (y > 220) { doc.addPage(); addPageHeader(doc, 'MEDICIONES CLÍNICAS', name); y = 36; }
    y = measurementTable('Fuerza muscular', assessment.muscleStrength, y);
    y = measurementTable('Reflejos', assessment.reflexes.filter(row => row.right || row.left), y);

    if (y > 190) { doc.addPage(); addPageHeader(doc, 'CONCLUSIONES', name); y = 36; }
    for (const [title, content] of [['Sensibilidad', assessment.sensitivity], ['Pruebas especiales', assessment.specialTests], ['Diagnóstico fisioterapéutico', assessment.physiotherapyDiagnosis], ['Notas clínicas', assessment.notes]] as const) {
      y = sectionTitle(doc, title, y);
      doc.setTextColor(...ink); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      const lines = doc.splitTextToSize(content || 'Sin información registrada.', 170);
      doc.text(lines, 18, y);
      y += Math.max(14, lines.length * 4.4 + 6);
    }
  } else {
    y = sectionTitle(doc, 'Información médica', y);
    infoTable(doc, [['Antecedentes', patient.medicalHistory || '—'], ['Alergias', patient.allergies || '—'], ['Medicamentos', patient.medications || '—'], ['Notas', patient.notes || '—']], y);
  }

  addFooter(doc);
  doc.save(`historia-clinica-${patient.firstName}-${patient.lastName}.pdf`);
}

export function exportTherapeuticReportToPDF(patient: Patient, report: TherapeuticReportData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const name = `${patient.firstName} ${patient.lastName}`;
  doc.setFillColor(247, 246, 239); doc.rect(0, 0, width, 297, 'F');
  doc.setTextColor(...tealDark); doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.text(report.clinicName || 'FisioAdmin', 18, 24);
  doc.setFontSize(8); doc.setTextColor(...muted); doc.text('FISIOTERAPIA · CREER · SENTIR · AVANZAR', 18, 31);
  doc.setDrawColor(...teal); doc.setLineWidth(0.5); doc.line(18, 38, width - 18, 38);
  doc.setTextColor(...ink); doc.setFontSize(15); doc.text('INFORME FISIOTERAPÉUTICO', width - 18, 28, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(formatDate(report.date), width - 18, 46, { align: 'right' });
  let y = 64;
  doc.setFontSize(11); doc.text(report.addressee || 'A quien corresponda:', 18, y); y += 14;
  const paragraph = `Por medio de la presente se hace constar que ${patient.gender === 'female' ? 'la paciente' : 'el paciente'} ${name} se encuentra actualmente bajo tratamiento fisioterapéutico debido a ${report.diagnosis || 'la condición descrita en su expediente clínico'}.`;
  doc.text(doc.splitTextToSize(paragraph, 174), 18, y, { align: 'justify', maxWidth: 174 }); y += 24;
  if (report.clinicalStatus) { const lines = doc.splitTextToSize(report.clinicalStatus, 174); doc.text(lines, 18, y, { align: 'justify', maxWidth: 174 }); y += lines.length * 5 + 9; }
  doc.setFont('helvetica', 'bold'); doc.text('Indicaciones y recomendaciones:', 18, y); y += 8; doc.setFont('helvetica', 'normal');
  report.recommendations.filter(Boolean).forEach(item => { const lines = doc.splitTextToSize(item, 164); doc.circle(21, y - 1.2, 0.7, 'F'); doc.text(lines, 25, y); y += lines.length * 5 + 2; });
  if (report.returnPlan) { y += 5; const lines = doc.splitTextToSize(report.returnPlan, 174); doc.text(lines, 18, y, { align: 'justify', maxWidth: 174 }); y += lines.length * 5 + 10; }
  y = Math.max(y, 220);
  doc.setFont('helvetica', 'bold'); doc.text('ATENTAMENTE', width / 2, y, { align: 'center' });
  doc.setDrawColor(...muted); doc.line(width / 2 - 35, y + 23, width / 2 + 35, y + 23);
  doc.setTextColor(...ink); doc.text(report.therapistName, width / 2, y + 30, { align: 'center' });
  if (report.professionalLicense) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(`Cédula profesional: ${report.professionalLicense}`, width / 2, y + 35, { align: 'center' }); }
  doc.setFontSize(8); doc.setTextColor(...muted);
  const contact = [report.phone, report.email, report.address].filter(Boolean);
  contact.forEach((value, index) => doc.text(value, 18, 268 + index * 5));
  doc.setDrawColor(...teal); doc.line(18, 287, width - 18, 287);
  doc.save(`informe-fisioterapeutico-${patient.firstName}-${patient.lastName}.pdf`);
}
