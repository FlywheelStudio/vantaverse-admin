import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';

export type ImageAsset = {
  blur_hash: string;
  image_url: string;
};

export type HabitPledge = {
  pledge: string;
  photo: ImageAsset;
  signature: ImageAsset;
  created_at: string;
};

export class HabitPledgeQuery extends SupabaseQuery {
  /**
   * Get most recent habit pledge by user ID
   * @param userId - The user ID to fetch pledge for
   * @returns Success with pledge data or error
   */
  public async getPledgeByUserId(
    userId: string,
  ): Promise<SupabaseSuccess<HabitPledge | null> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    const { data: pledge, error: pledgeError } = await supabase
      .from('habit_pledges')
      .select('pledge, photo, signature, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pledgeError) {
      return this.parseResponsePostgresError(
        pledgeError,
        'Failed to get habit pledge',
      );
    }

    if (!pledge) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: {
        pledge: pledge.pledge,
        photo: pledge.photo as ImageAsset,
        signature: pledge.signature as ImageAsset,
        created_at: pledge.created_at,
      },
    };
  }
}
