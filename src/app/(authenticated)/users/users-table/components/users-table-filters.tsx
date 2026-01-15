import { Input } from '@/components/ui/input';
import { OrgTeamFilter } from '../../org-team-filter';
import { RoleFilter } from '../../role-filter';
import { AddUserMenu } from './add-user-menu';
import type { UsersTableFilters } from '../types';

interface UsersTableFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: UsersTableFilters;
  selectedOrgName?: string;
  selectedTeamName?: string;
  onFiltersChange?: (filters: UsersTableFilters) => void;
  onTeamNameChange: (name: string | undefined) => void;
}

export function UsersTableFilters({
  searchValue,
  onSearchChange,
  filters,
  selectedOrgName,
  selectedTeamName,
  onFiltersChange,
  onTeamNameChange,
}: UsersTableFiltersProps) {
  const handleOrgSelect = (orgId?: string) => {
    onTeamNameChange(undefined);
    const newFilters: UsersTableFilters = {
      ...(orgId && { organization_id: orgId }),
      role: filters.role || 'user',
    };
    onFiltersChange?.(newFilters);
  };

  const handleTeamSelect = (teamId?: string, teamName?: string) => {
    onTeamNameChange(teamName);
    const newFilters: UsersTableFilters = {
      ...(filters.organization_id && {
        organization_id: filters.organization_id,
      }),
      ...(teamId && { team_id: teamId }),
      role: filters.role || 'user',
    };
    onFiltersChange?.(newFilters);
  };

  const handleClear = () => {
    onTeamNameChange(undefined);
    const newFilters: UsersTableFilters = {
      role: filters.role || 'user',
    };
    onFiltersChange?.(newFilters);
  };

  const handleRoleSelect = (role: 'admin' | 'user') => {
    onFiltersChange?.({ ...filters, role });
  };

  return (
    <div className="flex flex-row gap-4 w-full">
      <AddUserMenu role={filters.role} />
      <Input
        placeholder="Search users..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="bg-white border-[#2454FF]/20 rounded-xl placeholder:text-[#64748B]/60 focus:border-[#2454FF] focus:ring-[#2454FF] flex-1"
      />
      <OrgTeamFilter
        selectedOrgId={filters.organization_id}
        selectedOrgName={selectedOrgName}
        selectedTeamId={filters.team_id}
        selectedTeamName={selectedTeamName}
        onOrgSelect={handleOrgSelect}
        onTeamSelect={handleTeamSelect}
        onClear={handleClear}
      />
      <RoleFilter
        selectedRole={filters.role || 'user'}
        onRoleSelect={handleRoleSelect}
      />
    </div>
  );
}
