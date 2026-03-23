import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatLocalDate(isoString: string, pattern: string = 'dd/MM/yyyy HH:mm'): string {
  const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
  if (isNaN(date.getTime())) return isoString;
  return format(date, pattern, { locale: es });
}

export function toUTCStart(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00.000`);
  return date.toISOString();
}

export function toUTCEnd(dateStr: string): string {
  const date = new Date(`${dateStr}T23:59:59.999`);
  return date.toISOString();
}
