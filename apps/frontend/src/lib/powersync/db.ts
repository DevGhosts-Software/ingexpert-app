import type { AbstractPowerSyncDatabase } from '@powersync/web';
import { PowerSyncDatabase, WASQLiteOpenFactory } from '@powersync/web';
import { AppSchema } from './schema';

const POWERSYNC_DB_FILENAME = 'ingexpert-powersync.sqlite';

let databaseInstance: AbstractPowerSyncDatabase | null = null;

function resolvePowerSyncWorkerPath(fileName: string): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return `./@powersync/worker/${fileName}`;
  }

  return `/@powersync/worker/${fileName}`;
}

export function getPowerSyncDatabase(): AbstractPowerSyncDatabase {
  if (databaseInstance) {
    return databaseInstance;
  }

  if (typeof window === 'undefined') {
    throw new Error('PowerSync database must only be initialized in a browser context');
  }

  const openFactory = new WASQLiteOpenFactory({
    dbFilename: POWERSYNC_DB_FILENAME,
    worker: resolvePowerSyncWorkerPath('WASQLiteDB.umd.js'),
    flags: {
      disableSSRWarning: true,
      enableMultiTabs: false,
    },
  });

  databaseInstance = new PowerSyncDatabase({
    database: openFactory,
    schema: AppSchema,
    flags: {
      disableSSRWarning: true,
      enableMultiTabs: false,
    },
    sync: {
      worker: resolvePowerSyncWorkerPath('SharedSyncImplementation.umd.js'),
    },
  });

  return databaseInstance;
}
