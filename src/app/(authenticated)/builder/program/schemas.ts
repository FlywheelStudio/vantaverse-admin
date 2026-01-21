import { z } from 'zod';

/**
 * Schema for program template form validation
 */
export const programTemplateFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').trim(),
    weeks: z.number().int().min(1, 'Weeks must be at least 1'),
    description: z.string().trim().optional(),
    goals: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    imageFile: z.instanceof(File).optional(),
  })
  .refine(
    (data) => {
      // Only validate endDate >= startDate if both dates are provided
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

export type ProgramTemplateFormData = z.infer<typeof programTemplateFormSchema>;
