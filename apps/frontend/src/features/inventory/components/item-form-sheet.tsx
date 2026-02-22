'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Boxes, PackagePlus, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { CreateItemSchema, type CreateItemDto } from '@ingexpert/schema';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { useStorageUpload } from '@/hooks/use-storage-upload';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { ImageUploadField, type ImageUploadFieldHandle } from './image-upload-field';
import { type InventoryItem, type ItemType, TYPE_CONFIG } from './inventory-table.types';
import { KitComponentsBuilder, type LocalComponent } from './kit-components-builder';

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

  // Prefill form when editing
  useEffect(() => {
    imageFieldRef.current?.reset();
    setKitComponents([]);
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
          return; // uploadFile already toasts the error
        }
      }

      // Delete old image if it was replaced or removed
      if (originalImageUrl.current && originalImageUrl.current !== finalImageUrl) {
        void deleteFile(originalImageUrl.current);
      }

      const submitValues = { ...values, imageUrl: finalImageUrl ?? '' };

      try {
        if (isEdit && item) {
          await updateMutation.mutateAsync({ id: item.id, ...submitValues });
          toast.success('Ítem actualizado correctamente');
        } else {
          const created = await createMutation.mutateAsync(submitValues);
          if (values.type === 'KIT' && kitComponents.length > 0) {
            await setComponentsMutation.mutateAsync({
              kit_id: created.id,
              components: kitComponents.map((c) => ({ item_id: c.componentId, quantity: c.quantity })),
            });
          }
          toast.success('Ítem agregado correctamente');
        }
        void invalidateAll();
        onClose();
      } catch {
        // errors handled by each mutation's onError
      }
      // imageFieldRef and originalImageUrl are refs — stable, excluded from deps intentionally
    },
    [uploadFile, deleteFile, isEdit, item, updateMutation, createMutation, setComponentsMutation, kitComponents, onClose],
  );

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    setComponentsMutation.isPending ||
    isUploading;

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  // Stable kit component handlers
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
      prev.map((c) =>
        c.componentId === componentId ? { ...c, quantity: Number.isNaN(qty) ? 1 : Math.max(1, qty) } : c,
      ),
    );
  }, []);

  const kitExcludeIds = useMemo(
    () => kitComponents.map((c) => c.componentId),
    [kitComponents],
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-5 w-5" /> : <PackagePlus className="h-5 w-5" />}
            {isEdit ? 'Editar Ítem' : 'Agregar Ítem'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Modifica los datos del ítem de inventario.'
              : 'Completa los datos del nuevo ítem de inventario.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4 mt-6">
            {/* Image upload */}
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

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(TYPE_CONFIG) as ItemType[]).map((type) => (
                        <SelectItem key={type} value={type}>
                          {TYPE_CONFIG[type].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEdit ? 'Stock' : 'Stock inicial'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0"
                        disabled={isPending}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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

            {/* Kit components — shown only when type is KIT and creating */}
            {!isEdit && watchedType === 'KIT' && (
              <>
                <Separator />
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
                  />
                </div>
              </>
            )}

            <Separator />

            <div className="flex gap-2 justify-end">
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
      </SheetContent>
    </Sheet>
  );
}

