'use server';

import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { createAdminClient } from '@/lib/supabase/core/admin';
import * as XLSX from 'xlsx';

// ============================================================================
// Types for Excel Import Validation
// ============================================================================

export interface ImportUserRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportValidationResult {
  usersToAdd: ImportUserRow[];
  existingUsers: ImportUserRow[];
  failedUsers: ImportUserRow[];
  errors: ValidationError[];
}

const DATA_START_ROW_INDEX = 4; // row 5 (1-indexed), inclusive

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

/**
 * Get users with stats
 */
export async function getUsersWithStats(filters?: {
  organization_id?: string;
  team_id?: string;
  journey_phase?: string;
}) {
  const query = new ProfilesQuery();
  return query.getListWithStats(filters);
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  profileData: { first_name?: string; last_name?: string },
) {
  const query = new ProfilesQuery();
  return query.update(userId, profileData);
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
export async function uploadUsersCSV(
  csvText: string,
): Promise<
  | { success: true; data: ImportValidationResult }
  | { success: false; error: string }
> {
  try {
    // Parse CSV file using xlsx library
    const workbook = XLSX.read(csvText, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return { success: false, error: 'No data found in CSV file' };
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

    for (let i = DATA_START_ROW_INDEX; i < data.length; i++) {
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
export async function uploadUsersExcel(
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

    for (let i = DATA_START_ROW_INDEX; i < data.length; i++) {
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
}): Promise<
  | { success: true; data: { userId: string } }
  | { success: false; error: string }
> {
  const query = new ProfilesQuery();
  return query.createQuickAdd(data);
}

// ============================================================================
// Bulk Import Types and Functions (simple: first_name, last_name, email)
// ============================================================================

export type ProfileStatus = 'pending' | 'invited' | 'active' | 'assigned';

export interface ImportedUser {
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

async function createPendingUsers(rows: ImportUserRow[]): Promise<{
  createdUsers: ImportedUser[];
  errors: ValidationError[];
}> {
  const supabase = await createAdminClient();
  const createdUsers: ImportedUser[] = [];
  const errors: ValidationError[] = [];

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

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'Status',
        message: `Failed to set status: ${profileError.message}`,
      });
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

  return { success: true, data: existingUsers };
}

export async function importUsersCSV(
  csvText: string,
): Promise<
  { success: true; data: ImportUsersResult } | { success: false; error: string }
> {
  const parsed = await uploadUsersCSV(csvText);
  if (!parsed.success) return parsed;

  const createResult = await createPendingUsers(parsed.data.usersToAdd);
  const existingResult = await resolveExistingUsers(parsed.data.existingUsers);
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

export async function importUsersExcel(
  fileData: ArrayBuffer,
): Promise<
  { success: true; data: ImportUsersResult } | { success: false; error: string }
> {
  const parsed = await uploadUsersExcel(fileData);
  if (!parsed.success) return parsed;

  const createResult = await createPendingUsers(parsed.data.usersToAdd);
  const existingResult = await resolveExistingUsers(parsed.data.existingUsers);
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
