import type { AbstractPowerSyncDatabase } from '@journeyapps/powersync-sdk-web';
import { WASQLitePowerSyncDatabaseOpenFactory } from '@journeyapps/powersync-sdk-web';
import { AppSchema } from './schema';

const POWERSYNC_DB_FILENAME = 'ingexpert-powersync.sqlite';

let databaseInstance: AbstractPowerSyncDatabase | null = null;

export function getPowerSyncDatabase(): AbstractPowerSyncDatabase {
  if (databaseInstance) {
    return databaseInstance;
  }

  const openFactory = new WASQLitePowerSyncDatabaseOpenFactory({
    schema: AppSchema,
    dbFilename: POWERSYNC_DB_FILENAME,
    flags: {
      disableSSRWarning: true,
      enableMultiTabs: false,
    },
  });

  databaseInstance = openFactory.getInstance();
  return databaseInstance;
}
