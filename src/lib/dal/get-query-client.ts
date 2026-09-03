import {
  QueryClient,
  defaultShouldDehydrateQuery,
} from '@tanstack/react-query';

/**
 * App runtime helper: create/cache a TanStack `QueryClient` for Next SSR vs
 * browser (singleton on the client; fresh per request on the server).
 *
 * - Do **not** move this into `lib/dal/core`. Core owns defs, Result, and
 *   adapters that *accept* a `QueryClient` (e.g. `toMutationOptions`).
 * - Do **not** re-export from `@/lib/dal/core`. Import from
 *   `@/lib/dal/get-query-client` (or this path) in Providers / RSC prefetch.
 * - This encodes Next/React Query app shell concerns (`staleTime`, dehydrate,
 *   server vs browser). That is intentional stack packaging.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, avoid refetching immediately on the client
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}
