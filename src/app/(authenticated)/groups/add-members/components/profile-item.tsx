import { Checkbox } from '@/components/ui/checkbox';
import { Avatar } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { GroupedProfile } from '../types';

interface ProfileItemProps {
  groupedProfile: GroupedProfile;
  isSelected: boolean;
  onToggle: () => void;
}

export function ProfileItem({
  groupedProfile,
  isSelected,
  onToggle,
}: ProfileItemProps) {
  const { profile } = groupedProfile;
  const orgMemberships = profile.orgMemberships || [];

  const renderOrgDisplay = () => {
    if (orgMemberships.length === 0) {
      return null;
    }

    if (orgMemberships.length === 1) {
      return (
        <div className="text-[0.75rem] text-muted-foreground truncate">
          {orgMemberships[0].orgName}
        </div>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center">
            <span className="text-[0.75rem] text-muted-foreground bg-muted px-2 py-0.5 rounded-[var(--radius-pill)]">
              +{orgMemberships.length}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            {orgMemberships.map((org) => (
              <div key={org.orgId} className="text-[0.875rem] text-foreground">
                {org.orgName}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] hover:bg-muted/50 cursor-pointer min-w-0 transition-colors"
      onClick={onToggle}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 rounded-[var(--radius-xs)]"
      />
      <div className="size-9 shrink-0 flex items-center justify-center rounded-[var(--radius-md)] overflow-hidden">
        <Avatar
          src={profile.avatar_url || null}
          firstName={profile.first_name || ''}
          lastName={profile.last_name || ''}
          userId={profile.id}
          size={36}
        />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[0.875rem] font-medium text-foreground truncate">
            {profile.first_name} {profile.last_name}
          </div>
          {profile.email && (
            <div className="text-[0.75rem] text-muted-foreground truncate">
              {profile.email}
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center">{renderOrgDisplay()}</div>
      </div>
    </div>
  );
}
