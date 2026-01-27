'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  User,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { generateColorFromSeed } from '@/components/ui/avatar';

interface PhysicianAssignmentCardProps {
  physiologist: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    description: string | null;
  } | null;
}

function PhysicianAvatar({
  userId,
  firstName,
  lastName,
  avatarUrl,
  size = 40,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  size?: number;
}) {
  const bg = generateColorFromSeed(userId || 'default', { gradient: true });
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const fontSize = Math.max(10, Math.round(size * 0.35));

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-border/40 bg-muted"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`${firstName} ${lastName}`}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div
          className="size-full flex items-center justify-center text-white font-medium"
          style={{ backgroundImage: bg, fontSize }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export function PhysicianAssignmentCard({
  physiologist,
}: PhysicianAssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasPhysician = physiologist !== null;
  const color = 'var(--color-primary)';

  const getStatusLabel = () => {
    if (hasPhysician) return 'Assigned';
    return 'Not Assigned';
  };

  const statusBadgeClass = () => {
    if (hasPhysician) {
      return 'bg-[oklch(0.94_0.04_155)] text-[oklch(0.32_0.12_155)] border-[oklch(0.87_0.1_155)]';
    }
    return 'border-border bg-muted/30 text-muted-foreground';
  };

  const physicianName = hasPhysician
    ? `${physiologist.firstName} ${physiologist.lastName}`.trim()
    : '';

  return (
    <Card
      className={cn(
        'gap-0 border transition-all duration-300 overflow-hidden',
        !hasPhysician
          ? 'opacity-50 pointer-events-none shadow-none'
          : 'hover:shadow-[var(--shadow-lg)]',
      )}
      style={{ borderColor: color, minHeight: '166px' }}
    >
      {/* Card Header */}
      <div
        className="bg-muted/10"
        onClick={() => hasPhysician && setIsExpanded(!isExpanded)}
      >
        {/* Title and Badge Section */}
        <div
          className={cn('p-4 border-b-2', hasPhysician && 'cursor-pointer')}
          style={{ borderColor: color }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="font-semibold text-foreground text-lg truncate">
                5. Physiologist Assignment
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className={cn('font-semibold border', statusBadgeClass())}
              >
                {getStatusLabel()}
              </Badge>
              {hasPhysician && (
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
        {!isExpanded && hasPhysician && (
          <div className="p-5 pt-4 px-2 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" style={{ color }} />
              <span className="font-semibold text-foreground">
                {physicianName}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && hasPhysician && (
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
              <h4 className="font-semibold text-foreground">Assigned Physiologist</h4>
            </motion.div>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-[var(--radius-lg)]">
                <PhysicianAvatar
                  userId={physiologist.userId}
                  firstName={physiologist.firstName}
                  lastName={physiologist.lastName}
                  avatarUrl={physiologist.avatarUrl}
                  size={48}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {physicianName}
                  </p>
                  {physiologist.email && (
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {physiologist.email}
                      </p>
                    </div>
                  )}
                  {physiologist.description && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {physiologist.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disabled State Content */}
      {!hasPhysician && (
        <div className="p-5 text-center">
          <p className="text-sm text-muted-foreground">
            No physiologist assigned yet.
          </p>
        </div>
      )}
    </Card>
  );
}
