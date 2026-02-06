'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronUp,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import {
  calculateOverallCompletion,
  getProgressColor,
} from '../program-status/card-utils';
import { AssignProgramModal } from './assign-program-modal';
import { MIN_GATES_FOR_PROGRAM_ASSIGNMENT } from '@/lib/supabase/queries/program-assignments';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProgramAssignmentCardProps {
  assignment: ProgramAssignmentWithTemplate | null;
  organizations?: Array<{ id: string; name: string; description: string | null }>;
  userId: string;
  userFirstName?: string | null;
  userLastName?: string | null;
  maxGateUnlocked?: number | null;
}

export function ProgramAssignmentCard({
  assignment,
  organizations,
  userId,
  userFirstName,
  userLastName,
  maxGateUnlocked,
}: ProgramAssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const wasModalOpenRef = useRef(false);

  // Refresh data when modal closes after being open (indicating a successful save)
  useEffect(() => {
    if (wasModalOpenRef.current && !modalOpen) {
      router.refresh();
    }
    wasModalOpenRef.current = modalOpen;
  }, [modalOpen, router]);

  const hasAssignment = assignment !== null;
  const hasOrganizations = organizations && organizations.length > 0;
  const canAssignProgram =
    (maxGateUnlocked ?? 0) >= MIN_GATES_FOR_PROGRAM_ASSIGNMENT;

  // Color scheme based on assigned status
  const getColorScheme = () => {
    if (hasAssignment) {
      // Green variants (assigned)
      return {
        border: 'oklch(0.87 0.05 155)',
        text: 'oklch(0.32 0.05 155)',
        bg: 'oklch(0.94 0.04 155)',
        icon: 'oklch(0.55 0.05 155)',
      };
    }
    // Default/muted (unassigned)
    return {
      border: 'oklch(0.9 0.01 0)',
      text: 'oklch(0.5 0.01 0)',
      bg: 'oklch(0.96 0.01 0)',
      icon: 'oklch(0.6 0.01 0)',
    };
  };

  const colorScheme = getColorScheme();

  const getStatusLabel = () => {
    if (hasAssignment) return 'Assigned';
    return 'Not Assigned';
  };

  const statusBadgeClass = () => {
    if (hasAssignment) {
      return 'border font-semibold';
    }
    return 'border-border bg-muted/30 text-muted-foreground';
  };

  const getStatusBadgeStyle = () => {
    if (hasAssignment) {
      return {
        borderColor: colorScheme.border,
        backgroundColor: colorScheme.bg,
        color: colorScheme.text,
      };
    }
    return {};
  };

  const handleCardClick = () => {
    if (hasOrganizations && !hasAssignment && canAssignProgram) {
      setModalOpen(true);
    } else if (hasOrganizations && hasAssignment) {
      setIsExpanded(!isExpanded);
    }
  };

  const template = assignment?.program_template;
  const totalWeeks = template?.weeks || 0;
  const overallCompletion = hasAssignment
    ? calculateOverallCompletion(assignment.start_date, totalWeeks)
    : 0;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card
        className={cn(
          'gap-0 border transition-all duration-300 overflow-hidden',
          !hasOrganizations && 'min-h-0 opacity-50 pointer-events-none shadow-none',
          hasAssignment && 'hover:shadow-(--shadow-lg)',
        )}
        style={{
          borderColor: colorScheme.border,
          backgroundColor: colorScheme.bg,
        }}
      >
        {/* Card Header */}
        <div
          style={{ backgroundColor: colorScheme.bg }}
          onClick={handleCardClick}
        >
          {/* Title and Badge Section */}
          <div
            className={cn(
              'p-3',
              (hasOrganizations && hasAssignment) ||
                (hasOrganizations && !hasAssignment && canAssignProgram)
                ? 'cursor-pointer'
                : '',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex flex-col items-center shrink-0">
                  {hasAssignment ? (
                    <Check
                      className="h-5 w-5"
                      style={{ color: colorScheme.icon }}
                    />
                  ) : (
                    <Calendar
                      className="h-5 w-5"
                      style={{ color: colorScheme.icon }}
                    />
                  )}
                  <div className="w-[2px] h-4 bg-gray-300 mt-1" />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3
                    className="font-semibold text-foreground text-base truncate"
                    style={{ color: colorScheme.text }}
                  >
                    6. Program Assignment
                  </h3>
                  {hasAssignment && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-semibold border shrink-0',
                        statusBadgeClass(),
                      )}
                      style={getStatusBadgeStyle()}
                    >
                      {getStatusLabel()}
                    </Badge>
                  )}
                </div>
              </div>
              {hasAssignment && isExpanded && (
                <button className="shrink-0">
                  <ChevronUp
                    className="h-5 w-5"
                    style={{ color: colorScheme.icon }}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Collapsed Preview */}
          {!isExpanded && hasAssignment && (
            <div className="px-3 pb-3 space-y-2">
              {template?.name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" style={{ color: colorScheme.icon }} />
                  <span className="font-semibold text-foreground">
                    {template.name}
                  </span>
                </div>
              )}
              {assignment.start_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" style={{ color: colorScheme.icon }} />
                  <span>
                    Started: {formatDate(assignment.start_date)} •{' '}
                    {overallCompletion}% Complete
                  </span>
                </div>
              )}
              {overallCompletion > 0 && (
                <Progress
                  value={overallCompletion}
                  className="h-2 mt-2"
                  indicatorColor={getProgressColor(overallCompletion)}
                />
              )}
            </div>
          )}

          {!hasOrganizations && (
            <div className="px-5 pb-5">
              <p className="text-sm text-muted-foreground italic">
                No group assigned
              </p>
            </div>
          )}

          {hasOrganizations && !hasAssignment && canAssignProgram && (
            <div className="px-5 pb-5">
              <p className="text-sm text-muted-foreground italic">
                No program assigned yet. Click to assign.
              </p>
            </div>
          )}

          {hasOrganizations && !hasAssignment && !canAssignProgram && (
            <div className="px-5 pb-5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-muted-foreground italic cursor-default">
                    Gate {maxGateUnlocked ?? 0}/5
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>User must complete all 5 gates</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && hasAssignment && (
            <motion.div
              className="overflow-hidden p-5"
              style={{ backgroundColor: colorScheme.bg }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <motion.div
                className="flex items-center gap-2 mb-3"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                <CheckCircle2 className="h-5 w-5 text-[oklch(0.66 0.05 155)]" />
                <h4 className="font-semibold text-foreground">Program Details</h4>
              </motion.div>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                {template?.name && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Program Name:
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {template.name}
                    </span>
                  </div>
                )}

                {assignment.start_date && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Started:
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatDate(assignment.start_date)}
                    </span>
                  </div>
                )}

                {assignment.end_date && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      End Date:
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatDate(assignment.end_date)}
                    </span>
                  </div>
                )}

                {totalWeeks > 0 && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Duration:
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {totalWeeks} {totalWeeks === 1 ? 'week' : 'weeks'}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Overall Completion:
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {overallCompletion}%
                  </span>
                </div>

                {overallCompletion > 0 && (
                  <div className="space-y-2 pt-2">
                    <Progress
                      value={overallCompletion}
                      className="h-2"
                      indicatorColor={getProgressColor(overallCompletion)}
                    />
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {hasOrganizations && organizations.length > 0 && canAssignProgram && (
        <AssignProgramModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          userId={userId}
          userFirstName={userFirstName}
          userLastName={userLastName}
          onAssignSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
