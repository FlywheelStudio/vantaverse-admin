'use client';

import { Button } from '@/components/ui/button';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';
import { cn } from '@/lib/utils';

interface RoleFilterProps {
  selectedRole: MemberRole;
  onRoleSelect: (role: MemberRole) => void;
}

export function RoleFilter({
  selectedRole = 'patient',
  onRoleSelect,
}: RoleFilterProps) {
  return (
    <div className="flex items-center gap-2 bg-muted border border-border rounded-[var(--radius-pill)] p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRoleSelect('patient')}
        className={cn(
          'cursor-pointer flex-1 rounded-[var(--radius-pill)] transition-colors',
          selectedRole === 'patient'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'text-foreground hover:bg-background',
        )}
      >
        Members
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRoleSelect('admin')}
        className={cn(
          'cursor-pointer flex-1 rounded-[var(--radius-pill)] transition-colors',
          selectedRole === 'admin'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'text-foreground hover:bg-background',
        )}
      >
        Admins
      </Button>
    </div>
  );
}
