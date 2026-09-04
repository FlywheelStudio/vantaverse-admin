import { formatDalError, type DalResult } from '@/lib/dal';

export type SupabaseError = {
  success: false;
  error: string;
  status?: number;
};

export type SupabaseSuccess<T> = {
  success: true;
  data: T;
};

export type ClientRole = 'authenticated_user' | 'service_role';

/** Map DAL tuple results to legacy SupabaseSuccess/SupabaseError callers. */
export function toLegacyResult<T>(
  result: DalResult<T>,
): SupabaseSuccess<T> | SupabaseError {
  const [err, data] = result;
  if (err) {
    return { success: false, error: formatDalError(err) };
  }
  return { success: true, data };
}

/** Like {@link toLegacyResult} but discards payload for delete-style mutations. */
export function voidFromDeleteResult(
  result: DalResult<{ id: string }>,
): SupabaseSuccess<void> | SupabaseError {
  const mapped = toLegacyResult(result);
  if (!mapped.success) {
    return mapped;
  }
  return { success: true, data: undefined };
}
