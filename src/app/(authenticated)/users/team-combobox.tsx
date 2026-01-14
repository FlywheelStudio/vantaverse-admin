'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  getTeamsByOrganizationId,
  createTeam,
} from '@/app/(authenticated)/groups/teams-actions';
import toast from 'react-hot-toast';

interface TeamComboboxProps {
  organizationId?: string;
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
}

export function TeamCombobox({
  organizationId,
  value,
  onValueChange,
  disabled = false,
}: TeamComboboxProps) {
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const onValueChangeRef = useRef(onValueChange);

  // Keep ref in sync
  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  // Reset selected team when organization changes
  useEffect(() => {
    if (!organizationId) {
      setTeams([]);
      onValueChangeRef.current(undefined);
      return;
    }

    const fetchTeams = async () => {
      setLoadingTeams(true);
      try {
        const result = await getTeamsByOrganizationId(organizationId);
        if (result.success) {
          setTeams(result.data);
        } else {
          toast.error(result.error || 'Failed to load teams');
          setTeams([]);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams');
        setTeams([]);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [organizationId]);

  const options: ComboboxOption[] = useMemo(() => {
    return teams.map((team) => ({
      value: team.id,
      label: team.name,
    }));
  }, [teams]);

  const handleCreateNew = async (name: string) => {
    if (!organizationId) {
      toast.error('Please select an organization first');
      return;
    }

    try {
      const result = await createTeam(organizationId, name.trim());
      if (result.success) {
        // Refresh teams list
        const teamsResult = await getTeamsByOrganizationId(organizationId);
        if (teamsResult.success) {
          setTeams(teamsResult.data);
        }
        // Set the newly created team as selected
        onValueChange(result.data.id);
        toast.success('Team created successfully');
      } else {
        toast.error(result.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };

  const isDisabled = disabled || !organizationId || loadingTeams;

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={!organizationId ? "Select org's team..." : 'Select team...'}
      searchPlaceholder="Search teams..."
      emptyMessage="No team found."
      disabled={isDisabled}
      allowCreate={true}
      onCreateNew={handleCreateNew}
    />
  );
}
