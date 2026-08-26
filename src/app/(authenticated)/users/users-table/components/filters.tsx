'use client';

import { Icon } from '@/components/medvanta';
import { OrgTeamFilter } from '../org-team-filter';
import { RoleFilter } from '../role-filter';
import { HtmlSearchField } from '../../html-helpers';
import {
  MembersFilterPanel,
  type MembersFilters,
} from './members-filter-panel';

interface UsersTableFiltersProps {
  role: 'patient' | 'admin';
  onRoleSelect: (role: 'patient' | 'admin') => void;
  memberCount?: number;
  adminCount?: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Staged filter state shown inside the panel. */
  staged: MembersFilters;
  onStagedChange: (next: MembersFilters) => void;
  /** Number of applied facets (funnel-button badge). */
  activeCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  physiologistOptions: Array<{ name: string; count: number }>;
  unassignedPhysiologist?: number;
  selectedOrgName?: string;
  selectedTeamName?: string;
  onStagedOrgSelect: (orgId?: string) => void;
  onStagedTeamSelect: (teamId?: string, teamName?: string) => void;
  onClearAll: () => void;
  /** Apply staged filters + close the panel. */
  onApply: () => void;
}

/**
 * Members toolbar: role tabs + search + filter panel trigger.
 * Pills row lives in the parent (`UsersTable`).
 */
export function UsersTableFilters({
  role,
  onRoleSelect,
  memberCount = 0,
  adminCount = 0,
  searchValue,
  onSearchChange,
  staged,
  onStagedChange,
  activeCount,
  open,
  onOpenChange,
  physiologistOptions,
  unassignedPhysiologist,
  selectedOrgName,
  selectedTeamName,
  onStagedOrgSelect,
  onStagedTeamSelect,
  onClearAll,
  onApply,
}: UsersTableFiltersProps): React.ReactElement {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="tbar">
        <RoleFilter
          selectedRole={role}
          onRoleSelect={onRoleSelect}
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
            className={`btn btn-sec btn-sm${open ? ' btn-pri' : ''}`}
            onClick={() => onOpenChange(!open)}
          >
            <Icon name="Funnel" size={15} />
            Filters
            {activeCount > 0 ? <span className="bdg bdg-b">{activeCount}</span> : null}
          </button>
          <MembersFilterPanel
            open={open}
            onClose={() => onOpenChange(false)}
            activeCount={activeCount}
            filters={staged}
            onChange={onStagedChange}
            physiologistOptions={physiologistOptions}
            unassignedPhysiologist={unassignedPhysiologist}
            onClear={onClearAll}
            onApply={onApply}
            groupSlot={
              <OrgTeamFilter
                selectedOrgId={staged.organization_id}
                selectedOrgName={selectedOrgName}
                selectedTeamId={staged.team_id}
                selectedTeamName={selectedTeamName}
                onOrgSelect={onStagedOrgSelect}
                onTeamSelect={onStagedTeamSelect}
                onClear={onClearAll}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
