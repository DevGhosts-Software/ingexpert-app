'use client';

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase();
}

export function localizeUserError(
  rawMessage: string | null | undefined,
  fallback = 'Ocurrió un error. Intenta nuevamente.',
): string {
  if (!rawMessage) {
    return fallback;
  }

  const message = normalizeMessage(rawMessage);

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials') ||
    message.includes('invalid_grant')
  ) {
    return 'Credenciales inválidas. Intenta nuevamente.';
  }

  if (message.includes('email not confirmed')) {
    return 'Tu correo aún no ha sido confirmado.';
  }

  if (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('network')
  ) {
    return 'Sin conexión. Revisa tu internet e intenta nuevamente.';
  }

  if (message.includes('jwt') || message.includes('token')) {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }

  if (message.includes('permission denied') || message.includes('not authorized')) {
    return 'No tienes permisos para realizar esta acción.';
  }

  return fallback;
}
