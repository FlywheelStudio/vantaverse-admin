import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';

export function filterProfiles(
  profiles: ProfileWithMemberships[] | undefined,
  searchQuery: string,
): ProfileWithMemberships[] {
  if (!profiles || profiles.length === 0) return [];

  const query = searchQuery.toLowerCase().trim();
  if (!query) return profiles;

  return profiles.filter((profile) => {
    const firstName = profile.first_name?.toLowerCase() || '';
    const lastName = profile.last_name?.toLowerCase() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const email = profile.email?.toLowerCase() || '';
    const orgNames = profile.orgMemberships
      .map((m) => m.orgName.toLowerCase())
      .join(' ');
    const teamNames = profile.teamMemberships
      .map((m) => m.teamName.toLowerCase())
      .join(' ');

    return (
      firstName.includes(query) ||
      lastName.includes(query) ||
      fullName.includes(query) ||
      email.includes(query) ||
      orgNames.includes(query) ||
      teamNames.includes(query)
    );
  });
}
