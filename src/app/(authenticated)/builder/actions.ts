'use server';

import { ProgramTemplatesQuery } from '@/lib/supabase/queries/program-templates';
import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';
import { SupabaseStorage } from '@/lib/supabase/storage';
import { createClient } from '@/lib/supabase/core/server';

/**
 * Get all program assignments with status='template' (joined with program_template)
 */
export async function getProgramAssignments() {
  const query = new ProgramAssignmentsQuery();
  return query.getTemplates();
}

/**
 * Get a single program assignment by ID (joined with program_template)
 */
export async function getProgramAssignmentById(id: string) {
  const query = new ProgramAssignmentsQuery();
  return query.getById(id);
}

/**
 * Get a single program template by ID
 */
export async function getProgramTemplateById(id: string) {
  const query = new ProgramTemplatesQuery();
  return query.getById(id);
}

/**
 * Create a new program template and program assignment
 */
export async function createProgramTemplate(
  name: string,
  weeks: number,
  startDate: string,
  description?: string | null,
  goals?: string | null,
  notes?: string | null,
  organizationId?: string | null,
) {
  const templateQuery = new ProgramTemplatesQuery();
  const assignmentQuery = new ProgramAssignmentsQuery();

  // Create program_template first
  const templateResult = await templateQuery.create(
    name,
    weeks,
    description,
    goals,
    notes,
    organizationId,
  );

  if (!templateResult.success) {
    return templateResult;
  }

  const templateId = templateResult.data.id;

  // Calculate end date from start date + weeks
  const start = new Date(startDate);
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + weeks * 7);
  const endDateString = endDate.toISOString().split('T')[0];

  // Create program_assignment with status='template'
  const assignmentResult = await assignmentQuery.create(
    templateId,
    startDate,
    endDateString,
    organizationId,
  );

  if (!assignmentResult.success) {
    // If assignment creation fails, we could optionally rollback template creation
    // For now, we'll return the error
    return assignmentResult;
  }

  // Return both template and assignment data
  return {
    success: true as const,
    data: {
      template: templateResult.data,
      assignment: assignmentResult.data,
    },
  };
}

/**
 * Upload program template image
 */
export async function uploadProgramTemplateImage(
  templateId: string,
  organizationId: string | null,
  fileBase64: string,
  oldImageUrl?: string | null,
) {
  // Validate file type
  const base64Header = fileBase64.substring(0, 30);
  const isJpeg =
    base64Header.includes('data:image/jpeg') ||
    base64Header.includes('data:image/jpg');
  const isPng = base64Header.includes('data:image/png');

  if (!isJpeg && !isPng) {
    return {
      success: false as const,
      error: 'Invalid file type. Only JPEG and PNG images are allowed.',
    };
  }

  // If no organization ID, use 'default' folder
  const orgFolder = organizationId || 'default';

  const storage = new SupabaseStorage();
  const extension = isJpeg ? 'jpg' : 'png';
  const path = `${orgFolder}/program-templates/${templateId}/image.${extension}`;
  const contentType = isJpeg ? 'image/jpeg' : 'image/png';

  // Delete old image if it exists
  if (oldImageUrl) {
    // Extract path from URL - format: {orgId}/program-templates/{templateId}/image.{ext}
    const urlParts = oldImageUrl.split('/');
    const oldPathIndex = urlParts.findIndex((part) =>
      part.includes('program-templates'),
    );
    if (oldPathIndex !== -1) {
      const oldPath = urlParts.slice(oldPathIndex - 1).join('/');
      await storage.delete('organization_assets', oldPath);
    }
  }

  // Upload new image
  const result = await storage.upload({
    bucket: 'organization_assets',
    path,
    body: fileBase64,
    contentType,
    upsert: true,
    getPublicUrl: true,
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true as const,
    data: result.data.publicUrl,
  };
}

/**
 * Delete a program assignment and its associated template
 * Deletes the template, which cascades to delete the assignment
 */
export async function deleteProgramAssignment(assignmentId: string) {
  const assignmentQuery = new ProgramAssignmentsQuery();
  const templateQuery = new ProgramTemplatesQuery();

  // Get the assignment to find the template ID
  const assignmentResult = await assignmentQuery.getById(assignmentId);

  if (!assignmentResult.success) {
    return assignmentResult;
  }

  const templateId = assignmentResult.data.program_template?.id;

  if (!templateId) {
    return {
      success: false as const,
      error: 'Template ID not found',
    };
  }

  // Delete the template - this will cascade delete the assignment
  const deleteTemplateResult = await templateQuery.delete(templateId);

  if (!deleteTemplateResult.success) {
    return deleteTemplateResult;
  }

  return {
    success: true as const,
    data: undefined,
  };
}

/**
 * Update a program template
 */
export async function updateProgramTemplate(
  templateId: string,
  name: string,
  weeks: number,
  description?: string | null,
  goals?: string | null,
  notes?: string | null,
  startDate?: string | null,
  endDate?: string | null,
) {
  const templateQuery = new ProgramTemplatesQuery();

  // Update program_template
  const updateResult = await templateQuery.update(templateId, {
    name: name.trim(),
    weeks,
    description: description?.trim() || null,
    goals: goals?.trim() || null,
    notes: notes?.trim() || null,
  });

  if (!updateResult.success) {
    return updateResult;
  }

  // Update assignment dates if provided
  if (startDate && endDate) {
    const supabase = await createClient();

    // Get assignments with status='template' for this template
    const { data: assignments, error } = await supabase
      .from('program_assignment')
      .select('id')
      .eq('program_template_id', templateId)
      .eq('status', 'template');

    if (!error && assignments && assignments.length > 0) {
      // Update each assignment's dates
      for (const assignment of assignments) {
        await supabase
          .from('program_assignment')
          .update({
            start_date: startDate,
            end_date: endDate,
          })
          .eq('id', assignment.id);
      }
    }
  }

  return {
    success: true as const,
    data: updateResult.data,
  };
}

/**
 * Update program template image URL
 */
export async function updateProgramTemplateImage(
  templateId: string,
  imageUrl: string | null,
) {
  const query = new ProgramTemplatesQuery();
  return query.update(templateId, { image_url: imageUrl as unknown });
}
