'use client';

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RoleFilterProps {
  selectedRole?: 'admin' | 'user';
  onRoleSelect: (role?: 'admin' | 'user') => void;
}

export function RoleFilter({ selectedRole, onRoleSelect }: RoleFilterProps) {
  const displayText =
    selectedRole === 'admin'
      ? 'Admin'
      : selectedRole === 'user'
        ? 'Users'
        : 'All Roles';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-white border-[#2454FF]/20 rounded-xl text-[#1E3A5F] hover:bg-[#F5F7FA] min-w-[150px] justify-between"
        >
          {displayText}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[150px]">
        <DropdownMenuItem
          onClick={() => onRoleSelect(undefined)}
          data-selected={!selectedRole}
          className="cursor-pointer data-[selected=true]:bg-[#2454FF]/10! data-[selected=true]:focus:bg-[#2454FF]/10!"
        >
          All Roles
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRoleSelect('admin')}
          data-selected={selectedRole === 'admin'}
          className="cursor-pointer data-[selected=true]:bg-[#2454FF]/10! data-[selected=true]:focus:bg-[#2454FF]/10!"
        >
          Admin
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRoleSelect('user')}
          data-selected={selectedRole === 'user'}
          className="cursor-pointer data-[selected=true]:bg-[#2454FF]/10! data-[selected=true]:focus:bg-[#2454FF]/10!"
        >
          Users
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
