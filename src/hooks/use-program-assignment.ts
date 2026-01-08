'use client';

import { useQuery } from '@tanstack/react-query';
import { getProgramAssignmentById } from '@/app/(authenticated)/builder/actions';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

export function useProgramAssignment(id: string | null) {
  return useQuery<ProgramAssignmentWithTemplate | null, Error>({
    queryKey: ['program-assignment', id],
    queryFn: async () => {
      if (!id) return null;

      const result = await getProgramAssignmentById(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
