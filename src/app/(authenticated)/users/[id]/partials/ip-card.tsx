'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatNumber } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// okLCH greenish color palette
const primaryGreen = 'oklch(0.55 0.2 150)';
const lightGreen = 'oklch(0.95 0.05 150)';
const progressUnfilledGreen = 'oklch(0.85 0.08 150)';
const darkGray = 'oklch(0.25 0 0)';

interface IpCardProps {
  empowerment: number | null;
  empowermentTitle: string | null;
  currentEffect: string | null;
  gateTitle: string | null;
  gateDescription: string | null;
  pointsMissingForNextLevel: number | null;
  basePower: number | null;
  topPower: number | null;
  transactions: Array<{
    created_at: string | null;
    amount: number;
    transaction_type: string;
    description: string | null;
  }>;
}

export function IpCard({
  empowerment,
  empowermentTitle,
  currentEffect,
  gateTitle,
  gateDescription,
  pointsMissingForNextLevel,
  basePower,
  topPower,
  transactions,
}: IpCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const empowermentValue = empowerment ?? 0;
  const pointsMissing = pointsMissingForNextLevel;
  const isMaxLevel = pointsMissing === null;

  // Calculate progress percentage toward next level
  const calculateProgress = () => {
    if (isMaxLevel || pointsMissing === null) return 100;
    if (basePower === null || topPower === null) return 0;

    // Calculate next threshold base power
    const nextBasePower = empowermentValue + pointsMissing;
    const totalRange = nextBasePower - basePower;

    if (totalRange === 0) return 100;

    const currentProgress = empowermentValue - basePower;
    const progressPercentage = Math.min(
      (currentProgress / totalRange) * 100,
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

  const color = primaryGreen;

  return (
    <Card
      className={cn(
        'border gap-2 overflow-hidden cursor-pointer'
      )}
      style={{
        minHeight: '166px',
        borderColor: primaryGreen,
        background: `linear-gradient(135deg, ${lightGreen} 0%, white 100%)`
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Card Header */}
      <div>
        {/* Title and Badge Section */}
        <div className="pt-4 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <Shield className="shrink-0 w-5 h-5" style={{ color: primaryGreen }} />
              <h3 className="text-xs truncate" style={{ color: darkGray }}>
                Empowerment
              </h3>
            </div>
            {isExpanded && (
              <div className="flex items-center gap-2 shrink-0">
                <ChevronUp className="h-5 w-5" style={{ color }} />
              </div>
            )}
          </div>
        </div>

        {/* Collapsed Preview */}
        {!isExpanded && (
          <div
            className="px-4 py-2 flex flex-col justify-center relative"
          >
            <div className="space-y-2">
              <div className="text-3xl font-bold text-start" style={{ color: primaryGreen }}>
                {empowermentValue}%
              </div>
              <div className="w-full">
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: progressUnfilledGreen }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${empowermentValue}%`,
                      backgroundColor: primaryGreen
                    }}
                  />
                </div>
              </div>
              <div className="text-xs font-semibold text-start pt-1" style={{ color: primaryGreen }}>
                {empowermentTitle || 'Empowered'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${lightGreen} 0%, white 100%)`
            }}
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
              {/* Gate Title and Description */}
              {gateTitle && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    {gateTitle}
                  </h4>
                  {gateDescription && (
                    <p className="text-sm text-muted-foreground">
                      {gateDescription}
                    </p>
                  )}
                </div>
              )}

              {/* Current Stats */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Empowerment:
                  </span>
                </div>

                {empowermentTitle && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {empowermentValue}%
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {empowermentTitle}
                    </span>
                  </div>
                )}

                {currentEffect && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Current Effect:
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {currentEffect}
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                {!isMaxLevel && pointsMissing !== null && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress to Next Level</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(pointsMissing)} points needed
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
                <h4 className="font-semibold text-foreground px-4 pb-2">
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
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                            {tx.amount > 0 ? '+' : ''}
                            {formatNumber(tx.amount)} IP
                          </span>
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
