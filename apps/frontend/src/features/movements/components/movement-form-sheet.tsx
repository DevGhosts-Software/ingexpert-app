'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@powersync/react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  PackagePlus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { z } from 'zod';
import { cn } from '@/lib/utils';
import { type CreateMovementDto, CreateMovementSchema } from '@ingexpert/schema';
import { usePowerSyncDatabase } from '@/components/providers/powersync-provider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

// ─── Type card config ─────────────────────────────────────────────────────────

const TYPE_CARDS = [
  {
    value: 'PURCHASE' as const,
    icon: ArrowDownCircle,
    styles: {
      selected: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
      icon: 'text-blue-600 dark:text-blue-400',
      label: 'text-blue-700 dark:text-blue-300',
    },
    label: 'Compra',
    description: 'Nuevo material ingresando al almacén',
  },
  {
    value: 'RETURN' as const,
    icon: RotateCcw,
    styles: {
      selected: 'border-green-500 bg-green-50 dark:bg-green-950/30',
      icon: 'text-green-600 dark:text-green-400',
      label: 'text-green-700 dark:text-green-300',
    },
    label: 'Devolución',
    description: 'Material que regresa de un proyecto',
  },
  {
    value: 'EXIT' as const,
    icon: ArrowUpCircle,
    styles: {
      selected: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30',
      icon: 'text-orange-600 dark:text-orange-400',
      label: 'text-orange-700 dark:text-orange-300',
    },
    label: 'Salida',
    description: 'Material que sale hacia un proyecto o destino',
  },
  {
    value: 'WRITEOFF' as const,
    icon: Trash2,
    styles: {
      selected: 'border-red-500 bg-red-50 dark:bg-red-950/30',
      icon: 'text-red-600 dark:text-red-400',
      label: 'text-red-700 dark:text-red-300',
    },
    label: 'Baja',
    description: 'Material perdido, dañado o dado de baja',
  },
] as const;

const MovementFormSchema = CreateMovementSchema.omit({ details: true });
type FormValues = z.infer<typeof MovementFormSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

type MovementItem = LocalComponent; // reuse shape: componentId = itemId
type LocalProjectRow = { id: string; name: string };
type LocalUserRow = { id: string; name: string | null; email: string };
type LocalKitDetailRow = {
  kit_id: string;
  item_id: string;
  quantity: number | string | null;
  name: string;
  code: string;
  unit: string;
  stock: number | string | null;
  type: string;
};

interface MovementFormSheetProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MovementFormSheet({ open, onClose }: MovementFormSheetProps) {
  const powerSyncDb = usePowerSyncDatabase();

  // ── Items list state ────────────────────────────────────────────────────────
  const [movementItems, setMovementItems] = useState<MovementItem[]>([]);

  // Reset items when sheet closes
  useEffect(() => {
    if (!open) setMovementItems([]);
  }, [open]);

  // ── Support data ────────────────────────────────────────────────────────────
  const projectsQuery = useQuery<LocalProjectRow>(
    'SELECT id, name FROM projects ORDER BY name ASC',
  );
  const usersQuery = useQuery<LocalUserRow>(
    'SELECT id, name, email FROM users ORDER BY COALESCE(name, email) ASC',
  );
  const kitDetailsQuery = useQuery<LocalKitDetailRow>(`
    SELECT
      kd.kit_id,
      kd.item_id,
      kd.quantity,
      component.name,
      component.code,
      component.unit,
      component.stock,
      component.type
    FROM kit_details kd
    INNER JOIN items component ON component.id = kd.item_id
  `);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const projects = projectsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const kitComponentsByKitId = useMemo(() => {
    const source = new Map<string, MovementItem[]>();
    for (const row of kitDetailsQuery.data ?? []) {
      const current = source.get(row.kit_id) ?? [];
      current.push({
        componentId: row.item_id,
        name: row.name,
        code: row.code,
        unit: row.unit,
        stock: Number(row.stock ?? 0),
        quantity: Number(row.quantity ?? 0),
        type: row.type as MovementItem['type'],
      });
      source.set(row.kit_id, current);
    }
    return source;
  }, [kitDetailsQuery.data]);

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

  // ── Form ────────────────────────────────────────────────────────────────────
  const form = useForm<FormValues>({
    resolver: zodResolver(MovementFormSchema),
    defaultValues: {
      type: 'EXIT',
      destination: '',
      observations: '',
      responsibleDeliveryId: undefined,
      responsibleReceiptId: undefined,
      projectId: undefined,
    },
  });

