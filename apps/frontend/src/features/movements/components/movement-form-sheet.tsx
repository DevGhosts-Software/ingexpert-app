'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownCircle, ArrowUpCircle, ClipboardList, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

import { z } from 'zod';
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

// ─── Form schema ──────────────────────────────────────────────────────────────

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
      responsibleDeliveryId: undefined,
      responsibleReceiptId: undefined,
      projectId: undefined,
    },
  });

  const watchedType = form.watch('type');

  useEffect(() => {
    if (open) {
      form.reset({
        type: 'EXIT',
        destination: '',
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

          <ScrollArea className="flex-1 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onValidSubmit)} className="space-y-5 pr-4">
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
                Este movimiento <strong>no podrá editarse</strong> una vez registrado. Revisa los datos antes de continuar.
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
                      <div key={i} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 items-center">
                        <div className="min-w-0">
                          <p className="font-medium leading-tight truncate">{item?.name ?? d.itemId}</p>
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
