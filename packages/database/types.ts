export * from '@prisma/client';

export interface Syncable {
  id: string;
  version: number;
  lastSyncedAt: Date;
  syncStatus: string; // 'synced' | 'pending' | 'conflict'
}

export const SyncHelpers = {
  isConflict: (serverEntity: Syncable, clientVersion: number): boolean => {
    return serverEntity.version > clientVersion;
  },

  isStale: (lastSyncedAt: Date, thresholdMs: number): boolean => {
    return Date.now() - lastSyncedAt.getTime() > thresholdMs;
  },
};
