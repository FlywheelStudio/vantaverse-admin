import { Checkbox } from '@/components/ui/checkbox';
import { Avatar } from '@/components/ui/avatar';
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
          firstName={profile.first_name || ''}
          lastName={profile.last_name || ''}
          userId={profile.id}
          size={32}
        />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="font-medium text-sm text-foreground truncate">
          {profile.first_name} {profile.last_name}
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
