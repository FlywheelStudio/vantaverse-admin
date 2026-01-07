'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, TrendingUp, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

  const color = 'var(--color-orange-600)';

  return (
    <Card
      className={cn(
        'rounded-3xl p-2 border-2 transition-all gap-0 duration-300 overflow-hidden hover:shadow-xl bg-white',
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
                Empowerment
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {empowermentTitle && !isExpanded && (
                <Badge
                  variant="outline"
                  className="font-semibold border"
                  style={{
                    backgroundColor: `${color}1A`,
                    color: color,
                    borderColor: `${color}4D`,
                  }}
                >
                  {empowermentTitle}
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
              <Zap className="h-4 w-4" style={{ color }} />
              <span className="font-semibold text-[#1E3A5F]">
                {empowermentValue}% -&gt; {gateTitle}
              </span>
            </div>
            {!isMaxLevel && pointsMissing !== null && (
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <TrendingUp className="h-4 w-4" />
                <span>
                  {pointsMissing.toLocaleString()} points needed for next level
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
              {/* Gate Title and Description */}
              {gateTitle && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-[#1E3A5F] mb-1">
                    {gateTitle}
                  </h4>
                  {gateDescription && (
                    <p className="text-sm text-[#64748B]">{gateDescription}</p>
                  )}
                </div>
              )}

              {/* Current Stats */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-[#64748B]">
                    Empowerment:
                  </span>
                  <span className="text-sm font-semibold text-[#1E3A5F]">
                    {empowermentValue}%
                  </span>
                </div>

                {empowermentTitle && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-[#64748B]">
                      Empowerment Title:
                    </span>
                    <span className="text-sm font-semibold text-[#1E3A5F]">
                      {empowermentTitle}
                    </span>
                  </div>
                )}

                {currentEffect && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-[#64748B]">
                      Current Effect:
                    </span>
                    <span className="text-sm font-semibold text-[#1E3A5F]">
                      {currentEffect}
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                {!isMaxLevel && pointsMissing !== null && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>Progress to Next Level</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-[#64748B]">
                      {pointsMissing.toLocaleString()} points needed
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
                            {tx.amount > 0 ? '+' : ''}
                            {tx.amount.toLocaleString()} IP
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
