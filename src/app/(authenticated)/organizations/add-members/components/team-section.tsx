import { ChevronDown, ChevronRight } from 'lucide-react';
import type { GroupedProfile } from '../types';
import { ProfileItem } from './profile-item';

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
}

export function TeamSection({
  team,
  isExpanded,
  onToggle,
  isCurrentTeam,
  selectedUserIds,
  onToggleUser,
}: TeamSectionProps) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-muted/50 rounded"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="font-medium">
          {team.teamName}
          {isCurrentTeam ? ' (current)' : ''}
        </span>
        <span className="ml-auto text-muted-foreground text-xs">
          ({team.profiles.length})
        </span>
      </button>
      {isExpanded && (
        <div className="ml-6">
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
