'use client';

import { useState } from 'react';
import { Icon } from '@/components/medvanta';
import { RoleFilter } from './role-filter';
import { OrgTeamFilter } from './org-team-filter';
import { HtmlSearchField } from '../../html-helpers';
import { MembersFilterPanel } from './members-filter-panel';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilter: MemberRole | null;
  onRoleFilterChange: (role: MemberRole | null) => void;
  selectedOrgId: string | null;
  selectedTeamId: string | null;
  onOrgChange: (orgId: string | null) => void;
  onTeamChange: (teamId: string | null) => void;
  dueFilter?: 'all' | 'overdue' | 'due_soon';
  onDueFilterChange?: (value: 'all' | 'overdue' | 'due_soon') => void;
}

/**
 * Members toolbar + HTML `filterPanel` chrome (`filtersBtn` + FILTERS.members).
 */
export function Filters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  selectedOrgId,
  selectedTeamId,
  onOrgChange,
  onTeamChange,
  dueFilter = 'all',
  onDueFilterChange,
}: FiltersProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  const activeCount =
    (roleFilter ? 1 : 0) +
    (selectedOrgId || selectedTeamId ? 1 : 0) +
    (dueFilter !== 'all' ? 1 : 0);

  const clearAll = (): void => {
    onRoleFilterChange(null);
    onOrgChange(null);
    onTeamChange(null);
    onDueFilterChange?.('all');
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div className="tbar">
        <RoleFilter value={roleFilter} onChange={onRoleFilterChange} />
        <HtmlSearchField
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search by name or email"
          style={{ width: 280 }}
        />
        <span className="sp" />
        <button
          type="button"
          className={`btn btn-sec btn-sm${open ? ' btn-pri' : ''}`}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name="Funnel" size={15} />
          Filters
          {activeCount > 0 ? <span className="bdg bdg-b">{activeCount}</span> : null}
        </button>
      </div>

      <MembersFilterPanel
        open={open}
        onClose={() => setOpen(false)}
        activeCount={activeCount}
        role={roleFilter}
        onRoleChange={onRoleFilterChange}
        dueFilter={dueFilter}
        onDueFilterChange={(v) => onDueFilterChange?.(v)}
        onClear={clearAll}
        onApply={() => setOpen(false)}
        groupSlot={
          <OrgTeamFilter
            selectedOrgId={selectedOrgId}
            selectedTeamId={selectedTeamId}
            onOrgChange={onOrgChange}
            onTeamChange={onTeamChange}
          />
        }
      />
    </div>
  );
}
