import type { MovementHeaderEntity } from '@ingexpert/schema';

export type { MovementHeaderEntity as MovementRow } from '@ingexpert/schema';

export type ActiveTab = 'all' | 'purchase' | 'return' | 'exit' | 'writeoff';

export type TypeCounts = {
  all: number;
  purchase: number;
  return: number;
  exit: number;
  writeoff: number;
};

export type { MovementHeaderEntity };
