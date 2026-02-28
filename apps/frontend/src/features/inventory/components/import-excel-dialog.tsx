'use client';

import { useCallback, useRef, useState } from 'react';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';
import { AlertCircle, FileUp, Upload } from 'lucide-react';
import { toast } from 'sonner';

import type { CreateItemDto, KitImportRow } from '@ingexpert/schema';
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
import { Progress } from '@/components/ui/progress';

const CHUNK_SIZE = 100;

interface RawExcelRow {
  [key: string]: unknown;
}

/** Normalize a header key: uppercase + strip diacritics (e.g. "Ubicación" → "UBICACION"). */
function normalizeKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/** Re-key a raw row so every header is normalized to uppercase-no-accents. */
function normalizeRow(row: RawExcelRow): RawExcelRow {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [normalizeKey(k), v]));
}

function parseItemType(value: unknown): CreateItemDto['type'] {
  const str = String(value ?? '')
    .toUpperCase()
    .trim();
  if (str === 'EQUIPMENT' || str === 'EQUIPO') return ItemType.EQUIPMENT;
  if (str === 'TOOL' || str === 'HERRAMIENTA') return ItemType.TOOL;
  if (str === 'KIT') return ItemType.KIT;
  return ItemType.PRODUCT;
}

// Expected columns: CODIGO NOMBRE UBICACION STOCK UNIDAD [TIPO]
// KIT rows are excluded — they are handled via the Kits sheet
function parseInventoryRows(rows: RawExcelRow[]): CreateItemDto[] {
  return rows
    .map(normalizeRow)
    .filter((row) => row['NOMBRE'] || row['CODIGO'])
    .map((row): CreateItemDto => {
      const code = String(row['CODIGO'] ?? '').trim();
      const name = String(row['NOMBRE'] ?? '').trim();
      const location = String(row['UBICACION'] ?? '').trim();
      const stock = Number(row['STOCK'] ?? 0);
      const unit = String(row['UNIDAD'] ?? 'unidad').trim();

      return {
        code: code || name.slice(0, 20),
        name,
        location: location || 'Sin ubicacion',
        stock: isNaN(stock) ? 0 : stock,
        unit: unit || 'unidad',
        type: parseItemType(row['TIPO']),
        imageUrl: '',
      };
    })
    .filter((item) => item.type !== ItemType.KIT); // kits handled separately
}

// Expected columns: KIT CODIGO_KIT COMPONENTE CODIGO_COMPONENTE CANTIDAD UNIDAD
function parseKitRows(rows: RawExcelRow[]): KitImportRow[] {
  return rows
    .map(normalizeRow)
    .filter((row) => row['CODIGO_KIT'] && row['CODIGO_COMPONENTE'])
    .map(
      (row): KitImportRow => ({
        kitCode: String(row['CODIGO_KIT'] ?? '').trim(),
        kitName: String(row['KIT'] ?? '').trim() || String(row['CODIGO_KIT'] ?? '').trim(),
        componentCode: String(row['CODIGO_COMPONENTE'] ?? '').trim(),
        componentName:
          String(row['COMPONENTE'] ?? '').trim() || String(row['CODIGO_COMPONENTE'] ?? '').trim(),
        quantity: Math.max(Number(row['CANTIDAD'] ?? 1), 0.001),
        unit: String(row['UNIDAD'] ?? 'unidad').trim(),
      }),
    );
}

interface ImportExcelDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportExcelDialog({ open, onClose }: ImportExcelDialogProps) {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<CreateItemDto[]>([]);
  const [parsedKitRows, setParsedKitRows] = useState<KitImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');

  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const totalCount = parsedRows.length + parsedKitRows.length;
  const progress = totalCount > 0 ? Math.round((importedCount / totalCount) * 100) : 0;

  const upsertMutation = trpc.items.importMany.useMutation();
  const kitImportMutation = trpc.kits.importMany.useMutation();

  const invalidateAll = useCallback(
    () =>
      Promise.all([
        utils.items.list.invalidate(),
        utils.items.getStats.invalidate(),
        utils.items.getCounts.invalidate(),
        utils.items.getLocations.invalidate(),
        utils.kits.getAllWithComponents.invalidate(),
      ]),
    [utils],
  );

