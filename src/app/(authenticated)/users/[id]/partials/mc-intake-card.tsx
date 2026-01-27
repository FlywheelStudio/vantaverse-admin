'use client';

import { useState } from 'react';
import {
  ChevronUp,
  ClipboardList,
  Briefcase,
  Activity,
  Calendar,
  Clock,
  AlertCircle,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { McIntakeSurvey } from '@/lib/supabase/queries/mc-intake';

interface McIntakeCardProps {
  survey: McIntakeSurvey | null;
}

export function McIntakeCard({ survey }: McIntakeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isSigned = survey !== null;
  const hasSymptoms = survey?.symptoms && survey.symptoms.length > 0;
  const hasHealthConditions =
    survey?.health_conditions && survey.health_conditions.length > 0;
  const hasPreconditions = survey?.preconditions === true;

  // Color scheme based on signed status
  const getColorScheme = () => {
    if (isSigned) {
      // Green variants (signed)
      return {
        border: 'oklch(0.87 0.05 155)',
        text: 'oklch(0.32 0.05 155)',
        bg: 'oklch(0.94 0.04 155)',
        icon: 'oklch(0.55 0.05 155)',
      };
    }
    // Default/muted (not signed)
    return {
      border: 'oklch(0.9 0.01 0)',
      text: 'oklch(0.5 0.01 0)',
      bg: 'oklch(0.96 0.01 0)',
      icon: 'oklch(0.6 0.01 0)',
    };
  };

  const colorScheme = getColorScheme();

  return (
    <Card
      className={cn(
        'gap-0 border transition-all duration-300 overflow-hidden',
        !isExpanded && 'min-h-0',
        isSigned && 'hover:shadow-[var(--shadow-lg)]',
      )}
      style={{
        borderColor: colorScheme.border,
        backgroundColor: colorScheme.bg,
      }}
    >
      {/* Card Header */}
      <div
        style={{ backgroundColor: colorScheme.bg }}
        onClick={() => isSigned && setIsExpanded(!isExpanded)}
      >
        {/* Title and Badge Section */}
        <div className={cn('p-3', isSigned && 'cursor-pointer')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex flex-col items-center shrink-0">
                {isSigned ? (
                  <Check
                    className="h-5 w-5"
                    style={{ color: colorScheme.icon }}
                  />
                ) : (
                  <ClipboardList
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
                  2. Intake Survey
                </h3>
                {isSigned && (
                  <Badge
                    variant="outline"
                    className="font-semibold border shrink-0"
                    style={{
                      borderColor: colorScheme.border,
                      backgroundColor: colorScheme.bg,
                      color: colorScheme.text,
                    }}
                  >
                    Signed
                  </Badge>
                )}
              </div>
            </div>
            {isSigned && isExpanded && (
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
        {!isExpanded && isSigned && (
          <div className="px-3 pb-3 space-y-2">
            {survey.occupation && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span className="font-semibold text-foreground">
                  {survey.occupation}
                </span>
              </div>
            )}
            {survey.activity_level && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>{survey.activity_level}</span>
              </div>
            )}
            {(survey.commitment_days !== null ||
              survey.commitment_minutes !== null) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {survey.commitment_days !== null &&
                  survey.commitment_minutes !== null
                    ? `${survey.commitment_days} days, ${survey.commitment_minutes} min/week`
                    : survey.commitment_days !== null
                      ? `${survey.commitment_days} days/week`
                      : `${survey.commitment_minutes} min/week`}
                </span>
              </div>
            )}
          </div>
        )}

        {!isSigned && (
          <div className="px-3 pb-3">
            <p className="text-sm text-muted-foreground italic">
              Survey not completed yet
            </p>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && isSigned && (
          <motion.div
            className="overflow-hidden p-5"
            style={{ backgroundColor: colorScheme.bg }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              {/* Occupation */}
              {survey.occupation && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                    Occupation:
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {survey.occupation}
                  </span>
                </div>
              )}

              {/* Activity Level */}
              {survey.activity_level && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                    Activity Level:
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {survey.activity_level}
                  </span>
                </div>
              )}

              {/* Commitment */}
              {(survey.commitment_days !== null ||
                survey.commitment_minutes !== null) && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                    Commitment:
                  </span>
                  <div className="flex items-center gap-3">
                    {survey.commitment_days !== null && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">
                          {survey.commitment_days} days/week
                        </span>
                      </div>
                    )}
                    {survey.commitment_minutes !== null && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">
                          {survey.commitment_minutes} min/week
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Symptoms */}
              {hasSymptoms && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                    Symptoms:
                  </span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {survey.symptoms.map((symptom, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs border border-primary/20 bg-primary/10 text-primary"
                      >
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Health Conditions */}
              {hasHealthConditions && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                    Health Conditions:
                  </span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {survey.health_conditions.map((condition, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs border border-primary/20 bg-primary/10 text-primary"
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Preconditions */}
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                  Preconditions:
                </span>
                <div className="flex flex-col gap-2 flex-1">
                  {hasPreconditions ? (
                    <>
                      <Badge
                        variant="outline"
                        className="text-xs w-fit border border-destructive/20 bg-destructive/10 text-destructive"
                      >
                        Yes
                      </Badge>
                      {survey.preconditions_details && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            {survey.preconditions_details}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs w-fit bg-[oklch(0.94 0.04 155)] text-[oklch(0.32 0.05 155)] border-[oklch(0.87 0.05 155)]"
                    >
                      No
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
