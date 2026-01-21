'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/workout-schedule/utils';
import {
  parseCompletion,
  calculateOverallCompletion,
  getProgressColor,
} from './card-utils';
import { ProgramStatusWeekCard } from './week-card';
import { AssignProgramModal } from '../partials/assign-program-modal';
import { useDeleteProgram } from '../hooks/use-user-mutations';
import { useQueryClient } from '@tanstack/react-query';

interface ProgramStatusCardProps {
  assignment: ProgramAssignmentWithTemplate | null;
  schedule: DatabaseSchedule | null;
  completion: Array<Array<unknown>> | null | undefined;
  exerciseNamesMap: Map<string, string>;
  groupsMap: Map<string, { exercise_template_ids: string[] | null }>;
  userId: string;
  userFirstName?: string | null;
  userLastName?: string | null;
}

export function ProgramStatusCard({
  assignment,
  schedule,
  completion,
  exerciseNamesMap,
  groupsMap,
  userId,
  userFirstName,
  userLastName,
}: ProgramStatusCardProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteProgram = useDeleteProgram(userId);

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

  const handleEditProgram = () => {
    if (assignment?.id) {
      router.push(`/builder/${assignment.id}?from=/users/${userId}`);
    }
  };

  const handleAssignSuccess = () => {
    // Invalidate and refetch user's program assignment
    queryClient.invalidateQueries({ 
      queryKey: ['program-assignment', userId] 
    });
    // Reload the page to show updated assignment
    router.refresh();
  };

  const handleDelete = async () => {
    if (!assignment?.id) {
      return;
    }

    await deleteProgram.mutateAsync(assignment.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        // Reload the page to show updated assignment
        router.refresh();
      },
    });
  };

  if (!assignment) {
    return (
      <Card
        className="w-full col-span-full rounded-3xl p-2 border-2 transition-all gap-2 duration-300 overflow-hidden shadow-xl bg-white"
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
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="shrink-0 bg-red-500 hover:bg-red-600 text-white"
              >
                Assign Program
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[#1E3A5F]">
                  No program assigned
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Assign a program to start tracking weekly completion and schedule progress.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <AssignProgramModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          userId={userId}
          onAssignSuccess={handleAssignSuccess}
          userFirstName={userFirstName}
          userLastName={userLastName}
        />
      </Card>
    );
  }

  const template = assignment.program_template;
  const totalWeeks = template?.weeks || 0;
  const overallCompletion = calculateOverallCompletion(
    assignment.start_date,
    totalWeeks,
  );
  const isDeleting = deleteProgram.isPending;

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
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={assignment ? handleEditProgram : () => setIsModalOpen(true)}
                variant="outline"
                size="sm"
              >
                {assignment ? 'Edit Program' : 'Assign Program'}
              </Button>
              {assignment && (
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete Program</p>
                    </TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Program</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &ldquo;{template?.name || 'this program'}&rdquo;?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer" disabled={isDeleting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="cursor-pointer"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
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
      <AssignProgramModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        userId={userId}
        onAssignSuccess={handleAssignSuccess}
        userFirstName={userFirstName}
        userLastName={userLastName}
      />
    </Card>
  );
}
