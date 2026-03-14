'use client';

type MigrationSource = 'api' | 'local';

type SourceSelectionEvent = {
  procedure: string;
  mode: 'api' | 'dual-run' | 'local';
  source: MigrationSource;
};

type ParityEvent = {
  procedure: string;
  mode: 'dual-run' | 'local';
  matches: boolean;
  mismatchKeys: string[];
};

function emitWindowEvent<TDetail>(name: string, detail: TDetail): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function emitMigrationSourceSelection(event: SourceSelectionEvent): void {
  console.info('[api-migration] source', event);
  emitWindowEvent('api-migration:source', event);
}

export function emitMigrationParity(event: ParityEvent): void {
  console.info('[api-migration] parity', event);
  emitWindowEvent('api-migration:parity', event);
}
