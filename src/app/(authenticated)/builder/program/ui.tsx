import { CollapsibleSection } from '@/components/common/collapsible-section';
import { CreateTemplateForm } from './form';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';
import type { UseFormReturn } from 'react-hook-form';
import { isPreProgramTemplateStatus } from '@/lib/constants/program-assignment-status';
import type { ProgramTemplateFormData } from './schemas';

interface ProgramDetailsSectionProps {
  template: ProgramTemplate | null;
  status: string | null;
  hideActions?: boolean;
  formMethods?: UseFormReturn<ProgramTemplateFormData>;
  defaultOpen?: boolean;
}

export function ProgramDetailsSection({
  template,
  status,
  hideActions = false,
  formMethods,
  defaultOpen = true,
}: ProgramDetailsSectionProps) {
  const lockMetadataExceptWeeks = isPreProgramTemplateStatus(status);

  return (
    <CollapsibleSection title="Program Details" defaultOpen={defaultOpen}>
      <CreateTemplateForm
        initialData={template}
        hideActions={hideActions}
        formMethods={formMethods}
        lockMetadataExceptWeeks={lockMetadataExceptWeeks}
      />
    </CollapsibleSection>
  );
}
