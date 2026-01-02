import { ChevronDown, ChevronRight } from 'lucide-react';
import type { OrgGroup } from '../types';
import { TeamSection } from './team-section';
import { ProfileItem } from './profile-item';

interface OrgGroupSectionProps {
  org: OrgGroup;
  isOrgExpanded: boolean;
  onToggleOrg: () => void;
  expandedTeams: Set<string>;
  onToggleTeam: (teamId: string) => void;
  type: 'organization' | 'team';
  currentId: string;
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
}

export function OrgGroupSection({
  org,
  isOrgExpanded,
  onToggleOrg,
  expandedTeams,
  onToggleTeam,
  type,
  currentId,
  selectedUserIds,
  onToggleUser,
}: OrgGroupSectionProps) {
  const totalCount =
    org.teams.reduce((sum, t) => sum + t.profiles.length, 0) +
    org.profiles.length;

  return (
    <div className="mb-4">
      <button
        onClick={onToggleOrg}
        className="flex items-center gap-2 w-full px-2 py-2 font-semibold text-sm hover:bg-muted/50 rounded"
      >
        {isOrgExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>
          {org.orgName}
          {type === 'organization' && org.orgId === currentId
            ? ' (current)'
            : ''}
        </span>
        <span className="ml-auto text-muted-foreground text-xs">
          ({totalCount})
        </span>
      </button>

      {isOrgExpanded && (
        <div className="ml-6">
          {org.teams.map((team) => (
            <TeamSection
              key={team.teamId}
              team={team}
              isExpanded={expandedTeams.has(team.teamId)}
              onToggle={() => onToggleTeam(team.teamId)}
              isCurrentTeam={type === 'team' && team.teamId === currentId}
              selectedUserIds={selectedUserIds}
              onToggleUser={onToggleUser}
            />
          ))}
          {org.profiles.map((groupedProfile) => (
            <ProfileItem
              key={groupedProfile.profile.id}
              groupedProfile={groupedProfile}
              isSelected={selectedUserIds.has(groupedProfile.profile.id)}
              onToggle={() => onToggleUser(groupedProfile.profile.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
