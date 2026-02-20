'use client';

import { useRef, useState } from 'react';
import { ImageIcon, Loader2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useStorageUpload } from '@/hooks/use-storage-upload';
import { cn } from '@/lib/utils';

interface ImageUploadFieldProps {
  value?: string | null;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

export function ImageUploadField({ value, onChange, disabled }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { uploadFile, deleteFile, isUploading } = useStorageUpload();

  const isDisabled = disabled || isUploading;

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch {
      toast.error('Error al subir la imagen. Intenta de nuevo.');
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    if (value) await deleteFile(value);
    onChange(undefined);
  }

  if (value) {
    return (
      <div className="relative group w-full rounded-lg border overflow-hidden bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Vista previa" className="w-full h-40 object-contain" />
        {!isDisabled && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              Cambiar
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={(e) => void handleRemove(e)}>
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
          disabled={isDisabled}
        />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onClick={() => !isDisabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && !isDisabled && inputRef.current?.click()}
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
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        !isDisabled && 'cursor-pointer',
      )}
    >
      {isUploading ? (
        <div className="flex flex-col items-center gap-1">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">Subiendo imagen...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5" />
            <ImageIcon className="h-4 w-4" />
          </div>
          <span className="font-medium">Subir imagen</span>
          <span className="text-xs">Arrastra o haz clic para seleccionar</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={isDisabled}
      />
    </div>
  );
}
