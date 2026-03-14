'use client';

export type CountRow = {
  total: number | string | null;
};

export function parseCount(rows: CountRow[] | undefined): number {
  const rawValue = rows?.[0]?.total ?? 0;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const DEBUG_COUNT_SQL = {
  items: 'SELECT COUNT(*) AS total FROM items',
  projects: 'SELECT COUNT(*) AS total FROM projects',
  movements: 'SELECT COUNT(*) AS total FROM movements',
  movementDetails: 'SELECT COUNT(*) AS total FROM movement_details',
  users: 'SELECT COUNT(*) AS total FROM users',
  buckets: 'SELECT COUNT(*) AS total FROM ps_buckets',
  queue: 'SELECT COUNT(*) AS total FROM ps_crud',
} as const;
