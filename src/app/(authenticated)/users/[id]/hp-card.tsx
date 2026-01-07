'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trophy,
  TrendingUp,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

interface HpCardProps {
  currentLevel: number | null;
  hpPoints: number | null;
  pointsRequiredForNextLevel: number | null;
  currentPhase: string | null;
  levelDescription: string | null;
  levelImageUrl: string | null;
  transactions: Array<{
    created_at: string | null;
    points_earned: number;
    transaction_type: string;
    description: string | null;
  }>;
}

export function HpCard({
  currentLevel,
  hpPoints,
  pointsRequiredForNextLevel,
  currentPhase,
  levelDescription,
  levelImageUrl,
  transactions,
}: HpCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const level = currentLevel ?? 1;
  const points = hpPoints ?? 0;
  const pointsNeeded = pointsRequiredForNextLevel;
  const isMaxLevel = pointsNeeded === null;

  // Calculate progress percentage
  const calculateProgress = () => {
    if (isMaxLevel || pointsNeeded === null) return 100;
    if (pointsNeeded === 0) return 100;
    // Get current level's minimum points from transactions or use 0
    const currentLevelMinPoints = 0; // This would ideally come from hp_level_thresholds
    const progressPoints = points - currentLevelMinPoints;
    const progressPercentage = Math.min(
      (progressPoints / pointsNeeded) * 100,
      100,
    );
    return Math.max(progressPercentage, 0);
  };

  const progressPercentage = calculateProgress();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTransactionType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const color = 'var(--color-purple-600)';

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
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Title and Badge Section */}
        <div
          className={cn('p-4 border-b-2 cursor-pointer')}
          style={{ borderColor: color }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="font-bold text-[#1E3A5F] text-lg truncate">
                Vanta Points
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isExpanded && (
                <Badge
                  variant="outline"
                  className="font-semibold border"
                  style={{
                    backgroundColor: `${color}1A`,
                    color: color,
                    borderColor: `${color}4D`,
                  }}
                >
                  Level {level}
                </Badge>
              )}
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
          </div>
        </div>

        {/* Collapsed Preview */}
        {!isExpanded && (
          <div className="p-5 pt-4 px-2 space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <Trophy className="h-4 w-4" style={{ color }} />
              <span className="font-semibold text-[#1E3A5F]">
                {points.toLocaleString()} VP
              </span>
            </div>
            {!isMaxLevel && pointsNeeded !== null && (
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <TrendingUp className="h-4 w-4" />
                <span>
                  {pointsNeeded.toLocaleString()} points needed for next level
                </span>
              </div>
            )}
            {isMaxLevel && (
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Award className="h-4 w-4" />
                <span>Maximum level reached</span>
              </div>
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
            {/* Current Status Section */}
            <motion.div
              className="p-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              {/* Level Icon and Description */}
              {levelImageUrl && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-16 h-16 shrink-0">
                    <Image
                      src={levelImageUrl}
                      alt={`Level ${level} icon`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  {levelDescription && (
                    <p className="text-sm text-[#64748B] flex-1">
                      {levelDescription}
                    </p>
                  )}
                </div>
              )}

              {/* Current Stats */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-[#64748B]">
                    Current Level:
                  </span>
                  <span className="text-sm font-semibold text-[#1E3A5F]">
                    Level {level}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-[#64748B]">
                    Vanta Points:
                  </span>
                  <span className="text-sm font-semibold text-[#1E3A5F]">
                    {points.toLocaleString()}
                  </span>
                </div>

                {currentPhase && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-[#64748B]">
                      Current Phase:
                    </span>
                    <span className="text-sm font-semibold text-[#1E3A5F]">
                      {currentPhase
                        .split('_')
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(' ')}
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                {!isMaxLevel && pointsNeeded !== null && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>Progress to Level {level + 1}</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-[#64748B]">
                      {pointsNeeded.toLocaleString()} points needed
                    </p>
                  </div>
                )}

                {isMaxLevel && (
                  <div className="pt-2">
                    <Badge
                      variant="outline"
                      className="font-semibold"
                      style={{
                        backgroundColor: `${color}1A`,
                        color: color,
                        borderColor: `${color}4D`,
                      }}
                    >
                      Maximum Level Achieved
                    </Badge>
                  </div>
                )}
              </div>
            </motion.div>

            {/* History Section */}
            {transactions.length > 0 && (
              <motion.div
                className="pt-4 border-t border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <h4 className="font-bold text-[#1E3A5F] mb-3 px-4 pb-4">
                  Transaction History
                </h4>
                <motion.div
                  className="space-y-3 px-4 pb-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.25,
                      },
                    },
                  }}
                >
                  {transactions.map((tx, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start justify-between gap-3 p-3 bg-[#F5F7FA] rounded-lg"
                      variants={{
                        hidden: { opacity: 0, y: -8 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              backgroundColor: `${color}1A`,
                              color: color,
                              borderColor: `${color}4D`,
                            }}
                          >
                            {formatTransactionType(tx.transaction_type)}
                          </Badge>
                          <span className="text-sm font-semibold text-[#1E3A5F]">
                            +{tx.points_earned.toLocaleString()} HP
                          </span>
                        </div>
                        {tx.description && (
                          <p className="text-xs text-[#64748B] mt-1">
                            {tx.description}
                          </p>
                        )}
                        <p className="text-xs text-[#64748B] mt-1">
                          {formatDate(tx.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {transactions.length === 0 && (
              <motion.div
                className="pt-4 px-4 pb-4 text-sm text-[#64748B]"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                No transaction history available.
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
