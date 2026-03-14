'use client';

import { useMemo } from 'react';
import { useQuery } from '@powersync/react';

type WorkAreaRow = { name: string };
type UserNameRow = { id: string; name: string | null; email: string };
type UserRow = {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  name: string | null;
  avatar: string | null;
  has_auth: number | string | null;
  work_area: string | null;
};

type KitComponentRow = {
  component_id: string;
  quantity: number | string | null;
  name: string;
  code: string;
  unit: string;
  stock: number | string | null;
  type: string;
  location: string;
  image_url: string | null;
};

export function useLocalWorkAreas(): string[] {
  const query = useQuery<WorkAreaRow>('SELECT name FROM work_areas ORDER BY name ASC');
  return useMemo(() => (query.data ?? []).map((row) => row.name), [query.data]);
}

export function useLocalUserNames(): UserNameRow[] {
  const query = useQuery<UserNameRow>(
    'SELECT id, name, email FROM users ORDER BY COALESCE(name, email) ASC',
  );
  return query.data ?? [];
}

export function useLocalUsers() {
  const query = useQuery<UserRow>(
    `
      SELECT
        u.id,
        u.email,
        u.role,
        u.name,
        u.avatar,
        u.has_auth,
        wa.name AS work_area
      FROM users u
      LEFT JOIN staff s ON s.id = u.id
      LEFT JOIN work_areas wa ON wa.id = s.work_area_id
      ORDER BY u.email ASC
    `,
  );

  return useMemo(
    () =>
      (query.data ?? []).map((row) => ({
        id: row.id,
        email: row.email,
        role: row.role,
        name: row.name ?? null,
        avatar: row.avatar ?? null,
        has_auth: Number(row.has_auth ?? 0) === 1,
        workArea: row.work_area ?? null,
      })),
    [query.data],
  );
}

export function useLocalKitComponents(kitId: string, enabled: boolean) {
  const sql = enabled
    ? `
      SELECT
        kd.item_id AS component_id,
        kd.quantity,
        i.name,
        i.code,
        i.unit,
        i.stock,
        i.type,
        i.location,
        i.image_url
      FROM kit_details kd
      INNER JOIN items i ON i.id = kd.item_id
      WHERE kd.kit_id = '${kitId}'
      ORDER BY i.name ASC
    `
    : "SELECT item_id AS component_id, quantity, '' AS name, '' AS code, '' AS unit, 0 AS stock, '' AS type, '' AS location, '' AS image_url FROM kit_details WHERE 1 = 0";

  const query = useQuery<KitComponentRow>(sql);

  const components = useMemo(
    () =>
      (query.data ?? []).map((row) => ({
        componentId: row.component_id,
        quantity: Number(row.quantity ?? 0),
        component: {
          id: row.component_id,
          name: row.name,
          code: row.code,
          location: row.location,
          stock: Number(row.stock ?? 0),
          unit: row.unit,
          type: row.type as 'PRODUCT' | 'EQUIPMENT' | 'TOOL' | 'KIT',
          imageUrl: row.image_url ?? '',
        },
      })),
    [query.data],
  );

  return { components, isFetching: query.isFetching };
}
