'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  value: string; // ISO date string "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: Date; // passed as `disabled` to Calendar for min/max
  maxDate?: Date;
  minDate?: Date;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  maxDate,
  minDate,
  className,
}: DatePickerProps) {
  const selected = value ? parseISO(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? format(date, 'yyyy-MM-dd') : '');
  };

  const disabledMatcher = React.useCallback(
    (day: Date) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      if (minDate && dayStr < format(minDate, 'yyyy-MM-dd')) return true;
      if (maxDate && dayStr > format(maxDate, 'yyyy-MM-dd')) return true;
      return false;
    },
    [minDate, maxDate],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selected}
          className={cn(
            'h-8 w-full justify-start text-left text-sm font-normal data-[empty=true]:text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
          {selected ? format(selected, 'dd/MM/yyyy', { locale: es }) : placeholder}
          {selected && (
            <span
              role="button"
              aria-label="Limpiar fecha"
              className="ml-auto pl-1"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            >
              <X className="h-3 w-3 opacity-50 hover:opacity-100" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={disabledMatcher}
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  );
}
