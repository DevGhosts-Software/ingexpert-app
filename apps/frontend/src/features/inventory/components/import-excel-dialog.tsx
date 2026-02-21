'use client';

import { useCallback, useRef, useState } from 'react';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';
import { FileUp, Upload } from 'lucide-react';
import { toast } from 'sonner';

import type { CreateItemDto } from '@ingexpert/schema';
import { ItemType } from '@ingexpert/schema';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RawExcelRow {
  Código?: unknown;
  Nombre?: unknown;
  Ubicación?: unknown;
  Stock?: unknown;
  Unidad?: unknown;
  CODIGO?: unknown;
  OBSERVACION?: unknown;
  [key: string]: unknown;
}

function parseItemType(value: unknown): CreateItemDto['type'] {
  const str = String(value ?? '').toUpperCase().trim();
  if (str === 'EQUIPMENT' || str === 'EQUIPO') return ItemType.EQUIPMENT;
  if (str === 'TOOL' || str === 'HERRAMIENTA') return ItemType.TOOL;
  if (str === 'KIT') return ItemType.KIT;
  return ItemType.PRODUCT;
}

function parseRows(rows: RawExcelRow[]): CreateItemDto[] {
  return rows
    .filter((row) => row['Nombre'] || row['CODIGO'] || row['Código'])
    .map((row): CreateItemDto => {
      const code = String(row['CODIGO'] ?? row['Código'] ?? '').trim();
      const name = String(row['Nombre'] ?? '').trim();
      const location = String(row['Ubicación'] ?? '').trim();
      const stock = Number(row['Stock'] ?? 0);
      const unit = String(row['Unidad'] ?? 'unidad').trim();
      const observations = row['OBSERVACION'] != null ? String(row['OBSERVACION']).trim() : undefined;

      return {
        code: code || name.slice(0, 20),
        name,
        location: location || 'Sin ubicación',
        stock: isNaN(stock) ? 0 : stock,
        unit: unit || 'unidad',
        type: parseItemType(row['Tipo']),
        imageUrl: '',
        observations: observations || undefined,
      };
    });
}

interface ImportExcelDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportExcelDialog({ open, onClose }: ImportExcelDialogProps) {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<CreateItemDto[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');

  const upsertMutation = trpc.items.upsertManyByName.useMutation({
    onSuccess: () => {
      toast.success(`${parsedRows.length} ítems importados correctamente`);
      void Promise.all([
        utils.items.list.invalidate(),
        utils.items.getStats.invalidate(),
        utils.items.getCounts.invalidate(),
        utils.items.getLocations.invalidate(),
      ]);
      handleClose();
    },
    onError: (err) => toast.error(err.message ?? 'Error al importar ítems'),
  });

  const handleClose = useCallback(() => {
    setParsedRows([]);
    setFileName('');
    setParseError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  }, [onClose]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setParsedRows([]);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const workbook = xlsxRead(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = xlsxUtils.sheet_to_json<RawExcelRow>(sheet, { defval: '' });
        const items = parseRows(rawRows);
        if (items.length === 0) {
          setParseError('No se encontraron filas válidas en el archivo.');
          return;
        }
        setParsedRows(items);
      } catch {
        setParseError('Error al leer el archivo. Asegúrate de que sea un .xlsx válido.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleImport = useCallback(() => {
    if (parsedRows.length === 0) return;
    upsertMutation.mutate(parsedRows);
  }, [parsedRows, upsertMutation]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Importar desde Excel
          </DialogTitle>
          <DialogDescription>
            Selecciona un archivo .xlsx con las columnas: Código, Nombre, Ubicación, Stock, Unidad,
            CODIGO, OBSERVACION.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {fileName ? (
              <p className="text-sm font-medium">{fileName}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Haz clic para seleccionar un archivo .xlsx
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {parseError && <p className="text-sm text-destructive">{parseError}</p>}

          {parsedRows.length > 0 && (
            <div className="rounded-md bg-muted px-4 py-3 text-sm">
              <span className="font-medium">{parsedRows.length}</span> ítems listos para importar.
              Los existentes (por nombre) serán actualizados.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={upsertMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedRows.length === 0 || upsertMutation.isPending}
          >
            {upsertMutation.isPending ? 'Importando...' : `Importar ${parsedRows.length > 0 ? parsedRows.length : ''} ítems`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
