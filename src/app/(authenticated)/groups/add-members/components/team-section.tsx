import { ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { GroupedProfile } from '../types';
import { ProfileItem } from './profile-item';
import { useMemo } from 'react';

interface TeamSectionProps {
  team: {
    teamId: string;
    teamName: string;
    profiles: GroupedProfile[];
  };
  isExpanded: boolean;
  onToggle: () => void;
  isCurrentTeam: boolean;
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
  onToggleGroup: (userIds: string[]) => void;
}

export function TeamSection({
  team,
  isExpanded,
  onToggle,
  isCurrentTeam,
  selectedUserIds,
  onToggleUser,
  onToggleGroup,
}: TeamSectionProps) {
  const memberIds = useMemo(
    () => team.profiles.map((p) => p.profile.id),
    [team.profiles],
  );

  const selectedCount = useMemo(
    () => memberIds.filter((id) => selectedUserIds.has(id)).length,
    [memberIds, selectedUserIds],
  );

  const allSelected = selectedCount === team.profiles.length;
  const someSelected =
    selectedCount > 0 && selectedCount < team.profiles.length;

  const handleCheckboxChange = () => {
    onToggleGroup(memberIds);
  };

  return (
    <div className="mb-2 min-w-0">
      <div className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-muted/50 rounded min-w-0">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium truncate">
            {team.teamName}
            {isCurrentTeam ? ' (current)' : ''}
          </span>
        </button>
        <span className="text-muted-foreground text-xs shrink-0">
          ({team.profiles.length})
        </span>
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={handleCheckboxChange}
          className="shrink-0"
        />
      </div>
      {isExpanded && (
        <div className="ml-2 min-w-0">
          {team.profiles.map((groupedProfile) => (
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
