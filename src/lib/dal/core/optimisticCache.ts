import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type { DalEntity } from './defineMutation';

function isEntity(value: unknown): value is DalEntity {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as DalEntity).id === 'string'
  );
}

export function findExistingEntity<TData extends DalEntity>(
  queryClient: QueryClient,
  keys: readonly QueryKey[],
  id: string | undefined,
): TData | Record<string, never> {
  if (!id) {
    return {};
  }

  for (const key of keys) {
    const current = queryClient.getQueryData(key);
    if (Array.isArray(current)) {
      const found = current.find((row) => isEntity(row) && row.id === id);
      if (found && isEntity(found)) {
        return found as TData;
      }
    } else if (isEntity(current) && current.id === id) {
      return current as TData;
    }
  }

  return {};
}

/** Upsert by id into list arrays or replace detail objects. Skip missing keys. */
export function upsertEntity(
  queryClient: QueryClient,
  key: QueryKey,
  row: DalEntity,
): void {
  const current = queryClient.getQueryData(key);
  if (current === undefined) {
    return;
  }

  if (Array.isArray(current)) {
    const index = current.findIndex(
      (item) => isEntity(item) && item.id === row.id,
    );
    if (index >= 0) {
      queryClient.setQueryData(
        key,
        current.map((item, i) => (i === index ? { ...item, ...row } : item)),
      );
    } else {
      queryClient.setQueryData(key, [row, ...current]);
    }
    return;
  }

  if (isEntity(current)) {
    if (current.id === row.id) {
      queryClient.setQueryData(key, { ...current, ...row });
    } else {
      queryClient.setQueryData(key, row);
    }
    return;
  }

  queryClient.setQueryData(key, row);
}

/** Replace temp id with server row in patched keys only. */
export function swapTempEntity(
  queryClient: QueryClient,
  key: QueryKey,
  tempId: string,
  serverRow: DalEntity,
): void {
  const current = queryClient.getQueryData(key);
  if (current === undefined) {
    return;
  }

  if (Array.isArray(current)) {
    queryClient.setQueryData(
      key,
      current.map((item) =>
        isEntity(item) && item.id === tempId ? serverRow : item,
      ),
    );
    return;
  }

  if (isEntity(current) && current.id === tempId) {
    queryClient.setQueryData(key, serverRow);
  }
}

export function removeEntity(
  queryClient: QueryClient,
  key: QueryKey,
  id: string,
): void {
  const current = queryClient.getQueryData(key);
  if (current === undefined) {
    return;
  }

  if (Array.isArray(current)) {
    queryClient.setQueryData(
      key,
      current.filter((item) => !(isEntity(item) && item.id === id)),
    );
    return;
  }

  if (isEntity(current) && current.id === id) {
    queryClient.removeQueries({ queryKey: key, exact: true });
  }
}

export type CacheSnapshot = {
  key: QueryKey;
  data: unknown;
};

export function snapshotKeys(
  queryClient: QueryClient,
  keys: readonly QueryKey[],
): CacheSnapshot[] {
  return keys.map((key) => ({
    key,
    data: queryClient.getQueryData(key),
  }));
}

export function restoreSnapshots(
  queryClient: QueryClient,
  snapshots: readonly CacheSnapshot[],
): void {
  for (const { key, data } of snapshots) {
    queryClient.setQueryData(key, data);
  }
}
