import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { log } from 'next/dist/server/typescript/utils';

export function formatLocalDate(isoString: string, pattern: string = 'dd/MM/yyyy HH:mm'): string {
  const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
  if (isNaN(date.getTime())) return isoString;
  return format(date, pattern, { locale: es });
}

export function toUTCStart(dateStr: string): string {
  // Split '2026-03-23' into numbers: [2026, 3, 23]
  const [year, month, day] = dateStr.split('-').map(Number);

  // Create local date explicitly (Note: months are 0-indexed in JS, so month - 1)
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);

  return date.toISOString();
}

export function toUTCEnd(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);

  // Explicitly set to 23:59:59.999 local time
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);

  return date.toISOString();
}
