'use client';

import { useQuery } from '@tanstack/react-query';
import { getProgramTemplateById } from '@/app/(authenticated)/builder/actions';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';

export function useProgramTemplate(id: string | null) {
  return useQuery<ProgramTemplate | null, Error>({
    queryKey: ['program-template', id],
    queryFn: async () => {
      if (!id) return null;

      const result = await getProgramTemplateById(id);

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
