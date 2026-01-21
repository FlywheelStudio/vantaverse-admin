import { CollapsibleSection } from '@/components/common/collapsible-section';
import { CreateTemplateForm } from './form';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';

interface ProgramDetailsSectionProps {
  template: ProgramTemplate | null;
}

export function ProgramDetailsSection({
  template,
}: ProgramDetailsSectionProps) {
  return (
    <CollapsibleSection title="Program Details" defaultOpen={true}>
      <CreateTemplateForm initialData={template} />
    </CollapsibleSection>
  );
}
