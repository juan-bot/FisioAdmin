import type { Appointment } from '../types';

export function paymentStatusOf(appointment: Appointment): Appointment['paymentStatus'] | undefined {
  if (appointment.paymentStatus) return appointment.paymentStatus;
  return appointment.status === 'completed' ? 'pending' : undefined;
}

export function followUpStatusOf(appointment: Appointment): Appointment['followUpStatus'] | undefined {
  if (appointment.followUpStatus) return appointment.followUpStatus;
  return appointment.status === 'completed' ? 'pending' : undefined;
}

export function isAppointmentPaid(appointment: Appointment): boolean {
  return appointment.status === 'completed'
    && appointment.paymentStatus === 'paid'
    && Boolean(appointment.amount && appointment.amount > 0);
}

export function paymentDateOf(appointment: Appointment): Date {
  return new Date(appointment.paidAt || `${appointment.date}T12:00:00`);
}

export function needsPayment(appointment: Appointment): boolean {
  return appointment.status === 'completed' && paymentStatusOf(appointment) === 'pending';
}

export function needsFollowUp(appointment: Appointment, today: string): boolean {
  return appointment.status === 'completed'
    && followUpStatusOf(appointment) === 'pending'
    && (!appointment.followUpDate || appointment.followUpDate <= today);
}
