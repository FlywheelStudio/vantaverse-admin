import { ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { OrgGroup } from '../types';
import { TeamSection } from './team-section';
import { ProfileItem } from './profile-item';
import { useMemo } from 'react';

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
  onToggleGroup: (userIds: string[]) => void;
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
  onToggleGroup,
}: OrgGroupSectionProps) {
  const totalCount =
    org.teams.reduce((sum, t) => sum + t.profiles.length, 0) +
    org.profiles.length;

  const allMemberIds = useMemo(() => {
    const teamMemberIds = org.teams.flatMap((team) =>
      team.profiles.map((p) => p.profile.id),
    );
    const directMemberIds = org.profiles.map((p) => p.profile.id);
    return [...teamMemberIds, ...directMemberIds];
  }, [org]);

  const selectedCount = useMemo(
    () => allMemberIds.filter((id) => selectedUserIds.has(id)).length,
    [allMemberIds, selectedUserIds],
  );

  const allSelected = selectedCount === allMemberIds.length;
  const someSelected = selectedCount > 0 && selectedCount < allMemberIds.length;

  const handleCheckboxChange = () => {
    onToggleGroup(allMemberIds);
  };

  return (
    <div className="mb-4 min-w-0">
      <div className="flex items-center gap-2 w-full px-2 py-2 font-semibold text-sm hover:bg-muted/50 rounded min-w-0">
        <button
          onClick={onToggleOrg}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          {isOrgExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">
            {org.orgName}
            {type === 'organization' && org.orgId === currentId
              ? ' (current)'
              : ''}
          </span>
        </button>
        <span className="text-muted-foreground text-xs shrink-0">
          ({totalCount})
        </span>
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={handleCheckboxChange}
          className="shrink-0"
        />
      </div>

      {isOrgExpanded && (
        <div className="ml-2 min-w-0">
          {org.teams.map((team) => (
            <TeamSection
              key={team.teamId}
              team={team}
              isExpanded={expandedTeams.has(team.teamId)}
              onToggle={() => onToggleTeam(team.teamId)}
              isCurrentTeam={type === 'team' && team.teamId === currentId}
              selectedUserIds={selectedUserIds}
              onToggleUser={onToggleUser}
              onToggleGroup={onToggleGroup}
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