  const handleClose = useCallback(() => {
    if (isImporting) return;
    setParsedRows([]);
    setParsedKitRows([]);
    setFileName('');
    setParseError('');
    setImportedCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  }, [isImporting, onClose]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setParsedRows([]);
    setParsedKitRows([]);
    setImportedCount(0);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const workbook = xlsxRead(data, { type: 'array' });

        // Sheet 1: Inventario (inventory items, kits excluded)
        const inventorySheetName =
          workbook.SheetNames.find((n) => n.toLowerCase().startsWith('inv')) ??
          workbook.SheetNames[0];
        const inventorySheet = workbook.Sheets[inventorySheetName];
        const inventoryRaw = xlsxUtils.sheet_to_json<RawExcelRow>(inventorySheet, { defval: '' });
        const items = parseInventoryRows(inventoryRaw);

        // Sheet 2: Kits (optional)
        const kitsSheetName = workbook.SheetNames.find((n) => n.toLowerCase().startsWith('kit'));
        const kitRows: KitImportRow[] = kitsSheetName
          ? parseKitRows(
              xlsxUtils.sheet_to_json<RawExcelRow>(workbook.Sheets[kitsSheetName], { defval: '' }),
            )
          : [];

        if (items.length === 0 && kitRows.length === 0) {
          setParseError('No se encontraron filas validas en el archivo.');
          return;
        }
        setParsedRows(items);
        setParsedKitRows(kitRows);
      } catch {
        setParseError('Error al leer el archivo. Asegurate de que sea un .xlsx valido.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleImport = useCallback(async () => {
    if (parsedRows.length === 0 && parsedKitRows.length === 0) return;
    setIsImporting(true);
    setImportedCount(0);

    try {
      // ── Items (in chunks) ────────────────────────────────────────────────────
      if (parsedRows.length > 0) {
        const chunks: CreateItemDto[][] = [];
        for (let i = 0; i < parsedRows.length; i += CHUNK_SIZE) {
          chunks.push(parsedRows.slice(i, i + CHUNK_SIZE));
        }
        let done = 0;
        for (const chunk of chunks) {
          await upsertMutation.mutateAsync(chunk);
          done += chunk.length;
          setImportedCount(done);
        }
      }

      // ── Kits (in chunks) ─────────────────────────────────────────────────────
      if (parsedKitRows.length > 0) {
        const kitChunks: KitImportRow[][] = [];
        for (let i = 0; i < parsedKitRows.length; i += CHUNK_SIZE) {
          kitChunks.push(parsedKitRows.slice(i, i + CHUNK_SIZE));
        }
        let done = parsedRows.length;
        for (const chunk of kitChunks) {
          await kitImportMutation.mutateAsync(chunk);
          done += chunk.length;
          setImportedCount(done);
        }
      }

      toast.success(
        `Importación completada: ${parsedRows.length} items, ${parsedKitRows.length} filas de kits`,
      );
      void invalidateAll();
      setParsedRows([]);
      setParsedKitRows([]);
      setFileName('');
      setImportedCount(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    } catch {
      toast.error('Error durante la importacion. Algunos items pueden haberse guardado.');
    } finally {
      setIsImporting(false);
    }
  }, [parsedRows, parsedKitRows, upsertMutation, kitImportMutation, invalidateAll, onClose]);

  const itemChunkCount = Math.ceil(parsedRows.length / CHUNK_SIZE);
  const kitChunkCount = Math.ceil(parsedKitRows.length / CHUNK_SIZE);
  const chunkCount = itemChunkCount + kitChunkCount;
  const currentChunk = Math.min(Math.ceil(importedCount / CHUNK_SIZE) + 1, chunkCount);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md" hideClose={isImporting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Importar desde Excel
          </DialogTitle>
          <DialogDescription>
            Hoja <span className="font-mono font-medium text-foreground">Inventario</span>:{' '}
            <span className="font-mono text-foreground">
              CODIGO · NOMBRE · UBICACION · STOCK · UNIDAD
            </span>
            . Hoja <span className="font-mono font-medium text-foreground">Kits</span> (opcional):{' '}
            <span className="font-mono text-foreground">
              KIT · CODIGO_KIT · COMPONENTE · CODIGO_COMPONENTE · CANTIDAD
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isImporting
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:border-primary/50'
            }`}
            onClick={() => !isImporting && fileInputRef.current?.click()}
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
              disabled={isImporting}
            />
          </div>

          {parseError && <p className="text-sm text-destructive">{parseError}</p>}

          {(parsedRows.length > 0 || parsedKitRows.length > 0) && !isImporting && (
            <div className="rounded-md bg-muted px-4 py-3 text-sm space-y-0.5">
              {parsedRows.length > 0 && (
                <p>
                  <span className="font-medium">{parsedRows.length}</span> items de inventario en{' '}
                  <span className="font-medium">{itemChunkCount}</span>{' '}
                  {itemChunkCount === 1 ? 'lote' : 'lotes'}.
                </p>
              )}
              {parsedKitRows.length > 0 && (
                <p>
                  <span className="font-medium">{parsedKitRows.length}</span> filas de kits en{' '}
                  <span className="font-medium">{kitChunkCount}</span>{' '}
                  {kitChunkCount === 1 ? 'lote' : 'lotes'}.
                </p>
              )}
            </div>
          )}

          {isImporting && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Lote {currentChunk} de {chunkCount}
                </span>
                <span className="font-medium tabular-nums">
                  {importedCount} / {totalCount} filas
                </span>
              </div>
              <Progress value={progress} />
              <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">No cierres esta ventana.</p>
                  <p>
                    La importacion ocurre por lotes desde tu navegador. Si cierras ahora, solo se
                    guardaran los <span className="font-semibold">{importedCount}</span> items ya
                    procesados — los restantes se perderan. Espera a que el progreso llegue al 100%.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            {isImporting ? 'Procesando...' : 'Cancelar'}
          </Button>
          <Button onClick={() => void handleImport()} disabled={totalCount === 0 || isImporting}>
            {isImporting
              ? `${progress}% completado`
              : `Importar ${totalCount > 0 ? totalCount : ''} filas`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
