'use client';

import { Icon } from '@/components/medvanta';
import { Combobox } from '@/components/ui/combobox';
import {
  DASHBOARD_RANGES,
  type DashboardRangeKey,
} from './ranges';
import type { OrganizationOption } from '@/lib/supabase/queries/organization-search';

interface DashboardAppBarActionsUiProps {
  options: OrganizationOption[];
  selectedId?: string;
  selectedLabel: string;
  onSearchChange: (value: string) => void;
  onGroupSelect: (groupId: string | undefined) => void;
  range: DashboardRangeKey;
  onRangeChange: (range: DashboardRangeKey) => void;
}

/** Group (searchable) + date-range filters for the dashboard app bar. */
export function DashboardAppBarActionsUi({
  options,
  selectedId,
  selectedLabel,
  onSearchChange,
  onGroupSelect,
  range,
  onRangeChange,
}: DashboardAppBarActionsUiProps): React.ReactElement {
  return (
    <>
      <Combobox
        options={[
          ...options.map((o) => ({ value: o.id, label: o.name })),
          ...(options.length || !selectedId
            ? []
            : [{ value: selectedId, label: selectedLabel }]),
        ]}
        value={selectedId}
        onValueChange={onGroupSelect}
        placeholder="All groups"
        searchPlaceholder="Search groups..."
        emptyMessage="No group found."
        filterLocally={false}
        onSearchChange={onSearchChange}
      />
      <span className="sel">
        <select
          value={range}
          onChange={(e) => onRangeChange(e.target.value as DashboardRangeKey)}
          aria-label="Date range"
        >
          {DASHBOARD_RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        <span className="ci">
          <Icon name="ChevronDown" size={16} />
        </span>
      </span>
    </>
  );
}
