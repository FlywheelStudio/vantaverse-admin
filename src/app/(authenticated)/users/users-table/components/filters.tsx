import { Input, Tag } from '@/components/medvanta';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { OrgTeamFilter } from '../org-team-filter';
import { RoleFilter } from '../role-filter';
import { AddUserMenu } from './add-user-menu';
import type { UsersTableFilters } from '../types';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';

type DueFilter = 'all' | 'due' | 'overdue';

interface UsersTableFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: UsersTableFilters;
  selectedOrgName?: string;
  selectedTeamName?: string;
  onFiltersChange?: (filters: UsersTableFilters) => void;
  onTeamNameChange: (name: string | undefined) => void;
  data?: ProfileWithStats[];
  dueFilter?: DueFilter;
  onDueFilterChange?: (filter: DueFilter) => void;
}

export function UsersTableFilters({
  searchValue,
  onSearchChange,
  filters,
  selectedOrgName,
  selectedTeamName,
  onFiltersChange,
  onTeamNameChange,
  data = [],
  dueFilter = 'all',
  onDueFilterChange,
}: UsersTableFiltersProps) {
  const hasDueDates = data.some((profile) => profile.program_due_date);
  const handleOrgSelect = (orgId?: string) => {
    onTeamNameChange(undefined);
    const newFilters: UsersTableFilters = {
      ...(orgId && { organization_id: orgId }),
      role: filters.role || 'patient',
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
      role: filters.role || 'patient',
    };
    onFiltersChange?.(newFilters);
  };

  const handleClear = () => {
    onTeamNameChange(undefined);
    const newFilters: UsersTableFilters = {
      role: filters.role || 'patient',
    };
    onFiltersChange?.(newFilters);
  };

  const handleRoleSelect = (role: MemberRole) => {
    onFiltersChange?.({ ...filters, role });
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-row flex-wrap gap-4">
        <AddUserMenu role={filters.role} />
        <Input
          placeholder="Search users..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          iconLeft="Search"
          className="min-w-[200px] flex-1"
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
          selectedRole={filters.role || 'patient'}
          onRoleSelect={handleRoleSelect}
        />
      </div>
      {hasDueDates && onDueFilterChange ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[length:var(--text-xs)] font-[var(--fw-semibold)] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
            Program due
          </span>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0"
            onClick={() => onDueFilterChange('all')}
          >
            <Tag tone={dueFilter === 'all' ? 'accent' : 'neutral'}>All</Tag>
          </button>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0"
            onClick={() => onDueFilterChange('due')}
          >
            <Tag tone={dueFilter === 'due' ? 'accent' : 'neutral'}>Due</Tag>
          </button>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0"
            onClick={() => onDueFilterChange('overdue')}
          >
            <Tag tone={dueFilter === 'overdue' ? 'accent' : 'neutral'}>
              Overdue
            </Tag>
          </button>
        </div>
      ) : null}
    </div>
  );
}
