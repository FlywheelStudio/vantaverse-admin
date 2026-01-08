'use client';

import { useQuery } from '@tanstack/react-query';
import { getProgramTemplates } from '@/app/(authenticated)/builder/actions';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';

export function useProgramTemplates() {
  return useQuery<ProgramTemplate[], Error>({
    queryKey: ['program-templates'],
    queryFn: async () => {
      const result = await getProgramTemplates();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
