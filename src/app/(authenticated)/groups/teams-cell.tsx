'use client';

import * as React from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrganizationsTable } from '../../../context/organizations';
import type { Organization } from '@/lib/supabase/schemas/organizations';

interface TeamsCellProps {
  organization: Organization;
}

export function TeamsCell({ organization }: TeamsCellProps) {
  const {
    expandedOrganizationId,
    handleExpandToggle,
    handleTeamCreate,
    creatingTeam,
  } = useOrganizationsTable();
  const isExpanded = expandedOrganizationId === organization.id;
  const teamsCount = organization.teams_count || 0;

  const handleClick = () => {
    handleExpandToggle(organization.id);
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      handleExpandToggle(organization.id);
    }
    handleTeamCreate(organization.id);
  };

  return (
    <div className="flex items-center gap-2">
      {teamsCount > 0 && (
        <span className="border-[#2454FF] rounded-full p-2 cursor-default text-sm font-semibold text-[#1E3A5F]">
          {teamsCount}
        </span>
      )}
      {teamsCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          className="cursor-pointer h-6 w-6 p-0 text-[#2454FF] hover:text-[#1E3FCC] hover:bg-[#2454FF]/10 rounded"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCreateClick}
        disabled={creatingTeam}
        className="cursor-pointer h-6 w-6 p-0 text-[#2454FF] hover:text-[#1E3FCC] hover:bg-[#2454FF]/10 rounded disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
