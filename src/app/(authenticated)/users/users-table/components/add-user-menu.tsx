'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AddUserModal } from './add-user-modal';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';

interface AddUserMenuProps {
  role: MemberRole;
}

export function AddUserMenu({ role = 'patient' }: AddUserMenuProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="rounded-[var(--radius-pill)] shadow-[var(--shadow-md)] cursor-pointer"
      >
        {isMobile ? (
          <Plus className="h-4 w-4" />
        ) : role === 'admin' ? (
          'Add Admin'
        ) : (
          'Add Member'
        )}
      </Button>
      <AddUserModal
        open={open}
        onOpenChange={(next) => setOpen(next)}
        role={role}
      />
    </>
  );
}
