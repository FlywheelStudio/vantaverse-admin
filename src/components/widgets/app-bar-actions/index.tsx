'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { toPaginatedQueryOptions } from '@/lib/dal';
import { searchOrganizations } from '@/lib/supabase/queries/organization-search';
import type { DashboardRangeKey } from './ranges';
import { DashboardAppBarActionsUi } from './ui';

const ORG_SEARCH_LIMIT = 20;

export function DashboardAppBarActions({
  groupId,
  range,
}: {
  groupId?: string;
  range: DashboardRangeKey;
}): React.ReactElement {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: options = [] } = useQuery(
    toPaginatedQueryOptions(
      searchOrganizations,
      debouncedSearch,
      ORG_SEARCH_LIMIT,
    ),
  );

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
