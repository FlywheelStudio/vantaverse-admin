'use client';

import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';
import {
  programTemplateFormSchema,
  type ProgramTemplateFormData,
} from './schemas';
import { useProgramFormDates } from './hooks/use-program-form-dates';
import { useProgramFormInit } from './hooks/use-program-form-init';
import { useProgramFormSubmit } from './hooks/use-program-form-submit';
import { ImageUploadField } from './partials/image-upload-field';
import { DateRangePicker } from './partials/date-range-picker';
import {
  FormTextField,
  FormNumberField,
  FormTextareaField,
} from './partials/form-fields';

interface CreateTemplateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: ProgramTemplate | null;
}

export function CreateTemplateForm({
  onSuccess,
  onCancel,
  initialData,
}: CreateTemplateFormProps) {
  const loadedDatesForTemplateIdRef = useRef<string | null>(null);

  const form = useForm<ProgramTemplateFormData>({
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
    },
  });

  const { watch, reset } = form;
  const weeks = watch('weeks');

  const { imagePreview, setImagePreview } = useProgramFormInit({
    initialData,
    reset,
    loadedDatesForTemplateIdRef,
  });

  const { startDate, endDate, dateRange, handleDateSelect } =
    useProgramFormDates({
      initialData,
      form,
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
    });
    setImagePreview(null);
    onCancel?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="p-6 mb-6 bg-white/95 rounded-3xl border-2 border-white/50 shadow-xl">
        {!initialData && (
          <h3 className="text-lg font-semibold mb-4 text-[#1E3A5F]">
            Create New Program
          </h3>
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
            />

            <FormNumberField
              register={form.register}
              errors={form.formState.errors}
              name="weeks"
              label="Weeks"
              min={1}
              required
            />

            <DateRangePicker
              weeks={weeks}
              startDate={startDate}
              dateRange={dateRange}
              onDateSelect={handleDateSelect}
              errors={{
                startDate: form.formState.errors.startDate,
                endDate: form.formState.errors.endDate,
              }}
            />

            <FormTextField
              register={form.register}
              errors={form.formState.errors}
              name="goals"
              label="Goals"
              placeholder="Build strength, muscle & balance"
            />

            <FormTextareaField
              register={form.register}
              errors={form.formState.errors}
              name="description"
              label="Description"
              placeholder="Program description"
              rows={3}
            />
          </div>

          <FormTextareaField
            register={form.register}
            errors={form.formState.errors}
            name="notes"
            label="Notes"
            placeholder="Notes for physician or administrators"
            rows={3}
          />

          <ImageUploadField
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            setValue={form.setValue}
          />

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
              className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white"
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
        </form>
      </Card>
    </motion.div>
  );
}
