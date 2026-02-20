'use client';

import { useRef, useState } from 'react';
import { ImageIcon, UploadCloud, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadFieldProps {
  value?: string | null;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

export function ImageUploadField({ value, onChange, disabled }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(undefined);
  }

  if (value) {
    return (
      <div className="relative group w-full rounded-lg border overflow-hidden bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Vista previa" className="w-full h-40 object-contain" />
        {!disabled && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              Cambiar
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-2 w-full h-32',
        'rounded-lg border-2 border-dashed transition-colors',
        'text-muted-foreground text-sm',
        dragging
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-muted/30',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        !disabled && 'cursor-pointer',
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5" />
          <ImageIcon className="h-4 w-4" />
        </div>
        <span className="font-medium">Subir imagen</span>
        <span className="text-xs">Arrastra o haz clic para seleccionar</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}
