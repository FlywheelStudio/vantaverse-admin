'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganizations } from '@/hooks/use-organizations';
import { getTeamsByOrganizationId } from '@/app/(authenticated)/groups/teams-actions';
import type { Team } from '@/lib/supabase/schemas/teams';

interface OrgTeamFilterProps {
  selectedOrgId?: string;
  selectedOrgName?: string;
  selectedTeamId?: string;
  selectedTeamName?: string;
  onOrgSelect: (orgId?: string, orgName?: string) => void;
  onTeamSelect: (teamId?: string, teamName?: string) => void;
  onClear: () => void;
}

export function OrgTeamFilter({
  selectedOrgId,
  selectedOrgName,
  selectedTeamId,
  selectedTeamName,
  onOrgSelect,
  onTeamSelect,
  onClear,
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

  const displayText =
    selectedTeamId && selectedTeamName
      ? `${selectedOrgName || ''} / ${selectedTeamName}`
      : selectedOrgId && selectedOrgName
        ? selectedOrgName
        : 'All Groups / Teams';

  // Load teams for selected org if not already loaded (needed for highlighting and display)
  React.useEffect(() => {
    if (
      selectedOrgId &&
      !teamsByOrg[selectedOrgId] &&
      !loadingTeams[selectedOrgId]
    ) {
      loadTeams(selectedOrgId);
    }
  }, [selectedOrgId, teamsByOrg, loadingTeams, loadTeams]);

  // Also ensure teams are loaded when dropdown might open (on open state change)
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (
      isOpen &&
      selectedOrgId &&
      !teamsByOrg[selectedOrgId] &&
      !loadingTeams[selectedOrgId]
    ) {
      loadTeams(selectedOrgId);
    }
  }, [isOpen, selectedOrgId, teamsByOrg, loadingTeams, loadTeams]);

  const isAllSelected = !selectedOrgId && !selectedTeamId;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
            onClear();

            setIsOpen(false);
          }}
          data-selected={isAllSelected}
          className={`cursor-pointer data-[selected=true]:bg-[#2454FF]/10! data-[selected=true]:focus:bg-[#2454FF]/10!`}
        >
          All Groups / Teams
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {organizations?.map((org) => (
          <DropdownMenuSub key={org.id}>
            <DropdownMenuSubTrigger
              onMouseEnter={() => loadTeams(org.id)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOrgSelect(org.id, org.name);
                setIsOpen(false);
              }}
              data-selected={selectedOrgId === org.id && !selectedTeamId}
              className={`cursor-pointer data-[selected=true]:bg-[#2454FF]/10! data-[selected=true]:focus:bg-[#2454FF]/10! data-[selected=true]:data-[state=open]:bg-[#2454FF]/10!`}
            >
              {org.name}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel>Teams</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadingTeams[org.id] ? (
                <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
              ) : teamsByOrg[org.id]?.length === 0 ? (
                <DropdownMenuItem disabled>No teams</DropdownMenuItem>
              ) : (
                teamsByOrg[org.id]?.map((team) => {
                  const isSelected =
                    selectedOrgId === org.id && selectedTeamId === team.id;
                  return (
                    <DropdownMenuItem
                      key={team.id}
                      onClick={() => {
                        onOrgSelect(org.id, org.name);
                        onTeamSelect(team.id, team.name);
                        setIsOpen(false);
                      }}
                      data-selected={isSelected}
                      className={`cursor-pointer data-[selected=true]:bg-[#2454FF]/10! data-[selected=true]:focus:bg-[#2454FF]/10!`}
                    >
                      {team.name}
                    </DropdownMenuItem>
                  );
                })
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
