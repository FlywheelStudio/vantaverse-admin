'use client';

import { CollapsibleSection } from '../collapsible-section';
import { WeekNavigation } from './week-navigation';
import { DayBoxesGrid } from './day-boxes-grid';

interface BuildWorkoutSectionProps {
  initialWeeks: number;
}

export function BuildWorkoutSection({
  initialWeeks,
}: BuildWorkoutSectionProps) {
  return (
    <CollapsibleSection title="Build Workout" defaultOpen={true}>
      <div className="space-y-6">
        <WeekNavigation initialWeeks={initialWeeks} />
        <DayBoxesGrid />
      </div>
    </CollapsibleSection>
  );
}
