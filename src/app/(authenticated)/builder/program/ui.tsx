import { CollapsibleSection } from '@/components/common/collapsible-section';
import { CreateTemplateForm } from './form';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';

interface ProgramDetailsSectionProps {
  template: ProgramTemplate | null;
  status: string | null;
}

export function ProgramDetailsSection({
  template,
  status,
}: ProgramDetailsSectionProps) {
  console.log('status', status);
  return (
    <CollapsibleSection title="Program Details" defaultOpen={true}>
      <CreateTemplateForm initialData={template} showDates={status !== 'template'}/>
    </CollapsibleSection>
  );
}
