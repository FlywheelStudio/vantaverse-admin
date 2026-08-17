'use client';

import { Tabs } from '@/components/medvanta';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';

interface RoleFilterProps {
  selectedRole: MemberRole;
  onRoleSelect: (role: MemberRole) => void;
}

export function RoleFilter({
  selectedRole = 'patient',
  onRoleSelect,
}: RoleFilterProps): React.ReactElement {
  return (
    <Tabs
      tabs={[
        { id: 'patient', label: 'Members' },
        { id: 'admin', label: 'Admins' },
      ]}
      value={selectedRole}
      onChange={(id) => onRoleSelect(id as MemberRole)}
      className="w-auto shrink-0"
    />
  );
}
