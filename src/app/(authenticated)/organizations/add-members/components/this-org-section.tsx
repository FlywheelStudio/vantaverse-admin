import { ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { GroupedProfile } from '../types';
import { ProfileItem } from './profile-item';
import { useMemo } from 'react';

interface ThisOrgSectionProps {
  members: GroupedProfile[];
  isExpanded: boolean;
  onToggle: () => void;
  type: 'organization' | 'team';
  organizationId?: string;
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
  onToggleGroup: (userIds: string[]) => void;
}

export function ThisOrgSection({
  members,
  isExpanded,
  onToggle,
  type,
  organizationId,
  selectedUserIds,
  onToggleUser,
  onToggleGroup,
}: ThisOrgSectionProps) {
  const memberIds = useMemo(() => members.map((m) => m.profile.id), [members]);

  const selectedCount = useMemo(
    () => memberIds.filter((id) => selectedUserIds.has(id)).length,
    [memberIds, selectedUserIds],
  );

  const allSelected = selectedCount === members.length;
  const someSelected = selectedCount > 0 && selectedCount < members.length;

  const handleCheckboxChange = () => {
    onToggleGroup(memberIds);
  };

  if (members.length === 0) return null;

  return (
    <div className="mb-4 min-w-0">
      <div className="flex items-center gap-2 w-full px-2 py-2 font-semibold text-sm hover:bg-muted/50 rounded min-w-0">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">
            This organization&apos;s members
            {type === 'team' && organizationId ? ' (current)' : ''}
          </span>
        </button>
        <span className="text-muted-foreground text-xs shrink-0">
          ({members.length})
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
