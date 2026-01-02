import { ChevronDown, ChevronRight } from 'lucide-react';
import type { GroupedProfile } from '../types';
import { ProfileItem } from './profile-item';

interface ThisOrgSectionProps {
  members: GroupedProfile[];
  isExpanded: boolean;
  onToggle: () => void;
  type: 'organization' | 'team';
  organizationId?: string;
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
}

export function ThisOrgSection({
  members,
  isExpanded,
  onToggle,
  type,
  organizationId,
  selectedUserIds,
  onToggleUser,
}: ThisOrgSectionProps) {
  if (members.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-2 py-2 font-semibold text-sm hover:bg-muted/50 rounded"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>
          This organization&apos;s members
          {type === 'team' && organizationId ? ' (current)' : ''}
        </span>
        <span className="ml-auto text-muted-foreground text-xs">
          ({members.length})
        </span>
      </button>
      {isExpanded && (
        <div className="ml-6">
          {members.map((groupedProfile) => (
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
