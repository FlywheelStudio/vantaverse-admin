'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import {
  calculateOverallCompletion,
  getProgressColor,
} from '../program-status/card-utils';

interface ProgramAssignmentCardProps {
  assignment: ProgramAssignmentWithTemplate | null;
}

export function ProgramAssignmentCard({
  assignment,
}: ProgramAssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasAssignment = assignment !== null;
  const color = 'var(--color-primary)';

  const getStatusLabel = () => {
    if (hasAssignment) return 'Assigned';
    return 'Not Assigned';
  };

  const statusBadgeClass = () => {
    if (hasAssignment) {
      return 'bg-[oklch(0.94_0.04_155)] text-[oklch(0.32_0.12_155)] border-[oklch(0.87_0.1_155)]';
    }
    return 'border-border bg-muted/30 text-muted-foreground';
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
    <Card
      className={cn(
        'gap-0 border transition-all duration-300 overflow-hidden',
        !hasAssignment
          ? 'opacity-50 pointer-events-none shadow-none'
          : 'hover:shadow-[var(--shadow-lg)]',
      )}
      style={{ borderColor: color, minHeight: '166px' }}
    >
      {/* Card Header */}
      <div
        className="bg-muted/10"
        onClick={() => hasAssignment && setIsExpanded(!isExpanded)}
      >
        {/* Title and Badge Section */}
        <div
          className={cn('p-4 border-b-2', hasAssignment && 'cursor-pointer')}
          style={{ borderColor: color }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="font-semibold text-foreground text-lg truncate">
                6. Program Assignment
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className={cn('font-semibold border', statusBadgeClass())}
              >
                {getStatusLabel()}
              </Badge>
              {hasAssignment && (
                <button
                  className={cn(
                    'transition-transform duration-200',
                    isExpanded && 'rotate-180',
                  )}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" style={{ color }} />
                  ) : (
                    <ChevronDown className="h-5 w-5" style={{ color }} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Collapsed Preview */}
        {!isExpanded && hasAssignment && (
          <div className="p-5 pt-4 px-2 space-y-2">
            {template?.name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" style={{ color }} />
                <span className="font-semibold text-foreground">
                  {template.name}
                </span>
              </div>
            )}
            {assignment.start_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
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
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && hasAssignment && (
          <motion.div
            className="bg-card overflow-hidden p-5"
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
              <CheckCircle2 className="h-5 w-5 text-[oklch(0.66_0.17_155)]" />
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

      {/* Disabled State Content */}
      {!hasAssignment && (
        <div className="p-5 text-center">
          <p className="text-sm text-muted-foreground">
            No program assigned yet.
          </p>
        </div>
      )}
    </Card>
  );
}
