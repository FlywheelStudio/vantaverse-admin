'use client';

import { useState } from 'react';
import { Icon } from '@/components/medvanta';
import { AddUserModal } from './add-user-modal';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';

interface AddUserMenuProps {
  role: MemberRole;
}

export function AddUserMenu({
  role = 'patient',
}: AddUserMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const label = role === 'admin' ? 'Invite admins' : 'Invite members';

  return (
    <>
      <button type="button" className="btn btn-pri" onClick={() => setOpen(true)}>
        <Icon name="UserRoundPlus" size={17} />
        {label}
      </button>
      <AddUserModal
        open={open}
        onOpenChange={(next) => setOpen(next)}
        role={role}
      />
    </>
  );
}
