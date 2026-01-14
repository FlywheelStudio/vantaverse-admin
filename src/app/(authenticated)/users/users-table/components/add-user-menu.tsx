'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AddUserModal } from './add-user-modal';

export function AddUserMenu() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white font-semibold px-6 rounded-xl shadow-lg cursor-pointer"
      >
        {isMobile ? <Plus className="h-4 w-4" /> : 'Add User'}
      </Button>
      <AddUserModal open={open} onOpenChange={(next) => setOpen(next)} />
    </>
  );
}
