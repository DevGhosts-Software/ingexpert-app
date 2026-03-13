'use client';

import type { AbstractPowerSyncDatabase } from '@powersync/web';
import { createContext, useContext, useEffect, useState } from 'react';
import { IngexpertPowerSyncBackendConnector } from '@/lib/powersync/connector';
import { getPowerSyncDatabase } from '@/lib/powersync/db';

const PowerSyncDatabaseContext = createContext<AbstractPowerSyncDatabase | null>(null);

export function usePowerSyncDatabase(): AbstractPowerSyncDatabase {
  const context = useContext(PowerSyncDatabaseContext);
  if (!context) {
    throw new Error('usePowerSyncDatabase must be used inside PowerSyncProvider');
  }
  return context;
}

export function PowerSyncProvider({ children }: { children: React.ReactNode }) {
  const [powerSyncDatabase, setPowerSyncDatabase] = useState<AbstractPowerSyncDatabase | null>(
    null,
  );
  const [initializationError, setInitializationError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let database: AbstractPowerSyncDatabase | null = null;

    void (async () => {
      database = getPowerSyncDatabase();
      await database.init();
      await database.connect(new IngexpertPowerSyncBackendConnector());

      (window as any).db = database;
      console.log('🚀 PowerSync DB is now available on window.db');

      if (!isCancelled) {
        setPowerSyncDatabase(database);
      }
    })().catch((error: unknown) => {
      const normalizedError =
        error instanceof Error ? error : new Error('PowerSync initialization failed');
      if (!isCancelled) {
        setInitializationError(normalizedError);
      }
      console.error('PowerSync initialization failed', normalizedError);
    });

    return () => {
      isCancelled = true;
      if (!database) {
        return;
      }

      void database.disconnect().catch((error: unknown) => {
        console.error('PowerSync disconnect failed', error);
      });
    };
  }, []);

  if (initializationError) {
    throw initializationError;
  }

  if (!powerSyncDatabase) {
    return null;
  }

  return (
    <PowerSyncDatabaseContext.Provider value={powerSyncDatabase}>
      {children}
    </PowerSyncDatabaseContext.Provider>
  );
}
