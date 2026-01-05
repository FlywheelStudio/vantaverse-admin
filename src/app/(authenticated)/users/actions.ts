'use server';

import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { OrganizationsQuery } from '@/lib/supabase/queries/organizations';
import { TeamsQuery } from '@/lib/supabase/queries/teams';
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

    // Validate header row (row 8, 0-indexed: 7)
    const headerRowIndex = 7;
    if (data.length <= headerRowIndex) {
      return {
        success: false,
        error: 'CSV file does not have enough rows. Header expected at row 8.',
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

// ============================================================================
// Bulk Import Types and Functions
// ============================================================================

interface BulkImportResult {
  created: {
    organizations: number;
    teams: number;
    users: number;
  };
  updated: {
    users: number;
  };
  errors: Array<{
    type: 'organization' | 'team' | 'user';
    identifier: string;
    message: string;
  }>;
}

/**
 * Bulk import users from validated Excel data
 * Creates organizations, teams, and users in order
 * @param validationResult - The validated import data
 * @returns Success with summary or error
 */
export async function bulkImportUsers(
  validationResult: ImportValidationResult,
): Promise<
  { success: true; data: BulkImportResult } | { success: false; error: string }
> {
  const { usersToAdd, usersToUpdate, organizationsToCreate, teamsToCreate } =
    validationResult;

  const result: BulkImportResult = {
    created: { organizations: 0, teams: 0, users: 0 },
    updated: { users: 0 },
    errors: [],
  };

  const supabase = await createAdminClient();

  // Track created organizations and teams by name for later reference
  const orgNameToId = new Map<string, string>();
  const teamNameToId = new Map<string, string>(); // key: "orgName:teamName"

  // ========================================================================
  // Step 1: Create Organizations (idempotent)
  // ========================================================================
  for (const orgName of organizationsToCreate) {
    // Check if already exists (race condition handling)
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', orgName)
      .maybeSingle();

    if (existingOrg) {
      orgNameToId.set(orgName, existingOrg.id);
      continue; // Skip, already exists
    }

    // Create organization
    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert({ name: orgName })
      .select('id')
      .single();

    if (error) {
      result.errors.push({
        type: 'organization',
        identifier: orgName,
        message: error.message,
      });
      continue;
    }

    orgNameToId.set(orgName, newOrg.id);
    result.created.organizations++;
  }

  // Fetch all existing organizations to resolve IDs
  const orgQuery = new OrganizationsQuery();
  const allOrgsResult = await orgQuery.getAllForImport();
  if (allOrgsResult.success) {
    for (const [name, id] of allOrgsResult.data) {
      if (!orgNameToId.has(name)) {
        orgNameToId.set(name, id);
      }
    }
  }

  // ========================================================================
  // Step 2: Create Teams (idempotent)
  // ========================================================================
  for (const teamInfo of teamsToCreate) {
    const orgId = orgNameToId.get(teamInfo.organizationName);
    if (!orgId) {
      result.errors.push({
        type: 'team',
        identifier: `${teamInfo.organizationName}:${teamInfo.name}`,
        message: `Organization "${teamInfo.organizationName}" not found`,
      });
      continue;
    }

    // Check if team already exists (race condition handling)
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('organization_id', orgId)
      .eq('name', teamInfo.name)
      .maybeSingle();

    if (existingTeam) {
      teamNameToId.set(
        `${teamInfo.organizationName}:${teamInfo.name}`,
        existingTeam.id,
      );
      continue; // Skip, already exists
    }

    // Create team
    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({
        organization_id: orgId,
        name: teamInfo.name,
      })
      .select('id')
      .single();

    if (error) {
      result.errors.push({
        type: 'team',
        identifier: `${teamInfo.organizationName}:${teamInfo.name}`,
        message: error.message,
      });
      continue;
    }

    teamNameToId.set(
      `${teamInfo.organizationName}:${teamInfo.name}`,
      newTeam.id,
    );
    result.created.teams++;
  }

  // Fetch all existing teams to resolve IDs
  const teamQuery = new TeamsQuery();
  const allTeamsResult = await teamQuery.getAllForImport();
  if (allTeamsResult.success) {
    // Need to map org ID back to org name
    const orgIdToName = new Map<string, string>();
    for (const [name, id] of orgNameToId) {
      orgIdToName.set(id, name);
    }
    // Also get from allOrgsResult
    if (allOrgsResult.success) {
      for (const [name, id] of allOrgsResult.data) {
        orgIdToName.set(id, name);
      }
    }

    for (const [key, teamData] of allTeamsResult.data) {
      // key is "orgId:teamName", we need "orgName:teamName"
      const parts = key.split(':');
      const orgId = parts[0];
      const teamName = parts.slice(1).join(':');
      const orgName = orgIdToName.get(orgId);
      if (orgName) {
        const teamKey = `${orgName}:${teamName}`;
        if (!teamNameToId.has(teamKey)) {
          teamNameToId.set(teamKey, teamData.id);
        }
      }
    }
  }

  // ========================================================================
  // Step 3: Create New Users
  // ========================================================================
  for (const userRow of usersToAdd) {
    const { email, firstName, lastName, organizationName, teamName, role } =
      userRow;
    const normalizedRole = role.toLowerCase().trim();
    const dbRole: 'admin' | 'patient' =
      normalizedRole === 'admin' ? 'admin' : 'patient';

    // Create auth user
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
        email_confirm: true,
      });

    if (authError || !authUser.user) {
      result.errors.push({
        type: 'user',
        identifier: email,
        message: authError?.message || 'Failed to create auth user',
      });
      continue;
    }

    const userId = authUser.user.id;

    // Add to team if specified (trigger will auto-add to org as "patient")
    if (teamName && organizationName) {
      const teamKey = `${organizationName}:${teamName}`;
      const teamId = teamNameToId.get(teamKey);

      if (teamId) {
        const teamQuery = new TeamsQuery();
        const teamResult = await teamQuery.addUserToTeam(userId, teamId);
        if (!teamResult.success) {
          result.errors.push({
            type: 'user',
            identifier: email,
            message: teamResult.error,
          });
        }

        // If role is admin, update org membership role (trigger added as patient)
        if (dbRole === 'admin') {
          const orgId = orgNameToId.get(organizationName);
          if (orgId) {
            const orgMembersQuery = new OrganizationMembers();
            const orgResult = await orgMembersQuery.addOrUpdateMembership(
              userId,
              orgId,
              'admin',
            );
            if (!orgResult.success) {
              result.errors.push({
                type: 'user',
                identifier: email,
                message: orgResult.error,
              });
            }
          }
        }
      } else {
        result.errors.push({
          type: 'user',
          identifier: email,
          message: `Team "${teamName}" in "${organizationName}" not found`,
        });
      }
    } else if (organizationName) {
      // Only organization specified (no team)
      const orgId = orgNameToId.get(organizationName);
      if (orgId) {
        const orgMembersQuery = new OrganizationMembers();
        const orgResult = await orgMembersQuery.addOrUpdateMembership(
          userId,
          orgId,
          dbRole,
        );
        if (!orgResult.success) {
          result.errors.push({
            type: 'user',
            identifier: email,
            message: orgResult.error,
          });
        }
      } else {
        result.errors.push({
          type: 'user',
          identifier: email,
          message: `Organization "${organizationName}" not found`,
        });
      }
    }

    result.created.users++;
  }

  // ========================================================================
  // Step 4: Update Existing Users
  // ========================================================================
  for (const userRow of usersToUpdate) {
    const { email, firstName, lastName, organizationName, teamName, role } =
      userRow;
    const normalizedRole = role.toLowerCase().trim();
    const dbRole: 'admin' | 'patient' =
      normalizedRole === 'admin' ? 'admin' : 'patient';

    // Get user by email
    const profileQuery = new ProfilesQuery();
    const userResult = await profileQuery.getByEmail(email);
    if (!userResult.success) {
      result.errors.push({
        type: 'user',
        identifier: email,
        message: userResult.error,
      });
      continue;
    }

    const userId = userResult.data.id;
    let wasUpdated = false;

    // Update profile name if different
    if (
      userResult.data.first_name !== firstName ||
      userResult.data.last_name !== lastName
    ) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        result.errors.push({
          type: 'user',
          identifier: email,
          message: `Failed to update profile: ${updateError.message}`,
        });
      } else {
        wasUpdated = true;
      }
    }

    // Add to team if specified
    if (teamName && organizationName) {
      const teamKey = `${organizationName}:${teamName}`;
      const teamId = teamNameToId.get(teamKey);

      if (teamId) {
        const teamQuery = new TeamsQuery();
        const teamResult = await teamQuery.addUserToTeam(userId, teamId);
        if (!teamResult.success) {
          result.errors.push({
            type: 'user',
            identifier: email,
            message: teamResult.error,
          });
        } else {
          wasUpdated = true;
        }

        // Update org membership role if admin
        const orgId = orgNameToId.get(organizationName);
        if (orgId && dbRole === 'admin') {
          const orgMembersQuery = new OrganizationMembers();
          const orgResult = await orgMembersQuery.addOrUpdateMembership(
            userId,
            orgId,
            'admin',
          );
          if (!orgResult.success) {
            result.errors.push({
              type: 'user',
              identifier: email,
              message: orgResult.error,
            });
          } else {
            wasUpdated = true;
          }
        }
      } else {
        result.errors.push({
          type: 'user',
          identifier: email,
          message: `Team "${teamName}" in "${organizationName}" not found`,
        });
      }
    } else if (organizationName) {
      // Only organization specified (no team)
      const orgId = orgNameToId.get(organizationName);
      if (orgId) {
        const orgMembersQuery = new OrganizationMembers();
        const orgResult = await orgMembersQuery.addOrUpdateMembership(
          userId,
          orgId,
          dbRole,
        );
        if (!orgResult.success) {
          result.errors.push({
            type: 'user',
            identifier: email,
            message: orgResult.error,
          });
        } else {
          wasUpdated = true;
        }
      } else {
        result.errors.push({
          type: 'user',
          identifier: email,
          message: `Organization "${organizationName}" not found`,
        });
      }
    }

    if (wasUpdated) {
      result.updated.users++;
    }
  }

  return {
    success: true,
    data: result,
  };
}
