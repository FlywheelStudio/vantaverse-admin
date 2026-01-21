'use client';

import { UseFormReset } from 'react-hook-form';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';
import {
  useCreateProgramTemplate,
  useUpdateProgramTemplate,
} from '@/hooks/use-program-template-mutations';
import type { ProgramTemplateFormData } from '@/app/(authenticated)/builder/program/schemas';

interface UseProgramFormSubmitProps {
  initialData?: ProgramTemplate | null;
  imagePreview: string | null;
  reset: UseFormReset<ProgramTemplateFormData>;
  setImagePreview: (preview: string | null) => void;
  onSuccess?: () => void;
}

export function useProgramFormSubmit({
  initialData,
  imagePreview,
  reset,
  setImagePreview,
  onSuccess,
}: UseProgramFormSubmitProps) {
  const createMutation = useCreateProgramTemplate({ onSuccess });
  const updateMutation = useUpdateProgramTemplate({ onSuccess });

  const onSubmit = async (data: ProgramTemplateFormData) => {
    if (initialData) {
      // Update existing template
      const oldImageUrl =
        typeof initialData.image_url === 'string'
          ? initialData.image_url
          : typeof initialData.image_url === 'object' &&
              initialData.image_url !== null &&
              'url' in initialData.image_url
            ? String(initialData.image_url.url)
            : null;

      updateMutation.mutate({
        templateId: initialData.id,
        name: data.name,
        weeks: data.weeks,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description || null,
        goals: data.goals || null,
        notes: data.notes || null,
        imageFile: data.imageFile || null,
        imagePreview: imagePreview || null,
        oldImageUrl: oldImageUrl,
        organizationId: initialData.organization_id || null,
      });
    } else {
      // Create new template
      createMutation.mutate({
        name: data.name,
        weeks: data.weeks,
        startDate: data.startDate,
        description: data.description || null,
        goals: data.goals || null,
        notes: data.notes || null,
        imageFile: data.imageFile || null,
        imagePreview: imagePreview || null,
      });

      // Reset form after successful creation
      reset({
        name: '',
        description: '',
        weeks: 4,
        goals: '',
        notes: '',
        startDate: undefined as unknown as Date,
        endDate: undefined as unknown as Date,
        imageFile: undefined,
      });
      setImagePreview(null);
    }
  };

  return {
    onSubmit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
}
