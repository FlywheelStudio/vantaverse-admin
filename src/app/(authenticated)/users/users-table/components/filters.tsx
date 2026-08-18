'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/medvanta';
import { OrgTeamFilter } from '../org-team-filter';
import { RoleFilter } from '../role-filter';
import { HtmlSearchField } from '../../html-helpers';
import { MembersFilterPanel } from './members-filter-panel';
import type { UsersTableFilters } from '../types';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';

type DueFilter = 'all' | 'due' | 'overdue';
type PanelDueFilter = 'all' | 'overdue' | 'due_soon';

interface UsersTableFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: UsersTableFilters;
  selectedOrgName?: string;
  selectedTeamName?: string;
  onFiltersChange?: (filters: UsersTableFilters) => void;
  onTeamNameChange: (name: string | undefined) => void;
  memberCount?: number;
  adminCount?: number;
  dueFilter?: DueFilter;
  onDueFilterChange?: (filter: DueFilter) => void;
}

function toPanelDue(due: DueFilter): PanelDueFilter {
  return due === 'due' ? 'due_soon' : due;
}

function fromPanelDue(due: PanelDueFilter): DueFilter {
  return due === 'due_soon' ? 'due' : due;
}

/**
 * Members toolbar + HTML `filterPanel` chrome (`filtersBtn` + FILTERS.members).
 */
export function UsersTableFilters({
  searchValue,
  onSearchChange,
  filters,
  selectedOrgName,
  selectedTeamName,
  onFiltersChange,
  onTeamNameChange,
  memberCount = 0,
  adminCount = 0,
  dueFilter = 'all',
  onDueFilterChange,
}: UsersTableFiltersProps): React.ReactElement {
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const handlePanelRoleChange = (role: MemberRole | null): void => {
    if (!role) return;
    handleRoleSelect(role);
  };

  return (
    <div style={{ marginBottom: 14 }}>
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
        <span className="sp" />
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <button
            type="button"
            className={`btn btn-sec btn-sm${filtersOpen ? ' btn-pri' : ''}`}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <Icon name="Funnel" size={15} />
            Filters
            {activeFilterCount > 0 ? (
              <span className="bdg bdg-b">{activeFilterCount}</span>
            ) : null}
          </button>
          <MembersFilterPanel
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            activeCount={activeFilterCount}
            role={filters.role || 'patient'}
            onRoleChange={handlePanelRoleChange}
            memberCount={memberCount}
            adminCount={adminCount}
            dueFilter={toPanelDue(dueFilter)}
            onDueFilterChange={(value) =>
              onDueFilterChange?.(fromPanelDue(value))
            }
            onClear={handleClear}
            onApply={() => setFiltersOpen(false)}
            groupSlot={
              <OrgTeamFilter
                selectedOrgId={filters.organization_id}
                selectedOrgName={selectedOrgName}
                selectedTeamId={filters.team_id}
                selectedTeamName={selectedTeamName}
                onOrgSelect={handleOrgSelect}
                onTeamSelect={handleTeamSelect}
                onClear={handleClear}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
