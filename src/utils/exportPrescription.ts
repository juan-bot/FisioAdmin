import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Prescription } from '../types';
import { formatDate } from './format';

export function exportPrescriptionToPDF(prescription: Prescription) {
  const therapistName = prescription.therapistName;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20;

  const primaryColor: [number, number, number] = [37, 99, 235];
  const secondaryColor: [number, number, number] = [59, 130, 246];
  const textColor: [number, number, number] = [31, 41, 55];
  const lightGray: [number, number, number] = [243, 244, 246];
  const borderColor: [number, number, number] = [209, 213, 219];

  const addHeader = () => {
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 55, 'F');

    doc.setFillColor(...secondaryColor);
    doc.rect(0, 55, pageWidth, 3, 'F');

    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('RECETA DE TRATAMIENTO', pageWidth / 2, 22, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('FisioAdmin - Gestión de Fisioterapia', pageWidth / 2, 34, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(200, 220, 255);
    doc.text(`Generado el ${formatDate(new Date().toISOString().split('T')[0])}`, pageWidth / 2, 44, { align: 'center' });

    yPosition = 70;
  };

  const addPatientInfo = () => {
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 28, 3, 3, 'F');
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 28, 3, 3, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('INFORMACIÓN DEL PACIENTE', margin + 5, yPosition + 7);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text(`${prescription.patientName}`, margin + 5, yPosition + 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de la receta: ${formatDate(prescription.date)}`, margin + 5, yPosition + 23);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Terapeuta: ${therapistName}`, pageWidth - margin - 5, yPosition + 16, { align: 'right' });

    doc.setFontSize(9);
    doc.text(`Estado: ${getStatusLabel(prescription.status)}`, pageWidth - margin - 5, yPosition + 23, { align: 'right' });

    yPosition += 36;
  };

  const addDiagnosis = () => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 22, 3, 3, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('DIAGNÓSTICO', margin + 5, yPosition + 7);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    const diagnosisLines = doc.splitTextToSize(prescription.diagnosis, pageWidth - 2 * margin - 10);
    doc.text(diagnosisLines, margin + 5, yPosition + 15);

    yPosition += 30;
  };

  const addTreatments = () => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('PLAN DE TRATAMIENTO', margin, yPosition);
    yPosition += 8;

    const tableData = prescription.treatments.map((t, index) => [
      `${index + 1}`,
      t.name,
      t.description || '-',
      `${t.sets}`,
      `${t.reps}`,
      t.duration ? `${t.duration} min` : '-',
      t.frequency || '-',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Ejercicio', 'Descripción', 'Series', 'Reps', 'Duración', 'Frecuencia']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: textColor,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: lightGray,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35, fontStyle: 'bold' },
        2: { cellWidth: 55 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 30, halign: 'center' },
      },
      margin: { left: margin, right: margin },
      styles: {
        lineColor: borderColor,
        lineWidth: 0.2,
      },
      didDrawPage: (data) => {
        yPosition = data.cursor.y + 5;
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  };

  const addNotes = () => {
    const hasGeneralNotes = prescription.notes && prescription.notes.trim();
    const hasTreatmentNotes = prescription.treatments.some(t => t.notes && t.notes.trim());

    if (!hasGeneralNotes && !hasTreatmentNotes) return;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 30, 3, 3, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('NOTAS E INDICACIONES', margin + 5, yPosition + 7);

    let noteY = yPosition + 14;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);

    if (hasGeneralNotes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Generales:', margin + 5, noteY);
      doc.setFont('helvetica', 'normal');
      const generalLines = doc.splitTextToSize(prescription.notes, pageWidth - 2 * margin - 15);
      doc.text(generalLines, margin + 25, noteY);
      noteY += generalLines.length * 4.5 + 3;
    }

    if (hasTreatmentNotes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Por tratamiento:', margin + 5, noteY);
      noteY += 5;
      doc.setFont('helvetica', 'normal');
      prescription.treatments.forEach((t, index) => {
        if (t.notes && t.notes.trim()) {
          const noteText = `${index + 1}. ${t.name}: ${t.notes}`;
          const noteLines = doc.splitTextToSize(noteText, pageWidth - 2 * margin - 15);
          doc.text(noteLines, margin + 10, noteY);
          noteY += noteLines.length * 4.5 + 2;
        }
      });
    }

    yPosition = noteY + 10;
  };

  const addFooter = () => {
    const footerY = pageHeight - 25;

    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('FisioAdmin - Sistema de Gestión de Fisioterapia', pageWidth / 2, footerY + 2, { align: 'center' });
    doc.text('Este documento es confidencial y está destinado únicamente al paciente indicado.', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text(`Paciente: ${prescription.patientName} | Terapeuta: ${therapistName} | ID: ${prescription.id}`, pageWidth / 2, footerY + 14, { align: 'center' });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'ACTIVA',
      completed: 'COMPLETADA',
      cancelled: 'CANCELADA',
    };
    return labels[status] || status.toUpperCase();
  };

  addHeader();
  addPatientInfo();
  addDiagnosis();
  addTreatments();
  addNotes();
  addFooter();

  const fileName = `Receta_${prescription.patientName.replace(/\s+/g, '_')}_${prescription.date}.pdf`;
  doc.save(fileName);
}