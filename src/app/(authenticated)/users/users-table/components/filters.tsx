'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/medvanta';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { OrgTeamFilter } from '../org-team-filter';
import { RoleFilter } from '../role-filter';
import { HtmlSearchField } from '../../html-helpers';
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
}: UsersTableFiltersProps): React.ReactElement {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasDueDates = data.some((profile) => profile.program_due_date);

  const memberCount = useMemo(
    () => data.filter((profile) => profile.role !== 'admin').length,
    [data],
  );
  const adminCount = useMemo(
    () => data.filter((profile) => profile.role === 'admin').length,
    [data],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.organization_id) count += 1;
    if (filters.team_id) count += 1;
    if (dueFilter !== 'all') count += 1;
    return count;
  }, [filters.organization_id, filters.team_id, dueFilter]);

  const handleOrgSelect = (orgId?: string): void => {
    onTeamNameChange(undefined);
    const newFilters: UsersTableFilters = {
      ...(orgId && { organization_id: orgId }),
      role: filters.role || 'patient',
    };
    onFiltersChange?.(newFilters);
  };

  const handleTeamSelect = (teamId?: string, teamName?: string): void => {
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

  const handleClear = (): void => {
    onTeamNameChange(undefined);
    onDueFilterChange?.('all');
    onFiltersChange?.({ role: filters.role || 'patient' });
  };

  const handleRoleSelect = (role: MemberRole): void => {
    onFiltersChange?.({ ...filters, role });
  };

  return (
    <>
      <div className="tbar">
        <RoleFilter
          selectedRole={filters.role || 'patient'}
          onRoleSelect={handleRoleSelect}
          memberCount={memberCount}
          adminCount={adminCount}
        />
        <HtmlSearchField
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Search by name or email…"
        />
        <button
          type="button"
          className="btn btn-sec"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <Icon name="Funnel" size={16} />
          Filters
          {activeFilterCount > 0 ? (
            <span className="bdg bdg-b" style={{ padding: '0 6px', fontSize: 10 }}>
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {filtersOpen ? (
        <div
          className="card"
          style={{ marginBottom: 16, padding: 16 }}
        >
          <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
            <OrgTeamFilter
              selectedOrgId={filters.organization_id}
              selectedOrgName={selectedOrgName}
              selectedTeamId={filters.team_id}
              selectedTeamName={selectedTeamName}
              onOrgSelect={handleOrgSelect}
              onTeamSelect={handleTeamSelect}
              onClear={handleClear}
            />
            {hasDueDates && onDueFilterChange ? (
              <span className="seg seg-lg">
                {(['all', 'due', 'overdue'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={dueFilter === value ? 'on' : undefined}
                    onClick={() => onDueFilterChange(value)}
                  >
                    {value === 'all' ? 'All due' : value.charAt(0).toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </span>
            ) : null}
            <button type="button" className="btn btn-ghost btn-sm sp" onClick={handleClear}>
              Clear filters
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
