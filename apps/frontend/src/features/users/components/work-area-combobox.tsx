'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface WorkAreaComboboxProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  workAreas: string[];
  disabled?: boolean;
}

export function WorkAreaCombobox({ value, onChange, workAreas, disabled }: WorkAreaComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const currentValue = value ?? '';
  const trimmed = search.trim();

  // Show "create new" option only when typed text doesn't exactly match an existing area
  const showCreate =
    trimmed.length > 0 && !workAreas.some((a) => a.toLowerCase() === trimmed.toLowerCase());

  const handleSelect = (area: string) => {
    onChange(area === currentValue ? null : area);
    setOpen(false);
    setSearch('');
  };

  const handleCreate = () => {
    onChange(trimmed);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !currentValue && 'text-muted-foreground',
          )}
        >
          {currentValue || 'Buscar o escribir área...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar área..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
              Sin resultados.
            </CommandEmpty>
            {workAreas.length > 0 && (
              <CommandGroup>
                {workAreas.map((area) => (
                  <CommandItem key={area} value={area} onSelect={() => handleSelect(area)}>
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        currentValue === area ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {area}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <CommandGroup>
                <CommandItem onSelect={handleCreate} className="text-muted-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear &quot;{trimmed}&quot;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
