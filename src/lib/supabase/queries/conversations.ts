import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineQuery } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';

import type { MessageAttachment } from '../schemas/messages';

export const conversationItemSchema = z.object({
  user_id: z.string().uuid(),
  chat_id: z.string().uuid().nullable(),
  organization_id: z.string().uuid(),
  organization_name: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  avatar_url: z.string().nullable(),
  last_message_content: z.string().nullable(),
  last_message_at: z.string().nullable(),
  program_assignment_id: z.string().uuid().nullable(),
  program_name: z.string().nullable(),
  unread_count: z.number().int().nonnegative(),
});

export type ConversationItem = z.infer<typeof conversationItemSchema>;

const conversationListSchema = z.array(conversationItemSchema);
const hasUnreadSchema = z.boolean();

export const conversationKeys = {
  all: ['conversations'] as const,
  forAdmin: (adminUserId: string) =>
    [...conversationKeys.all, 'admin', adminUserId] as const,
  unreadForAdmin: (adminUserId: string) =>
    [...conversationKeys.all, 'unread', adminUserId] as const,
};

type RawMember = {
  user_id: string;
  organization_id: string;
  organizations:
    | { id: string; name: string }
    | { id: string; name: string }[];
  created_at: string | null;
};

type RawProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type RawAssignment = {
  id: string;
  user_id: string;
  program_template:
    | { name: string }
    | { name: string }[]
    | null
    | undefined;
};

/**
 * Org IDs in scope for the admin messaging inbox.
 * Super-admins: all non-super-admin orgs. Org admins: orgs where they are admin.
 */
async function fetchAdminOrgIds(
  client: SupabaseClient<Database>,
  adminUserId: string,
): Promise<
  | { data: string[]; error: { message: string; code?: string } | null }
  | { data: null; error: { message: string; code?: string } }
> {
  const { data: isSuperAdmin, error: superAdminError } = await client.rpc(
    'user_in_super_admin_org',
    { p_user_id: adminUserId },
  );

  if (superAdminError) {
    return { data: null, error: superAdminError };
  }

  if (isSuperAdmin) {
    const { data: orgs, error } = await client
      .from('organizations')
      .select('id')
      .or('is_super_admin.is.null,is_super_admin.eq.false');

    if (error) {
      return { data: null, error };
    }

    return {
      data: (orgs ?? []).map((organization) => organization.id),
      error: null,
    };
  }

  const { data, error } = await client
    .from('organization_members')
    .select(
      'organization_id, organizations!inner(id, name, is_super_admin)',
    )
    .eq('user_id', adminUserId)
    .eq('role', 'admin')
    .eq('is_active', true);

  if (error) {
    return { data: null, error };
  }

  const orgIds: string[] = [];
  for (const row of data ?? []) {
    const org = Array.isArray(row.organizations)
      ? row.organizations[0]
      : row.organizations;
    if (!org || org.is_super_admin === true) continue;
    orgIds.push(row.organization_id);
  }

  return { data: orgIds, error: null };
}

/**
 * Organizations (id + name) for the messages filter panel.
 * Super-admins: all non-super-admin orgs. Org admins: orgs where they are admin.
 */
