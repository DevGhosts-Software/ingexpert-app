'use client';

import type { AbstractPowerSyncDatabase } from '@journeyapps/powersync-sdk-web';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
  const powerSyncDatabase = useMemo(() => getPowerSyncDatabase(), []);
  const [initializationError, setInitializationError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      await powerSyncDatabase.init();
      await powerSyncDatabase.connect(new IngexpertPowerSyncBackendConnector());
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
      void powerSyncDatabase.disconnect().catch((error: unknown) => {
        console.error('PowerSync disconnect failed', error);
      });
    };
  }, [powerSyncDatabase]);

  if (initializationError) {
    throw initializationError;
  }

  return (
    <PowerSyncDatabaseContext.Provider value={powerSyncDatabase}>
      {children}
    </PowerSyncDatabaseContext.Provider>
  );
}
