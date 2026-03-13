import type {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncCredentials,
} from '@journeyapps/powersync-sdk-web';
import { UpdateType, type PowerSyncBackendConnector } from '@journeyapps/powersync-sdk-web';
import { supabase } from '@/lib/supabase';

type HttpMethod = 'POST' | 'PATCH';

type UploadRequest = {
  method: HttpMethod;
  path: string;
  body: Record<string, unknown>;
};

export class IngexpertPowerSyncBackendConnector implements PowerSyncBackendConnector {
  private readonly powerSyncEndpoint = process.env.NEXT_PUBLIC_POWERSYNC_URL;
  private readonly apiBaseUrl = this.resolveApiBaseUrl();

  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    if (!this.powerSyncEndpoint) {
      throw new Error('Missing NEXT_PUBLIC_POWERSYNC_URL for PowerSync credentials');
    }

    return {
      endpoint: this.powerSyncEndpoint,
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Cannot upload PowerSync CRUD without an active Supabase session');
    }

    while (true) {
      const batch = await database.getCrudBatch(100);
      if (!batch) {
        return;
      }

      for (const entry of batch.crud) {
        const request = this.mapCrudEntryToRequest(entry);
        await this.sendToBackend(request, session.access_token);
      }

      await batch.complete();
      if (!batch.haveMore) {
        return;
      }
    }
  }

  private mapCrudEntryToRequest(entry: CrudEntry): UploadRequest {
    if (entry.table === 'MovementDetail') {
      throw new Error(
        'MovementDetail CRUD upload must be replayed through movement-level endpoints, not direct table writes',
      );
    }

    if (entry.op === UpdateType.DELETE) {
      throw new Error(`DELETE replay is not mapped for table ${entry.table}`);
    }

    const payload = entry.opData ?? {};

    if (entry.table === 'Item') {
      if (entry.op === UpdateType.PUT) {
        return { method: 'POST', path: '/items', body: payload };
      }
      return { method: 'PATCH', path: `/items/${entry.id}`, body: { id: entry.id, ...payload } };
    }

    if (entry.table === 'Project') {
      if (entry.op === UpdateType.PUT) {
        return { method: 'POST', path: '/projects', body: payload };
      }
      return { method: 'PATCH', path: `/projects/${entry.id}`, body: { id: entry.id, ...payload } };
    }

    if (entry.table === 'Movement') {
      if (entry.op === UpdateType.PUT) {
        return { method: 'POST', path: '/movements', body: payload };
      }
      return { method: 'PATCH', path: '/movements', body: { id: entry.id, data: payload } };
    }

    throw new Error(`Unsupported CRUD table "${entry.table}" in PowerSync uploadData`);
  }

  private async sendToBackend(request: UploadRequest, accessToken: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}${request.path}`, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.body),
      credentials: 'include',
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `PowerSync upload failed (${request.method} ${request.path}): ${response.status} ${details}`,
      );
    }
  }

  private resolveApiBaseUrl(): string {
    const explicit = process.env.NEXT_PUBLIC_API_REST_URL;
    if (explicit) {
      return explicit.replace(/\/+$/, '');
    }

    const trpcUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/trpc';
    return trpcUrl.replace(/\/trpc\/?$/, '');
  }
}
