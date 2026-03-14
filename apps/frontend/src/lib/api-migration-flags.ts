'use client';

import { useMemo } from 'react';
import { getProcedureMetadata, type ProcedureName } from './api-migration-registry';

export type MigrationPhase = 'observe' | 'dual-run' | 'cutover' | 'rollback';
export type ProcedureReadMode = 'api' | 'dual-run' | 'local';

const DEFAULT_PHASE: MigrationPhase = 'observe';

function parsePhase(value: string | undefined): MigrationPhase {
  if (value === 'observe' || value === 'dual-run' || value === 'cutover' || value === 'rollback') {
    return value;
  }
  return DEFAULT_PHASE;
}

function getForceApiSet(): Set<string> {
  const source = process.env.NEXT_PUBLIC_MIGRATION_FORCE_API ?? '';
  return new Set(
    source
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
  );
}

export function getMigrationPhase(): MigrationPhase {
  return parsePhase(process.env.NEXT_PUBLIC_API_MIGRATION_PHASE);
}

export function getProcedureReadMode(procedureName: ProcedureName): ProcedureReadMode {
  const forceApi = getForceApiSet();
  if (forceApi.has('*') || forceApi.has(procedureName)) {
    return 'api';
  }

  const phase = getMigrationPhase();
  const metadata = getProcedureMetadata(procedureName);
  if (!metadata.localFirstCandidate || phase === 'rollback') {
    return 'api';
  }

  if (metadata.classification === 'Local-Computable Read') {
    return 'local';
  }

  if (metadata.classification === 'Server Compute Read') {
    if (phase === 'cutover') {
      return 'local';
    }
    return 'dual-run';
  }

  return 'api';
}

export function useMigrationProcedureMode(procedureName: ProcedureName): ProcedureReadMode {
  return useMemo(() => getProcedureReadMode(procedureName), [procedureName]);
}
