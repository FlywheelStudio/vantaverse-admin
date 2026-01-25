import { CollapsibleSection } from '@/components/common/collapsible-section';
import { CreateTemplateForm } from './form';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';
import type { ProgramTemplateFormData } from './schemas';
import type { UseFormReturn } from 'react-hook-form';

interface ProgramDetailsSectionProps {
  template: ProgramTemplate | null;
  status: string | null;
  hideActions?: boolean;
  formMethods?: UseFormReturn<ProgramTemplateFormData>;
}

export function ProgramDetailsSection({
  template,
  status,
  hideActions = false,
  formMethods,
}: ProgramDetailsSectionProps) {
  return (
    <CollapsibleSection title="Program Details" defaultOpen={true}>
      <CreateTemplateForm
        initialData={template}
        showDates={status !== 'template'}
        hideActions={hideActions}
        formMethods={formMethods}
      />
    </CollapsibleSection>
  );
}
