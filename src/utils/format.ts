const parseCalendarDate = (date: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(date);
};

export const formatDate = (date: string) => {
  const d = parseCalendarDate(date);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateLong = (date: string) => {
  const d = parseCalendarDate(date);
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
