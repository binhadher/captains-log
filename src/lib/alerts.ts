// Alert calculation utilities

export interface Alert {
  id: string;
  type: 'maintenance_date' | 'maintenance_hours' | 'document_expiry' | 'health_check';
  severity: 'overdue' | 'urgent' | 'upcoming' | 'info';
  title: string;
  description: string;
  dueDate?: string;
  dueHours?: number;
  currentHours?: number;
  componentId?: string;
  componentName?: string;
  documentId?: string;
  boatId: string;
  boatName?: string;
}

export function calculateSeverity(daysUntilDue: number): Alert['severity'] {
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'urgent';
  if (daysUntilDue <= 30) return 'upcoming';
  return 'info';
}

export function calculateHoursSeverity(hoursUntilDue: number): Alert['severity'] {
  if (hoursUntilDue < 0) return 'overdue';
  if (hoursUntilDue <= 10) return 'urgent';
  if (hoursUntilDue <= 50) return 'upcoming';
  return 'info';
}

export function formatDueIn(daysUntilDue: number): string {
  if (daysUntilDue < 0) {
    const overdue = Math.abs(daysUntilDue);
    return overdue === 1 ? '1 day overdue' : `${overdue} days overdue`;
  }
  if (daysUntilDue === 0) return 'Today';
  if (daysUntilDue === 1) return 'Tomorrow';
  if (daysUntilDue < 7) return `${daysUntilDue} days`;
  if (daysUntilDue < 30) {
    const weeks = Math.floor(daysUntilDue / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  const months = Math.floor(daysUntilDue / 30);
  return months === 1 ? '1 month' : `${months} months`;
}

export function formatHoursDue(hoursUntilDue: number, currentHours?: number): string {
  if (hoursUntilDue < 0) {
    return `${Math.abs(hoursUntilDue)} hrs overdue`;
  }
  if (currentHours !== undefined) {
    return `${hoursUntilDue} hrs remaining`;
  }
  return `Due at ${hoursUntilDue} hrs`;
}

export const SEVERITY_COLORS: Record<Alert['severity'], { bg: string; text: string; border: string }> = {
  overdue: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  urgent: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  upcoming: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  info: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};
