'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
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

const FL_TEAMS_ENABLED = process.env.NEXT_PUBLIC_FL_TEAMS === 'true';

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
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);
  const [enabledOrgs, setEnabledOrgs] = React.useState<Set<string>>(new Set());

  // Set up queries for all organizations, but only enable them when needed
  const teamQueries = useQueries({
    queries:
      FL_TEAMS_ENABLED && organizations
        ? organizations.map((org) => ({
            queryKey: ['teams', org.id],
            queryFn: async () => {
              const result = await getTeamsByOrganizationId(org.id);
              if (!result.success) {
                throw new Error(result.error);
              }
              return result.data;
            },
            enabled: enabledOrgs.has(org.id) || selectedOrgId === org.id,
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
          }))
        : [],
  });

  // Create a map of org ID to query result for easy lookup
  const teamsByOrg = React.useMemo(() => {
    const map: Record<string, Team[]> = {};
    organizations?.forEach((org, index) => {
      const query = teamQueries[index];
      if (query?.data) {
        map[org.id] = query.data;
      }
    });
    return map;
  }, [organizations, teamQueries]);

  // Create a map of org ID to loading state
  const loadingTeams = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    organizations?.forEach((org, index) => {
      const query = teamQueries[index];
      map[org.id] = query?.isLoading ?? false;
    });
    return map;
  }, [organizations, teamQueries]);

  // Load teams for an organization on demand
  const loadTeams = React.useCallback(
    (orgId: string) => {
      if (!FL_TEAMS_ENABLED) return;
      if (!enabledOrgs.has(orgId)) {
        setEnabledOrgs((prev) => new Set(prev).add(orgId));
      } else {
        // If already enabled, refetch to ensure fresh data
        queryClient.fetchQuery({
          queryKey: ['teams', orgId],
          queryFn: async () => {
            const result = await getTeamsByOrganizationId(orgId);
            if (!result.success) {
              throw new Error(result.error);
            }
            return result.data;
          },
        });
      }
    },
    [enabledOrgs, queryClient],
  );

  const displayText =
    selectedTeamId && selectedTeamName
      ? `${selectedOrgName || ''} / ${selectedTeamName}`
      : selectedOrgId && selectedOrgName
        ? selectedOrgName
        : !FL_TEAMS_ENABLED
          ? 'All Groups / Teams'
          : 'All Groups';

  // Load teams for selected org when it changes
  React.useEffect(() => {
    if (!FL_TEAMS_ENABLED) return;
    if (selectedOrgId && !enabledOrgs.has(selectedOrgId)) {
      setEnabledOrgs((prev) => new Set(prev).add(selectedOrgId));
    }
  }, [selectedOrgId, enabledOrgs]);

  const isAllSelected = !selectedOrgId && !selectedTeamId;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="min-w-[200px] justify-between h-11 rounded-[var(--radius-pill)] bg-background"
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
          className="cursor-pointer data-[selected=true]:!bg-primary/10 data-[selected=true]:focus:!bg-primary/10"
        >
          {!FL_TEAMS_ENABLED ? 'All Groups / Teams' : 'All Groups'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {organizations?.map((org) => {
          if (!FL_TEAMS_ENABLED) {
            const teams = teamsByOrg[org.id];
            const isLoading = loadingTeams[org.id];

            return (
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
                  className="cursor-pointer data-[selected=true]:!bg-primary/10 data-[selected=true]:focus:!bg-primary/10 data-[selected=true]:data-[state=open]:!bg-primary/10"
                >
                  {org.name}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuLabel>Teams</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isLoading ? (
                    <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                  ) : teams?.length === 0 ? (
                    <DropdownMenuItem disabled>No teams</DropdownMenuItem>
                  ) : (
                    teams?.map((team) => {
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
                          className="cursor-pointer data-[selected=true]:!bg-primary/10 data-[selected=true]:focus:!bg-primary/10"
                        >
                          {team.name}
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          }

          return (
            <DropdownMenuItem
              key={org.id}
              onClick={() => {
                onOrgSelect(org.id, org.name);
                setIsOpen(false);
              }}
              data-selected={selectedOrgId === org.id}
              className="cursor-pointer data-[selected=true]:!bg-primary/10 data-[selected=true]:focus:!bg-primary/10"
            >
              {org.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
