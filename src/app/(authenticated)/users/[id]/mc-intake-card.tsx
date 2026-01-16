'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Briefcase,
  Activity,
  Calendar,
  Clock,
  AlertCircle,
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

  const color = 'var(--color-blue-600)';
  const hasSymptoms = survey?.symptoms && survey.symptoms.length > 0;
  const hasHealthConditions =
    survey?.health_conditions && survey.health_conditions.length > 0;
  const hasPreconditions = survey?.preconditions === true;

  return (
    <Card
      className={cn(
        'rounded-3xl p-2 border-2 transition-all gap-2 duration-300 overflow-hidden hover:shadow-xl bg-white',
      )}
      style={{ borderColor: color, minHeight: '166px' }}
    >
      {/* Card Header */}
      <div
        className="bg-linear-to-b from-white to-gray-50/30"
        onClick={survey !== null ? () => setIsExpanded(!isExpanded) : undefined}
      >
        {/* Title and Badge Section */}
        <div
          className={cn('p-4 border-b-2', survey !== null && 'cursor-pointer')}
          style={{ borderColor: color }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="font-bold text-[#1E3A5F] text-lg truncate">
                MC Intake
              </h3>
            </div>
            {survey !== null && (
              <div className="flex items-center gap-2 shrink-0">
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
              </div>
            )}
          </div>
        </div>

        {/* Collapsed Preview */}
        {!isExpanded && (
          <div className="p-5 pt-4 px-2 space-y-2">
            {survey !== null ? (
              <>
                {survey.occupation && (
                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
                    <Briefcase className="h-4 w-4" style={{ color }} />
                    <span className="font-semibold text-[#1E3A5F]">
                      {survey.occupation}
                    </span>
                  </div>
                )}
                {survey.activity_level && (
                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
                    <Activity className="h-4 w-4" />
                    <span>{survey.activity_level}</span>
                  </div>
                )}
                {(survey.commitment_days !== null ||
                  survey.commitment_minutes !== null) && (
                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
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
              </>
            ) : (
              <p className="text-sm text-[#64748B] italic">
                Survey not completed yet
              </p>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="bg-white overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.div
              className="p-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              {survey !== null ? (
                <div className="space-y-3">
                  {/* Occupation */}
                  {survey.occupation && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-[#64748B] min-w-[140px]">
                        Occupation:
                      </span>
                      <span className="text-sm font-semibold text-[#1E3A5F]">
                        {survey.occupation}
                      </span>
                    </div>
                  )}

                  {/* Activity Level */}
                  {survey.activity_level && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-[#64748B] min-w-[140px]">
                        Activity Level:
                      </span>
                      <span className="text-sm font-semibold text-[#1E3A5F]">
                        {survey.activity_level}
                      </span>
                    </div>
                  )}

                  {/* Commitment */}
                  {(survey.commitment_days !== null ||
                    survey.commitment_minutes !== null) && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-[#64748B] min-w-[140px]">
                        Commitment:
                      </span>
                      <div className="flex items-center gap-3">
                        {survey.commitment_days !== null && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-[#64748B]" />
                            <span className="text-sm font-semibold text-[#1E3A5F]">
                              {survey.commitment_days} days/week
                            </span>
                          </div>
                        )}
                        {survey.commitment_minutes !== null && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-[#64748B]" />
                            <span className="text-sm font-semibold text-[#1E3A5F]">
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
                      <span className="text-sm font-medium text-[#64748B] min-w-[140px]">
                        Symptoms:
                      </span>
                      <div className="flex flex-wrap gap-2 flex-1">
                        {survey.symptoms.map((symptom, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                            style={{
                              backgroundColor: `${color}1A`,
                              color: color,
                              borderColor: `${color}4D`,
                            }}
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
                      <span className="text-sm font-medium text-[#64748B] min-w-[140px]">
                        Health Conditions:
                      </span>
                      <div className="flex flex-wrap gap-2 flex-1">
                        {survey.health_conditions.map((condition, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                            style={{
                              backgroundColor: `${color}1A`,
                              color: color,
                              borderColor: `${color}4D`,
                            }}
                          >
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preconditions */}
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-[#64748B] min-w-[140px]">
                      Preconditions:
                    </span>
                    <div className="flex flex-col gap-2 flex-1">
                      {hasPreconditions ? (
                        <>
                          <Badge
                            variant="outline"
                            className="text-xs w-fit"
                            style={{
                              backgroundColor: '#FF4D6D1A',
                              color: '#FF4D6D',
                              borderColor: '#FF4D6D4D',
                            }}
                          >
                            Yes
                          </Badge>
                          {survey.preconditions_details && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-[#FF4D6D] shrink-0 mt-0.5" />
                              <span className="text-sm text-[#64748B]">
                                {survey.preconditions_details}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs w-fit"
                          style={{
                            backgroundColor: '#00C8961A',
                            color: '#00C896',
                            borderColor: '#00C8964D',
                          }}
                        >
                          No
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-[#64748B] italic">
                    Survey not completed yet
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
