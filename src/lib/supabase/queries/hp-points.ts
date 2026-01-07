import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';

export class HpPointsQuery extends SupabaseQuery {
  /**
   * Get HP level threshold by level number
   * @param level - The level number to fetch
   * @returns Success with level threshold data or error
   */
  public async getHpLevelThresholdByLevel(level: number): Promise<
    | SupabaseSuccess<{
        description: string;
        image_url: string | null;
      }>
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('hp_level_thresholds')
      .select('description, image_url')
      .eq('level', level)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get Vanta Points level threshold',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'Level threshold not found',
      };
    }

    return {
      success: true,
      data: {
        description: data.description,
        image_url: data.image_url,
      },
    };
  }

  /**
   * Get HP transactions for a user
   * @param userId - The user ID to fetch transactions for
   * @returns Success with transactions array or error
   */
  public async getHpTransactionsByUserId(userId: string): Promise<
    | SupabaseSuccess<
        Array<{
          created_at: string | null;
          points_earned: number;
          transaction_type: string;
          description: string | null;
        }>
      >
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('hp_transactions')
      .select('created_at, points_earned, transaction_type, description')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get Vanta Points transactions',
      );
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    return {
      success: true,
      data: data.map((tx) => ({
        created_at: tx.created_at,
        points_earned: tx.points_earned,
        transaction_type: tx.transaction_type,
        description: tx.description,
      })),
    };
  }
}
