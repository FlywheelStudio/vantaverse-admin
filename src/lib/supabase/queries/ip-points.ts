import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineQuery } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';

const empowermentThresholdSchema = z.object({
  title: z.string(),
  base_power: z.number(),
  top_power: z.number(),
  effects: z.string().nullable(),
});

export type EmpowermentThreshold = z.infer<typeof empowermentThresholdSchema>;

const gateInfoSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
});

export type GateInfo = z.infer<typeof gateInfoSchema>;

const ipTransactionSchema = z.object({
  created_at: z.string().nullable(),
  amount: z.number(),
  transaction_type: z.string(),
  description: z.string().nullable(),
});

export type IpTransaction = z.infer<typeof ipTransactionSchema>;

const ipTransactionListSchema = z.array(ipTransactionSchema);

const nextEmpowermentThresholdSchema = z
  .object({
    base_power: z.number(),
    top_power: z.number(),
  })
  .nullable();

export type NextEmpowermentThreshold = z.infer<
  typeof nextEmpowermentThresholdSchema
>;

export const ipPointsKeys = {
  all: ['ip-points'] as const,
  empowermentThreshold: (id: number) =>
    [...ipPointsKeys.all, 'empowerment-threshold', id] as const,
  gateInfo: (gateType: string, gateNumber: number) =>
    [...ipPointsKeys.all, 'gate', gateType, gateNumber] as const,
  transactionsByUser: (userId: string) =>
    [...ipPointsKeys.all, 'transactions', userId] as const,
  nextEmpowermentThreshold: (currentThresholdId: number) =>
    [...ipPointsKeys.all, 'next-threshold', currentThresholdId] as const,
};

async function fetchEmpowermentThresholdById(
  client: SupabaseClient<Database>,
  id: number,
): Promise<{
  data: EmpowermentThreshold | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('empowerment_threshold')
    .select('title, base_power, top_power, effects')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return {
      data: null,
      error: { message: 'Empowerment threshold not found', code: 'P0404' },
    };
  }

  const parsed = empowermentThresholdSchema.safeParse({
    title: data.title,
    base_power: Number(data.base_power),
    top_power: Number(data.top_power),
    effects: data.effects,
  });

  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

async function fetchIpTransactionsByUserId(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{
  data: IpTransaction[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await (client as SupabaseClient)
    .from('ip_transactions')
    .select('created_at, amount, transaction_type, metadata')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  const transactions = (data ?? []).map((tx) => ({
    created_at: tx.created_at,
    amount: tx.amount,
    transaction_type: tx.transaction_type,
    description:
      tx.metadata &&
      typeof tx.metadata === 'object' &&
      'description' in tx.metadata
        ? String(tx.metadata.description)
        : null,
  }));

  const parsed = ipTransactionListSchema.safeParse(transactions);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

/** Empowerment threshold by id (service role). */
export const getEmpowermentThresholdById = defineQuery({
  key: ipPointsKeys.empowermentThreshold,
  schema: empowermentThresholdSchema,
  client: 'admin',
  execute: (client, id: number) => fetchEmpowermentThresholdById(client, id),
});

/** Gate unlock step title and description (service role). */
export const getCurrentGateInfo = defineQuery({
  key: ipPointsKeys.gateInfo,
  schema: gateInfoSchema,
  client: 'admin',
  execute: async (client, gateType: string, gateNumber: number) => {
    const { data, error } = await (client as SupabaseClient)
      .from('gate_unlock_steps')
      .select('title, description')
      .eq('type', gateType)
      .eq('gate', gateNumber)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: 'Gate information not found', code: 'P0404' },
      };
    }

    const parsed = gateInfoSchema.safeParse(data);
    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return { data: parsed.data, error: null };
  },
});

/** IP transactions for a user (service role). */
export const getIpTransactionsByUserId = defineQuery({
  key: ipPointsKeys.transactionsByUser,
  schema: ipTransactionListSchema,
  client: 'admin',
  execute: (client, userId: string) =>
    fetchIpTransactionsByUserId(client, userId),
});

/** Next empowerment threshold after the current one (service role). */
export const getNextEmpowermentThreshold = defineQuery({
  key: ipPointsKeys.nextEmpowermentThreshold,
  schema: nextEmpowermentThresholdSchema,
  client: 'admin',
  execute: async (client, currentThresholdId: number) => {
    const current = await fetchEmpowermentThresholdById(
      client,
      currentThresholdId,
    );

    if (current.error) {
      return { data: null, error: current.error };
    }

    if (!current.data) {
      return {
        data: null,
        error: {
          message: 'Empowerment threshold not found',
          code: 'P0404',
        },
      };
    }

    const currentTopPower = current.data.top_power;

    if (currentTopPower >= 999) {
      return { data: null, error: null };
    }

    const { data, error } = await client
      .from('empowerment_threshold')
      .select('base_power, top_power')
      .gt('base_power', currentTopPower)
      .order('base_power', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: null };
    }

    const parsed = z
      .object({
        base_power: z.number(),
        top_power: z.number(),
      })
      .safeParse({
        base_power: Number(data.base_power),
        top_power: Number(data.top_power),
      });

    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return { data: parsed.data, error: null };
  },
});
