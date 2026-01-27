'use client';

import { useState } from 'react';
import {
  ChevronUp,
  Building2,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { generateColorFromSeed } from '@/components/ui/avatar';
import { AssignGroupModal } from './assign-group-modal';

interface GroupAssignmentCardProps {
  organizations: Array<{ id: string; name: string; description: string | null }>;
  userId: string;
  userFirstName?: string | null;
  userLastName?: string | null;
}

function OrgAvatar({
  orgId,
  pictureUrl,
  size = 40,
}: {
  orgId: string;
  pictureUrl: string | null | undefined;
  size?: number;
}) {
  const bg = generateColorFromSeed(orgId || 'default', { gradient: true });
  const fontSize = Math.max(10, Math.round(size * 0.35));

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[var(--radius-md)] ring-1 ring-border/40 bg-muted"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {pictureUrl ? (
        <Image
          src={pictureUrl}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div
          className="size-full flex items-center justify-center text-white font-medium"
          style={{ backgroundImage: bg, fontSize }}
        />
      )}
    </div>
  );
}

export function GroupAssignmentCard({
  organizations,
  userId,
  userFirstName,
  userLastName,
}: GroupAssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const hasGroups = organizations.length > 0;

  // Color scheme based on assigned status
  const getColorScheme = () => {
    if (hasGroups) {
      // Green variants (assigned)
      return {
        border: 'oklch(0.87_0.1_155)',
        text: 'oklch(0.32_0.12_155)',
        bg: 'oklch(0.94_0.04_155)',
        icon: 'oklch(0.55_0.18_155)',
      };
    }
    // Default/muted (unassigned)
    return {
      border: 'oklch(0.9_0.01_0)',
      text: 'oklch(0.5_0.01_0)',
      bg: 'oklch(0.96_0.01_0)',
      icon: 'oklch(0.6_0.01_0)',
    };
  };

  const colorScheme = getColorScheme();

  const getStatusLabel = () => {
    if (hasGroups) return 'Assigned';
    return 'Unassigned';
  };

  const statusBadgeClass = () => {
    if (hasGroups) {
      return 'border font-semibold';
    }
    return 'border-border bg-muted/30 text-muted-foreground';
  };

  const getStatusBadgeStyle = () => {
    if (hasGroups) {
      return {
        borderColor: colorScheme.border,
        backgroundColor: colorScheme.bg,
        color: colorScheme.text,
      };
    }
    return {};
  };

  const handleCardClick = () => {
    if (hasGroups) {
      setIsExpanded(!isExpanded);
    } else {
      setModalOpen(true);
    }
  };

  const handleAssignSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <Card
        className={cn(
          'gap-0 border transition-all duration-300 overflow-hidden',
          !hasGroups && 'min-h-0',
          hasGroups && 'hover:shadow-[var(--shadow-lg)]',
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
          <div className="p-3 cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex flex-col items-center shrink-0">
                  {hasGroups ? (
                    <Check
                      className="h-5 w-5"
                      style={{ color: colorScheme.icon }}
                    />
                  ) : (
                    <Building2
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
                    4. Group Assignment
                  </h3>
                  {hasGroups && (
                    <Badge
                      variant="outline"
                      className={cn('font-semibold border shrink-0', statusBadgeClass())}
                      style={getStatusBadgeStyle()}
                    >
                      {getStatusLabel()}
                    </Badge>
                  )}
                </div>
              </div>
              {hasGroups && isExpanded && (
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
          {!isExpanded && hasGroups && (
            <div className="px-3 pb-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" style={{ color: colorScheme.icon }} />
                <span className="font-semibold text-foreground">
                  {organizations.length === 1
                    ? organizations[0].name
                    : `${organizations.length} Groups`}
                </span>
              </div>
            </div>
          )}

          {!hasGroups && (
            <div className="px-3 pb-3">
              <p className="text-sm text-muted-foreground italic">
                No group assigned yet. Click to assign.
              </p>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && hasGroups && (
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
                <CheckCircle2 className="h-5 w-5 text-[oklch(0.66_0.17_155)]" />
                <h4 className="font-semibold text-foreground">Assigned Groups</h4>
              </motion.div>

              <motion.div
                className="space-y-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.1,
                    },
                  },
                }}
              >
                {organizations.map((org) => (
                  <motion.div
                    key={org.id}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-[var(--radius-lg)]"
                    variants={{
                      hidden: { opacity: 0, y: -8 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <OrgAvatar orgId={org.id} pictureUrl={null} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {org.name}
                      </p>
                      {org.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <AssignGroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        userId={userId}
        userFirstName={userFirstName}
        userLastName={userLastName}
        onAssignSuccess={handleAssignSuccess}
      />
    </>
  );
}
