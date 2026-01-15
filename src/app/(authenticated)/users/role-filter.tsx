'use client';

import { Button } from '@/components/ui/button';

interface RoleFilterProps {
  selectedRole?: 'admin' | 'user';
  onRoleSelect: (role: 'admin' | 'user') => void;
}

export function RoleFilter({
  selectedRole = 'user',
  onRoleSelect,
}: RoleFilterProps) {
  return (
    <div className="flex items-center gap-2 bg-white border border-[#2454FF]/20 rounded-xl p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRoleSelect('user')}
        className={`cursor-pointer flex-1 rounded-lg transition-colors ${
          selectedRole === 'user'
            ? 'bg-[#2454FF] text-white hover:bg-[#1E3FCC]'
            : 'text-[#1E3A5F] hover:bg-[#F5F7FA]'
        }`}
      >
        Members
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRoleSelect('admin')}
        className={`cursor-pointer flex-1 rounded-lg transition-colors ${
          selectedRole === 'admin'
            ? 'bg-[#2454FF] text-white hover:bg-[#1E3FCC]'
            : 'text-[#1E3A5F] hover:bg-[#F5F7FA]'
        }`}
      >
        Physicians
      </Button>
    </div>
  );
}
