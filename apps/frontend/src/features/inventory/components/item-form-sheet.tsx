'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Boxes, PackagePlus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { type CreateItemDto, CreateItemSchema } from '@ingexpert/schema';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useLocalKitComponents } from '@/lib/api-migration-local-reads';
import { supabase } from '@/lib/supabase';
import { useStorageUpload } from '@/hooks/use-storage-upload';
import { usePowerSyncDatabase } from '@/components/providers/powersync-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { ImageUploadField, type ImageUploadFieldHandle } from './image-upload-field';
import {
  type InventoryItem,
  type ItemType,
  TYPE_COLORS,
  TYPE_CONFIG,
} from './inventory-table.types';
import { KitComponentsBuilder, type LocalComponent } from './kit-components-builder';

// ─── Type cards ───────────────────────────────────────────────────────────────

const TYPE_CARDS = (Object.keys(TYPE_CONFIG) as ItemType[]).map((type) => ({
  value: type,
  icon: TYPE_CONFIG[type].icon,
  label: TYPE_CONFIG[type].label,
  description: TYPE_COLORS[type].description,
  styles: {
    selected: `${TYPE_COLORS[type].bg} border-opacity-100`,
    border: TYPE_COLORS[type].border,
    icon: TYPE_COLORS[type].badge.split(' ').find((c) => c.startsWith('text-')) ?? '',
    label: TYPE_COLORS[type].badge.split(' ').find((c) => c.startsWith('text-')) ?? '',
  },
}));

// ─── Stock input with free-form editing ──────────────────────────────────────

function StockInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [display, setDisplay] = useState(String(value));

  return (
    <Input
      type="text"
      inputMode="decimal"
      placeholder="0"
      disabled={disabled}
      value={display}
      onChange={(e) => {
        const raw = e.target.value;
        setDisplay(raw);
        const n = Number(raw);
        if (raw !== '' && !isNaN(n) && n >= 0) onChange(n);
      }}
      onBlur={() => {
        const n = Number(display);
        const safe = isNaN(n) || n < 0 ? 0 : n;
        setDisplay(String(safe));
        onChange(safe);
      }}
    />
  );
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ItemFormSchema = CreateItemSchema.extend({
  name: z.string().min(1, 'Nombre requerido'),
  code: z.string().min(1, 'Código requerido'),
  location: z.string().min(1, 'Ubicación requerida'),
  stock: z.number().min(0, 'Stock mínimo es 0'),
  unit: z.string().min(1, 'Unidad requerida'),
});
type FormValues = CreateItemDto;

interface ItemFormSheetProps {
  mode: 'create' | 'edit';
  item?: InventoryItem | null;
  open: boolean;
  onClose: () => void;
}

