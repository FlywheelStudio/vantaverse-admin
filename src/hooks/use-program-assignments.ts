'use client';

import { useQuery } from '@tanstack/react-query';
import { getProgramAssignments } from '@/app/(authenticated)/builder/actions';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

export function useProgramAssignments() {
  return useQuery<ProgramAssignmentWithTemplate[], Error>({
    queryKey: ['program-assignments'],
    queryFn: async () => {
      const result = await getProgramAssignments();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
