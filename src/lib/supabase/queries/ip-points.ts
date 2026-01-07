import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';

export class IpPointsQuery extends SupabaseQuery {
  /**
   * Get empowerment threshold by ID
   * @param id - The threshold ID to fetch
   * @returns Success with threshold data or error
   */
  public async getEmpowermentThresholdById(id: number): Promise<
    | SupabaseSuccess<{
        title: string;
        base_power: number;
        top_power: number;
        effects: string | null;
      }>
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('empowerment_threshold')
      .select('title, base_power, top_power, effects')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get empowerment threshold',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'Empowerment threshold not found',
      };
    }

    return {
      success: true,
      data: {
        title: data.title,
        base_power: Number(data.base_power),
        top_power: Number(data.top_power),
        effects: data.effects,
      },
    };
  }

  /**
   * Get current gate information
   * @param gateType - The gate type enum value
   * @param gateNumber - The gate number
   * @returns Success with gate data or error
   */
  public async getCurrentGateInfo(
    gateType: string,
    gateNumber: number,
  ): Promise<
    | SupabaseSuccess<{
        title: string;
        description: string | null;
      }>
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('gate_unlock_steps')
      .select('title, description')
      .eq('type', gateType)
      .eq('gate', gateNumber)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get current gate information',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'Gate information not found',
      };
    }

    return {
      success: true,
      data: {
        title: data.title,
        description: data.description,
      },
    };
  }

  /**
   * Get IP transactions for a user
   * @param userId - The user ID to fetch transactions for
   * @returns Success with transactions array or error
   */
  public async getIpTransactionsByUserId(userId: string): Promise<
    | SupabaseSuccess<
        Array<{
          created_at: string | null;
          amount: number;
          transaction_type: string;
          description: string | null;
        }>
      >
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('ip_transactions')
      .select('created_at, amount, transaction_type, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get IP transactions',
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
        amount: tx.amount,
        transaction_type: tx.transaction_type,
        description:
          tx.metadata &&
          typeof tx.metadata === 'object' &&
          'description' in tx.metadata
            ? String(tx.metadata.description)
            : null,
      })),
    };
  }

  /**
   * Get next empowerment threshold for calculating missing points
   * @param currentThresholdId - The current threshold ID
   * @returns Success with next threshold data or error
   */
  public async getNextEmpowermentThreshold(currentThresholdId: number): Promise<
    | SupabaseSuccess<{
        base_power: number;
        top_power: number;
      } | null>
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    // First get current threshold to find its top_power
    const currentThresholdResult =
      await this.getEmpowermentThresholdById(currentThresholdId);

    if (!currentThresholdResult.success) {
      return currentThresholdResult;
    }

    const currentTopPower = currentThresholdResult.data.top_power;

    // If current top_power is 999, user is at max level
    if (currentTopPower >= 999) {
      return {
        success: true,
        data: null,
      };
    }

    // Get next threshold where base_power > current top_power
    const { data, error } = await supabase
      .from('empowerment_threshold')
      .select('base_power, top_power')
      .gt('base_power', currentTopPower)
      .order('base_power', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get next empowerment threshold',
      );
    }

    if (!data) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: {
        base_power: Number(data.base_power),
        top_power: Number(data.top_power),
      },
    };
  }
}