export function ItemFormSheet({ mode, item, open, onClose }: ItemFormSheetProps) {
  const isEdit = mode === 'edit';
  const imageFieldRef = useRef<ImageUploadFieldHandle>(null);
  const originalImageUrl = useRef<string | undefined>(undefined);
  const { uploadFile, deleteFile, isUploading } = useStorageUpload();
  const powerSyncDb = usePowerSyncDatabase();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [kitComponents, setKitComponents] = useState<LocalComponent[]>([]);
  const { components: localExistingComponents } = useLocalKitComponents(
    item?.id ?? '',
    isEdit && item?.type === 'KIT' && open,
  );
  const existingComponents = localExistingComponents;

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) {
        setCurrentUserId(session?.user.id ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (open && isEdit && existingComponents) {
      setKitComponents(
        existingComponents.map((c) => ({
          componentId: c.componentId,
          name: c.component.name,
          code: c.component.code,
          unit: c.component.unit,
          totalInventory: Number(c.component.stock),
          quantity: Number(c.quantity),
          type: c.component.type,
        })),
      );
    } else if (!open) {
      setKitComponents([]);
    }
  }, [open, isEdit, existingComponents]);

  const form = useForm<FormValues>({
    resolver: zodResolver(ItemFormSchema),
    defaultValues: {
      name: '',
      code: '',
      location: '',
      stock: 0,
      unit: '',
      type: 'PRODUCT' as FormValues['type'],
      imageUrl: undefined,
    },
  });

  const watchedType = form.watch('type');
  const isKit = watchedType === 'KIT';
  const colors = TYPE_COLORS[watchedType];

  const handleTypeSelect = useCallback(
    (type: ItemType) => {
      form.setValue('type', type, { shouldValidate: true });
    },
    [form],
  );

  useEffect(() => {
    if (isKit) {
      form.setValue('location', '-', { shouldValidate: false });
      form.setValue('unit', 'kit', { shouldValidate: false });
      form.setValue('stock', 0, { shouldValidate: false });
      form.setValue('imageUrl', undefined, { shouldValidate: false });
    }
  }, [isKit, form]);

  useEffect(() => {
    imageFieldRef.current?.reset();
    if (isEdit && item && open) {
      originalImageUrl.current = item.imageUrl ?? undefined;
      form.reset({
        name: item.name,
        code: item.code,
        location: item.location,
        stock: item.warehouseInventory,
        unit: item.unit,
        type: item.type,
        imageUrl: item.imageUrl ?? undefined,
      });
    } else if (!isEdit && open) {
      originalImageUrl.current = undefined;
      form.reset({
        name: '',
        code: '',
        location: '',
        stock: 0,
        unit: '',
        type: 'PRODUCT',
        imageUrl: undefined,
      });
    }
  }, [open, isEdit, item, form]);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      const pendingFile = imageFieldRef.current?.getPendingFile() ?? null;
      const itemId = isEdit && item ? item.id : uuidv4();
      const imageUrl = values.imageUrl ?? '';
      const normalizedStock = Number.isFinite(values.stock) ? Math.max(values.stock, 0) : 0;

      await powerSyncDb.writeTransaction(async (tx) => {
        if (isEdit && item) {
          await tx.execute(
            `
              UPDATE items
              SET code = ?, name = ?, location = ?, unit = ?, type = ?, image_url = ?
              WHERE id = ?
            `,
            [
              values.code,
              values.name,
              values.location,
              values.unit,
              values.type,
              imageUrl,
              item.id,
            ],
          );

          if (values.type !== 'KIT') {
            const currentStock = Number(item.warehouseInventory ?? 0);
            const stockDelta = normalizedStock - currentStock;
            if (stockDelta !== 0) {
              if (!currentUserId) {
                throw new Error(
                  'No se pudo identificar el usuario actual para registrar el ajuste',
                );
              }
              const movementId = uuidv4();
              const adjustmentType = stockDelta > 0 ? 'PURCHASE' : 'WRITEOFF';
              const adjustmentQty = Math.abs(stockDelta);
              const nowIso = new Date().toISOString();

              await tx.execute(
                `
                  INSERT INTO movements (
                    id,
                    type,
                    created_by_id,
                    destination,
                    observations,
                    responsible_delivery_id,
                    responsible_receipt_id,
                    date,
                    project_id
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                  movementId,
                  adjustmentType,
                  currentUserId,
                  '__stock_adjustment__',
                  'Ajuste automático desde edición de stock',
                  null,
                  null,
                  nowIso,
                  null,
                ],
              );

              await tx.execute(
                `
                  INSERT INTO movement_details (id, movement_id, item_id, quantity)
                  VALUES (?, ?, ?, ?)
                `,
                [uuidv4(), movementId, item.id, adjustmentQty],
              );

              await tx.execute('UPDATE items SET stock = stock + ? WHERE id = ?', [
                stockDelta,
                item.id,
              ]);
            }
          }
        } else {
          await tx.execute(
            `
              INSERT INTO items (id, code, name, location, stock, unit, type, image_url)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              itemId,
              values.code,
              values.name,
              values.location,
              normalizedStock,
              values.unit,
              values.type,
              imageUrl,
            ],
          );
        }

        if (values.type === 'KIT') {
          await tx.execute('DELETE FROM kit_details WHERE kit_id = ?', [itemId]);
          for (const component of kitComponents) {
            await tx.execute(
              `
                INSERT INTO kit_details (id, kit_id, item_id, quantity)
                VALUES (?, ?, ?, ?)
              `,
              [uuidv4(), itemId, component.componentId, component.quantity],
            );
          }
        } else {
          await tx.execute('DELETE FROM kit_details WHERE kit_id = ?', [itemId]);
        }
      });

      if (pendingFile) {
        void (async () => {
          try {
            const uploadedImageUrl = await uploadFile(pendingFile);
            await powerSyncDb.writeTransaction(async (tx) => {
              await tx.execute('UPDATE items SET image_url = ? WHERE id = ?', [
                uploadedImageUrl,
                itemId,
              ]);
            });
            if (originalImageUrl.current && originalImageUrl.current !== uploadedImageUrl) {
              await deleteFile(originalImageUrl.current);
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Error al subir la imagen del ítem';
            toast.error(message);
          }
        })();
      } else if (originalImageUrl.current && originalImageUrl.current !== imageUrl) {
        void deleteFile(originalImageUrl.current);
      }

      toast.success(
        isEdit
          ? 'Ítem guardado localmente. Se sincronizará automáticamente.'
          : 'Ítem creado localmente. Se sincronizará automáticamente.',
      );
      onClose();
    },
    [currentUserId, deleteFile, isEdit, item, kitComponents, onClose, powerSyncDb, uploadFile],
  );

  const isPending = isUploading;

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  const handleKitAdd = useCallback((newItem: LocalComponent) => {
    setKitComponents((prev) => {
      if (prev.some((c) => c.componentId === newItem.componentId)) return prev;
      return [...prev, newItem];
    });
  }, []);

  const handleKitRemove = useCallback((componentId: string) => {
    setKitComponents((prev) => prev.filter((c) => c.componentId !== componentId));
  }, []);

  const handleKitQtyChange = useCallback((componentId: string, qty: number) => {
    setKitComponents((prev) =>
      prev.map((c) => (c.componentId === componentId ? { ...c, quantity: qty } : c)),
    );
  }, []);

  const kitExcludeIds = useMemo(
    () => [item?.id, ...kitComponents.map((c) => c.componentId)].filter(Boolean) as string[],
    [item?.id, kitComponents],
  );

  const { icon: TypeIcon, label: typeLabel } = TYPE_CONFIG[watchedType];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        {/* Colored dynamic header */}
        <div className={`px-6 pt-6 pb-5 border-b ${colors.bg} ${colors.border}`}>
          <SheetHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={`gap-1.5 text-sm px-3 py-1 font-medium ${colors.badge}`}>
                <TypeIcon className="h-4 w-4" />
                {typeLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {isEdit ? item?.code : 'Nuevo ítem'}
              </span>
            </div>
            <div>
              <SheetTitle className="text-base flex items-center gap-2">
                {isEdit ? <Pencil className="h-4 w-4" /> : <PackagePlus className="h-4 w-4" />}
                {isEdit ? (item?.name ?? 'Editar ítem') : 'Agregar ítem'}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{colors.description}</p>
            </div>
          </SheetHeader>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 min-h-0">
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-5 px-6 py-5">
              {/* Type card picker */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Tipo de ítem</p>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_CARDS.map((card) => {
                    const Icon = card.icon;
                    const selected = watchedType === card.value;
                    return (
                      <button
                        key={card.value}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleTypeSelect(card.value)}
                        className={cn(
                          'flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected
                            ? `${TYPE_COLORS[card.value].bg} ${TYPE_COLORS[card.value].border}`
                            : 'border-border hover:border-muted-foreground/40',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4',
                            selected
                              ? (TYPE_COLORS[card.value].badge
                                  .split(' ')
                                  .find((c) => c.startsWith('text-') && !c.includes('dark:')) ??
                                  'text-foreground')
                              : 'text-muted-foreground',
                          )}
                        />
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            selected
                              ? (TYPE_COLORS[card.value].badge
                                  .split(' ')
                                  .find((c) => c.startsWith('text-') && !c.includes('dark:')) ?? '')
                              : '',
                          )}
                        >
                          {card.label}
                        </span>
                        <span className="text-xs text-muted-foreground leading-tight">
                          {card.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Image upload — hidden for KIT */}
              {!isKit && (
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Imagen <span className="text-muted-foreground text-xs">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <ImageUploadField
                          ref={imageFieldRef}
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isPending}
                          isUploading={isUploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Taladradora Industrial"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: TOOL-001" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location — hidden for KIT */}
              {!isKit && (
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Taller A" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Stock + Unit — hidden for KIT */}
              {!isKit && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isEdit ? 'Stock de almacén deseado' : 'Stock inicial'}
                        </FormLabel>
                        <FormControl>
                          <StockInput
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: unidades" disabled={isPending} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Kit components — KIT only */}
              {isKit && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Boxes className="h-4 w-4 text-muted-foreground" />
                    Componentes del kit{' '}
                    <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                  </p>
                  <KitComponentsBuilder
                    components={kitComponents}
                    excludeIds={kitExcludeIds}
                    onAdd={handleKitAdd}
                    onRemove={handleKitRemove}
                    onQtyChange={handleKitQtyChange}
                    disabled={isPending}
                    allowedTypes={['PRODUCT', 'TOOL']}
                    inventoryDisplayMode="warehouse"
                  />
                </div>
              )}

              <Separator />

              <div className="flex gap-2 justify-end pb-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? isEdit
                      ? 'Guardando...'
                      : 'Agregando...'
                    : isEdit
                      ? 'Guardar cambios'
                      : 'Agregar ítem'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
