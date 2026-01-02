import { Input } from '@/components/ui/input';
import { OrgTeamFilter } from '../../org-team-filter';
import { JourneyPhaseFilter } from '../../journey-phase-filter';
import { AddUserMenu } from '../../import-menu';
import type { UsersTableFilters } from '../types';

interface UsersTableFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: UsersTableFilters;
  selectedOrgName?: string;
  selectedTeamName?: string;
  onFiltersChange?: (filters: UsersTableFilters) => void;
  onTeamNameChange: (name: string | undefined) => void;
  onQuickAdd: () => void;
}

export function UsersTableFilters({
  searchValue,
  onSearchChange,
  filters,
  selectedOrgName,
  selectedTeamName,
  onFiltersChange,
  onTeamNameChange,
  onQuickAdd,
}: UsersTableFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4">
        <AddUserMenu onQuickAdd={onQuickAdd} />
        <Input
          placeholder="Search users..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-white border-[#2454FF]/20 rounded-xl placeholder:text-[#64748B]/60 focus:border-[#2454FF] focus:ring-[#2454FF] flex-1"
        />
        <div className="hidden md:flex flex-row gap-4 flex-1">
          <OrgTeamFilter
            selectedOrgId={filters.organization_id}
            selectedOrgName={selectedOrgName}
            selectedTeamId={filters.team_id}
            selectedTeamName={selectedTeamName}
            onOrgSelect={(orgId) => {
              onTeamNameChange(undefined);
              const newFilters: UsersTableFilters = {
                ...(orgId && { organization_id: orgId }),
                ...(filters.journey_phase && {
                  journey_phase: filters.journey_phase,
                }),
              };
              onFiltersChange?.(newFilters);
            }}
            onTeamSelect={(teamId, teamName) => {
              onTeamNameChange(teamName);
              const newFilters: UsersTableFilters = {
                ...(filters.organization_id && {
                  organization_id: filters.organization_id,
                }),
                ...(teamId && { team_id: teamId }),
                ...(filters.journey_phase && {
                  journey_phase: filters.journey_phase,
                }),
              };
              onFiltersChange?.(newFilters);
            }}
            onClear={() => {
              onTeamNameChange(undefined);
              const newFilters: UsersTableFilters = {
                ...(filters.journey_phase && {
                  journey_phase: filters.journey_phase,
                }),
              };
              onFiltersChange?.(newFilters);
            }}
          />
          <JourneyPhaseFilter
            selectedPhase={filters.journey_phase}
            onPhaseSelect={(phase) => {
              onFiltersChange?.({ ...filters, journey_phase: phase });
            }}
          />
        </div>
      </div>
      <div className="md:hidden">
        <OrgTeamFilter
          selectedOrgId={filters.organization_id}
          selectedOrgName={selectedOrgName}
          selectedTeamId={filters.team_id}
          selectedTeamName={selectedTeamName}
          onOrgSelect={(orgId) => {
            onTeamNameChange(undefined);
            const newFilters: UsersTableFilters = {
              ...(orgId && { organization_id: orgId }),
              ...(filters.journey_phase && {
                journey_phase: filters.journey_phase,
              }),
            };
            onFiltersChange?.(newFilters);
          }}
          onTeamSelect={(teamId, teamName) => {
            onTeamNameChange(teamName);
            const newFilters: UsersTableFilters = {
              ...(filters.organization_id && {
                organization_id: filters.organization_id,
              }),
              ...(teamId && { team_id: teamId }),
              ...(filters.journey_phase && {
                journey_phase: filters.journey_phase,
              }),
            };
            onFiltersChange?.(newFilters);
          }}
          onClear={() => {
            onTeamNameChange(undefined);
            const newFilters: UsersTableFilters = {
              ...(filters.journey_phase && {
                journey_phase: filters.journey_phase,
              }),
            };
            onFiltersChange?.(newFilters);
          }}
        />
      </div>
      <div className="md:hidden">
        <JourneyPhaseFilter
          selectedPhase={filters.journey_phase}
          onPhaseSelect={(phase) => {
            onFiltersChange?.({ ...filters, journey_phase: phase });
          }}
        />
      </div>
    </div>
  );
}
