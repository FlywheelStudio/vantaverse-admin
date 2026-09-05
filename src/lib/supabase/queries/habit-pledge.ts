import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineQuery } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';

const imageAssetSchema = z.object({
  blur_hash: z.string(),
  image_url: z.string(),
});

export type ImageAsset = z.infer<typeof imageAssetSchema>;

const habitPledgeSchema = z.object({
  pledge: z.string(),
  photo: imageAssetSchema,
  signature: imageAssetSchema,
  created_at: z.string(),
});

export type HabitPledge = z.infer<typeof habitPledgeSchema>;

const habitPledgeNullableSchema = habitPledgeSchema.nullable();

export const habitPledgeKeys = {
  all: ['habit-pledge'] as const,
  byUser: (userId: string) => [...habitPledgeKeys.all, 'user', userId] as const,
};

async function fetchPledgeByUserId(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{
  data: HabitPledge | null;
  error: { message: string; code?: string } | null;
}> {
  const { data: pledge, error } = await client
    .from('habit_pledges')
    .select('pledge, photo, signature, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!pledge) {
    return { data: null, error: null };
  }

  const parsed = habitPledgeSchema.safeParse({
    pledge: pledge.pledge,
    photo: pledge.photo,
    signature: pledge.signature,
    created_at: pledge.created_at,
  });

  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

/** Most recent habit pledge for a user (service role). */
export const getPledgeByUserId = defineQuery({
  key: habitPledgeKeys.byUser,
  schema: habitPledgeNullableSchema,
  client: 'admin',
  execute: (client, userId: string) => fetchPledgeByUserId(client, userId),
});
