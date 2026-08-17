'use client';

import { Button } from '@/components/medvanta';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AddUserModal } from './add-user-modal';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';

interface AddUserMenuProps {
  role: MemberRole;
}

export function AddUserMenu({ role = 'patient' }: AddUserMenuProps): React.ReactElement {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="md"
        iconLeft={isMobile ? 'Plus' : undefined}
      >
        {isMobile ? null : role === 'admin' ? 'Add Admin' : 'Add Member'}
      </Button>
      <AddUserModal
        open={open}
        onOpenChange={(next) => setOpen(next)}
        role={role}
      />
    </>
  );
}
