'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, isBefore } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import toast from 'react-hot-toast';
import {
  createProgramTemplate,
  updateProgramTemplate,
  uploadProgramTemplateImage,
  updateProgramTemplateImage,
} from '../actions';
import { useQueryClient } from '@tanstack/react-query';
import { useProgramAssignments } from '@/hooks/use-program-assignments';
import Image from 'next/image';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';
import { useBuilder } from '@/context/builder-context';

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
  const queryClient = useQueryClient();
  const { setProgramStartDate } = useBuilder();
  const { data: assignments } = useProgramAssignments();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weeks: 4,
    goals: '',
    notes: '',
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const lastProcessedRef = useRef<{
    fromTime: number;
    weeks: number;
  } | null>(null);
  const loadedDatesForTemplateIdRef = useRef<string | null>(null);

  // Pre-fill form when initialData changes
  useEffect(() => {
    if (initialData) {
      // Reset the ref when initialData changes to a different template
      if (loadedDatesForTemplateIdRef.current !== initialData.id) {
        loadedDatesForTemplateIdRef.current = null;
      }
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        weeks: initialData.weeks || 4,
        goals: initialData.goals || '',
        notes: initialData.notes || '',
      });

      // Handle image preview if image_url exists
      if (initialData.image_url) {
        if (typeof initialData.image_url === 'string') {
          setImagePreview(initialData.image_url);
        } else if (
          typeof initialData.image_url === 'object' &&
          initialData.image_url !== null &&
          'url' in initialData.image_url
        ) {
          setImagePreview(String(initialData.image_url.url));
        }
      }

      // Load assignment dates if available (only once per template)
      if (
        assignments &&
        loadedDatesForTemplateIdRef.current !== initialData.id
      ) {
        const assignment = assignments.find(
          (a) => a.program_template?.id === initialData.id,
        );
        if (assignment?.start_date) {
          const startDate = new Date(assignment.start_date);
          const endDate = assignment.end_date
            ? new Date(assignment.end_date)
            : calculateEndDate(startDate, initialData.weeks || 4);
          setDateRange({
            from: startOfDay(startDate),
            to: endDate ? startOfDay(endDate) : undefined,
          });
          // Store start date in builder context
          setProgramStartDate(formatDateForDB(startDate));
          loadedDatesForTemplateIdRef.current = initialData.id;
        }
      }
    }
  }, [initialData, setProgramStartDate, assignments]);

  // Format date to YYYY-MM-DD in UTC to match Supabase timezone
  // Creates a UTC date from local date components to ensure the date string matches what the user sees
  const formatDateForDB = (date: Date): string => {
    // Extract local date components (what user sees in calendar)
    const localYear = date.getFullYear();
    const localMonth = date.getMonth();
    const localDay = date.getDate();
    // Create UTC date from local components to ensure consistent storage
    const utcDate = new Date(Date.UTC(localYear, localMonth, localDay));
    // Format as YYYY-MM-DD using UTC methods
    const year = utcDate.getUTCFullYear();
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate end date from start date and weeks
  const calculateEndDate = (
    startDate: Date | undefined,
    weeks: number,
  ): Date | undefined => {
    if (!startDate || weeks < 1) return undefined;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeks * 7);
    return endDate;
  };

  // Update end date when start date or weeks change
  useEffect(() => {
    if (dateRange?.from && formData.weeks >= 1) {
      const normalizedFrom = startOfDay(dateRange.from);
      const normalizedFromTime = normalizedFrom.getTime();

      // Check if we've already processed this exact date/week combination
      const lastProcessed = lastProcessedRef.current;
      if (
        lastProcessed &&
        lastProcessed.fromTime === normalizedFromTime &&
        lastProcessed.weeks === formData.weeks
      ) {
        return; // Already processed, skip to prevent infinite loop
      }

      const endDate = calculateEndDate(normalizedFrom, formData.weeks);

      if (endDate) {
        // Track what we've processed
        lastProcessedRef.current = {
          fromTime: normalizedFromTime,
          weeks: formData.weeks,
        };

        setDateRange({
          from: normalizedFrom,
          to: endDate,
        });
      }
    } else {
      lastProcessedRef.current = null;
    }
  }, [formData.weeks, dateRange?.from]);

  // Store start date in builder context when date changes (only in edit mode)
  useEffect(() => {
    if (initialData && dateRange?.from) {
      setProgramStartDate(formatDateForDB(dateRange.from));
    } else if (!dateRange?.from) {
      setProgramStartDate(null);
    }
  }, [dateRange?.from, initialData, setProgramStartDate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const newWeeks =
      name === 'weeks'
        ? Math.max(1, Number.parseInt(value, 10) || 1)
        : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: newWeeks !== undefined ? newWeeks : value,
    }));
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    // If clicking the same start date again, deselect
    if (
      dateRange?.from &&
      range?.from &&
      startOfDay(range.from).getTime() === startOfDay(dateRange.from).getTime()
    ) {
      setDateRange(undefined);
      lastProcessedRef.current = null;
      return;
    }

    // Always recalculate end date from start date + weeks
    // User can only modify the start date, end date is always auto-calculated
    if (range?.from) {
      const normalizedFrom = startOfDay(range.from);
      const endDate = calculateEndDate(normalizedFrom, formData.weeks);
      setDateRange({
        from: normalizedFrom,
        to: endDate,
      });
      // Store start date in builder context (only in edit mode)
      if (initialData) {
        setProgramStartDate(formatDateForDB(normalizedFrom));
      }
      // Reset the ref so useEffect can process this new date
      lastProcessedRef.current = null;
    } else {
      setDateRange(undefined);
      if (initialData) {
        setProgramStartDate(null);
      }
      lastProcessedRef.current = null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (formData.weeks < 1) {
      toast.error('Weeks must be at least 1');
      return;
    }

    if (!dateRange?.from) {
      toast.error('Start date is required');
      return;
    }

    if (!dateRange?.to) {
      toast.error('End date is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialData) {
        // Update existing template
        const startDateString = dateRange?.from
          ? formatDateForDB(dateRange.from)
          : null;
        const endDateString = dateRange?.to
          ? formatDateForDB(dateRange.to)
          : null;

        const updateResult = await updateProgramTemplate(
          initialData.id,
          formData.name.trim(),
          formData.weeks,
          formData.description.trim() || null,
          formData.goals.trim() || null,
          formData.notes.trim() || null,
          startDateString,
          endDateString,
        );

        if (!updateResult.success) {
          toast.error(updateResult.error || 'Failed to update program');
          return;
        }

        const templateId = initialData.id;
        const organizationId = initialData.organization_id;

        // Upload image if a new one is provided
        if (imageFile && imagePreview) {
          try {
            const oldImageUrl =
              typeof initialData.image_url === 'string'
                ? initialData.image_url
                : typeof initialData.image_url === 'object' &&
                    initialData.image_url !== null &&
                    'url' in initialData.image_url
                  ? String(initialData.image_url.url)
                  : null;

            const uploadResult = await uploadProgramTemplateImage(
              templateId,
              organizationId,
              imagePreview,
              oldImageUrl,
            );

            if (uploadResult.success && uploadResult.data) {
              await updateProgramTemplateImage(templateId, uploadResult.data);
            }
          } catch (error) {
            console.error('Error uploading image:', error);
            // Don't fail the whole operation if image upload fails
            toast.error('Program updated but image upload failed');
          }
        }

        // Refresh assignments list
        queryClient.invalidateQueries({ queryKey: ['program-assignments'] });

        toast.success('Program updated successfully');
        onSuccess?.();
      } else {
        // Create new template and assignment
        const startDateString = formatDateForDB(dateRange.from);

        const createResult = await createProgramTemplate(
          formData.name.trim(),
          formData.weeks,
          startDateString,
          formData.description.trim() || null,
          formData.goals.trim() || null,
          formData.notes.trim() || null,
          null, // organizationId - can be added later if needed
        );

        if (!createResult.success) {
          toast.error(createResult.error || 'Failed to create program');
          return;
        }

        const templateId = createResult.data.template.id;
        const organizationId = createResult.data.template.organization_id;

        // Upload image if provided
        if (imageFile && imagePreview) {
          try {
            const uploadResult = await uploadProgramTemplateImage(
              templateId,
              organizationId,
              imagePreview,
              null,
            );

            if (uploadResult.success && uploadResult.data) {
              await updateProgramTemplateImage(templateId, uploadResult.data);
            }
          } catch (error) {
            console.error('Error uploading image:', error);
            // Don't fail the whole operation if image upload fails
            toast.error('Program created but image upload failed');
          }
        }

        // Refresh assignments list
        queryClient.invalidateQueries({ queryKey: ['program-assignments'] });

        // Reset form
        setFormData({
          name: '',
          description: '',
          weeks: 4,
          goals: '',
          notes: '',
        });
        setDateRange(undefined);
        setImageFile(null);
        setImagePreview(null);

        toast.success('Program created successfully');
        onSuccess?.();
      }
    } catch (error) {
      console.error(
        `Error ${initialData ? 'updating' : 'creating'} program:`,
        error,
      );
      toast.error(`Failed to ${initialData ? 'update' : 'create'} program`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      weeks: 4,
      goals: '',
      notes: '',
    });
    setDateRange(undefined);
    setImageFile(null);
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Left column: Program form fields (4/5 width) */}
            <div className="md:col-span-4 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-[#64748B] mb-1"
                >
                  Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Program name"
                  required
                  className="bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="weeks"
                  className="block text-sm font-medium text-[#64748B] mb-1"
                >
                  Weeks *
                </label>
                <Input
                  id="weeks"
                  name="weeks"
                  type="number"
                  min="1"
                  value={formData.weeks}
                  onChange={handleInputChange}
                  required
                  className="bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-1">
                    Start Date *
                  </label>
                  <Input
                    value={
                      dateRange?.from
                        ? format(dateRange.from, 'PPP')
                        : 'Pick a start date'
                    }
                    disabled
                    required
                    className="bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-1">
                    End Date *
                  </label>
                  <Input
                    value={
                      dateRange?.to
                        ? format(dateRange.to, 'PPP')
                        : 'Select start date and weeks'
                    }
                    disabled
                    required
                    className="bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="goals"
                  className="block text-sm font-medium text-[#64748B] mb-1"
                >
                  Goals
                </label>
                <Input
                  id="goals"
                  name="goals"
                  value={formData.goals}
                  onChange={handleInputChange}
                  placeholder="Build strength, muscle & balance"
                  className="bg-white"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[#64748B] mb-1"
                >
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Program description"
                  rows={3}
                  className="bg-white"
                />
              </div>
            </div>

            {/* Right column: Calendar (1/5 width) */}
            <div className="md:col-span-1 flex justify-center items-start">
              <div className="w-fit border rounded-md p-2 bg-white">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  defaultMonth={dateRange?.from || new Date()}
                  numberOfMonths={1}
                  disabled={(date) => {
                    const today = startOfDay(new Date());
                    const dateToCheck = startOfDay(date);
                    return isBefore(dateToCheck, today);
                  }}
                  className="w-full [--cell-size:2rem]"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-[#64748B] mb-1"
            >
              Notes
            </label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Notes for physician or administrators"
              rows={3}
              className="bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="image"
              className="block text-sm font-medium text-[#64748B] mb-1"
            >
              Image
            </label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="bg-white"
            />
            {imagePreview && (
              <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>

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
