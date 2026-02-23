'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginDto, LoginSchema } from '@ingexpert/schema';
import { trpc } from '@/lib/trpc';
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

  const { data: authenticatedUser } = trpc.users.me.useQuery(undefined, { retry: false });

  useEffect(() => {
    if (authenticatedUser) {
      router.replace('/');
    }
  }, [authenticatedUser, router]);

  const form = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = trpc.auth.login.useMutation();

  function onSubmit(values: LoginDto) {
    loginMutation.mutate(values, {
      onSuccess: async (data) => {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        toast.success('Sesión iniciada correctamente');
        router.push('/');
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || 'Credenciales incorrectas. Intenta nuevamente.');
      },
    });
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
                      disabled={loginMutation.isPending}
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
                        disabled={loginMutation.isPending}
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
            <Button type="submit" className="w-full mt-2" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
