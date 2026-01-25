'use client';

import { useEffect, useRef, useState, useMemo, RefObject } from 'react';
import { UseFormReset, UseFormGetValues } from 'react-hook-form';
import { useProgramAssignments } from '@/hooks/use-passignments';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';
import type { ProgramTemplateFormData } from '@/app/(authenticated)/builder/program/schemas';

interface UseProgramFormInitProps {
  initialData?: ProgramTemplate | null;
  reset: UseFormReset<ProgramTemplateFormData>;
  getValues: UseFormGetValues<ProgramTemplateFormData>;
  loadedDatesForTemplateIdRef: RefObject<string | null>;
}

export function useProgramFormInit({
  initialData,
  reset,
  getValues,
  loadedDatesForTemplateIdRef,
}: UseProgramFormInitProps) {
  const { assignments } = useProgramAssignments();
  const assignmentsRef = useRef(assignments);

  // Derive initial preview from initialData
  const derivedPreview = useMemo(() => {
    if (!initialData?.image_url) return null;
    if (typeof initialData.image_url === 'string') {
      return initialData.image_url;
    }
    // Database constraint requires: { image_url: string, blur_hash: string }
    if (
      typeof initialData.image_url === 'object' &&
      initialData.image_url !== null &&
      'image_url' in initialData.image_url
    ) {
      return String(initialData.image_url.image_url);
    }
    return null;
  }, [initialData?.image_url]);

  // State for user-uploaded preview with template ID tracking
  const [manualPreview, setManualPreview] = useState<{
    preview: string;
    templateId: string | null;
  } | null>(null);

  // Only use manual preview if it belongs to the current template
  const imagePreview = useMemo(() => {
    if (
      manualPreview &&
      manualPreview.templateId === (initialData?.id ?? null)
    ) {
      return manualPreview.preview;
    }
    return derivedPreview;
  }, [manualPreview, initialData?.id, derivedPreview]);

  // Keep ref in sync with assignments
  useEffect(() => {
    assignmentsRef.current = assignments;
  }, [assignments]);

  // Pre-fill form when initialData changes
  useEffect(() => {
    if (initialData) {
      // Check if this is a different template before modifying ref
      const isDifferentTemplate = loadedDatesForTemplateIdRef.current !== initialData.id;
      
      // Preserve current date values if it's the same template and dates exist
      // Dates are loaded from assignments by use-program-form-dates, not from template
      const currentValues = getValues();
      const shouldPreserveDates = 
        !isDifferentTemplate && 
        (currentValues.startDate || currentValues.endDate);

      // Reset the ref when initialData changes to a different template
      if (isDifferentTemplate) {
        loadedDatesForTemplateIdRef.current = null;
      }

      reset({
        name: initialData.name || '',
        description: initialData.description || '',
        weeks: initialData.weeks || 4,
        goals: initialData.goals || '',
        notes: initialData.notes || '',
        startDate: shouldPreserveDates ? currentValues.startDate : (undefined as unknown as Date),
        endDate: shouldPreserveDates ? currentValues.endDate : (undefined as unknown as Date),
        imageFile: undefined,
        imagePreview: undefined,
      });
    } else {
      reset({
        name: '',
        description: '',
        weeks: 4,
        goals: '',
        notes: '',
        startDate: undefined as unknown as Date,
        endDate: undefined as unknown as Date,
        imageFile: undefined,
        imagePreview: undefined,
      });
    }
  }, [initialData, reset, getValues, loadedDatesForTemplateIdRef]);

  const setImagePreview = (preview: string | null) => {
    if (preview) {
      setManualPreview({
        preview,
        templateId: initialData?.id ?? null,
      });
    } else {
      setManualPreview(null);
    }
  };

  return {
    imagePreview,
    setImagePreview,
    assignmentsRef,
  };
}
