import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, getInitials } from '@/components/ui/avatar';
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

  // Calculate avatar ID for consistent color generation
  const avatarId = profile.email || profile.id || profile.username || undefined;

  // Build display name with proper formatting
  const fullName =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null;

  let displayName = '';
  if (fullName && profile.username) {
    displayName = `${fullName}`;
  } else if (fullName) {
    displayName = fullName;
  } else if (profile.username) {
    displayName = profile.username;
  }

  const avatarAlt = displayName || profile.email || 'Unknown';
  const initials = getInitials(
    profile.first_name,
    profile.last_name,
    profile.username,
    displayName || avatarAlt,
  );

  return (
    <div
      className="flex items-center gap-2 px-2 py-2 hover:bg-muted/50 cursor-pointer min-w-0"
      onClick={onToggle}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      />
      <div className="size-8 shrink-0 flex items-center justify-center">
        <Avatar
          src={profile.avatar_url || null}
          alt={avatarAlt}
          id={avatarId}
          size={32}
          initials={initials}
        />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="font-medium text-sm text-foreground truncate">
          {displayName || 'Unknown'}
        </div>
        {profile.email && (
          <div className="text-xs text-muted-foreground truncate">
            {profile.email}
          </div>
        )}
      </div>
    </div>
  );
}