async function fetchMessagingOrganizations(
  client: SupabaseClient<Database>,
  adminUserId: string,
): Promise<{
  data: Array<{ id: string; name: string }> | null;
  error: { message: string; code?: string } | null;
}> {
  const { data: isSuperAdmin, error: superAdminError } = await client.rpc(
    'user_in_super_admin_org',
    { p_user_id: adminUserId },
  );

  if (superAdminError) {
    return { data: null, error: superAdminError };
  }

  if (isSuperAdmin) {
    const { data: orgs, error } = await client
      .from('organizations')
      .select('id, name')
      .or('is_super_admin.is.null,is_super_admin.eq.false')
      .order('name', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return {
      data: (orgs ?? []).map((organization) => ({
        id: organization.id,
        name: organization.name,
      })),
      error: null,
    };
  }

  const { data, error } = await client
    .from('organization_members')
    .select(
      'organization_id, organizations!inner(id, name, is_super_admin)',
    )
    .eq('user_id', adminUserId)
    .eq('role', 'admin')
    .eq('is_active', true);

  if (error) {
    return { data: null, error };
  }

  const organizations: Array<{ id: string; name: string }> = [];
  for (const row of data ?? []) {
    const org = Array.isArray(row.organizations)
      ? row.organizations[0]
      : row.organizations;
    if (!org || org.is_super_admin === true) continue;
    organizations.push({ id: org.id, name: org.name });
  }

  organizations.sort((left, right) => left.name.localeCompare(right.name));
  return { data: organizations, error: null };
}

async function fetchHasUnreadMessagesForAdmin(
  client: SupabaseClient<Database>,
  adminUserId: string,
): Promise<{ data: boolean; error: { message: string; code?: string } | null }> {
  const adminOrgs = await fetchAdminOrgIds(client, adminUserId);
  if (adminOrgs.error) {
    return { data: false, error: adminOrgs.error };
  }

  const adminOrgIds = adminOrgs.data ?? [];
  if (adminOrgIds.length === 0) {
    return { data: false, error: null };
  }

  const { data: patientMembers, error: patientError } = await client
    .from('organization_members')
    .select('user_id, created_at')
    .in('organization_id', adminOrgIds)
    .eq('role', 'patient')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (patientError) {
    return { data: false, error: patientError };
  }

  if (!patientMembers || patientMembers.length === 0) {
    return { data: false, error: null };
  }

  const patientRows = patientMembers as { user_id: string }[];
  const patientUserIds = [...new Set(patientRows.map((member) => member.user_id))];
  if (patientUserIds.length === 0) {
    return { data: false, error: null };
  }

  const { data: userMsgRows, error: unreadError } = await client
    .from('messages')
    .select('chat_id, created_at, last_seen_at, chats!inner(user_id)')
    .eq('message_type', 'user')
    .in('chats.user_id', patientUserIds)
    .eq('chats.target_type', 'user')
    .is('chats.deleted_at', null);

  if (unreadError) {
    return { data: false, error: unreadError };
  }

  const rows = (userMsgRows ?? []) as {
    chat_id: string;
    created_at: string | null;
    last_seen_at: string | null;
  }[];

  if (rows.length === 0) {
    return { data: false, error: null };
  }

  const chatToCutoff = new Map<string, string>();
  for (const row of rows) {
    if (row.last_seen_at != null && row.created_at != null) {
      const current = chatToCutoff.get(row.chat_id);
      if (!current || row.created_at > current) {
        chatToCutoff.set(row.chat_id, row.created_at);
      }
    }
  }

  for (const row of rows) {
    const cutoff = chatToCutoff.get(row.chat_id);
    const created = row.created_at ?? '';
    if (cutoff == null || created > cutoff) {
      return { data: true, error: null };
    }
  }

  return { data: false, error: null };
}

async function fetchConversationsForAdmin(
  client: SupabaseClient<Database>,
  adminUserId: string,
): Promise<{
  data: ConversationItem[];
  error: { message: string; code?: string } | null;
}> {
  const adminOrgs = await fetchAdminOrgIds(client, adminUserId);
  if (adminOrgs.error) {
    return { data: [], error: adminOrgs.error };
  }

  const adminOrgIds = adminOrgs.data ?? [];
  if (adminOrgIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: patientMembers, error: patientError } = await client
    .from('organization_members')
    .select(
      'user_id, organization_id, organizations!inner(id, name), created_at',
    )
    .in('organization_id', adminOrgIds)
    .eq('role', 'patient')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (patientError) {
    return { data: [], error: patientError };
  }

  if (!patientMembers || patientMembers.length === 0) {
    return { data: [], error: null };
  }

  const patientByUser = new Map<string, { orgId: string; orgName: string }>();
  for (const member of patientMembers as unknown as RawMember[]) {
    const org = Array.isArray(member.organizations)
      ? member.organizations[0]
      : member.organizations;
    if (!patientByUser.has(member.user_id) && org) {
      patientByUser.set(member.user_id, {
        orgId: member.organization_id,
        orgName: org.name,
      });
    }
  }
  const patientUserIds = [...patientByUser.keys()];

  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url')
    .in('id', patientUserIds);

  if (profilesError) {
    return { data: [], error: profilesError };
  }

  const profileRows = (profiles ?? []) as RawProfile[];
  const profileMap = new Map(profileRows.map((profile) => [profile.id, profile]));

  const { data: chats, error: chatsError } = await client
    .from('chats')
    .select('id, user_id')
    .in('user_id', patientUserIds)
    .eq('target_type', 'user')
    .is('deleted_at', null);

  if (chatsError) {
    return { data: [], error: chatsError };
  }

  const chatByUserId = new Map<string, string>();
  for (const chat of chats ?? []) {
    if (chat.user_id) {
      chatByUserId.set(chat.user_id, chat.id);
    }
  }
  const chatIds = [...chatByUserId.values()];

  const unreadCountByChatId = new Map<string, number>();
  if (chatIds.length > 0) {
    const { data: userMsgRows, error: unreadError } = await client
      .from('messages')
      .select('chat_id, created_at, last_seen_at')
      .in('chat_id', chatIds)
      .eq('message_type', 'user');

    if (unreadError) {
      return { data: [], error: unreadError };
    }

    const rows = (userMsgRows ?? []) as {
      chat_id: string;
      created_at: string | null;
      last_seen_at: string | null;
    }[];

    const chatToCutoff = new Map<string, string>();
    for (const row of rows) {
      if (row.last_seen_at != null && row.created_at != null) {
        const current = chatToCutoff.get(row.chat_id);
        if (!current || row.created_at > current) {
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

  const lastMessageByChatId = new Map<
    string,
    { content: string; created_at: string | null }
  >();
  if (chatIds.length > 0) {
    const results = await Promise.all(
      chatIds.map(async (chatId) => {
        const { data: rows, error } = await client
          .from('messages')
          .select('chat_id, content, attachments, created_at')
          .eq('chat_id', chatId)
          .neq('message_type', 'system')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !rows) {
          return null;
        }

        return rows as {
          chat_id: string;
          content: string | null;
          attachments: unknown;
          created_at: string | null;
        };
      }),
    );

    for (const message of results) {
      if (!message) continue;
      const raw = message.attachments as
        | MessageAttachment
        | MessageAttachment[]
        | null;
      const first = Array.isArray(raw) ? raw[0] : raw;
      const fallback = first?.type;
      lastMessageByChatId.set(message.chat_id, {
        content:
          (message.content?.trim().length ?? 0) > 0
            ? message.content!
            : fallback
              ? `New ${fallback} attachment`
              : '',
        created_at: message.created_at,
      });
    }
  }

  const { data: assignments, error: assignError } = await client
    .from('program_assignment')
    .select('id, user_id, program_template(name)')
    .in('user_id', patientUserIds)
    .eq('status', 'active');

  if (assignError) {
    return { data: [], error: assignError };
  }

  const programAssignmentIdByUserId = new Map<string, string>();
  const programNameByUserId = new Map<string, string>();
  for (const assignment of (assignments ?? []) as RawAssignment[]) {
    const raw = assignment.program_template;
    const template = Array.isArray(raw) ? raw[0] : raw;
    const userId = assignment.user_id ?? '';
    if (!programAssignmentIdByUserId.has(userId)) {
      programAssignmentIdByUserId.set(userId, assignment.id);
      if (template?.name) {
        programNameByUserId.set(userId, template.name);
      }
    }
  }

  const items: ConversationItem[] = patientUserIds.map((userId) => {
    const orgInfo = patientByUser.get(userId)!;
    const profile = profileMap.get(userId);
    const chatId = chatByUserId.get(userId) ?? null;
    const lastMessage = chatId ? lastMessageByChatId.get(chatId) : null;
    const programAssignmentId = programAssignmentIdByUserId.get(userId) ?? null;
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
      last_message_content: lastMessage?.content ?? null,
      last_message_at: lastMessage?.created_at ?? null,
      program_assignment_id: programAssignmentId,
      program_name: programName,
      unread_count: chatId ? (unreadCountByChatId.get(chatId) ?? 0) : 0,
    };
  });

  items.sort((left, right) => {
    const leftAt = left.last_message_at ?? '';
    const rightAt = right.last_message_at ?? '';
    if (leftAt && rightAt) return rightAt.localeCompare(leftAt);
    if (leftAt) return -1;
    if (rightAt) return 1;
    return 0;
  });

  return { data: items, error: null };
}

/** Whether the admin has any unread patient user messages. */
export const hasUnreadMessagesForAdmin = defineQuery({
  key: conversationKeys.unreadForAdmin,
  schema: hasUnreadSchema,
  execute: (client, adminUserId: string) =>
    fetchHasUnreadMessagesForAdmin(client, adminUserId),
});

const messagingOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const messagingOrganizationListSchema = z.array(messagingOrganizationSchema);

export const messagingOrganizationKeys = {
  forAdmin: (adminUserId: string) =>
    [...conversationKeys.all, 'messaging-orgs', adminUserId] as const,
};

/** Organizations available in the messages filter for this admin. */
export const getMessagingOrganizationsForAdmin = defineQuery({
  key: messagingOrganizationKeys.forAdmin,
  schema: messagingOrganizationListSchema,
  execute: (client, adminUserId: string) =>
    fetchMessagingOrganizations(client, adminUserId),
});

/** Conversations list for an admin across their organizations. */
export const getConversationsForAdmin = defineQuery({
  key: conversationKeys.forAdmin,
  schema: conversationListSchema,
  execute: (client, adminUserId: string) =>
    fetchConversationsForAdmin(client, adminUserId),
});
