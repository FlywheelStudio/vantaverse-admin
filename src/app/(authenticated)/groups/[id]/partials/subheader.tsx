'use client';

import type { Organization } from '@/lib/supabase/schemas/organizations';
import { useUpdateOrganization } from '../hooks/use-group-mutations';
import { EditableTitle } from './editable-components';

export function GroupDetailsSubheader({
  organization,
}: {
  organization: Pick<Organization, 'id' | 'name'>;
}) {
  const updateOrganizationMutation = useUpdateOrganization(organization.id);

  const handleSaveName = async (nextName: string) => {
    updateOrganizationMutation.mutate({ name: nextName });
  };

  return (
    <EditableTitle
      value={organization.name}
      onSave={handleSaveName}
      className="text-2xl font-medium text-white cursor-pointer hover:opacity-90 transition-opacity"
    />
  );
}
