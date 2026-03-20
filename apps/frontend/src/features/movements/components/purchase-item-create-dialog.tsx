'use client';

import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { ItemType } from '@ingexpert/schema';
import { cn } from '@/lib/utils';
import { useStorageUpload } from '@/hooks/use-storage-upload';
import { usePowerSyncDatabase } from '@/components/providers/powersync-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  ImageUploadField,
  type ImageUploadFieldHandle,
} from '@/features/inventory/components/image-upload-field';
import { TYPE_COLORS, TYPE_CONFIG } from '@/features/inventory/components/inventory-table.types';

const PURCHASE_ALLOWED_TYPES: ItemType[] = ['PRODUCT', 'EQUIPMENT', 'TOOL'];

const PURCHASE_ITEM_TYPES = PURCHASE_ALLOWED_TYPES.map((type) => ({
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

const PurchaseItemSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  code: z.string().min(1, 'Código requerido'),
  location: z.string().min(1, 'Ubicación requerida'),
  unit: z.string().min(1, 'Unidad requerida'),
  type: z.enum(PURCHASE_ALLOWED_TYPES),
  imageUrl: z.string().optional(),
});

type FormValues = z.infer<typeof PurchaseItemSchema>;

export interface CreatedItem {
  id: string;
  name: string;
  code: string;
  location: string;
  unit: string;
  type: ItemType;
  imageUrl: string;
}

interface PurchaseItemCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onItemCreated: (item: CreatedItem, quantity: number) => void;
  existingCodes: string[];
}

export function PurchaseItemCreateDialog({
  open,
  onClose,
  onItemCreated,
  existingCodes,
}: PurchaseItemCreateDialogProps) {
  const imageFieldRef = useRef<ImageUploadFieldHandle>(null);
  const originalImageUrl = useRef<string | undefined>(undefined);
  const { uploadFile, deleteFile, isUploading } = useStorageUpload();
  const powerSyncDb = usePowerSyncDatabase();
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(PurchaseItemSchema),
    defaultValues: {
      name: '',
      code: '',
      location: '',
      unit: '',
      type: 'PRODUCT',
      imageUrl: undefined,
    },
  });

  const watchedType = form.watch('type');
  const colors = TYPE_COLORS[watchedType];
  const TypeIcon = TYPE_CONFIG[watchedType].icon;
  const typeLabel = TYPE_CONFIG[watchedType].label;

  const handleTypeSelect = useCallback(
    (type: ItemType) => {
      if (PURCHASE_ALLOWED_TYPES.includes(type as (typeof PURCHASE_ALLOWED_TYPES)[number])) {
        form.setValue('type', type as (typeof PURCHASE_ALLOWED_TYPES)[number], {
          shouldValidate: true,
        });
      }
    },
    [form],
  );

  const handleReset = useCallback(() => {
    form.reset({
      name: '',
      code: '',
      location: '',
      unit: '',
      type: 'PRODUCT',
      imageUrl: undefined,
    });
    setQuantity(1);
    originalImageUrl.current = undefined;
    imageFieldRef.current?.reset();
  }, [form]);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (existingCodes.includes(values.code)) {
        form.setError('code', { message: 'Este código ya existe' });
        return;
      }

      const pendingFile = imageFieldRef.current?.getPendingFile() ?? null;
      const itemId = uuidv4();
      const normalizedQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

      setIsSubmitting(true);

      try {
        const imageUrl = values.imageUrl ?? '';

        await powerSyncDb.writeTransaction(async (tx) => {
          await tx.execute(
            `INSERT INTO items (id, code, name, location, unit, type, image_url)VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [itemId, values.code, values.name, values.location, values.unit, values.type, imageUrl],
          );
        });

        if (pendingFile) {
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
            const message = error instanceof Error ? error.message : 'Error al subir la imagen';
            toast.error(message);
          }
        }

        const createdItem: CreatedItem = {
          id: itemId,
          name: values.name,
          code: values.code,
          location: values.location,
          unit: values.unit,
          type: values.type,
          imageUrl: values.imageUrl ?? '',
        };

        onItemCreated(createdItem, normalizedQuantity);
        handleReset();
        onClose();
        toast.success('Ítem creado exitosamente');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al crear el ítem';
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      existingCodes,
      form,
      quantity,
      powerSyncDb,
      uploadFile,
      deleteFile,
      onItemCreated,
      handleReset,
      onClose,
    ],
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  const isPending = isUploading || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={cn`px-2 -ml-2 -mt-1 pb-1`}>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium',
                colors.badge,
              )}
            >
              <TypeIcon className="h-3.5 w-3.5" />
              {typeLabel}
            </div>
          </div>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Crear Nuevo Ítem
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo ítem para agregarlo a esta compra. El stock se registrará automáticamente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-4 px-1">
              <div className="space-y-2">
                <p className="text-sm font-medium">Tipo de ítem</p>
                <div className="grid grid-cols-3 gap-2">
                  {PURCHASE_ITEM_TYPES.map((card) => {
                    const Icon = card.icon;
                    const selected = watchedType === card.value;
                    return (
                      <button
                        key={card.value}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleTypeSelect(card.value)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected
                            ? `${card.styles.selected} ${card.styles.border}`
                            : 'border-border hover:border-muted-foreground/40',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4',
                            selected ? card.styles.icon : 'text-muted-foreground',
                          )}
                        />
                        <span
                          className={cn('text-xs font-semibold', selected ? card.styles.label : '')}
                        >
                          {card.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Los Kits deben crearse desde la sección de inventario
                </p>
              </div>

              <Separator />

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

              <Separator />

              <div className="space-y-2">
                <FormLabel>Cantidad inicial</FormLabel>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setQuantity(Number.isFinite(v) && v > 0 ? v : 1);
                  }}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Esta cantidad se registrará en el movimiento de compra
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creando...' : 'Crear ítem'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
