'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronDown, SearchIcon } from 'lucide-react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [isOpen, setIsOpen] = useState(false);
  const [enabledOrgs, setEnabledOrgs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Derive effective enabled orgs set that includes selectedOrgId
  const effectiveEnabledOrgs = useMemo(() => {
    if (!FL_TEAMS_ENABLED || !selectedOrgId) return enabledOrgs;
    if (enabledOrgs.has(selectedOrgId)) return enabledOrgs;
    return new Set(enabledOrgs).add(selectedOrgId);
  }, [selectedOrgId, enabledOrgs]);

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
            enabled: effectiveEnabledOrgs.has(org.id),
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
          }))
        : [],
  });

  // Create a map of org ID to query result for easy lookup
  const teamsByOrg = useMemo(() => {
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
  const loadingTeams = useMemo(() => {
    const map: Record<string, boolean> = {};
    organizations?.forEach((org, index) => {
      const query = teamQueries[index];
      map[org.id] = query?.isLoading ?? false;
    });
    return map;
  }, [organizations, teamQueries]);

  // Load teams for an organization on demand
  const loadTeams = useCallback(
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

  const isAllSelected = !selectedOrgId && !selectedTeamId;

  // Filter organizations based on search query
  const filteredOrganizations = useMemo(() => {
    if (!organizations) return [];
    if (!searchQuery.trim()) return organizations;
    
    const queryLower = searchQuery.toLowerCase();
    return organizations.filter((org) =>
      org.name.toLowerCase().includes(queryLower)
    );
  }, [organizations, searchQuery]);


  // Filter teams based on search query
  // Teams are searchable when FL_TEAMS_ENABLED is false (when shown in submenu)
  const getFilteredTeams = useCallback(
    (orgId: string): Team[] => {
      const teams = teamsByOrg[orgId] || [];
      // Only filter teams when FL_TEAMS_ENABLED is false
      if (FL_TEAMS_ENABLED) return teams;
      if (!searchQuery.trim()) return teams;
      
      const queryLower = searchQuery.toLowerCase();
      return teams.filter((team) =>
        team.name.toLowerCase().includes(queryLower)
      );
    },
    [teamsByOrg, searchQuery]
  );


  return (
    <DropdownMenu 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setSearchQuery('');
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="min-w-[200px] justify-between h-11 rounded-[var(--radius-pill)] bg-background"
        >
          {displayText}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[200px] max-h-[400px] overflow-y-auto slim-scrollbar"
      >
        <div className="p-2 dropdown-item-animate" style={{ animationDelay: '0ms' }}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="h-11 pl-9 rounded-[var(--radius-md)]"
            />
          </div>
        </div>
        <DropdownMenuItem
          onClick={() => {
            onClear();

            setIsOpen(false);
          }}
          data-selected={isAllSelected}
          className="cursor-pointer truncate data-[selected=true]:!bg-primary/10 data-[selected=true]:focus:!bg-primary/10 dropdown-item-animate"
          style={{ animationDelay: '50ms' }}
        >
          {!FL_TEAMS_ENABLED ? 'All Groups / Teams' : 'All Groups'}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="dropdown-item-animate" style={{ animationDelay: '100ms' }} />
        {filteredOrganizations.length === 0 && searchQuery.trim() ? (
          <DropdownMenuItem disabled className="text-muted-foreground truncate dropdown-item-animate" style={{ animationDelay: '150ms' }}>
            No groups found
          </DropdownMenuItem>
        ) : (
          filteredOrganizations.map((org, index) => {
          if (!FL_TEAMS_ENABLED) {
            const teams = getFilteredTeams(org.id);
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
                  className="cursor-pointer truncate data-[selected=true]:!bg-primary/10 data-[selected=true]:focus:!bg-primary/10 data-[selected=true]:data-[state=open]:!bg-primary/10 dropdown-item-animate"
                  style={{ animationDelay: `${150 + index * 30}ms` }}
                >
                  {org.name}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuLabel className="dropdown-item-animate" style={{ animationDelay: '50ms' }}>Teams</DropdownMenuLabel>
                  <DropdownMenuSeparator className="dropdown-item-animate" style={{ animationDelay: '100ms' }} />
                  {isLoading ? (
                    <DropdownMenuItem disabled className="truncate dropdown-item-animate" style={{ animationDelay: '150ms' }}>Loading...</DropdownMenuItem>
                  ) : teams?.length === 0 ? (
                    <DropdownMenuItem disabled className="truncate dropdown-item-animate" style={{ animationDelay: '150ms' }}>No teams</DropdownMenuItem>
                  ) : (
                    teams?.map((team, teamIndex) => {
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
                          className="cursor-pointer truncate data-[selected=true]:!bg-primary/10 data-[selected=true]:focus:!bg-primary/10 dropdown-item-animate"
                          style={{ animationDelay: `${150 + teamIndex * 30}ms` }}
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
              className="cursor-pointer truncate data-[selected=true]:!bg-primary/10 data-[selected=true]:focus:!bg-primary/10 dropdown-item-animate"
              style={{ animationDelay: `${150 + index * 30}ms` }}
            >
              {org.name}
            </DropdownMenuItem>
          );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
