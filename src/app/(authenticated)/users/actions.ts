'use server';

import { revalidatePath } from 'next/cache';
import { mutate, query, type DalResult } from '@/lib/dal';
import { createClient } from '@/lib/supabase/core/server';
import {
  createQuickAddMutation,
  deleteAuthUserMutation,
  getAllEmailsForImportQuery,
  getMemberFilterCountsQuery,
  getProfileByIdQuery,
  getProfilesByEmailsForImportQuery,
  listProfilesFilteredQuery,
  listProfilesWithStatsQuery,
  setOnboardingStateMutation,
  updateProfileMutation,
  type ListProfilesFilteredInput,
  type MemberFilterCounts,
  type SetOnboardingStateTarget,
} from '@/lib/supabase/queries/profiles';
import { getSuperAdminOrganizationId } from '@/lib/supabase/queries/organizations';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { createAdminClient } from '@/lib/supabase/core/admin';
import { SupabaseStorage } from '@/lib/supabase/storage';
import * as XLSX from 'xlsx';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { Profile, ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { PaginatedResult } from '@/lib/supabase/queries/exercise-templates';
import type { SupabaseError, SupabaseSuccess } from '@/lib/supabase/result';

function toSupabaseResult<T>(
  result: DalResult<T>,
): SupabaseSuccess<T> | SupabaseError {
  const [err, data] = result;
  if (err) {
    return { success: false, error: err.message };
  }
  return { success: true, data };
}

// ============================================================================
// Types for Excel Import Validation
// ============================================================================

interface ImportUserRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
}

interface ImportValidationResult {
  usersToAdd: ImportUserRow[];
  existingUsers: ImportUserRow[];
  failedUsers: ImportUserRow[];
  errors: ValidationError[];
}

function isHeaderRow(row: (string | number | undefined)[] | undefined) {
  if (!row) return false;
  const first = String(row[0] ?? '')
    .trim()
    .toLowerCase();
  const last = String(row[1] ?? '')
    .trim()
    .toLowerCase();
  const email = String(row[2] ?? '')
    .trim()
    .toLowerCase();
  return (
    first === 'first name' &&
    last === 'last name' &&
    (email === 'email' || email === 'email*')
  );
}

function findHeaderRowIndex(
  data: (string | number | undefined)[][],
): number | null {
  for (let i = 0; i < data.length; i++) {
    const isHeader = isHeaderRow(data[i]);
    if (isHeader) {
      return i;
    }
  }
  return null;
}

/**
 * Get users with stats
 */
export async function getUsersWithStats(filters?: {
  organization_id?: string;
  team_id?: string;
  journey_phase?: string;
  role?: MemberRole;
}): Promise<SupabaseSuccess<ProfileWithStats[]> | SupabaseError> {
  return toSupabaseResult(
    await query(listProfilesWithStatsQuery, filters ?? {}),
  );
}

/**
 * Get members filtered via the `list_profiles_filtered` RPC.
 */
export async function getMembersFiltered(
  params: ListProfilesFilteredInput = {},
): Promise<SupabaseSuccess<PaginatedResult<ProfileWithStats>> | SupabaseError> {
  const client = await createClient();
  return toSupabaseResult(
    await query(listProfilesFilteredQuery, params, { client }),
  );
}

/**
 * Get facet counts for the members filter panel.
 */
export async function getMemberFilterCounts(): Promise<
  SupabaseSuccess<MemberFilterCounts> | SupabaseError
> {
  const client = await createClient();
  return toSupabaseResult(
    await query(getMemberFilterCountsQuery, { client }),
  );
}

/**
 * Get user profile by ID
 */
export async function getUserProfileById(
  id: string,
): Promise<SupabaseSuccess<ProfileWithStats> | SupabaseError> {
  const client = await createClient();
  return toSupabaseResult(await query(getProfileByIdQuery, id, { client }));
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  profileData: Pick<
    Partial<Profile>,
    'first_name' | 'last_name' | 'description' | 'avatar_url'
  >,
): Promise<SupabaseSuccess<Profile> | SupabaseError> {
  return toSupabaseResult(
    await mutate(updateProfileMutation, { id: userId, profileData }),
  );
}

/**
 * Upload user avatar image
 */
export async function uploadUserAvatar(
  userId: string,
  fileBase64: string,
): Promise<
  { success: true; data: string } | { success: false; error: string }
