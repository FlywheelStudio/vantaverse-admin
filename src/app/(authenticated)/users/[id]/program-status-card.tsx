'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/workout-schedule/utils';
import {
  parseCompletion,
  calculateOverallCompletion,
  getProgressColor,
} from './program-status-card-utils';
import { ProgramStatusWeekCard } from './program-status-week-card';

interface ProgramStatusCardProps {
  assignment: ProgramAssignmentWithTemplate | null;
  schedule: DatabaseSchedule | null;
  completion: Array<Array<unknown>> | null | undefined;
  exerciseNamesMap: Map<string, string>;
  groupsMap: Map<string, { exercise_template_ids: string[] | null }>;
}

export function ProgramStatusCard({
  assignment,
  schedule,
  completion,
  exerciseNamesMap,
  groupsMap,
}: ProgramStatusCardProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  const parsedCompletion = parseCompletion(completion);
  const color = 'var(--color-cyan-600)';

  const toggleWeek = (weekIndex: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekIndex)) {
      newExpanded.delete(weekIndex);
    } else {
      newExpanded.add(weekIndex);
    }
    setExpandedWeeks(newExpanded);
  };

  if (!assignment) {
    return (
      <Card className="w-full col-span-full rounded-3xl p-2 border-2 overflow-hidden shadow-xl bg-amber-200/50">
        <CardContent className="p-6">
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Program Assigned</AlertTitle>
            <AlertDescription>
              This user does not have an active program assignment.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const template = assignment.program_template;
  const totalWeeks = template?.weeks || 0;
  const overallCompletion = calculateOverallCompletion(
    assignment.start_date,
    totalWeeks,
  );

  return (
    <Card
      className={cn(
        'w-full col-span-full rounded-3xl p-2 border-2 transition-all gap-2 duration-300 overflow-hidden shadow-xl bg-white',
      )}
      style={{ borderColor: color }}
    >
      <div className="bg-linear-to-b from-white to-gray-50/30">
        <div className={cn('p-4 border-b-2')} style={{ borderColor: color }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="font-bold text-[#1E3A5F] text-lg truncate">
                Program Status
              </h3>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Program Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#64748B]">
              Program Name:
            </span>
            {template?.id ? (
              <Link
                href={`/builder/${template.id}`}
                className="text-sm font-semibold text-[#1E3A5F] hover:text-cyan-600 hover:underline transition-colors duration-200"
              >
                {template.name}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-[#1E3A5F]">N/A</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#64748B]">
              Overall Completion:
            </span>
            <span className="text-sm font-semibold text-[#1E3A5F]">
              {overallCompletion}%
            </span>
          </div>
          <Progress
            value={overallCompletion}
            className="h-2 mt-2"
            indicatorColor={getProgressColor(overallCompletion)}
          />
        </div>

        {/* Weeks */}
        {schedule && schedule.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#1E3A5F] mb-3">
              Workout Schedule
            </h3>
            {schedule.map((week, weekIndex) => (
              <ProgramStatusWeekCard
                key={weekIndex}
                week={week}
                weekIndex={weekIndex}
                startDate={assignment.start_date}
                isExpanded={expandedWeeks.has(weekIndex)}
                onToggle={() => toggleWeek(weekIndex)}
                parsedCompletion={parsedCompletion}
                exerciseNamesMap={exerciseNamesMap}
                groupsMap={groupsMap}
              />
            ))}
          </div>
        )}

        {(!schedule || schedule.length === 0) && (
          <div className="text-sm text-[#64748B] text-center py-4">
            No workout schedule available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
