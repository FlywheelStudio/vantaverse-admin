'use client';

import { useRef } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';
import {
  programTemplateFormSchema,
  type ProgramTemplateFormData,
} from './schemas';
import { useProgramFormInit } from './hooks/use-program-form-init';
import { useProgramFormSubmit } from './hooks/use-program-form-submit';
import { ImageUploadField } from './partials/image-upload-field';
import {
  FormTextField,
  FormTextareaField,
} from './partials/form-fields';

interface CreateTemplateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: ProgramTemplate | null;
  hideActions?: boolean;
  formMethods?: UseFormReturn<ProgramTemplateFormData>;
  lockMetadataExceptWeeks?: boolean;
}

export function CreateTemplateForm({
  onSuccess,
  onCancel,
  initialData,
  hideActions = false,
  formMethods,
  lockMetadataExceptWeeks = false,
}: CreateTemplateFormProps) {
  const loadedDatesForTemplateIdRef = useRef<string | null>(null);

  const defaultForm = useForm<ProgramTemplateFormData>({
    resolver: zodResolver(programTemplateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      weeks: 4,
      goals: '',
      notes: '',
      startDate: undefined as unknown as Date,
      endDate: undefined as unknown as Date,
      imageFile: undefined,
      imagePreview: undefined,
    },
  });

  const form = formMethods ?? defaultForm;

  const { reset } = form;

  const { imagePreview, setImagePreview } = useProgramFormInit({
    initialData,
    reset,
    getValues: form.getValues,
    loadedDatesForTemplateIdRef,
  });


  const { onSubmit, isSubmitting } = useProgramFormSubmit({
    initialData,
    imagePreview,
    reset,
    setImagePreview,
    onSuccess,
  });

  const handleCancel = () => {
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
    setImagePreview(null);
    onCancel?.();
  };

  return (
    <FormProvider {...form}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="p-5 mb-6">
          {!initialData && (
            <h3 className="text-lg font-semibold mb-4 text-foreground">Create New Program</h3>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <FormTextField
                register={form.register}
                errors={form.formState.errors}
                name="name"
                label="Name"
                placeholder="Program name"
                required
                disabled={lockMetadataExceptWeeks}
              />



              <FormTextField
                register={form.register}
                errors={form.formState.errors}
                name="goals"
                label="Goals"
                placeholder="Build strength, muscle & balance"
                disabled={lockMetadataExceptWeeks}
              />

              <FormTextareaField
                register={form.register}
                errors={form.formState.errors}
                name="description"
                label="Description"
                placeholder="Program description"
                rows={3}
                disabled={lockMetadataExceptWeeks}
              />
            </div>

            <FormTextareaField
              register={form.register}
              errors={form.formState.errors}
              name="notes"
              label="Notes"
              placeholder="Notes for administrators and staff"
              rows={3}
              disabled={lockMetadataExceptWeeks}
            />

            <ImageUploadField
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              setValue={form.setValue}
              disabled={lockMetadataExceptWeeks}
            />

            {!hideActions && (
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? initialData
                      ? 'Updating...'
                      : 'Creating...'
                    : initialData
                      ? 'Update Program'
                      : 'Create Program'}
                </Button>
              </div>
            )}
          </form>
        </Card>
      </motion.div>
    </FormProvider>
  );
}