> {
  // Validate file type
  const base64Header = fileBase64.substring(0, 30);
  const isJpeg =
    base64Header.includes('data:image/jpeg') ||
    base64Header.includes('data:image/jpg');
  const isPng = base64Header.includes('data:image/png');

  if (!isJpeg && !isPng) {
    return {
      success: false,
      error: 'Invalid file type. Only JPEG and PNG images are allowed.',
    };
  }

  const storage = new SupabaseStorage();
  const extension = isJpeg ? 'jpg' : 'png';
  const folderPath = `${userId}/user_image`;
  const filePath = `${folderPath}/image.${extension}`;
  const contentType = isJpeg ? 'image/jpeg' : 'image/png';

  // List and delete existing files in the folder
  const listResult = await storage.list('user_assets', folderPath);
  if (listResult.success) {
    // Delete all existing files
    for (const existingPath of listResult.data) {
      await storage.delete('user_assets', existingPath);
    }
  }

  // Upload new image
  const uploadResult = await storage.upload({
    bucket: 'user_assets',
    path: filePath,
    body: fileBase64,
    contentType,
    upsert: true,
    getPublicUrl: false, // Don't get public URL since bucket is private
  });

  if (!uploadResult.success) {
    return uploadResult;
  }

  // Generate signed URL (1000 years expiration)
  const signedUrlResult = await storage.createSignedUrl(
    'user_assets',
    filePath,
    1000 * 365 * 24 * 60 * 60, // 1000 years in seconds
  );

  if (!signedUrlResult.success) {
    return {
      success: false,
      error: `Failed to generate signed URL: ${signedUrlResult.error}`,
    };
  }

  const updateResult = await updateUserProfile(userId, {
    avatar_url: signedUrlResult.data,
  });

  if (!updateResult.success) {
    return {
      success: false,
      error: `Failed to update avatar URL: ${updateResult.error}`,
    };
  }

  return {
    success: true,
    data: signedUrlResult.data,
  };
}

/**
 * Delete an auth user
 */
export async function deleteAuthUser(
  userId: string,
): Promise<SupabaseSuccess<void> | SupabaseError> {
  const result = await mutate(deleteAuthUserMutation, { id: userId });
  const [err] = result;
  if (err) {
    return { success: false, error: err.message };
  }
  return { success: true, data: undefined };
}

/**
 * Hard-delete an admin from /manage: blocks self-remove and sole-admin remove.
 */
export async function removeAdminUser(
  userId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { createClient } = await import('@/lib/supabase/core/server');

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { success: false, error: 'Unauthorized' };
  }
  if (auth.user.id === userId) {
    return { success: false, error: 'You cannot remove yourself as admin' };
  }

  const [orgErr, orgId] = await query(getSuperAdminOrganizationId, {
    client: supabase,
  });
  if (orgErr) {
    return { success: false, error: orgErr.message };
  }

  const admin = await createAdminClient();
  const { count, error: countError } = await admin
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .eq('role', 'admin');

  if (countError) {
    return { success: false, error: countError.message };
  }
  if ((count ?? 0) <= 1) {
    return {
      success: false,
      error: 'Cannot remove the sole remaining admin',
    };
  }

  const deleted = await deleteAuthUser(userId);
  if (!deleted.success) {
    return { success: false, error: deleted.error };
  }

  revalidatePath('/manage');
  revalidatePath('/users');
  return { success: true };
}

/**
 * Make a user a super admin
 */
export async function makeSuperAdmin(userId: string) {
  const query = new OrganizationMembers();
  return query.makeSuperAdmin(userId);
}

/**
 * Revoke super admin status from a user
 */
export async function revokeSuperAdmin(userId: string) {
  const query = new OrganizationMembers();
  return query.revokeSuperAdmin(userId);
}

/**
 * Get CSV template download URL
 * Returns the URL to the template file in the public folder
 */
export async function getTemplateCSVUrl() {
  return {
    success: true as const,
    data: '/Medvanta - Bulk User Template.csv',
  };
}

/**
 * Get Excel template download URL
 * Returns the URL to the template file in the public folder
 */
export async function getTemplateExcelUrl() {
  return {
    success: true as const,
    data: '/Medvanta - Bulk User Template.xlsx',
  };
}

