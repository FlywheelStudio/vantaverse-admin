import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import {
  adminProfileSchema,
  type AdminFilterCounts,
  type AdminProfile,
} from '../schemas/admins';
import { MemberRole } from '../schemas/organization-members';
import type { PaginatedResult } from './exercise-templates';

/**
 * Data access for `profiles_admins` and admin list RPCs.
 * Patient profiles stay on {@link ProfilesQuery}.
 */
export class AdminsQuery extends SupabaseQuery {
  /**
   * Authenticated shell profile from `profiles_admins`.
   * Requires an active org admin membership; attaches `is_super_admin` from org membership.
   */
  public async getAuthProfile(): Promise<
    SupabaseSuccess<AdminProfile> | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');
    const user = await this.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Unauthenticated',
        status: 401,
      };
    }

    const { data, error } = await supabase
      .from('profiles_admins')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get authenticated admin profile',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'Admin profile not found',
        status: 403,
      };
    }

    const membershipOk = await this.hasActiveAdminMembership(user.id);
    if (!membershipOk.success) {
      return membershipOk;
    }
    if (!membershipOk.data) {
      return {
        success: false,
        error: 'Active admin membership required',
        status: 403,
      };
    }

    const enriched = await this.enrichAdminRows([data], [user.id]);
    if (!enriched.success) {
      return enriched;
    }

    const parsed = adminProfileSchema.safeParse(enriched.data[0]);
    if (!parsed.success) {
      return this.parseResponseZodError(parsed.error);
    }

    return { success: true, data: parsed.data };
  }

  /**
   * Load one admin by id under RLS.
   */
  public async getById(
    id: string,
  ): Promise<SupabaseSuccess<AdminProfile> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('profiles_admins')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get admin profile by ID',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'Admin not found',
        status: 404,
      };
    }

    const enriched = await this.enrichAdminRows([data], [id]);
    if (!enriched.success) {
      return enriched;
    }

    const parsed = adminProfileSchema.safeParse(enriched.data[0]);
    if (!parsed.success) {
      return this.parseResponseZodError(parsed.error);
    }

    return { success: true, data: parsed.data };
  }

  /**
   * Whether a `profiles_admins` row exists for the id (RLS-scoped).
   */
  public async exists(id: string): Promise<SupabaseSuccess<boolean> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('profiles_admins')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to check admin profile',
      );
    }

    return { success: true, data: Boolean(data) };
  }

  /**
   * Batch-load slim admin PII by ids (org/team/group name joins).
   */
  public async getByIds(
    ids: string[],
  ): Promise<SupabaseSuccess<AdminProfile[]> | SupabaseError> {
    if (ids.length === 0) {
      return { success: true, data: [] };
    }

    const supabase = await this.getClient('authenticated_user');
    const uniqueIds = [...new Set(ids)];

    const { data, error } = await supabase
      .from('profiles_admins')
      .select('*')
      .in('id', uniqueIds);

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to batch get admin profiles',
      );
    }

    const rows = data ?? [];
    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    const enriched = await this.enrichAdminRows(
      rows,
      rows.map((row) => row.id),
    );
    if (!enriched.success) {
      return enriched;
    }

    const parsed = adminProfileSchema.array().safeParse(enriched.data);
    if (!parsed.success) {
      return this.parseResponseZodError(parsed.error);
    }

    return { success: true, data: parsed.data };
  }

  /**
   * Paginated Manage list via `list_admins_filtered`.
   */
  public async getListFiltered(params: {
    search?: string;
    organizationId?: string;
    teamId?: string;
    status?: string;
    lastActive?: string;
    joined?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<SupabaseSuccess<PaginatedResult<AdminProfile>> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase.rpc('list_admins_filtered', {
      p_search: params.search || undefined,
      p_org_id: params.organizationId || undefined,
      p_team_id: params.teamId || undefined,
      p_status: params.status || 'all',
      p_last_active: params.lastActive || 'all',
      p_joined: params.joined || 'all',
      p_page: params.page ?? 1,
      p_page_size: params.pageSize ?? 500,
      p_sort_by: params.sortBy ?? 'created_at',
      p_sort_order: params.sortOrder ?? 'desc',
    });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get filtered admins',
      );
    }

    const payload = (data as { data: unknown[]; count: number }) || {
      data: [],
      count: 0,
    };
    const rows = payload.data ?? [];
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 500;
    const total = payload.count ?? 0;

    if (rows.length === 0) {
      return {
        success: true,
        data: {
          data: [],
          page,
          pageSize,
          total,
          hasMore: false,
        },
      };
    }

    const profileIds = rows.map(
      (row) => (row as Record<string, unknown>).id as string,
    );
    const enriched = await this.enrichAdminRows(rows, profileIds);
    if (!enriched.success) {
      return enriched;
    }

    const parsed = adminProfileSchema.array().safeParse(enriched.data);
    if (!parsed.success) {
      return this.parseResponseZodError(parsed.error);
    }

    return {
      success: true,
      data: {
        data: parsed.data,
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total,
      },
    };
  }

  /** Facet counts via `get_admin_filter_counts`. */
  public async getFilterCounts(): Promise<
    SupabaseSuccess<AdminFilterCounts> | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase.rpc('get_admin_filter_counts');

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get admin filter counts',
      );
    }

    return { success: true, data: data as AdminFilterCounts };
  }

  /**
   * Update an admin row under RLS.
   */
  public async update(
    id: string,
    profileData: Pick<
      Partial<AdminProfile>,
      'first_name' | 'last_name' | 'description' | 'avatar_url'
    >,
  ): Promise<SupabaseSuccess<AdminProfile> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('profiles_admins')
      .update(profileData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to update admin profile',
      );
    }

    const enriched = await this.enrichAdminRows([data], [id]);
    if (!enriched.success) {
      return enriched;
    }

    const parsed = adminProfileSchema.safeParse(enriched.data[0]);
    if (!parsed.success) {
      return this.parseResponseZodError(parsed.error);
    }

    return { success: true, data: parsed.data };
  }

  private async hasActiveAdminMembership(
    userId: string,
  ): Promise<SupabaseSuccess<boolean> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to verify admin membership',
      );
    }

    return { success: true, data: Boolean(data) };
  }

  private async getSuperAdminUserIds(): Promise<
    SupabaseSuccess<Set<string>> | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');

    const { data: superAdminOrg, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('is_super_admin', true)
      .maybeSingle();

    if (orgError) {
      return this.parseResponsePostgresError(
        orgError,
        'Failed to resolve super-admin organization',
      );
    }

    const userIds = new Set<string>();
    if (!superAdminOrg?.id) {
      return { success: true, data: userIds };
    }

    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', superAdminOrg.id)
      .eq('is_active', true);

    if (membersError) {
      return this.parseResponsePostgresError(
        membersError,
        'Failed to resolve super-admin members',
      );
    }

    members?.forEach((member) => userIds.add(member.user_id));
    return { success: true, data: userIds };
  }

  private async getOrganizationMemberships(profileIds: string[]): Promise<
    SupabaseSuccess<{
      orgMembershipsMap: Map<string, Array<{ orgId: string; orgName: string }>>;
      userRoleMap: Map<string, MemberRole>;
    }> | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');

    const { data: orgMembersData, error } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role, organizations!inner(id, name)')
      .in('user_id', profileIds)
      .eq('is_active', true);

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get admin organization memberships',
      );
    }

    const orgMembershipsMap = new Map<
      string,
      Array<{ orgId: string; orgName: string }>
    >();
    const userRoleMap = new Map<string, MemberRole>();

    type OrgMemberWithRole = {
      user_id: string;
      organization_id: string;
      role: MemberRole;
      organizations: {
        id: string;
        name: string;
      } | null;
    };

    (orgMembersData as unknown as OrgMemberWithRole[] | null)?.forEach((om) => {
      if (om.organizations) {
        if (!orgMembershipsMap.has(om.user_id)) {
          orgMembershipsMap.set(om.user_id, []);
        }
        orgMembershipsMap.get(om.user_id)!.push({
          orgId: om.organization_id,
          orgName: om.organizations.name,
        });
      }
      if (om.role && !userRoleMap.has(om.user_id)) {
        userRoleMap.set(om.user_id, om.role);
      }
    });

    return {
      success: true,
      data: { orgMembershipsMap, userRoleMap },
    };
  }

  private async enrichAdminRows(
    rows: unknown[],
    profileIds: string[],
  ): Promise<SupabaseSuccess<unknown[]> | SupabaseError> {
    const [superAdminResult, membershipsResult] = await Promise.all([
      this.getSuperAdminUserIds(),
      this.getOrganizationMemberships(profileIds),
    ]);

    if (!superAdminResult.success) {
      return superAdminResult;
    }
    if (!membershipsResult.success) {
      return membershipsResult;
    }

    const { orgMembershipsMap, userRoleMap } = membershipsResult.data;
    const superAdminUserIds = superAdminResult.data;

    const enriched = rows.map((row) => {
      const record = row as Record<string, unknown>;
      const userId = record.id as string;
      const role = userRoleMap.get(userId) ?? ('admin' as MemberRole);

      return {
        ...record,
        is_super_admin: superAdminUserIds.has(userId),
        orgMemberships: orgMembershipsMap.get(userId) || [],
        role,
      };
    });

    return { success: true, data: enriched };
  }
}
