'use client';

import { useQuery } from '@tanstack/react-query';
import { getEquipments } from '@/app/(authenticated)/exercises/actions';
import type { Equipment } from '@/lib/supabase/schemas/equipments';

export const equipmentsKeys = {
  all: ['equipments'] as const,
};

/**
 * Fetches the full equipment list (read-only reference data).
 */
export function useEquipments() {
  return useQuery<Equipment[], Error>({
    queryKey: equipmentsKeys.all,
    queryFn: async () => {
      const result = await getEquipments();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
