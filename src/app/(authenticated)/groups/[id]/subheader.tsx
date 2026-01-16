'use client';

import toast from 'react-hot-toast';
import { updateOrganization } from '../actions';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { EditableTitle } from './editable-components';

export function GroupDetailsSubheader({
  organization,
  onOrganizationChange,
}: {
  organization: Pick<Organization, 'id' | 'name'>;
  onOrganizationChange: (patch: Partial<Pick<Organization, 'name'>>) => void;
}) {
  const handleSaveName = async (nextName: string) => {
    const prev = organization.name;
    onOrganizationChange({ name: nextName });
    const result = await updateOrganization(organization.id, {
      name: nextName,
    });
    if (!result.success) {
      onOrganizationChange({ name: prev });
      toast.error(result.error || 'Failed to update name');
    }
  };

  return (
    <EditableTitle
      value={organization.name}
      onSave={handleSaveName}
      className="text-2xl font-medium text-white cursor-pointer hover:opacity-90 transition-opacity"
    />
  );
}
