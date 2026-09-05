interface SearchableMember {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  orgMemberships?: Array<{ orgName: string }>;
  teamMemberships?: Array<{ teamName: string }>;
}

export function filterProfiles<T extends SearchableMember>(
  profiles: T[] | undefined,
  searchQuery: string,
): T[] {
  if (!profiles || profiles.length === 0) return [];

  const query = searchQuery.toLowerCase().trim();
  if (!query) return profiles;

  return profiles.filter((profile) => {
    const firstName = profile.first_name?.toLowerCase() || '';
    const lastName = profile.last_name?.toLowerCase() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const email = profile.email?.toLowerCase() || '';
    const orgNames = (profile.orgMemberships ?? [])
      .map((m) => m.orgName.toLowerCase())
      .join(' ');
    const teamNames = (profile.teamMemberships ?? [])
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
