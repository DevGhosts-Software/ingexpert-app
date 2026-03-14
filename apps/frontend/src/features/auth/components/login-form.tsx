'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginDto, LoginSchema } from '@ingexpert/schema';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Boxes, Eye, EyeOff } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && session) {
        router.replace('/');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const form = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(values: LoginDto) {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message || 'Credenciales incorrectas. Intenta nuevamente.');
      return;
    }

    toast.success('Sesión iniciada correctamente');
    router.push('/');
  }

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg">
      <CardHeader className="items-center text-center pb-4">
        {/* Brand mark */}
        <div className="flex aspect-square size-12 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground mb-3 shadow-sm">
          <Boxes className="size-6" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">IngExpert</CardTitle>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Gestión de Stock
          </p>
        </div>
        <CardDescription className="pt-2 text-sm">
          Ingresa tus credenciales para acceder al sistema.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@empresa.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="pr-10"
                        disabled={isSubmitting}
                        {...field}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
