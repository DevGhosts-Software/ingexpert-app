'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Boxes, PackagePlus, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { CreateItemSchema, type CreateItemDto } from '@ingexpert/schema';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useStorageUpload } from '@/hooks/use-storage-upload';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { ImageUploadField, type ImageUploadFieldHandle } from './image-upload-field';
import { type InventoryItem, type ItemType, TYPE_CONFIG, TYPE_COLORS } from './inventory-table.types';
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
  const utils = trpc.useUtils();
  const isEdit = mode === 'edit';
  const imageFieldRef = useRef<ImageUploadFieldHandle>(null);
  const originalImageUrl = useRef<string | undefined>(undefined);
  const { uploadFile, deleteFile, isUploading } = useStorageUpload();

  const [kitComponents, setKitComponents] = useState<LocalComponent[]>([]);

  const { data: existingComponents } = trpc.kits.getComponents.useQuery(item?.id ?? '', {
    enabled: isEdit && item?.type === 'KIT' && open,
  });

  useEffect(() => {
    if (open && isEdit && existingComponents) {
      setKitComponents(
        existingComponents.map((c) => ({
          componentId: c.componentId,
          name: c.component.name,
          code: c.component.code,
          unit: c.component.unit,
          stock: Number(c.component.stock),
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
        stock: item.stock,
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

  const createMutation = trpc.items.create.useMutation({
    onError: (error) => toast.error(error.message ?? 'Error al agregar el ítem'),
  });

  const updateMutation = trpc.items.update.useMutation({
    onError: (error) => toast.error(error.message ?? 'Error al actualizar el ítem'),
  });

  const setComponentsMutation = trpc.kits.setComponents.useMutation({
    onError: (error) => toast.error(error.message ?? 'Error al guardar los componentes'),
  });

  const clearKitMutation = trpc.kits.clearKit.useMutation({
    onError: (error) => toast.error(error.message ?? 'Error al limpiar los componentes'),
  });

  function invalidateAll() {
    return Promise.all([
      utils.items.list.invalidate(),
      utils.items.getStats.invalidate(),
      utils.items.getCounts.invalidate(),
      utils.items.getLocations.invalidate(),
    ]);
  }

  const onSubmit = useCallback(
    async (values: FormValues) => {
      const pendingFile = imageFieldRef.current?.getPendingFile() ?? null;

      let finalImageUrl = values.imageUrl;
      if (pendingFile) {
        try {
          finalImageUrl = await uploadFile(pendingFile);
        } catch {
          return;
        }
      }

      if (originalImageUrl.current && originalImageUrl.current !== finalImageUrl) {
        void deleteFile(originalImageUrl.current);
      }

      const submitValues = { ...values, imageUrl: finalImageUrl ?? '' };

      try {
        if (isEdit && item) {
          await updateMutation.mutateAsync({ id: item.id, ...submitValues });
          if (values.type === 'KIT') {
            if (kitComponents.length > 0) {
              const updated = await setComponentsMutation.mutateAsync({
                kit_id: item.id,
                components: kitComponents.map((c) => ({
                  item_id: c.componentId,
                  quantity: c.quantity,
                })),
              });
              utils.kits.getComponents.setData(item.id, updated);
            } else {
              await clearKitMutation.mutateAsync(item.id);
              utils.kits.getComponents.setData(item.id, []);
            }
          }
          toast.success('Ítem actualizado correctamente');
        } else {
          const created = await createMutation.mutateAsync(submitValues);
          if (values.type === 'KIT' && kitComponents.length > 0) {
            const created2 = await setComponentsMutation.mutateAsync({
              kit_id: created.id,
              components: kitComponents.map((c) => ({
                item_id: c.componentId,
                quantity: c.quantity,
              })),
            });
            utils.kits.getComponents.setData(created.id, created2);
          }
          toast.success('Ítem agregado correctamente');
        }
        void invalidateAll();
        onClose();
      } catch {
        // errors handled by each mutation's onError
      }
    },
    [
      uploadFile,
      deleteFile,
      isEdit,
      item,
      utils,
      updateMutation,
      createMutation,
      setComponentsMutation,
      clearKitMutation,
      kitComponents,
      onClose,
    ],
  );

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    setComponentsMutation.isPending ||
    clearKitMutation.isPending ||
    isUploading;

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
                              ? TYPE_COLORS[card.value].badge.split(' ').find((c) => c.startsWith('text-') && !c.includes('dark:')) ?? 'text-foreground'
                              : 'text-muted-foreground',
                          )}
                        />
                        <span className={cn(
                          'text-sm font-semibold',
                          selected
                            ? TYPE_COLORS[card.value].badge.split(' ').find((c) => c.startsWith('text-') && !c.includes('dark:')) ?? ''
                            : '',
                        )}>
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
                        <FormLabel>{isEdit ? 'Stock' : 'Stock inicial'}</FormLabel>
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

