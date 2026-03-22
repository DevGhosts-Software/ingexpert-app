import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatLocalDate(isoString: string, pattern: string = 'dd/MM/yyyy HH:mm'): string {
  const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
  if (isNaN(date.getTime())) return isoString;
  return format(date, pattern, { locale: es });
}
