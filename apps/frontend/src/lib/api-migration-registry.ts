'use client';

export type ProcedureClassification =
  | 'Identity/Auth'
  | 'Server Authority Write'
  | 'Server Compute Read'
  | 'Local-Computable Read'
  | 'Migration Candidate';

export type ProcedureName =
  | 'users.listNames'
  | 'adminUsers.getWorkAreas'
  | 'kits.getComponents'
  | 'items.getStats'
  | 'movements.getStats'
  | 'projects.getStats'
  | 'adminUsers.getStats';

export type ProcedureMetadata = {
  procedureName: ProcedureName;
  classification: ProcedureClassification;
  owner: 'Projects' | 'Users/Admin' | 'Inventory' | 'Dashboard';
  localFirstCandidate: boolean;
};

export const API_MIGRATION_REGISTRY: Record<ProcedureName, ProcedureMetadata> = {
  'users.listNames': {
    procedureName: 'users.listNames',
    classification: 'Local-Computable Read',
    owner: 'Projects',
    localFirstCandidate: true,
  },
  'adminUsers.getWorkAreas': {
    procedureName: 'adminUsers.getWorkAreas',
    classification: 'Local-Computable Read',
    owner: 'Users/Admin',
    localFirstCandidate: true,
  },
  'kits.getComponents': {
    procedureName: 'kits.getComponents',
    classification: 'Local-Computable Read',
    owner: 'Inventory',
    localFirstCandidate: true,
  },
  'items.getStats': {
    procedureName: 'items.getStats',
    classification: 'Server Compute Read',
    owner: 'Dashboard',
    localFirstCandidate: true,
  },
  'movements.getStats': {
    procedureName: 'movements.getStats',
    classification: 'Server Compute Read',
    owner: 'Dashboard',
    localFirstCandidate: true,
  },
  'projects.getStats': {
    procedureName: 'projects.getStats',
    classification: 'Server Compute Read',
    owner: 'Dashboard',
    localFirstCandidate: true,
  },
  'adminUsers.getStats': {
    procedureName: 'adminUsers.getStats',
    classification: 'Server Compute Read',
    owner: 'Dashboard',
    localFirstCandidate: true,
  },
};

export function getProcedureMetadata(procedureName: ProcedureName): ProcedureMetadata {
  return API_MIGRATION_REGISTRY[procedureName];
}
