import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import type { MessageAttachment } from '../schemas/messages';
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
  program_assignment_id: string | null;
  program_name: string | null;
  unread_count: number;
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

    // 5. Unread count = user messages with created_at after the latest user message that has last_seen_at
    const unreadCountByChatId = new Map<string, number>();
    if (chatIds.length > 0) {
      const { data: userMsgRows, error: unreadError } = await supabase
        .from('messages')
        .select('chat_id, created_at, last_seen_at')
        .in('chat_id', chatIds)
        .eq('message_type', 'user');

      if (unreadError) {
        return this.parseResponsePostgresError(
          unreadError,
          'Failed to get unread message counts',
        );
      }

      const rows = (userMsgRows ?? []) as {
        chat_id: string;
        created_at: string | null;
        last_seen_at: string | null;
      }[];

      // Calculate unread count per chat, we only count messages that are after the last seen at
      const chatToCutoff = new Map<string, string>();
      for (const row of rows) {
        if (row.last_seen_at != null && row.created_at != null) {
          const cur = chatToCutoff.get(row.chat_id);
          if (!cur || row.created_at > cur) {
            chatToCutoff.set(row.chat_id, row.created_at);
          }
        }
      }
      for (const row of rows) {
        const cutoff = chatToCutoff.get(row.chat_id);
        const created = row.created_at ?? '';
        if (cutoff == null || created > cutoff) {
          unreadCountByChatId.set(
            row.chat_id,
            (unreadCountByChatId.get(row.chat_id) ?? 0) + 1,
          );
        }
      }
    }

    // 6. Get last message per chat (one query per chat so every chat gets its latest)
    const lastMessageByChatId = new Map<
      string,
      { content: string; created_at: string | null }
    >();
    if (chatIds.length > 0) {
      const results = await Promise.all(
        chatIds.map(async (chatId) => {
          const { data: rows, error } = await supabase
            .from('messages')
            .select('chat_id, content, attachments, created_at')
            .eq('chat_id', chatId)
            .neq('message_type', 'system')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (error || !rows) return null;
          return rows as {
            chat_id: string;
            content: string | null;
            attachments: unknown;
            created_at: string | null;
          };
        }),
      );
      for (const m of results) {
        if (!m) continue;
        const raw = m.attachments as
          | MessageAttachment
          | MessageAttachment[]
          | null;
        const first = Array.isArray(raw) ? raw[0] : raw;
        const fallback = first?.type;
        lastMessageByChatId.set(m.chat_id, {
          content:
            (m.content?.trim().length ?? 0) > 0
              ? m.content!
              : fallback
                ? `New ${fallback} attachment`
                : '',
          created_at: m.created_at,
        });
      }
    }

    // 7. Get program assignment id + name (active assignments)
    const { data: assignments, error: assignError } = await supabase
      .from('program_assignment')
      .select('id, user_id, program_template(name)')
      .in('user_id', patientUserIds)
      .eq('status', 'active');

    if (assignError) {
      return this.parseResponsePostgresError(
        assignError,
        'Failed to get program assignments',
      );
    }
    type RawAssignment = {
      id: string;
      user_id: string;
      program_template:
        | { name: string }
        | { name: string }[]
        | null
        | undefined;
    };
    const programAssignmentIdByUserId = new Map<string, string>();
    const programNameByUserId = new Map<string, string>();
    for (const a of (assignments ?? []) as RawAssignment[]) {
      const raw = a.program_template;
      const template = Array.isArray(raw) ? raw[0] : raw;
      const uid = a.user_id ?? '';
      if (!programAssignmentIdByUserId.has(uid)) {
        programAssignmentIdByUserId.set(uid, a.id);
        if (template?.name) programNameByUserId.set(uid, template.name);
      }
    }

    // 8. Build conversation list, sorted by last_message_at desc
    const items: ConversationItem[] = patientUserIds.map((userId) => {
      const orgInfo = patientByUser.get(userId)!;
      const profile = profileMap.get(userId);
      const chatId = chatByUserId.get(userId) ?? null;
      const lastMsg = chatId ? lastMessageByChatId.get(chatId) : null;
      const programAssignmentId =
        programAssignmentIdByUserId.get(userId) ?? null;
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
        program_assignment_id: programAssignmentId,
        program_name: programName,
        unread_count: chatId ? (unreadCountByChatId.get(chatId) ?? 0) : 0,
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
