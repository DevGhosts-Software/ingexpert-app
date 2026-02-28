'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  PackagePlus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { z } from 'zod';
import { cn } from '@/lib/utils';
import { type CreateMovementDto, CreateMovementSchema } from '@ingexpert/schema';
import { trpc } from '@/lib/trpc';
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

interface MovementFormSheetProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MovementFormSheet({ open, onClose }: MovementFormSheetProps) {
  const utils = trpc.useUtils();

  // ── Items list state ────────────────────────────────────────────────────────
  const [movementItems, setMovementItems] = useState<MovementItem[]>([]);

  // Reset items when sheet closes
  useEffect(() => {
    if (!open) setMovementItems([]);
  }, [open]);

  // ── Support data ────────────────────────────────────────────────────────────
  const { data: projects = [] } = trpc.movements.getProjects.useQuery();
  const { data: users = [] } = trpc.users.listNames.useQuery();

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

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = trpc.movements.create.useMutation({
    onError: (e) => toast.error(e.message ?? 'Error al registrar movimiento'),
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
  const handleAddItem = useCallback(
    (item: MovementItem) => {
      if (item.type === 'KIT') {
        // Expand kit: fetch its components and add/increment each one atomically on server
        void (async () => {
          const comps = await utils.kits.getComponents.fetch(item.componentId);
          if (comps.length === 0) {
            toast.error(`El kit "${item.name}" no tiene componentes configurados`);
            return;
          }
          setMovementItems((prev) => {
            const updated = [...prev];
            for (const c of comps) {
              const qty = Number(c.quantity);
              const idx = updated.findIndex((i) => i.componentId === c.componentId);
              if (idx >= 0) {
                // Component already in list — increment quantity
                updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty };
              } else {
                updated.push({
                  componentId: c.componentId,
                  name: c.component.name,
                  code: c.component.code,
                  unit: c.component.unit,
                  stock: Number(c.component.stock),
                  quantity: qty,
                  type: c.component.type,
                });
              }
            }
            return updated;
          });
        })();
        return;
      }
      setMovementItems((prev) => {
        const exists = prev.find((i) => i.componentId === item.componentId);
        if (exists) return prev;
        return [...prev, item];
      });
    },
    [utils],
  );

  const handleRemoveItem = useCallback((componentId: string) => {
    setMovementItems((prev) => prev.filter((i) => i.componentId !== componentId));
  }, []);

  const handleQtyChange = useCallback((componentId: string, qty: number) => {
    setMovementItems((prev) =>
      prev.map((i) => (i.componentId === componentId ? { ...i, quantity: qty } : i)),
    );
  }, []);

  const isPending = createMutation.isPending;
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
    try {
      await createMutation.mutateAsync(pendingPayload);
      toast.success('Movimiento registrado correctamente');
      void invalidateAll();
      setPendingPayload(null);
      onClose();
    } catch {
      // handled by mutation onError
    }
  }, [pendingPayload, createMutation, onClose]);

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
                    disabled={isPending}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 pb-4">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Registrando...' : 'Revisar y confirmar'}
                  </Button>
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
            <AlertDialogCancel disabled={isPending}>Volver a editar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} disabled={isPending}>
              {isPending ? 'Registrando...' : 'Confirmar registro'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
