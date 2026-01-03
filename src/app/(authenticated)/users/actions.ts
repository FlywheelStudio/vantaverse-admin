'use server';

import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { OrganizationsQuery } from '@/lib/supabase/queries/organizations';
import { TeamsQuery } from '@/lib/supabase/queries/teams';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import * as XLSX from 'xlsx';

// ============================================================================
// Types for Excel Import Validation
// ============================================================================

export interface ImportUserRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;
  teamName: string;
  role: string;
}

export interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportValidationResult {
  usersToAdd: ImportUserRow[];
  usersToUpdate: ImportUserRow[];
  organizationsToCreate: string[];
  teamsToCreate: { name: string; organizationName: string }[];
  errors: ValidationError[];
}

// Expected headers in row 8 (0-indexed: row 7)
const EXPECTED_HEADERS = [
  'First Name',
  'Last Name',
  'Email*',
  'Organization Name (exact)',
  'Team Name (exact, must have organization)',
  'Role (admin or user)',
];

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
 * Download CSV template (placeholder - UI only)
 */
export async function downloadTemplateCSV() {
  // Placeholder function - implementation later
  return {
    success: false as const,
    error: 'Not implemented',
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
 * Upload users CSV (placeholder - UI only)
 */
export async function uploadUsersCSV(file: File) {
  // Placeholder function - implementation later
  console.log('uploadUsersCSV', file);
  return {
    success: false as const,
    error: 'Not implemented',
  };
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
 * Validate role value
 */
function isValidRole(role: string): boolean {
  const normalizedRole = role.toLowerCase().trim();
  return normalizedRole === 'admin' || normalizedRole === 'user';
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

    // Validate header row (row 8, 0-indexed: 7)
    const headerRowIndex = 7;
    if (data.length <= headerRowIndex) {
      return {
        success: false,
        error:
          'Excel file does not have enough rows. Header expected at row 8.',
      };
    }

    const headerRow = data[headerRowIndex];
    if (!headerRow) {
      return { success: false, error: 'Header row (row 8) is empty' };
    }

    // Validate headers match expected
    for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
      const expected = EXPECTED_HEADERS[i];
      const actual = String(headerRow[i] || '').trim();
      if (actual !== expected) {
        return {
          success: false,
          error: `Invalid header at column ${i + 1}. Expected "${expected}", got "${actual}"`,
        };
      }
    }

    // Fetch existing data from database
    const orgQuery = new OrganizationsQuery();
    const teamQuery = new TeamsQuery();
    const profileQuery = new ProfilesQuery();

    const [orgResult, teamResult, emailResult] = await Promise.all([
      orgQuery.getAllForImport(),
      teamQuery.getAllForImport(),
      profileQuery.getAllEmailsForImport(),
    ]);

    if (!orgResult.success) {
      return {
        success: false,
        error: orgResult.error,
      };
    }
    if (!teamResult.success) {
      return {
        success: false,
        error: teamResult.error,
      };
    }
    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error,
      };
    }

    const existingOrgs = orgResult.data;
    const existingTeams = teamResult.data;
    const existingEmails = emailResult.data;

    // Process data rows (starting from row 9, 0-indexed: 8)
    const dataStartIndex = 8;
    const usersToAdd: ImportUserRow[] = [];
    const usersToUpdate: ImportUserRow[] = [];
    const organizationsToCreate = new Set<string>();
    const teamsToCreate = new Map<
      string,
      { name: string; organizationName: string }
    >();
    const errors: ValidationError[] = [];

    for (let i = dataStartIndex; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every((cell) => !cell || String(cell).trim() === '')) {
        // Skip empty rows
        continue;
      }

      const rowNumber = i + 1; // 1-indexed for user display
      const firstName = String(row[0] || '').trim();
      const lastName = String(row[1] || '').trim();
      const email = String(row[2] || '').trim();
      const organizationName = String(row[3] || '').trim();
      const teamName = String(row[4] || '').trim();
      const role = String(row[5] || '').trim();

      const userRow: ImportUserRow = {
        rowNumber,
        firstName,
        lastName,
        email,
        organizationName,
        teamName,
        role,
      };

      // Validate required fields
      if (!firstName) {
        errors.push({
          rowNumber,
          field: 'First Name',
          message: 'First name is required',
        });
      }
      if (!lastName) {
        errors.push({
          rowNumber,
          field: 'Last Name',
          message: 'Last name is required',
        });
      }
      if (!email) {
        errors.push({
          rowNumber,
          field: 'Email',
          message: 'Email is required',
        });
      } else if (!isValidEmail(email)) {
        errors.push({
          rowNumber,
          field: 'Email',
          message: 'Invalid email format',
        });
      }

      // Validate role if provided
      if (role && !isValidRole(role)) {
        errors.push({
          rowNumber,
          field: 'Role',
          message: 'Role must be "admin" or "user"',
        });
      }

      // Validate team requires organization
      if (teamName && !organizationName) {
        errors.push({
          rowNumber,
          field: 'Team Name',
          message: 'Team requires an organization',
        });
      }

      // Check if user exists (case-insensitive email)
      const emailLower = email.toLowerCase();
      const userExists = existingEmails.has(emailLower);

      if (userExists) {
        usersToUpdate.push(userRow);
      } else if (email) {
        usersToAdd.push(userRow);
      }

      // Check if organization exists (case-sensitive)
      if (organizationName && !existingOrgs.has(organizationName)) {
        organizationsToCreate.add(organizationName);
      }

      // Check if team exists (case-sensitive, within organization)
      if (teamName && organizationName) {
        const orgId = existingOrgs.get(organizationName);
        if (orgId) {
          // Organization exists, check if team exists
          const teamKey = `${orgId}:${teamName}`;
          if (!existingTeams.has(teamKey)) {
            const createKey = `${organizationName}:${teamName}`;
            teamsToCreate.set(createKey, { name: teamName, organizationName });
          }
        } else {
          // Organization will be created, team also needs creation
          const createKey = `${organizationName}:${teamName}`;
          teamsToCreate.set(createKey, { name: teamName, organizationName });
        }
      }
    }

    return {
      success: true,
      data: {
        usersToAdd,
        usersToUpdate,
        organizationsToCreate: Array.from(organizationsToCreate),
        teamsToCreate: Array.from(teamsToCreate.values()),
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
