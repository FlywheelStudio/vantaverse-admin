'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganizations } from '@/hooks/use-organizations';
import { getTeamsByOrganizationId } from '@/app/(authenticated)/organizations/teams-actions';
import type { Team } from '@/lib/supabase/schemas/teams';

interface OrgTeamFilterProps {
  selectedOrgId?: string;
  selectedTeamId?: string;
  onOrgSelect: (orgId?: string) => void;
  onTeamSelect: (teamId?: string) => void;
}

export function OrgTeamFilter({
  selectedOrgId,
  selectedTeamId,
  onOrgSelect,
  onTeamSelect,
}: OrgTeamFilterProps) {
  const { data: organizations } = useOrganizations();
  const [teamsByOrg, setTeamsByOrg] = React.useState<Record<string, Team[]>>(
    {},
  );
  const [loadingTeams, setLoadingTeams] = React.useState<
    Record<string, boolean>
  >({});

  const loadTeams = React.useCallback(
    async (orgId: string) => {
      if (teamsByOrg[orgId] || loadingTeams[orgId]) return;

      setLoadingTeams((prev) => ({ ...prev, [orgId]: true }));
      const result = await getTeamsByOrganizationId(orgId);
      if (result.success) {
        setTeamsByOrg((prev) => ({ ...prev, [orgId]: result.data }));
      }
      setLoadingTeams((prev) => ({ ...prev, [orgId]: false }));
    },
    [teamsByOrg, loadingTeams],
  );

  const selectedOrg = organizations?.find((o) => o.id === selectedOrgId);
  const selectedTeam = selectedOrgId
    ? teamsByOrg[selectedOrgId]?.find((t) => t.id === selectedTeamId)
    : undefined;

  const displayText = selectedTeam
    ? `${selectedOrg?.name} / ${selectedTeam.name}`
    : selectedOrg
      ? selectedOrg.name
      : 'All Organizations / Teams';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-white border-[#2454FF]/20 rounded-xl text-[#1E3A5F] hover:bg-[#F5F7FA] min-w-[200px] justify-between"
        >
          {displayText}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        <DropdownMenuItem
          onClick={() => {
            onOrgSelect(undefined);
            onTeamSelect(undefined);
          }}
        >
          All Organizations / Teams
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {organizations?.map((org) => (
          <DropdownMenuSub key={org.id}>
            <DropdownMenuSubTrigger
              onMouseEnter={() => loadTeams(org.id)}
              onClick={() => {
                onOrgSelect(org.id);
                onTeamSelect(undefined);
              }}
            >
              {org.name}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => {
                  onOrgSelect(org.id);
                  onTeamSelect(undefined);
                }}
              >
                All Teams
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {loadingTeams[org.id] ? (
                <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
              ) : teamsByOrg[org.id]?.length === 0 ? (
                <DropdownMenuItem disabled>No teams</DropdownMenuItem>
              ) : (
                teamsByOrg[org.id]?.map((team) => (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => {
                      onOrgSelect(org.id);
                      onTeamSelect(team.id);
                    }}
                  >
                    {team.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
