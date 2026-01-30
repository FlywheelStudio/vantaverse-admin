import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { OrganizationMembers } from './organization-members';

export type ConversationItem = {
  user_id: string;
  chat_id: string | null;
  organization_id: string;
  organization_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  program_name: string | null;
};

export class ConversationsQuery extends SupabaseQuery {
  /**
   * Get all conversations for an admin (patients in orgs where admin has role=admin)
   * Includes last message and program name per user
   */
  public async getConversationsForAdmin(
    adminUserId: string,
  ): Promise<SupabaseSuccess<ConversationItem[]> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');
    const orgMembersQuery = new OrganizationMembers();

    // 1. Get admin org IDs
    const adminOrgsResult =
      await orgMembersQuery.getOrganizationsWhereUserIsAdmin(adminUserId);
    if (!adminOrgsResult.success) return adminOrgsResult;
    const adminOrgIds = adminOrgsResult.data.map((o) => o.id);
    if (adminOrgIds.length === 0) {
      return { success: true, data: [] };
    }

    // 2. Get patients in those orgs with org info (user_id, org_id, org_name)
    const { data: patientMembers, error: patientError } = await supabase
      .from('organization_members')
      .select(
        'user_id, organization_id, organizations!inner(id, name), created_at',
      )
      .in('organization_id', adminOrgIds)
      .eq('role', 'patient')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (patientError) {
      return this.parseResponsePostgresError(
        patientError,
        'Failed to get patients',
      );
    }

    if (!patientMembers || patientMembers.length === 0) {
      return { success: true, data: [] };
    }

    // Dedupe by user_id (keep latest org membership)
    type RawMember = {
      user_id: string;
      organization_id: string;
      organizations:
        | { id: string; name: string }
        | { id: string; name: string }[];
      created_at: string | null;
    };
    const patientByUser = new Map<string, { orgId: string; orgName: string }>();
    for (const m of patientMembers as unknown as RawMember[]) {
      const org = Array.isArray(m.organizations)
        ? m.organizations[0]
        : m.organizations;
      if (!patientByUser.has(m.user_id) && org) {
        patientByUser.set(m.user_id, {
          orgId: m.organization_id,
          orgName: org.name,
        });
      }
    }
    const patientUserIds = [...patientByUser.keys()];

    // 3. Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .in('id', patientUserIds);

    if (profilesError) {
      return this.parseResponsePostgresError(
        profilesError,
        'Failed to get profiles',
      );
    }
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    // 4. Get chats for these users
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('id, user_id')
      .in('user_id', patientUserIds)
      .eq('target_type', 'user')
      .is('deleted_at', null);

    if (chatsError) {
      return this.parseResponsePostgresError(chatsError, 'Failed to get chats');
    }
    const chatByUserId = new Map<string, string>();
    for (const c of chats ?? []) {
      if (c.user_id) chatByUserId.set(c.user_id, c.id);
    }
    const chatIds = [...chatByUserId.values()];

    // 5. Get last message per chat
    const lastMessageByChatId = new Map<
      string,
      { content: string; created_at: string | null }
    >();
    if (chatIds.length > 0) {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('chat_id, content, created_at')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false })
        .limit(500);

      if (!msgError && messages) {
        for (const m of messages) {
          if (!lastMessageByChatId.has(m.chat_id)) {
            lastMessageByChatId.set(m.chat_id, {
              content: m.content,
              created_at: m.created_at,
            });
          }
        }
      }
    }

    // 6. Get program names (active assignments)
    const { data: assignments, error: assignError } = await supabase
      .from('program_assignment')
      .select('user_id, program_template(name)')
      .in('user_id', patientUserIds)
      .eq('status', 'active');

    if (assignError) {
      return this.parseResponsePostgresError(
        assignError,
        'Failed to get program assignments',
      );
    }
    type RawAssignment = {
      user_id: string;
      program_template:
        | { name: string }
        | { name: string }[]
        | null
        | undefined;
    };
    const programNameByUserId = new Map<string, string>();
    for (const a of (assignments ?? []) as RawAssignment[]) {
      const raw = a.program_template;
      const template = Array.isArray(raw) ? raw[0] : raw;
      if (template?.name && !programNameByUserId.has(a.user_id ?? '')) {
        programNameByUserId.set(a.user_id, template.name);
      }
    }

    // 7. Build conversation list, sorted by last_message_at desc
    const items: ConversationItem[] = patientUserIds.map((userId) => {
      const orgInfo = patientByUser.get(userId)!;
      const profile = profileMap.get(userId);
      const chatId = chatByUserId.get(userId) ?? null;
      const lastMsg = chatId ? lastMessageByChatId.get(chatId) : null;
      const programName = programNameByUserId.get(userId) ?? null;

      return {
        user_id: userId,
        chat_id: chatId,
        organization_id: orgInfo.orgId,
        organization_name: orgInfo.orgName,
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        email: profile?.email ?? null,
        avatar_url: profile?.avatar_url ?? null,
        last_message_content: lastMsg?.content ?? null,
        last_message_at: lastMsg?.created_at ?? null,
        program_name: programName,
      };
    });

    // Sort by last_message_at desc, nulls last
    items.sort((a, b) => {
      const aAt = a.last_message_at ?? '';
      const bAt = b.last_message_at ?? '';
      if (aAt && bAt) return bAt.localeCompare(aAt);
      if (aAt) return -1;
      if (bAt) return 1;
      return 0;
    });

    return { success: true, data: items };
  }
}
