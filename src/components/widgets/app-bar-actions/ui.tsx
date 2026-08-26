'use client';

import { Combobox } from '@/components/ui/combobox';
import {
  DASHBOARD_RANGES,
  type DashboardRangeKey,
} from './ranges';
import type { OrganizationOption } from '@/lib/supabase/queries/organization-search';

/** Sentinel Combobox value for the unscoped "All groups" filter. */
const ALL_GROUPS_VALUE = '__all__';

const RANGE_OPTIONS = DASHBOARD_RANGES.map((r) => ({
  value: r.key,
  label: r.label,
}));

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
  const handleGroupChange = (value: string | undefined): void => {
    if (!value || value === ALL_GROUPS_VALUE) {
      onGroupSelect(undefined);
      return;
    }
    onGroupSelect(value);
  };

  const handleRangeChange = (value: string | undefined): void => {
    if (!value) return;
    onRangeChange(value as DashboardRangeKey);
  };

  return (
    <>
      <Combobox
        className="w-[200px]"
        options={[
          { value: ALL_GROUPS_VALUE, label: 'All groups' },
          ...options.map((o) => ({ value: o.id, label: o.name })),
          ...(options.length || !selectedId
            ? []
            : [{ value: selectedId, label: selectedLabel }]),
        ]}
        value={selectedId ?? ALL_GROUPS_VALUE}
        onValueChange={handleGroupChange}
        placeholder="All groups"
        searchPlaceholder="Search groups..."
        emptyMessage="No group found."
        filterLocally={false}
        onSearchChange={onSearchChange}
      />
      <Combobox
        className="w-[160px] shrink-0"
        options={RANGE_OPTIONS}
        value={range}
        onValueChange={handleRangeChange}
        placeholder="Date range"
        searchPlaceholder="Search ranges..."
        emptyMessage="No range found."
      />
    </>
  );
}
