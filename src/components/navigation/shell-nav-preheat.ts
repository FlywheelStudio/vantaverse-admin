import { toQueryOptions } from '@/lib/dal';
import { listExercises } from '@/lib/supabase/queries/exercises';
import { listOrganizations } from '@/lib/supabase/queries/organizations';
import { getMemberFilterCountsQuery } from '@/lib/supabase/queries/profiles';

import {
  asPreheatQuery,
  type PreheatQueryTarget,
} from '@/hooks/use-preheat';
import type { ShellNavId } from '@/components/medvanta/shell/nav';

/**
 * Branded DAL query options to prefetch for a shell nav destination.
 * User/auth/unread-message surfaces stay dynamic — no prefetch for messages.
 */
export function getShellNavPreheatQueries(
  id: ShellNavId,
): readonly PreheatQueryTarget[] {
  switch (id) {
    case 'members':
      return [asPreheatQuery(toQueryOptions(getMemberFilterCountsQuery))];
    case 'groups':
      return [asPreheatQuery(toQueryOptions(listOrganizations))];
    case 'exercises':
      return [asPreheatQuery(toQueryOptions(listExercises))];
    default:
      return [];
  }
}
