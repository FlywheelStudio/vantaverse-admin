'use server';

import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { createAdminClient } from '@/lib/supabase/core/admin';
import { SupabaseStorage } from '@/lib/supabase/storage';
import * as XLSX from 'xlsx';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { Profile } from '@/lib/supabase/schemas/profiles';

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
}) {
  const query = new ProfilesQuery();
  return query.getListWithStats(filters);
}

/**
 * Get user profile by ID
 */
export async function getUserProfileById(id: string) {
  const query = new ProfilesQuery();
  return query.getUserById(id);
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
) {
  const query = new ProfilesQuery();
  return query.update(userId, profileData);
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

  // Update user's avatar_url
  const query = new ProfilesQuery();
  const updateResult = await query.update(userId, {
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
 * Delete a user
 */
export async function deleteUser(userId: string) {
  const query = new ProfilesQuery();
  return query.delete(userId);
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

    const profileQuery = new ProfilesQuery();

    const emailResult = await profileQuery.getAllEmailsForImport();
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
        error: 'No user data found in CSV file. Please add user rows after the header row (First Name, Last Name, Email*). The template file should be filled in with actual user data before uploading.',
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

    const profileQuery = new ProfilesQuery();

    const emailResult = await profileQuery.getAllEmailsForImport();
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
    fetch('http://127.0.0.1:7242/ingest/025afd74-7b67-4f45-afd3-6a6b59d4393b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:uploadUsersExcel',message:'Excel parse complete',data:{usersToAddCount:usersToAdd.length,existingUsersCount:existingUsers.length,failedUsersCount:failedUsers.length,errorsCount:errors.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
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
 * Create a user quickly with email, name, and optional org/team assignment
 */
export async function createUserQuickAdd(data: {
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
  const query = new ProfilesQuery();
  return query.createQuickAdd(data);
}

export type SendBulkInvitationsResult =
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

async function createPendingUsers(
  rows: ImportUserRow[],
  role: MemberRole,
): Promise<{
  createdUsers: ImportedUser[];
  errors: ValidationError[];
}> {
  const supabase = await createAdminClient();
  const createdUsers: ImportedUser[] = [];
  const errors: ValidationError[] = [];
  const orgMembersQuery = new OrganizationMembers();

  for (const row of rows) {
    const email = row.email.toLowerCase().trim();
    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();

    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        user_metadata: { first_name: firstName, last_name: lastName },
        email_confirm: true,
      });

    if (authError || !authUser.user) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'Email',
        message: authError?.message || 'Failed to create auth user',
      });
      continue;
    }

    const userId = authUser.user.id;

    const profilesQuery = new ProfilesQuery();
    const updateResult = await profilesQuery.update(userId, {
      first_name: firstName || null,
      last_name: lastName || null,
      status: 'pending',
    });

    if (!updateResult.success) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'Status',
        message: `Failed to set status: ${updateResult.error}`,
      });
    }

    // Add to super admin organization if role is admin
    if (role === 'admin') {
      const superAdminResult = await orgMembersQuery.makeSuperAdmin(userId);
      // Log error but don't fail user creation if super admin org doesn't exist
      if (!superAdminResult.success) {
        console.error(
          'Failed to add user to super admin organization:',
          superAdminResult.error,
        );
      }
    }

    createdUsers.push({
      id: userId,
      email,
      firstName,
      lastName,
      status: 'pending',
    });
  }

  return { createdUsers, errors };
}

async function resolveExistingUsers(
  rows: ImportUserRow[],
  role: MemberRole,
): Promise<
  { success: true; data: ImportedUser[] } | { success: false; error: string }
> {
  const profileQuery = new ProfilesQuery();
  const emails = rows.map((r) => r.email.toLowerCase().trim());
  const result = await profileQuery.getByEmailsForImport(emails);
  if (!result.success) return { success: false, error: result.error };

  const byEmail = new Map(
    result.data
      .filter((p) => p.email)
      .map((p) => [String(p.email).toLowerCase(), p]),
  );

  const existingUsers: ImportedUser[] = rows.map((r) => {
    const emailLower = r.email.toLowerCase().trim();
    const p = byEmail.get(emailLower);
    return {
      id: p?.id ?? `missing:${emailLower}`,
      email: emailLower,
      firstName: p?.first_name ?? r.firstName ?? '',
      lastName: p?.last_name ?? r.lastName ?? '',
      status: (p?.status ?? 'active') as ProfileStatus | string,
    };
  });

  // Add existing users to super admin organization if role is admin
  if (role === 'admin') {
    const orgMembersQuery = new OrganizationMembers();
    for (const user of existingUsers) {
      // Skip if user ID is missing (failed lookup)
      if (user.id.startsWith('missing:')) continue;

      const superAdminResult = await orgMembersQuery.makeSuperAdmin(user.id);
      // Log error but don't fail if super admin org doesn't exist
      if (!superAdminResult.success) {
        console.error(
          'Failed to add existing user to super admin organization:',
          superAdminResult.error,
        );
      }
    }
  }

  return { success: true, data: existingUsers };
}

export async function importUsersCSV(
  csvText: string,
  role: MemberRole,
): Promise<
  { success: true; data: ImportUsersResult } | { success: false; error: string }
> {
  const parsed = await uploadUsersCSV(csvText);
  if (!parsed.success) {
    return parsed;
  }

  const createResult = await createPendingUsers(parsed.data.usersToAdd, role);
  const existingResult = await resolveExistingUsers(
    parsed.data.existingUsers,
    role,
  );
  if (!existingResult.success) return existingResult;

  const result = {
    success: true as const,
    data: {
      createdUsers: createResult.createdUsers,
      existingUsers: existingResult.data,
      failedUsers: parsed.data.failedUsers.map((u) => ({
        rowNumber: u.rowNumber,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
      })),
      errors: [...parsed.data.errors, ...createResult.errors],
    },
  };

  return result;
}

export async function importUsersExcel(
  fileData: ArrayBuffer,
  role: MemberRole,
): Promise<
  { success: true; data: ImportUsersResult } | { success: false; error: string }
> {
  const parsed = await uploadUsersExcel(fileData);
  if (!parsed.success) return parsed;

  const createResult = await createPendingUsers(parsed.data.usersToAdd, role);
  const existingResult = await resolveExistingUsers(
    parsed.data.existingUsers,
    role,
  );
  if (!existingResult.success) return existingResult;

  return {
    success: true,
    data: {
      createdUsers: createResult.createdUsers,
      existingUsers: existingResult.data,
      failedUsers: parsed.data.failedUsers.map((u) => ({
        rowNumber: u.rowNumber,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
      })),
      errors: [...parsed.data.errors, ...createResult.errors],
    },
  };
}
