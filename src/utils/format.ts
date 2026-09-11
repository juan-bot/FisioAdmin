/**
 * Parses date-only values as local calendar dates. The Date constructor treats
 * `YYYY-MM-DD` as UTC, which otherwise displays the previous day in Mexico.
 */
export const parseCalendarDate = (date: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(date);
};

/** Returns today's date for date inputs in the user's local time zone. */
export const getLocalDateISO = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const formatCalendarDate = (date: string, options: Intl.DateTimeFormatOptions) =>
  parseCalendarDate(date).toLocaleDateString('es-MX', options);

/** Calculates age from a calendar date without UTC date-shift issues. */
export const getAge = (dateOfBirth: string, referenceDate = new Date()): number | null => {
  const birthDate = parseCalendarDate(dateOfBirth);
  if (Number.isNaN(birthDate.getTime()) || birthDate > referenceDate) return null;

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday = referenceDate.getMonth() > birthDate.getMonth()
    || (referenceDate.getMonth() === birthDate.getMonth() && referenceDate.getDate() >= birthDate.getDate());
  if (!hasHadBirthday) age -= 1;
  return age;
};

export const formatDate = (date: string) => {
  return formatCalendarDate(date, { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateLong = (date: string) => {
  return formatCalendarDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

export const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    scheduled: 'badge-info',
    confirmed: 'badge-success',
    completed: 'badge-secondary',
    cancelled: 'badge-danger',
    'no-show': 'badge-warning',
    active: 'badge-success',
    inactive: 'badge-warning',
    discharged: 'badge-secondary',
  };
  return colors[status] || 'badge-secondary';
};

export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    'no-show': 'No asistió',
    active: 'Activo',
    inactive: 'Inactivo',
    discharged: 'Dado de alta',
  };
  return labels[status] || status;
};

export const getAppointmentTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    evaluation: 'Evaluación',
    treatment: 'Tratamiento',
    'follow-up': 'Seguimiento',
    're-evaluation': 'Re-evaluación',
  };
  return labels[type] || type;
};
