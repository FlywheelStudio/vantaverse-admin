'use client';

import * as React from 'react';
import { Badge, IconButton } from '@/components/medvanta';
import { useOrganizationsTable } from '@/context/organizations';
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

  const handleClick = (): void => {
    handleExpandToggle(organization.id);
  };

  const handleCreateClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!isExpanded) {
      handleExpandToggle(organization.id);
    }
    handleTeamCreate(organization.id);
  };

  return (
    <div className="flex items-center gap-2">
      {teamsCount > 0 ? (
        <Badge tone="brand">{teamsCount}</Badge>
      ) : null}
      {teamsCount > 0 ? (
        <IconButton
          icon={isExpanded ? 'ChevronUp' : 'ChevronDown'}
          label={isExpanded ? 'Collapse teams' : 'Expand teams'}
          variant="ghost"
          size="sm"
          onClick={handleClick}
        />
      ) : null}
      <IconButton
        icon="Plus"
        label="Create team"
        variant="ghost"
        size="sm"
        onClick={handleCreateClick}
        disabled={creatingTeam}
      />
    </div>
  );
}