/**
 * Upload and validate users CSV file
 * @param csvText - The CSV file content as a string
 */
async function uploadUsersCSV(
  csvText: string,
): Promise<
  | { success: true; data: ImportValidationResult }
  | { success: false; error: string }
> {
  try {
    // Parse CSV file - use a more direct approach to get all rows
    // Split by newlines first to get raw CSV rows
    const rawLines = csvText.split(/\r?\n/);

    // Parse each line as CSV (handle quoted values)
    const data: (string | number | undefined)[][] = [];
    for (const line of rawLines) {
      if (!line.trim()) {
        // Empty line - add empty row
        data.push(['', '', '']);
        continue;
      }

      // Simple CSV parsing (handles basic cases)
      // Split by comma, but respect quoted strings
      const row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim()); // Add last field

      // Ensure at least 3 columns
      while (row.length < 3) {
        row.push('');
      }

      data.push(row.slice(0, 3)); // Take first 3 columns
    }

    const emailResult = toSupabaseResult(
      await query(getAllEmailsForImportQuery),
    );
    if (!emailResult.success)
      return { success: false, error: emailResult.error };
    const existingEmails = emailResult.data;

    const usersToAdd: ImportUserRow[] = [];
    const existingUsers: ImportUserRow[] = [];
    const failedUsers: ImportUserRow[] = [];
    const errors: ValidationError[] = [];

    const seenEmails = new Set<string>();

    // Find the header row dynamically
    const headerRowIndex = findHeaderRowIndex(data);
    const startIndex = headerRowIndex !== null ? headerRowIndex + 1 : 0;

    // Check if we have any data rows after the header
    if (startIndex >= data.length) {
      return {
        success: false,
        error:
          'No user data found in CSV file. Please add user rows after the header row (First Name, Last Name, Email*). The template file should be filled in with actual user data before uploading.',
      };
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every((cell) => !cell || String(cell).trim() === '')) {
        // Skip empty rows
        continue;
      }

      if (isHeaderRow(row)) continue;

      const rowNumber = i + 1; // 1-indexed for user display
      const firstName = String(row[0] || '').trim();
      const lastName = String(row[1] || '').trim();
      const email = String(row[2] || '').trim();

      const userRow: ImportUserRow = {
        rowNumber,
        firstName,
        lastName,
        email,
      };

      if (!email) {
        errors.push({
          rowNumber,
          field: 'Email',
          message: 'Email is required',
        });
        failedUsers.push(userRow);
        continue;
      }

      const emailLower = email.toLowerCase();
      if (seenEmails.has(emailLower)) {
        continue; // silently dedupe within file
      }
      seenEmails.add(emailLower);

      if (!isValidEmail(email)) {
        errors.push({
          rowNumber,
          field: 'Email',
          message: 'Invalid email format',
        });
        failedUsers.push(userRow);
        continue;
      }

      // Check if user exists (case-insensitive email)
      const userExists = existingEmails.has(emailLower);

      if (userExists) {
        existingUsers.push(userRow);
      } else {
        usersToAdd.push(userRow);
      }
    }

    return {
      success: true,
      data: {
        usersToAdd,
        existingUsers,
        failedUsers,
        errors,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to parse CSV file',
    };
  }
}

// ============================================================================
// Database Helper Functions for Import Validation
// ============================================================================

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Upload and validate users Excel file
 */
async function uploadUsersExcel(
  fileData: ArrayBuffer,
): Promise<
  | { success: true; data: ImportValidationResult }
  | { success: false; error: string }
