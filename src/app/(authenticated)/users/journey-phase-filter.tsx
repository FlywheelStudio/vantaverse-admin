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
        <DropdownMenuItem
          onClick={() => onPhaseSelect(undefined)}
          data-selected={!selectedPhase}
          className="cursor-pointer data-[selected=true]:bg-[#2454FF]/10! data-[selected=true]:focus:bg-[#2454FF]/10!"
        >
          All Phases
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onPhaseSelect('discovery')}
          data-selected={selectedPhase === 'discovery'}
          className="cursor-pointer data-[selected=true]:bg-[#2454FF]/10! data-[selected=true]:focus:bg-[#2454FF]/10!"
        >
          Discovery
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onPhaseSelect('onboarding')}
          data-selected={selectedPhase === 'onboarding'}
          className="cursor-pointer data-[selected=true]:bg-[#2454FF]/10! data-[selected=true]:focus:bg-[#2454FF]/10!"
        >
          Onboarding
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onPhaseSelect('scaffolding')}
          data-selected={selectedPhase === 'scaffolding'}
          className="cursor-pointer data-[selected=true]:bg-[#2454FF]/10! data-[selected=true]:focus:bg-[#2454FF]/10!"
        >
          Scaffolding
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
