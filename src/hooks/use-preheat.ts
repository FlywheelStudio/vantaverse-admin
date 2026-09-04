'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  useQueryClient,
  type UseInfiniteQueryOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type { DalError } from '@/lib/dal';

/** TanStack query target for optional hover/focus data prefetch. */
export type PreheatQueryTarget =
  | {
      kind: 'query';
      options: UseQueryOptions<unknown, DalError>;
    }
  | {
      kind: 'infinite';
      options: UseInfiniteQueryOptions<unknown, DalError>;
    };

/** Wrap branded DAL `toQueryOptions` output for preheat call sites. */
export function asPreheatQuery<TData>(
  options: UseQueryOptions<TData, DalError, TData, readonly unknown[]>,
): PreheatQueryTarget {
  return {
    kind: 'query',
    options: options as UseQueryOptions<unknown, DalError>,
  };
}

/** Wrap branded DAL `toInfiniteQueryOptions` output for preheat call sites. */
export function asPreheatInfiniteQuery<TPage, TPageParam>(
  options: UseInfiniteQueryOptions<
    TPage,
    DalError,
    TPage,
    readonly unknown[],
    TPageParam
  >,
): PreheatQueryTarget {
  return {
    kind: 'infinite',
    options: options as UseInfiniteQueryOptions<unknown, DalError>,
  };
}

export interface PreheatHandlers {
  onMouseEnter: () => void;
  onFocus: () => void;
}

export interface UsePreheatResult {
  preheat: (href: string, queries?: readonly PreheatQueryTarget[]) => void;
  getPreheatHandlers: (
    href: string,
    queries?: readonly PreheatQueryTarget[],
  ) => PreheatHandlers;
}

function preheatKeyForQuery(target: PreheatQueryTarget): string {
  return `${target.kind}:${JSON.stringify(target.options.queryKey)}`;
}

/**
 * Client hook: prefetch a Next route and optional TanStack Query data on demand.
 * Dedupes repeated preheat calls for the same route/query key within a mount.
 */
export function usePreheat(): UsePreheatResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  const preheatedRef = useRef(new Set<string>());

  const preheat = useCallback(
    (href: string, queries?: readonly PreheatQueryTarget[]): void => {
      const routeKey = `route:${href}`;
      if (!preheatedRef.current.has(routeKey)) {
        preheatedRef.current.add(routeKey);
        void router.prefetch(href);
      }

      for (const target of queries ?? []) {
        const queryKey = preheatKeyForQuery(target);
        if (preheatedRef.current.has(queryKey)) {
          continue;
        }

        preheatedRef.current.add(queryKey);

        if (target.kind === 'infinite') {
          void queryClient.prefetchInfiniteQuery(target.options);
          continue;
        }

        void queryClient.prefetchQuery(target.options);
      }
    },
    [queryClient, router],
  );

  const getPreheatHandlers = useCallback(
    (
      href: string,
      queries?: readonly PreheatQueryTarget[],
    ): PreheatHandlers => ({
      onMouseEnter: () => {
        preheat(href, queries);
      },
      onFocus: () => {
        preheat(href, queries);
      },
    }),
    [preheat],
  );

  return { preheat, getPreheatHandlers };
}
