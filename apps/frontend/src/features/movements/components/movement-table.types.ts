import type { MovementHeaderEntity } from '@ingexpert/schema';

export type { MovementHeaderEntity as MovementRow } from '@ingexpert/schema';

export type ActiveTab = 'all' | 'entry' | 'exit';

export type TypeCounts = {
  all: number;
  entry: number;
  exit: number;
};

export type { MovementHeaderEntity };