  const watchedType = form.watch('type');

  const handleTypeSelect = useCallback(
    (type: FormValues['type']) => {
      form.setValue('type', type, { shouldValidate: true });
      // Clear fields irrelevant to the new type
      form.setValue('destination', '');
      form.setValue('responsibleDeliveryId', undefined);
      form.setValue('responsibleReceiptId', undefined);
      form.setValue('projectId', undefined);
    },
    [form],
  );

  useEffect(() => {
    if (open) {
      form.reset({
        type: 'EXIT',
        destination: '',
        observations: '',
        responsibleDeliveryId: undefined,
        responsibleReceiptId: undefined,
        projectId: undefined,
      });
    }
  }, [open, form]);

  // ── Item list helpers ───────────────────────────────────────────────────────
  const handleAddItem = useCallback(
    (item: MovementItem) => {
      if (item.type === 'KIT') {
        const kitComponents = kitComponentsByKitId.get(item.componentId) ?? [];
        if (kitComponents.length === 0) {
          toast.error(`El kit "${item.name}" no tiene componentes configurados`);
          return;
        }
        setMovementItems((prev) => {
          const updated = [...prev];
          for (const component of kitComponents) {
            const idx = updated.findIndex((entry) => entry.componentId === component.componentId);
            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                quantity: updated[idx].quantity + component.quantity,
              };
            } else {
              updated.push(component);
            }
          }
          return updated;
        });
        return;
      }
      setMovementItems((prev) => {
        const exists = prev.find((i) => i.componentId === item.componentId);
        if (exists) return prev;
        return [...prev, item];
      });
    },
    [kitComponentsByKitId],
  );

  const handleRemoveItem = useCallback((componentId: string) => {
    setMovementItems((prev) => prev.filter((i) => i.componentId !== componentId));
  }, []);

  const handleQtyChange = useCallback((componentId: string, qty: number) => {
    setMovementItems((prev) =>
      prev.map((i) => (i.componentId === componentId ? { ...i, quantity: qty } : i)),
    );
  }, []);

  const excludeIds: string[] = [];

  // ── Confirm dialog state ────────────────────────────────────────────────────
  const [pendingPayload, setPendingPayload] = useState<CreateMovementDto | null>(null);

  // Called by react-hook-form on valid submission — shows confirm dialog
  const onValidSubmit = useCallback(
    (values: FormValues) => {
      if (movementItems.length === 0) {
        toast.error('Agrega al menos un ítem al movimiento');
        return;
      }
      setPendingPayload({
        ...values,
        destination: values.destination || undefined,
        details: movementItems.map((i) => ({ itemId: i.componentId, quantity: i.quantity })),
      });
    },
    [movementItems],
  );

  // Called when user confirms in the dialog
  const onConfirm = useCallback(async () => {
    if (!pendingPayload) return;
    if (!currentUserId) {
      toast.error('No se pudo identificar el usuario actual');
      return;
    }

    const movementId = uuidv4();
    const movementDate = new Date().toISOString();
    const stockDeltaSign =
      pendingPayload.type === 'PURCHASE' || pendingPayload.type === 'RETURN' ? 1 : -1;
    const optimisticMetadata = JSON.stringify({ source: 'movement-optimistic-stock' });

    try {
      await powerSyncDb.writeTransaction(async (tx) => {
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
            pendingPayload.type,
            currentUserId,
            pendingPayload.destination ?? null,
            pendingPayload.observations ?? null,
            pendingPayload.responsibleDeliveryId ?? null,
            pendingPayload.responsibleReceiptId ?? null,
            movementDate,
            pendingPayload.projectId ?? null,
          ],
        );

        for (const detail of pendingPayload.details) {
          await tx.execute(
            `INSERT INTO movement_details (id, movement_id, item_id, quantity) VALUES (?, ?, ?, ?)`,
            [uuidv4(), movementId, detail.itemId, detail.quantity],
          );

          await tx.execute(`UPDATE items SET stock = stock + ?, _metadata = ? WHERE id = ?`, [
            stockDeltaSign * detail.quantity,
            optimisticMetadata,
            detail.itemId,
          ]);
        }
      });

      toast.success('Movimiento guardado localmente. Se sincronizará cuando haya conexión.');
      setPendingPayload(null);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al registrar movimiento en almacenamiento local';
      toast.error(message);
    }
  }, [currentUserId, onClose, pendingPayload, powerSyncDb]);

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5" /> Registrar Movimiento
            </SheetTitle>
            <SheetDescription>
              Registra una entrada o salida de material. Una vez confirmado, no podrá editarse.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onValidSubmit)} className="space-y-5 pr-4">
                {/* Type card picker */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tipo de movimiento</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPE_CARDS.map((card) => {
                      const Icon = card.icon;
                      const selected = watchedType === card.value;
                      return (
                        <button
                          key={card.value}
                          type="button"
                          onClick={() => handleTypeSelect(card.value)}
                          className={cn(
                            'flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            selected
                              ? card.styles.selected
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
                            className={cn(
                              'text-sm font-semibold',
                              selected ? card.styles.label : '',
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

                {/* PURCHASE: who receives it */}
                {watchedType === 'PURCHASE' && (
                  <FormField
                    control={form.control}
                    name="responsibleReceiptId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Quien recibe{' '}
                          <span className="text-muted-foreground font-normal">(opcional)</span>
                        </FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === 'none' ? undefined : v)}
                          value={field.value ?? 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sin asignar" />
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
                )}

                {/* RETURN: project of origin + who returned it */}
                {watchedType === 'RETURN' && (
                  <>
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <ClipboardList className="inline h-3.5 w-3.5 mr-1" />
                            Proyecto de origen{' '}
                            <span className="text-muted-foreground font-normal">(opcional)</span>
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
                    <FormField
                      control={form.control}
                      name="responsibleReceiptId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Quien devuelve el material{' '}
                            <span className="text-muted-foreground font-normal">(opcional)</span>
                          </FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(v === 'none' ? undefined : v)}
                            value={field.value ?? 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sin asignar" />
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
                  </>
                )}

                {/* EXIT: destination + project + who delivers */}
                {watchedType === 'EXIT' && (
                  <>
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
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <ClipboardList className="inline h-3.5 w-3.5 mr-1" />
                            Proyecto destino{' '}
                            <span className="text-muted-foreground font-normal">(opcional)</span>
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
                  </>
                )}

                {/* WRITEOFF: observations is the key field */}
                {watchedType === 'WRITEOFF' && (
                  <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-400">
                    Esta baja descontará el stock seleccionado de forma permanente. Usa las
                    observaciones para registrar el motivo.
                  </div>
                )}

                {/* Observations — all types */}
                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Observaciones{' '}
                        <span className="text-muted-foreground font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            watchedType === 'WRITEOFF'
                              ? 'Motivo de la baja (pérdida, daño, venta, etc.)...'
                              : 'Notas adicionales sobre el movimiento...'
                          }
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Items */}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">
                      Ítems del movimiento
                      {movementItems.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ({movementItems.length})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Los kits se expanden en sus componentes — sale todo o nada.
                    </p>
                  </div>
                  <KitComponentsBuilder
                    components={movementItems}
                    excludeIds={excludeIds}
                    onAdd={handleAddItem}
                    onRemove={handleRemoveItem}
                    onQtyChange={handleQtyChange}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 pb-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">Revisar y confirmar</Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Confirmation dialog — shown after form validation passes */}
      <AlertDialog open={!!pendingPayload} onOpenChange={(v) => !v && setPendingPayload(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar registro del movimiento?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Este movimiento <strong>no podrá editarse</strong> una vez registrado. Revisa los
                  datos antes de continuar.
                </p>
                {pendingPayload && (
                  <div className="rounded-md border divide-y text-sm">
                    <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-1.5 bg-muted/40 text-xs font-medium text-muted-foreground">
                      <span>Ítem</span>
                      <span className="text-right">Cantidad</span>
                    </div>
                    {pendingPayload.details.map((d, i) => {
                      const item = movementItems.find((m) => m.componentId === d.itemId);
                      return (
                        <div
                          key={i}
                          className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 items-center"
                        >
                          <div className="min-w-0">
                            <p className="font-medium leading-tight truncate">
                              {item?.name ?? d.itemId}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">{item?.code}</p>
                          </div>
                          <span className="text-right font-mono text-xs whitespace-nowrap">
                            {d.quantity} {item?.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver a editar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>Confirmar registro</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
