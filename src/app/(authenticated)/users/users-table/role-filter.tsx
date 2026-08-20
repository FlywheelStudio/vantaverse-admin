'use client';

import { MemberRole } from '@/lib/supabase/schemas/organization-members';

interface RoleFilterProps {
  selectedRole: MemberRole;
  onRoleSelect: (role: MemberRole) => void;
  memberCount?: number;
  adminCount?: number;
}

export function RoleFilter({
  selectedRole = 'patient',
  onRoleSelect,
  memberCount,
  adminCount,
}: RoleFilterProps): React.ReactElement {
  return (
    <span className="seg">
      <button
        type="button"
        className={selectedRole === 'patient' ? 'on' : undefined}
        onClick={() => onRoleSelect('patient')}
      >
        Members
        {memberCount != null ? (
          <span className="bdg bdg-b" style={{ padding: '0 6px', fontSize: 10 }}>
            {memberCount}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        className={selectedRole === 'admin' ? 'on' : undefined}
        onClick={() => onRoleSelect('admin')}
      >
        Admins
        {adminCount != null ? (
          <span className="bdg" style={{ padding: '0 6px', fontSize: 10 }}>
            {adminCount}
          </span>
        ) : null}
      </button>
    </span>
  );
}
