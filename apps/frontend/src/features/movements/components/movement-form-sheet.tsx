'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownCircle, ArrowUpCircle, ClipboardList, PackagePlus, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { type CreateMovementDto, CreateMovementSchema } from '@ingexpert/schema';
import { trpc } from '@/lib/trpc';
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
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  KitComponentsBuilder,
  type LocalComponent,
} from '@/features/inventory/components/kit-components-builder';
import type { MovementRow } from './movement-table.types';

// ─── Form schema ──────────────────────────────────────────────────────────────

const MovementFormSchema = CreateMovementSchema;
type FormValues = CreateMovementDto;

// ─── Types ────────────────────────────────────────────────────────────────────

type MovementItem = LocalComponent; // reuse shape: componentId = itemId

interface MovementFormSheetProps {
  mode: 'create' | 'edit';
  movement?: MovementRow | null;
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MovementFormSheet({ mode, movement, open, onClose }: MovementFormSheetProps) {
  const utils = trpc.useUtils();
  const isEdit = mode === 'edit';

  // ── Items list state ────────────────────────────────────────────────────────
  const [movementItems, setMovementItems] = useState<MovementItem[]>([]);

  // Load full movement details for edit
  const { data: existingMovement } = trpc.movements.getById.useQuery(movement?.id ?? '', {
    enabled: isEdit && !!movement?.id && open,
  });

  // Mirror query data into local state — same pattern as kit components
  useEffect(() => {
    if (open && isEdit && existingMovement) {
      setMovementItems(
        existingMovement.details.map((d) => ({
          componentId: d.itemId,
          name: d.item.name,
          code: d.item.code,
          unit: d.item.unit,
          stock: Number(d.item.stock),
          quantity: Number(d.quantity),
        })),
      );
    } else if (!open) {
      setMovementItems([]);
    }
  }, [open, isEdit, existingMovement]);

  // ── Support data ────────────────────────────────────────────────────────────
  const { data: projects = [] } = trpc.movements.getProjects.useQuery();
  const { data: users = [] } = trpc.users.listNames.useQuery();

  // ── Form ────────────────────────────────────────────────────────────────────
  const form = useForm<FormValues>({
    resolver: zodResolver(MovementFormSchema),
    defaultValues: {
      type: 'EXIT',
      destination: '',
      responsibleDeliveryId: undefined,
      responsibleReceiptId: undefined,
      projectId: undefined,
      details: [],
    },
  });

  const watchedType = form.watch('type');

  useEffect(() => {
    if (isEdit && existingMovement && open) {
      form.reset({
        type: existingMovement.type,
        destination: existingMovement.destination ?? '',
        responsibleDeliveryId: existingMovement.responsibleDeliveryId ?? undefined,
        responsibleReceiptId: existingMovement.responsibleReceiptId ?? undefined,
        projectId: existingMovement.projectId ?? undefined,
        details: [],
      });
    } else if (!isEdit && open) {
      form.reset({
        type: 'EXIT',
        destination: '',
        responsibleDeliveryId: undefined,
        responsibleReceiptId: undefined,
        projectId: undefined,
        details: [],
      });
    }
  }, [open, isEdit, existingMovement, form]);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = trpc.movements.create.useMutation({
    onError: (e) => toast.error(e.message ?? 'Error al registrar movimiento'),
  });

  const updateMutation = trpc.movements.update.useMutation({
    onError: (e) => toast.error(e.message ?? 'Error al actualizar movimiento'),
  });

  function invalidateAll() {
    return Promise.all([
      utils.movements.getAll.invalidate(),
      utils.movements.getStats.invalidate(),
      utils.items.list.invalidate(),
      utils.items.getStats.invalidate(),
    ]);
  }

  // ── Item list helpers ───────────────────────────────────────────────────────
  const handleAddItem = useCallback((item: MovementItem) => {
    setMovementItems((prev) => {
      const exists = prev.find((i) => i.componentId === item.componentId);
      if (exists) return prev; // already added
      return [...prev, item];
    });
  }, []);

  const handleRemoveItem = useCallback((componentId: string) => {
    setMovementItems((prev) => prev.filter((i) => i.componentId !== componentId));
  }, []);

  const handleQtyChange = useCallback((componentId: string, qty: number) => {
    if (!qty || qty < 1) return;
    setMovementItems((prev) =>
      prev.map((i) => (i.componentId === componentId ? { ...i, quantity: qty } : i)),
    );
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (movementItems.length === 0) {
        toast.error('Agrega al menos un ítem al movimiento');
        return;
      }

      const payload = {
        ...values,
        destination: values.destination || undefined,
        details: movementItems.map((i) => ({ itemId: i.componentId, quantity: i.quantity })),
      };

      try {
        if (isEdit && movement) {
          await updateMutation.mutateAsync({ id: movement.id, data: payload });
          toast.success('Movimiento actualizado correctamente');
        } else {
          await createMutation.mutateAsync(payload);
          toast.success('Movimiento registrado correctamente');
        }
        void invalidateAll();
        onClose();
      } catch {
        // errors handled by mutation onError
      }
    },
    [movementItems, isEdit, movement, createMutation, updateMutation, onClose],
  );

  const isPending = createMutation.isPending || updateMutation.isPending;
  const excludeIds: string[] = [];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isEdit ? (
              <>
                <Pencil className="h-5 w-5" /> Editar Movimiento
              </>
            ) : (
              <>
                <PackagePlus className="h-5 w-5" /> Registrar Movimiento
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? `Editando movimiento #${movement?.id.slice(0, 8).toUpperCase()}`
              : 'Registra una entrada o salida de material'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pr-4">
              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de movimiento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EXIT">
                          <span className="flex items-center gap-2">
                            <ArrowUpCircle className="h-4 w-4 text-orange-500" /> Salida
                          </span>
                        </SelectItem>
                        <SelectItem value="ENTRY">
                          <span className="flex items-center gap-2">
                            <ArrowDownCircle className="h-4 w-4 text-green-500" /> Entrada
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Destination (EXIT only) */}
              {watchedType === 'EXIT' && (
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Destino{' '}
                        <span className="text-muted-foreground font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Sitio de Obra Norte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Project */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClipboardList className="inline h-3.5 w-3.5 mr-1" />
                      Proyecto <span className="text-muted-foreground font-normal">(opcional)</span>
                    </FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === 'none' ? undefined : v)}
                      value={field.value ?? 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin proyecto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin proyecto</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Responsible delivery */}
              <FormField
                control={form.control}
                name="responsibleDeliveryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Responsable de entrega{' '}
                      <span className="text-muted-foreground font-normal">(opcional)</span>
                    </FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === 'none' ? undefined : v)}
                      value={field.value ?? 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name ?? u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Responsible receipt */}
              <FormField
                control={form.control}
                name="responsibleReceiptId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Responsable de recepción{' '}
                      <span className="text-muted-foreground font-normal">(opcional)</span>
                    </FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === 'none' ? undefined : v)}
                      value={field.value ?? 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name ?? u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Items */}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Ítems del movimiento
                  {movementItems.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({movementItems.length})
                    </span>
                  )}
                </p>
                <KitComponentsBuilder
                  components={movementItems}
                  excludeIds={excludeIds}
                  onAdd={handleAddItem}
                  onRemove={handleRemoveItem}
                  onQtyChange={handleQtyChange}
                  disabled={isPending}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 pb-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar movimiento'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
