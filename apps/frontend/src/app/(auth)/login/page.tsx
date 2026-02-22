import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <LoginForm />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Acceso restringido. Solo usuarios autorizados.
        </p>
      </div>
    </div>
  );
}
