'use client';

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface JourneyPhaseFilterProps {
  selectedPhase?: string;
  onPhaseSelect: (phase?: string) => void;
}

export function JourneyPhaseFilter({
  selectedPhase,
  onPhaseSelect,
}: JourneyPhaseFilterProps) {
  const displayText =
    selectedPhase === 'discovery'
      ? 'Discovery'
      : selectedPhase === 'onboarding'
        ? 'Onboarding'
        : selectedPhase === 'scaffolding'
          ? 'Scaffolding'
          : 'All Phases';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-white border-[#2454FF]/20 rounded-xl text-[#1E3A5F] hover:bg-[#F5F7FA] min-w-[150px] justify-between"
        >
          {displayText}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[150px]">
        <DropdownMenuItem onClick={() => onPhaseSelect(undefined)}>
          All Phases
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPhaseSelect('discovery')}>
          Discovery
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPhaseSelect('onboarding')}>
          Onboarding
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPhaseSelect('scaffolding')}>
          Scaffolding
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
