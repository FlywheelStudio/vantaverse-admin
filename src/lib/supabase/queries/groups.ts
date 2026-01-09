import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { z } from 'zod';

export const groupSchema = z.object({
  id: z.string(),
  title: z.string(),
  is_superset: z.boolean().nullable(),
  note: z.string().nullable(),
  exercise_template_ids: z.array(z.string()).nullable(),
  group_hash: z.string(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type Group = z.infer<typeof groupSchema>;

export class GroupsQuery extends SupabaseQuery {
  /**
   * Get group by ID
   * @param id - The group ID
   * @returns Success with group or error
   */
  public async getById(
    id: string,
  ): Promise<SupabaseSuccess<Group> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get group');
    }

    if (!data) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    const result = groupSchema.safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Get multiple groups by IDs
   * @param ids - Array of group IDs
   * @returns Success with groups map or error
   */
  public async getByIds(
    ids: string[],
  ): Promise<SupabaseSuccess<Map<string, Group>> | SupabaseError> {
    if (ids.length === 0) {
      return {
        success: true,
        data: new Map(),
      };
    }

    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .in('id', ids);

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get groups');
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: new Map(),
      };
    }

    // Create map
    const groupsMap = new Map<string, Group>();
    for (const item of data) {
      const result = groupSchema.safeParse(item);
      if (result.success) {
        groupsMap.set(item.id, result.data);
      }
    }

    return {
      success: true,
      data: groupsMap,
    };
  }
}
