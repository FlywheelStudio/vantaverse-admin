'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { useOrganizations } from '@/hooks/use-organizations';
import { createOrganization } from '@/app/(authenticated)/groups/actions';
import toast from 'react-hot-toast';

interface OrganizationComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
}

export function OrganizationCombobox({
  value,
  onValueChange,
  disabled = false,
}: OrganizationComboboxProps) {
  const { data: organizations, isLoading } = useOrganizations();
  const queryClient = useQueryClient();

  const options: ComboboxOption[] = useMemo(() => {
    if (!organizations) return [];
    return organizations.map((org) => ({
      value: org.id,
      label: org.name,
    }));
  }, [organizations]);

  const handleCreateNew = async (name: string) => {
    try {
      const result = await createOrganization(name.trim());
      if (result.success) {
        // Invalidate and refetch organizations
        await queryClient.invalidateQueries({ queryKey: ['organizations'] });
        // Set the newly created org as selected
        onValueChange(result.data.id);
        toast.success('Organization created successfully');
      } else {
        toast.error(result.error || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    }
  };

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder="Select organization..."
      searchPlaceholder="Search or create..."
      emptyMessage="No organization found."
      disabled={disabled || isLoading}
      allowCreate={true}
      onCreateNew={handleCreateNew}
    />
  );
}
