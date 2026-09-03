import type { SupabaseClient } from '@supabase/supabase-js';
import type { QueryKey } from '@tanstack/react-query';
import type { ZodError, z } from 'zod';

import type { Database } from '@/lib/supabase/database.types';

import type { ClientStrategy, SupabaseQueryResult } from './defineQuery';
import { fromZodError } from './errors';
import { toFormErrors, type FormSubmitErrors } from './toFormErrors';

/**
 * Structural input validator (Zod schemas satisfy this). Kept structural so
 * optional `inputSchema` does not widen/break MutationDef brand checks.
 */
type DalInputSchema<TInput> = {
  safeParse(
    data: unknown,
  ): { success: true; data: TInput } | { success: false; error: ZodError };
};

/** Entity rows patched via identity upsert/remove must expose a string id. */
export type DalEntity = {
  id: string;
};

type PredictContext<TData extends DalEntity> = {
  /** Adapter-minted id for creates; ignore for updates. */
  tempId: string;
  now: string;
  /** Best-effort row from patched keys (detail or list match). */
  existing: TData | Record<string, never>;
};

type OptimisticUpsert<TInput, TData extends DalEntity> = {
  keys: (input: TInput) => readonly QueryKey[];
  predict: (input: TInput, ctx: PredictContext<TData>) => TData;
  remove?: never;
};

type OptimisticRemove<TInput> = {
  keys: (input: TInput) => readonly QueryKey[];
  remove: (input: TInput) => string;
  predict?: never;
};

type OptimisticIntent<TInput, TData extends DalEntity> =
  | OptimisticUpsert<TInput, TData>
  | OptimisticRemove<TInput>;

const mutationDefBrand = Symbol('dal.MutationDef');

/** Unbranded shape accepted only by `defineMutation`. */
export type MutationDefInput<TInput, TData extends DalEntity> = {
  readonly execute: (
    client: SupabaseClient<Database>,
    input: TInput,
  ) => SupabaseQueryResult | PromiseLike<SupabaseQueryResult>;
  /** Response / row schema — Zod-parsed after execute. */
  readonly schema: z.ZodType<TData>;
  /**
   * Optional input schema — Zod-parsed before execute. Share with Form sync
   * validators; failures become `kind: "validation"` with path issues.
   * When present, {@link defineMutation} attaches `onSubmitFormValidate`.
   */
  readonly inputSchema?: DalInputSchema<TInput>;
  /** Keys to invalidate on settle (hydrate). Always required. */
  readonly targets: (input: TInput) => readonly QueryKey[];
  readonly client?: ClientStrategy;
  /**
   * Intent-gated optimistic patch. When omitted, adapter is invalidate-only.
   * `predict` XOR `remove`; patch only runs on `optimistic.keys`.
   */
  readonly optimistic?: OptimisticIntent<TInput, TData>;
};

type MutationDefBrand = {
  readonly [mutationDefBrand]: true;
};

type MutationDefShared<TInput, TData extends DalEntity> = Omit<
  MutationDefInput<TInput, TData>,
  'inputSchema'
> &
  MutationDefBrand;

/**
 * Branded mutation with `inputSchema` — includes Form sync helper
 * {@link MutationDefWithFormValidate.onSubmitFormValidate}.
 */
type MutationDefWithFormValidate<
  TInput,
  TData extends DalEntity,
> = MutationDefShared<TInput, TData> & {
  readonly inputSchema: DalInputSchema<TInput>;
  /**
   * Sync Form `validators.onSubmit` helper: `inputSchema.safeParse` →
   * {@link toFormErrors}. Returns `undefined` when valid.
   */
  readonly onSubmitFormValidate: (
    input: unknown,
  ) => FormSubmitErrors | undefined;
};

/**
 * Branded mutation without `inputSchema` — no Form sync helper (compile-time).
 */
type MutationDefWithoutFormValidate<
  TInput,
  TData extends DalEntity,
> = MutationDefShared<TInput, TData> & {
  readonly inputSchema?: undefined;
};

/**
 * Opaque mutation definition. Construct only via {@link defineMutation} —
 * hand-rolled objects are not assignable to `mutate` / `toMutationOptions`.
 * `onSubmitFormValidate` exists only when `inputSchema` was declared.
 */
export type MutationDef<TInput, TData extends DalEntity> =
  | MutationDefWithFormValidate<TInput, TData>
  | MutationDefWithoutFormValidate<TInput, TData>;

type MutationDefInputWithSchema<
  TInput,
  TData extends DalEntity,
> = MutationDefInput<TInput, TData> & {
  readonly inputSchema: DalInputSchema<TInput>;
};

type MutationDefInputWithoutSchema<
  TInput,
  TData extends DalEntity,
> = MutationDefInput<TInput, TData> & {
  readonly inputSchema?: undefined;
};

/**
 * Brands a mutation definition so only factory-built defs pass `mutate` /
 * `toMutationOptions`. Requires `targets`; optional `optimistic` is
 * intent-gated (`predict` XOR `remove`). Attaches `onSubmitFormValidate`
 * only when `inputSchema` is provided (overload return type).
 */
export function defineMutation<TInput, TData extends DalEntity>(
  def: MutationDefInputWithSchema<TInput, TData>,
): MutationDefWithFormValidate<TInput, TData>;
export function defineMutation<TInput, TData extends DalEntity>(
  def: MutationDefInputWithoutSchema<TInput, TData>,
): MutationDefWithoutFormValidate<TInput, TData>;
export function defineMutation<TInput, TData extends DalEntity>(
  def: MutationDefInput<TInput, TData>,
): MutationDef<TInput, TData> {
  if (!def.inputSchema) {
    return {
      ...def,
      [mutationDefBrand]: true,
      inputSchema: undefined,
    };
  }

  const inputSchema = def.inputSchema;
  return {
    ...def,
    [mutationDefBrand]: true,
    inputSchema,
    onSubmitFormValidate(input) {
      const parsed = inputSchema.safeParse(input);
      if (parsed.success) return undefined;
      return toFormErrors(fromZodError(parsed.error, 'Invalid input'));
    },
  };
}
