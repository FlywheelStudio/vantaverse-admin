'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronUp,
  User,
  CheckCircle2,
  Mail,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { generateColorFromSeed } from '@/components/ui/avatar';
import { AddMembersModal } from '@/app/(authenticated)/groups/add-members/add-members-modal';

interface PhysicianAssignmentCardProps {
  physiologist: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    description: string | null;
  } | null;
  organizations?: Array<{ id: string; name: string; description: string | null }>;
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
  organizations,
}: PhysicianAssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const wasModalOpenRef = useRef(false);

  // Refresh data when modal closes after being open (indicating a successful save)
  useEffect(() => {
    if (wasModalOpenRef.current && !modalOpen) {
      router.refresh();
    }
    wasModalOpenRef.current = modalOpen;
  }, [modalOpen, router]);

  const hasPhysician = physiologist !== null;
  const hasOrganizations = organizations && organizations.length > 0;

  // Color scheme based on assigned status
  const getColorScheme = () => {
    if (hasPhysician) {
      // Green variants (assigned)
      return {
        border: 'oklch(0.87 0.05 155)',
        text: 'oklch(0.32 0.05 155)',
        bg: 'oklch(0.94 0.04 155)',
        icon: 'oklch(0.55 0.05 155)',
      };
    }
    // Default/muted (unassigned)
    return {
      border: 'oklch(0.9 0.01 0)',
      text: 'oklch(0.5 0.01 0)',
      bg: 'oklch(0.96 0.01 0)',
      icon: 'oklch(0.6 0.01 0)',
    };
  };

  const colorScheme = getColorScheme();

  const getStatusLabel = () => {
    if (hasPhysician) return 'Assigned';
    return 'Not Assigned';
  };

  const statusBadgeClass = () => {
    if (hasPhysician) {
      return 'border font-semibold';
    }
    return 'border-border bg-muted/30 text-muted-foreground';
  };

  const getStatusBadgeStyle = () => {
    if (hasPhysician) {
      return {
        borderColor: colorScheme.border,
        backgroundColor: colorScheme.bg,
        color: colorScheme.text,
      };
    }
    return {};
  };

  const handleCardClick = () => {
    if (hasOrganizations && !hasPhysician) {
      // Open modal to assign physician
      setModalOpen(true);
    } else if (hasOrganizations && hasPhysician) {
      // Toggle expand/collapse
      setIsExpanded(!isExpanded);
    }
    // If !hasOrganizations, do nothing (disabled)
  };

  const physicianName = hasPhysician
    ? `${physiologist.firstName} ${physiologist.lastName}`.trim()
    : '';

  return (
    <>
      <Card
        className={cn(
          'gap-0 border transition-all duration-300 overflow-hidden',
          !hasOrganizations && 'min-h-0 opacity-50 pointer-events-none shadow-none',
          hasPhysician && 'hover:shadow-[var(--shadow-lg)]',
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
          <div
            className={cn(
              'p-3',
              (hasOrganizations && hasPhysician) ||
                (hasOrganizations && !hasPhysician)
                ? 'cursor-pointer'
                : '',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex flex-col items-center shrink-0">
                  {hasPhysician ? (
                    <Check
                      className="h-5 w-5"
                      style={{ color: colorScheme.icon }}
                    />
                  ) : (
                    <User
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
                    5. Physiologist Assignment
                  </h3>
                  {hasPhysician && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-semibold border shrink-0',
                        statusBadgeClass(),
                      )}
                      style={getStatusBadgeStyle()}
                    >
                      {getStatusLabel()}
                    </Badge>
                  )}
                </div>
              </div>
              {hasPhysician && isExpanded && (
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
          {!isExpanded && hasPhysician && (
            <div className="px-3 pb-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" style={{ color: colorScheme.icon }} />
                <span className="font-semibold text-foreground">
                  {physicianName}
                </span>
              </div>
            </div>
          )}

          {!hasOrganizations && (
            <div className="px-5 pb-5">
              <p className="text-sm text-muted-foreground italic">
                No group assigned
              </p>
            </div>
          )}

          {hasOrganizations && !hasPhysician && (
            <div className="px-5 pb-5">
              <p className="text-sm text-muted-foreground italic">
                No physiologist assigned yet. Click to assign.
              </p>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && hasPhysician && (
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
                <CheckCircle2 className="h-5 w-5 text-[oklch(0.66 0.17 155)]" />
                <h4 className="font-semibold text-foreground">
                  Assigned Physiologist
                </h4>
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
      </Card>

      {hasOrganizations && organizations.length > 0 && (
        <AddMembersModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          type="organization"
          id={organizations[0].id}
          name={organizations[0].name}
          organizationId={organizations[0].id}
          organizationName={organizations[0].name}
          initialRole="admin"
        />
      )}
    </>
  );
}
