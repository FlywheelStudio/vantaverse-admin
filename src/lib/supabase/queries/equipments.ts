import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { equipmentSchema, type Equipment } from '../schemas/equipments';

export class EquipmentsQuery extends SupabaseQuery {
  /**
   * Get all equipment options
   * @returns Success with equipment array or error
   */
  public async getList(): Promise<
    SupabaseSuccess<Equipment[]> | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get equipment');
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    const result = equipmentSchema.array().safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }
}
