'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
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

  const color = 'var(--color-primary)';

  return (
    <Card
      className={cn(
        'border border-border gap-2 overflow-hidden',
      )}
      style={{ minHeight: '166px' }}
    >
      {/* Card Header */}
      <div
        className="bg-muted/10"
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
              <h3 className="font-semibold text-foreground text-lg truncate">Vanta Points</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isExpanded && (
                <Badge
                  variant="outline"
                  className="font-semibold border border-primary/20 bg-primary/10 text-primary"
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
          <div className="p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">
                Level {level}
              </div>
              {!isMaxLevel && pointsNeeded !== null && (
                <div className="text-xs text-muted-foreground">
                  {formatNumber(pointsNeeded)} pts to Level {level + 1}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="bg-card overflow-hidden"
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
                    <p className="text-sm text-muted-foreground flex-1">
                      {levelDescription}
                    </p>
                  )}
                </div>
              )}

              {/* Current Stats */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Current Level:
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    Level {level}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Vanta Points:
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatNumber(points)}
                  </span>
                </div>

                {currentPhase && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Current Phase:
                    </span>
                    <span className="text-sm font-semibold text-foreground">
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress to Level {level + 1}</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(pointsNeeded)} points needed
                    </p>
                  </div>
                )}

                {isMaxLevel && (
                  <div className="pt-2">
                    <Badge
                      variant="outline"
                      className="font-semibold border border-primary/20 bg-primary/10 text-primary"
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
                className="pt-4 border-t border-border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <h4 className="font-semibold text-foreground mb-3 px-4 pb-4">
                  Transaction History
                </h4>
                <motion.div
                  className="space-y-3 px-4 pb-4 max-h-48 overflow-y-auto scrollbar-thin"
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
                      className="flex items-start justify-between gap-3 p-3 bg-muted/30 rounded-[var(--radius-lg)]"
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
                            className="text-xs border border-primary/20 bg-primary/10 text-primary"
                          >
                            {formatTransactionType(tx.transaction_type)}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">
                            +{formatNumber(tx.points_earned)} HP
                          </span>
                        </div>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {tx.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
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
                className="pt-4 px-4 pb-4 text-sm text-muted-foreground"
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
