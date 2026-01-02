'use client';

import { useQuery } from '@tanstack/react-query';
import { getExercises } from '@/app/(authenticated)/exercises/actions';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

export function useExercises() {
  return useQuery<Exercise[], Error>({
    queryKey: ['exercises'],
    queryFn: async () => {
      const result = await getExercises();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
