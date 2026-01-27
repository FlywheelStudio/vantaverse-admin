'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Medal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatNumber } from '@/lib/utils';
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

// okLCH purple color palette
const startPurple = 'oklch(63.41% 0.2528 306.97)';
const targetPurple = 'oklch(54.62% 0.2318 261.71)';

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

  const color = startPurple;

  return (
    <Card
      className={cn(
        'border border-border gap-2 overflow-hidden relative',
      )}
      style={{
        minHeight: '166px',
        background: `linear-gradient(135deg, ${startPurple} 0%, ${targetPurple} 100%)`,
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-30 pointer-events-none"
        style={{
          background: startPurple,
          transform: 'translate(50%, -50%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-30 pointer-events-none"
        style={{
          background: startPurple,
          transform: 'translate(-50%, 50%)',
        }}
      />

      {/* Card Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer relative"
      >

        {/* Title and Badge Section */}
        <div className="pt-4 px-4 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Medal className="shrink-0 w-5 h-5 text-white" />
              <h3 className="font-semibold text-white text-lg truncate uppercase">VantaPoints</h3>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                className={cn(
                  'transition-transform duration-200',
                  isExpanded && 'rotate-180',
                )}
              >
                {isExpanded && (
                  <ChevronUp className="h-5 w-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsed Preview */}
        {!isExpanded && (
          <div className="px-4 py-6 flex flex-col items-start justify-center relative z-10">
            <div className="text-5xl font-bold text-white mb-2">
              Level {level}
            </div>
            {!isMaxLevel && pointsNeeded !== null && (
              <div className="flex items-center justify-between w-full text-xs text-white/90 mt-4">
                <span>Progress to Level {level + 1}</span>
                <span>{formatNumber(pointsNeeded)} pts</span>
              </div>
            )}
            {!isMaxLevel && pointsNeeded !== null && (
              <div className="w-full mt-2 h-2 rounded-full overflow-hidden bg-white/20">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="overflow-hidden relative"
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
                  <div className="relative w-16 h-16 shrink-0 bg-background/70 backdrop-blur-sm rounded-[var(--radius-lg)] p-3 shadow-[var(--shadow-md)] border border-border/50">
                    <Image
                      src={levelImageUrl}
                      alt={`Level ${level} icon`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  {levelDescription && (
                    <p className="text-lg text-white/90 flex-1">
                      {levelDescription}
                    </p>
                  )}
                </div>
              )}

              {/* Current Stats */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-white/80">
                    Current Level:
                  </span>
                  <span className="text-sm font-semibold text-white">
                    Level {level}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-white/80">
                    Vanta Points:
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {formatNumber(points)}
                  </span>
                </div>

                {currentPhase && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-white/80">
                      Current Phase:
                    </span>
                    <span className="text-sm font-semibold text-white">
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
                    <div className="flex items-center justify-between text-xs text-white/90">
                      <span>Progress to Level {level + 1}</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden bg-white/20">
                      <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/80">
                      {formatNumber(pointsNeeded)} points needed
                    </p>
                  </div>
                )}

                {isMaxLevel && (
                  <div className="pt-2">
                    <Badge
                      variant="outline"
                      className="font-semibold border-white/20 bg-white/10 text-white"
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
                className="pt-4 border-t border-white/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <h4 className="font-semibold text-white px-4 pb-2">
                  Transaction History
                </h4>
                <motion.div
                  className="space-y-3 px-4 pb-4 max-h-[200px] overflow-y-auto scrollbar-thin"
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
                      className="flex items-start justify-between gap-3 p-3 bg-white/10 rounded-[var(--radius-lg)]"
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
                            className="text-xs border-white/20 bg-white/10 text-white"
                          >
                            {formatTransactionType(tx.transaction_type)}
                          </Badge>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          +{formatNumber(tx.points_earned)} HP
                        </span>
                        {tx.description && (
                          <p className="text-xs text-white/80 mt-1">
                            {tx.description}
                          </p>
                        )}
                        <p className="text-xs text-white/70 mt-1">
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
                className="pt-4 px-4 pb-4 text-sm text-white/80"
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