> {
  try {
    // Parse Excel file
    const workbook = XLSX.read(fileData, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return { success: false, error: 'No sheet found in Excel file' };
    }

    // Convert to array of arrays
    const data: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(
      sheet,
      {
        header: 1,
        defval: '',
      },
    );

    const emailResult = toSupabaseResult(
      await query(getAllEmailsForImportQuery),
    );
    if (!emailResult.success)
      return { success: false, error: emailResult.error };
    const existingEmails = emailResult.data;

    const usersToAdd: ImportUserRow[] = [];
    const existingUsers: ImportUserRow[] = [];
    const failedUsers: ImportUserRow[] = [];
    const errors: ValidationError[] = [];

    const seenEmails = new Set<string>();

    // Find the header row dynamically
    const headerRowIndex = findHeaderRowIndex(data);
    const startIndex = headerRowIndex !== null ? headerRowIndex + 1 : 0;

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every((cell) => !cell || String(cell).trim() === '')) {
        // Skip empty rows
        continue;
      }

      if (isHeaderRow(row)) continue;

      const rowNumber = i + 1; // 1-indexed for user display
      const firstName = String(row[0] || '').trim();
      const lastName = String(row[1] || '').trim();
      const email = String(row[2] || '').trim();

      const userRow: ImportUserRow = {
        rowNumber,
        firstName,
        lastName,
        email,
      };

      if (!email) {
        errors.push({
          rowNumber,
          field: 'Email',
          message: 'Email is required',
        });
        failedUsers.push(userRow);
        continue;
      }

      const emailLower = email.toLowerCase();
      if (seenEmails.has(emailLower)) {
        continue; // silently dedupe within file
      }
      seenEmails.add(emailLower);

      if (!isValidEmail(email)) {
        errors.push({
          rowNumber,
          field: 'Email',
          message: 'Invalid email format',
        });
        failedUsers.push(userRow);
        continue;
      }

      // Check if user exists (case-insensitive email)
      const userExists = existingEmails.has(emailLower);

      if (userExists) {
        existingUsers.push(userRow);
      } else {
        usersToAdd.push(userRow);
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/025afd74-7b67-4f45-afd3-6a6b59d4393b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'actions.ts:uploadUsersExcel',
        message: 'Excel parse complete',
        data: {
          usersToAddCount: usersToAdd.length,
          existingUsersCount: existingUsers.length,
          failedUsersCount: failedUsers.length,
          errorsCount: errors.length,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B',
      }),
    }).catch(() => {});
    // #endregion

    return {
      success: true,
      data: {
        usersToAdd,
        existingUsers,
        failedUsers,
        errors,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to parse Excel file',
    };
  }
}

/**
 * Create a user quickly with email, name, and optional org/team assignment.
 *
 * Admins get a super-admin membership on top of the profile row. Admin-ness
 * lives on `organization_members`, not `profiles`, so without this grant the
 * invitee is created but cannot log in (the `isUserAdminByEmail` gate in
 * `auth/actions.ts` rejects them) and never appears in the admin list.
 */
async function createUserQuickAdd(data: {
  email: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  teamId?: string;
  role?: MemberRole;
}): Promise<
  | { success: true; data: { userId: string } }
  | { success: false; error: string }
> {
  const result = await mutate(createQuickAddMutation, data);
  const [err, row] = result;
  if (err) {
    return { success: false, error: err.message };
  }

  if (data.role !== 'admin') {
    return { success: true, data: { userId: row.id } };
  }

  const orgMembers = new OrganizationMembers();
  const grant = await orgMembers.makeSuperAdmin(row.id);

  if (!grant.success) {
    // Surface it rather than logging and continuing: a swallowed failure here
    // leaves behind a user who can never sign in.
    return {
      success: false,
      error: `Created ${data.email}, but granting admin access failed: ${grant.error}. Retry from the admins list.`,
    };
  }

  return { success: true, data: { userId: row.id } };
}

type SendBulkInvitationsResult =
  | { success: true; data: BulkInvitationResponse }
  | { success: false; error: string };

