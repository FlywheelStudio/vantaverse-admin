import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineQuery } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';

const hpLevelThresholdSchema = z.object({
  description: z.string(),
  image_url: z.string().nullable(),
});

export type HpLevelThreshold = z.infer<typeof hpLevelThresholdSchema>;

const hpTransactionSchema = z.object({
  created_at: z.string().nullable(),
  points_earned: z.number(),
  transaction_type: z.string(),
  description: z.string().nullable(),
});

export type HpTransaction = z.infer<typeof hpTransactionSchema>;

const hpTransactionListSchema = z.array(hpTransactionSchema);

type HpTransactionsTable = {
  Row: {
    user_id: string;
    created_at: string | null;
    points_earned: number;
    transaction_type: string;
    description: string | null;
  };
  Insert: {
    user_id: string;
    created_at?: string | null;
    points_earned: number;
    transaction_type: string;
    description?: string | null;
  };
  Update: {
    user_id?: string;
    created_at?: string | null;
    points_earned?: number;
    transaction_type?: string;
    description?: string | null;
  };
  Relationships: [];
};

type HpPointsDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      hp_transactions: HpTransactionsTable;
    };
  };
};

function withHpPointsTables(
  client: SupabaseClient<Database>,
): SupabaseClient<HpPointsDatabase> {
  return client as SupabaseClient<HpPointsDatabase>;
}

export const hpPointsKeys = {
  all: ['hp-points'] as const,
  levelThreshold: (level: number) =>
    [...hpPointsKeys.all, 'level-threshold', level] as const,
  transactionsByUser: (userId: string) =>
    [...hpPointsKeys.all, 'transactions', userId] as const,
};

async function fetchHpLevelThresholdByLevel(
  client: SupabaseClient<Database>,
  level: number,
): Promise<{
  data: HpLevelThreshold | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('hp_level_thresholds')
    .select('description, image_url')
    .eq('level', level)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return {
      data: null,
      error: { message: 'Level threshold not found', code: 'P0404' },
    };
  }

  const parsed = hpLevelThresholdSchema.safeParse(data);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

async function fetchHpTransactionsByUserId(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{
  data: HpTransaction[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await withHpPointsTables(client)
    .from('hp_transactions')
    .select('created_at, points_earned, transaction_type, description')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  const parsed = hpTransactionListSchema.safeParse(data ?? []);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

/** HP level threshold metadata by level (service role). */
export const getHpLevelThresholdByLevel = defineQuery({
  key: hpPointsKeys.levelThreshold,
  schema: hpLevelThresholdSchema,
  client: 'admin',
  execute: (client, level: number) =>
    fetchHpLevelThresholdByLevel(client, level),
});

/** HP transactions for a user (service role). */
export const getHpTransactionsByUserId = defineQuery({
  key: hpPointsKeys.transactionsByUser,
  schema: hpTransactionListSchema,
  client: 'admin',
  execute: (client, userId: string) =>
    fetchHpTransactionsByUserId(client, userId),
});
