'use client';

import { PowerSyncContext } from '@powersync/react';
import { AbstractPowerSyncDatabase, createBaseLogger, LogLevel } from '@powersync/web';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  IngexpertPowerSyncBackendConnector,
  subscribePermissionError,
  subscribeSessionRevalidation,
} from '@/lib/powersync/connector';
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
    let unsubscribePermission: (() => void) | null = null;
    let unsubscribeSession: (() => void) | null = null;

    void (async () => {
      database = getPowerSyncDatabase();
      const logger = createBaseLogger();
      logger.useDefaults();
      logger.setLevel(LogLevel.DEBUG);
      await database.init();

      // One-time migration: create indexes for stock calculation performance.
      // These match the indexes declared in AppSchema for new databases.
      // CREATE INDEX IF NOT EXISTS is idempotent — safe to rerun.
      await database.execute(
        'CREATE INDEX IF NOT EXISTS idx_kit_details_kit_id ON kit_details(kit_id)',
      );
      await database.execute(
        'CREATE INDEX IF NOT EXISTS idx_kit_details_item_id ON kit_details(item_id)',
      );
      await database.execute(
        'CREATE INDEX IF NOT EXISTS idx_movement_details_movement_id ON movement_details(movement_id)',
      );
      await database.execute(
        'CREATE INDEX IF NOT EXISTS idx_movement_details_item_id ON movement_details(item_id)',
      );
      await database.execute(
        "CREATE INDEX IF NOT EXISTS idx_movements_type ON movements(type)",
      );
      await database.execute(
        "CREATE INDEX IF NOT EXISTS idx_movements_date ON movements(date)",
      );

      await database.connect(new IngexpertPowerSyncBackendConnector());

      (window as any).db = database;
      console.log('🚀 PowerSync DB is now available on window.db');

      if (!isCancelled) {
        setPowerSyncDatabase(database);

        unsubscribePermission = subscribePermissionError(() => {
          toast.error('No tienes permisos para esa operación', {
            description: 'Contacta al administrador si crees que esto es un error.',
          });
        });

        unsubscribeSession = subscribeSessionRevalidation(() => {
          toast.error('Sesión expirada', {
            description: 'Tu sesión ha sido revocada.',
          });
          if (window.location.pathname !== '/login') {
            setTimeout(() => {
              window.location.replace('/login');
            }, 1500);
          }
        });
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
      if (unsubscribePermission) {
        unsubscribePermission();
      }
      if (unsubscribeSession) {
        unsubscribeSession();
      }
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
    <PowerSyncContext.Provider value={powerSyncDatabase}>
      <PowerSyncDatabaseContext.Provider value={powerSyncDatabase}>
        {children}
      </PowerSyncDatabaseContext.Provider>
    </PowerSyncContext.Provider>
  );
}