interface BulkInvitationResponse {
  success: boolean;
  total: number;
  validated: number;
  successful: number;
  failed: number;
  validationErrors?: Array<{ email: string; error: string }>;
  results: Array<{
    email: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

export async function sendBulkInvitations(
  emails: string[],
  isAdmin: boolean,
): Promise<SendBulkInvitationsResult> {
  if (!emails.length) {
    return { success: false, error: 'No emails provided' };
  }
  const supabase = await createAdminClient();
  const { data, error } = await supabase.functions.invoke(
    'send_bulk_invitations',
    {
      body: { emails, is_admin: isAdmin },
    },
  );
  if (error) {
    return { success: false, error: error.message };
  }
  const body = data as BulkInvitationResponse | null;
  if (!body || typeof body.success !== 'boolean') {
    return { success: false, error: 'Invalid response from invite service' };
  }
  return { success: true, data: body };
}

// ============================================================================
// Bulk Import Types and Functions (simple: first_name, last_name, email)
// ============================================================================

type ProfileStatus = 'pending' | 'invited' | 'active' | 'assigned';

interface ImportedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: ProfileStatus | string;
}

export interface ImportUsersResult {
  createdUsers: ImportedUser[];
  existingUsers: ImportedUser[];
  failedUsers: Array<{
    rowNumber: number;
    email: string;
    firstName: string;
    lastName: string;
  }>;
  errors: ValidationError[];
}

/**
 * Parse + validate CSV into staged invite rows (no auth/profile creation).
 */
export async function importUsersCSV(
  csvText: string,
): Promise<
  { success: true; data: ImportUsersResult } | { success: false; error: string }
> {
  const parsed = await uploadUsersCSV(csvText);
  if (!parsed.success) return parsed;
  return stageImportRows(parsed.data);
}

/**
 * Parse + validate Excel into staged invite rows (no auth/profile creation).
 */
export async function importUsersExcel(
  fileData: ArrayBuffer,
): Promise<
  { success: true; data: ImportUsersResult } | { success: false; error: string }
> {
  const parsed = await uploadUsersExcel(fileData);
  if (!parsed.success) return parsed;
  return stageImportRows(parsed.data);
}

/**
 * Map parse results into ImportUsersResult without creating users.
 * New emails get temporary staged ids; existing emails get real profile ids.
 */
async function stageImportRows(
  parsed: ImportValidationResult,
): Promise<
  { success: true; data: ImportUsersResult } | { success: false; error: string }
> {
  const existingEmails = parsed.existingUsers.map((u) =>
    u.email.toLowerCase().trim(),
  );
  const existingLookup =
    existingEmails.length > 0
      ? toSupabaseResult(
          await query(getProfilesByEmailsForImportQuery, existingEmails),
        )
      : {
          success: true as const,
          data: [] as Array<{
            id: string;
            email: string | null;
            first_name: string | null;
            last_name: string | null;
            status: string | null;
          }>,
        };

  if (!existingLookup.success) {
    return { success: false, error: existingLookup.error };
  }

  const byEmail = new Map(
    existingLookup.data
      .filter((p) => p.email)
      .map((p) => [String(p.email).toLowerCase(), p]),
  );

  const createdUsers: ImportedUser[] = parsed.usersToAdd.map((u) => ({
    id: `staged:${u.email.toLowerCase().trim()}`,
    email: u.email.toLowerCase().trim(),
    firstName: u.firstName,
    lastName: u.lastName,
    status: 'pending',
  }));

  const existingUsers: ImportedUser[] = parsed.existingUsers.map((u) => {
    const emailLower = u.email.toLowerCase().trim();
    const p = byEmail.get(emailLower);
    return {
      id: p?.id ?? `missing:${emailLower}`,
      email: emailLower,
      firstName: p?.first_name ?? u.firstName ?? '',
      lastName: p?.last_name ?? u.lastName ?? '',
      status: (p?.status ?? 'active') as ProfileStatus | string,
    };
  });

  return {
    success: true,
    data: {
      createdUsers,
      existingUsers,
      failedUsers: parsed.failedUsers.map((u) => ({
        rowNumber: u.rowNumber,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
      })),
      errors: parsed.errors,
    },
  };
}

export interface InviteBatchItem {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  /** Present when staging an already-registered user. */
  existingUserId?: string;
  onboarding?: 'full' | 'screening' | 'consultation';
  /** Per-row admin grant (member modal can promote a row to admin). */
  asAdmin?: boolean;
}

interface InviteBatchResult {
  created: number;
  invited: number;
  failed: Array<{ email: string; error: string }>;
}

/**
 * Create/ensure users + org membership, then email invitations.
 * `defaultIsAdmin` applies when an item omits `asAdmin`.
 */
export async function sendInviteBatch(
  items: InviteBatchItem[],
  defaultIsAdmin: boolean,
): Promise<
  | { success: true; data: InviteBatchResult }
  | { success: false; error: string }
> {
  if (items.length === 0) {
    return { success: false, error: 'No invitees to send' };
  }

  const missingOrg = items.find((item) => !item.organizationId);
  if (missingOrg) {
    return {
      success: false,
      error: `Group required for ${missingOrg.email}`,
    };
  }

  const orgMembers = new OrganizationMembers();
  const failed: Array<{ email: string; error: string }> = [];
  const adminEmails: string[] = [];
  const memberEmails: string[] = [];
  let created = 0;

  for (const item of items) {
    const email = item.email.toLowerCase().trim();
    const isAdmin = item.asAdmin ?? defaultIsAdmin;
    const orgRole: MemberRole = isAdmin ? 'admin' : 'patient';
    let userId = item.existingUserId?.startsWith('staged:')
      ? undefined
      : item.existingUserId?.startsWith('missing:')
        ? undefined
        : item.existingUserId;

    if (!userId || !isValidUuid(userId)) {
      const createResult = await createUserQuickAdd({
        email,
        firstName: item.firstName,
        lastName: item.lastName,
        role: orgRole,
      });

      if (!createResult.success) {
        // Likely already exists — resolve by email and continue.
        const lookup = toSupabaseResult(
          await query(getProfilesByEmailsForImportQuery, [email]),
        );
        if (!lookup.success || lookup.data.length === 0) {
          failed.push({ email, error: createResult.error });
          continue;
        }
        const match = lookup.data.find(
          (p) => p.email?.toLowerCase() === email,
        );
        if (!match?.id) {
          failed.push({ email, error: createResult.error });
          continue;
        }
        userId = match.id;
        if (isAdmin) {
          const grant = await orgMembers.makeSuperAdmin(userId);
          if (!grant.success) {
            failed.push({ email, error: grant.error });
            continue;
          }
        }
      } else {
        userId = createResult.data.userId;
        created += 1;
      }
    } else if (isAdmin) {
      const grant = await orgMembers.makeSuperAdmin(userId);
      if (!grant.success) {
        failed.push({ email, error: grant.error });
        continue;
      }
    }

    const membership = await orgMembers.addOrUpdateMembership(
      userId,
      item.organizationId,
      orgRole,
    );
    if (!membership.success) {
      failed.push({ email, error: membership.error });
      continue;
    }

    if (
      !isAdmin &&
      item.onboarding &&
      item.onboarding !== 'full' &&
      isValidUuid(userId)
    ) {
      const onboarding = await setOnboardingStateForUsers(
        [userId],
        item.onboarding,
        { skipRevalidate: true },
      );
      if (!onboarding.success) {
        failed.push({ email, error: onboarding.error });
        continue;
      }
    }

    if (isAdmin) adminEmails.push(email);
    else memberEmails.push(email);
  }

  let invited = 0;
  const sendGroups: Array<{ emails: string[]; isAdmin: boolean }> = [
    { emails: adminEmails, isAdmin: true },
    { emails: memberEmails, isAdmin: false },
  ];

  for (const group of sendGroups) {
    if (group.emails.length === 0) continue;
    const inviteResult = await sendBulkInvitations(group.emails, group.isAdmin);
    if (!inviteResult.success) {
      return { success: false, error: inviteResult.error };
    }
    for (const row of inviteResult.data.results) {
      if (row.success) {
        invited += 1;
      } else {
        failed.push({
          email: row.email,
          error: row.error || 'Failed to send invitation',
        });
      }
    }
    for (const row of inviteResult.data.validationErrors ?? []) {
      failed.push({ email: row.email, error: row.error });
    }
  }

  revalidatePath('/users');
  revalidatePath('/manage');

  return {
    success: true,
    data: { created, invited, failed },
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function setOnboardingStateForUsers(
  userIds: string[],
  target: SetOnboardingStateTarget,
  opts?: { skipRevalidate?: boolean },
): Promise<
  { success: true; updatedCount: number } | { success: false; error: string }
> {
  try {
    const uniqueValidIds = [...new Set(userIds)].filter(isValidUuid);
    if (uniqueValidIds.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    const BATCH_SIZE = 10;
    const batches = chunkArray(uniqueValidIds, BATCH_SIZE);
    let updatedCount = 0;

    for (const batch of batches) {
      const results = await Promise.all(
        batch.map((userId) =>
          mutate(setOnboardingStateMutation, { userId, target }),
        ),
      );

      const firstError = results.find(([err]) => err !== null);
      if (firstError) {
        const [err] = firstError;
        if (err) {
          return {
            success: false,
            error: err.message,
          };
        }
      }

      updatedCount += results.length;
    }

    if (!opts?.skipRevalidate) {
      revalidatePath('/users');
      uniqueValidIds.forEach((uid) => revalidatePath(`/users/${uid}`));
    }
    return { success: true, updatedCount };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update onboarding state.',
    };
  }
}
