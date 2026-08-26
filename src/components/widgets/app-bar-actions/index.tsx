'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import {
  searchOrganizations,
  type OrganizationOption,
} from '@/lib/supabase/queries/organization-search';
import type { DashboardRangeKey } from './ranges';
import { DashboardAppBarActionsUi } from './ui';

export function DashboardAppBarActions({
  groupId,
  range,
}: {
  groupId?: string;
  range: DashboardRangeKey;
}): React.ReactElement {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [options, setOptions] = useState<OrganizationOption[]>([]);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    let cancelled = false;
    void searchOrganizations(debouncedSearch).then((orgs) => {
      if (!cancelled) setOptions(orgs);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const navigate = useCallback(
    (nextGroupId: string | undefined, nextRange: DashboardRangeKey) => {
      const params = new URLSearchParams();
      if (nextGroupId) params.set('group', nextGroupId);
      if (nextRange !== '30d') params.set('range', nextRange);
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : '/', { scroll: false });
    },
    [router],
  );

  const selectedLabel = useMemo(
    () => options.find((o) => o.id === groupId)?.name ?? 'All groups',
    [options, groupId],
  );

  return (
    <DashboardAppBarActionsUi
      options={options}
      selectedId={groupId}
      selectedLabel={selectedLabel}
      onSearchChange={setSearchInput}
      onGroupSelect={(id) => navigate(id, range)}
      range={range}
      onRangeChange={(r) => navigate(groupId, r)}
    />
  );
}
