'use client';

import type { Appointment } from '@/lib/supabase/queries/appointments';
import { useState } from 'react';
import {
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  Video,
  Clock,
  CheckCircle2,
  Edit2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AppointmentCardProps {
  title: string;
  color: string;
  appointments: Appointment[];
}

export function AppointmentCard({
  title,
  color,
  appointments,
}: AppointmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort appointments: latest created first
  const sortedAppointments = [...appointments].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const latestAppointment = sortedAppointments[0];
  const history = sortedAppointments.slice(1);

  // Determine status from latest appointment
  let status: 'not_programmed' | 'canceled' | 'scheduled' | 'attended' =
    'not_programmed';
  if (latestAppointment) {
    status = latestAppointment.status;
  }

  const getStatusLabel = (statusStr: string) => {
    if (statusStr === 'not_programmed') return 'Not Programmed';
    if (statusStr === 'canceled') return 'Canceled';
    if (statusStr === 'scheduled') return 'Scheduled';
    if (statusStr === 'attended') return 'Attended';
    return statusStr;
  };

  const isDisabled = status === 'not_programmed';
  const statusBadgeClass = (statusStr: string) => {
    switch (statusStr) {
      case 'scheduled':
        return 'border-primary/20 bg-primary/10 text-primary';
      case 'attended':
        return 'bg-[oklch(0.94_0.04_155)] text-[oklch(0.32_0.12_155)] border-[oklch(0.87_0.1_155)]';
      case 'canceled':
        return 'border-destructive/20 bg-destructive/10 text-destructive';
      case 'not_programmed':
      default:
        return 'border-border bg-muted/30 text-muted-foreground';
    }
  };

  // Format date and time
  const formatScheduledTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Calculate duration in minutes
    const durationMs = end.getTime() - start.getTime();
    const durationMin = Math.round(durationMs / 60000);

    // Format date and time without seconds
    const dateStr = start.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = start
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .toLowerCase();

    return `${dateStr} ${timeStr} (${durationMin} min)`;
  };

  const formatScheduledAt = (createdAt: string) => {
    const date = new Date(createdAt);
    return date
      .toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .toLowerCase();
  };

  // Check if location is a meeting URL
  const isMeetingUrl = (location?: string | null) => {
    if (!location) return false;
    return location.startsWith('http://') || location.startsWith('https://');
  };

  const getLocationDisplay = (apt: Appointment) => {
    const locationValue = apt.location_value || apt.location_type;
    if (!locationValue) return null;

    const isPhone =
      apt.location_type?.toLowerCase().includes('call') ||
      apt.location_type?.toLowerCase().includes('phone');
    const isMeeting = isMeetingUrl(locationValue);

    if (isMeeting) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <Video className="h-4 w-4" style={{ color }} />
          <a
            href={locationValue}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline truncate min-w-0"
            style={{ color }}
            onClick={(e) => e.stopPropagation()}
          >
            Meeting Link
          </a>
        </div>
      );
    }

    if (isPhone) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground truncate min-w-0 flex-1">
            {locationValue}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 min-w-0">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground truncate min-w-0 flex-1">
          {locationValue}
        </span>
      </div>
    );
  };

  return (
    <Card
      className={cn(
        'gap-0 border transition-all duration-300 overflow-hidden',
        isDisabled
          ? 'opacity-50 pointer-events-none shadow-none'
          : 'hover:shadow-[var(--shadow-lg)]',
      )}
      style={{ borderColor: color, minHeight: '166px' }}
    >
      {/* Card Header */}
      <div
        className="bg-muted/10"
        onClick={() => !isDisabled && setIsExpanded(!isExpanded)}
      >
        {/* Title and Badge Section */}
        <div
          className={cn('p-4', !isDisabled && 'cursor-pointer')}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="font-semibold text-foreground text-lg truncate">{title}</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className={cn('font-semibold border', statusBadgeClass(status))}
              >
                {getStatusLabel(status)}
              </Badge>
              {!isDisabled && (
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
        {!isExpanded && latestAppointment && !isDisabled && (
          <div className="p-5 pt-4 px-2 space-y-2">
            {latestAppointment.start_time && latestAppointment.end_time && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {formatScheduledTime(
                    latestAppointment.start_time,
                    latestAppointment.end_time,
                  )}
                </span>
                {' '}
                {getLocationDisplay(latestAppointment)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && !isDisabled && (
          <motion.div
            className="bg-card overflow-hidden p-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Current Status Section */}
            {latestAppointment ? (
              <>
                <motion.div
                  className="flex items-center gap-2 mb-3"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-[oklch(0.66_0.17_155)]" />
                  <h4 className="font-semibold text-foreground">Current Status</h4>
                </motion.div>

                <motion.div
                  className="p-4"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  {status === 'canceled' && latestAppointment.canceled_by && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                        Canceled by:
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {latestAppointment.canceled_by}
                      </span>
                    </div>
                  )}
                  {status === 'canceled' &&
                    latestAppointment.cancellation_reason && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                          Reason:
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {latestAppointment.cancellation_reason}
                        </span>
                      </div>
                    )}
                  {latestAppointment.start_time &&
                    latestAppointment.end_time && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                          Meeting time:
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatScheduledTime(
                            latestAppointment.start_time,
                            latestAppointment.end_time,
                          )}
                        </span>
                      </div>
                    )}

                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground min-w-[100px] whitespace-nowrap">
                      Location:
                    </span>
                    <div className="min-w-0 flex-1">{getLocationDisplay(latestAppointment)}</div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                      Scheduled on:
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatScheduledAt(latestAppointment.created_at)}
                    </span>
                  </div>
                </motion.div>
              </>
            ) : (
              <motion.div
                className="pt-4 text-sm text-muted-foreground"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                No appointment scheduled yet.
              </motion.div>
            )}

            {/* Action Buttons */}
            {latestAppointment &&
              (latestAppointment.reschedule_url ||
                latestAppointment.cancel_url) && (
                <motion.div
                  className="flex gap-2 sm:gap-3 pt-2 min-w-0"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.15 }}
                >
                  {latestAppointment.reschedule_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0 rounded-[var(--radius-pill)] bg-transparent cursor-pointer hover:bg-muted/40"
                      style={{
                        color: color,
                        borderColor: color,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (latestAppointment.reschedule_url) {
                          window.open(
                            latestAppointment.reschedule_url,
                            '_blank',
                          );
                        }
                      }}
                    >
                      <Edit2 className="h-4 w-4 shrink-0 mr-1 sm:mr-2" />
                      <span className="truncate">Reschedule</span>
                    </Button>
                  )}
                  {latestAppointment.cancel_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-[var(--radius-pill)] bg-transparent cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (latestAppointment.cancel_url) {
                          window.open(latestAppointment.cancel_url, '_blank');
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 shrink-0 mr-1 sm:mr-2" />
                      <span className="truncate">Cancel</span>
                    </Button>
                  )}
                </motion.div>
              )}

            {/* History Section */}
            {history.length > 0 && (
              <motion.div
                className="pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <h4 className="font-semibold text-foreground mb-3 pb-4">History</h4>
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
                        delayChildren: 0.25,
                      },
                    },
                  }}
                >
                  {history.map((histAppt) => (
                    <motion.div
                      key={histAppt.id}
                      className="flex items-start justify-between gap-3 p-3 bg-muted/30 rounded-[var(--radius-lg)]"
                      variants={{
                        hidden: { opacity: 0, y: -8 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <div className="flex-1">
                        {histAppt.start_time && (
                          <p className="text-sm text-muted-foreground">
                            For:{' '}
                            {new Date(histAppt.start_time).toLocaleString(
                              'en-US',
                              {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              },
                            )}
                          </p>
                        )}
                        {histAppt.status === 'canceled' &&
                          histAppt.cancellation_reason && (
                            <p className="text-xs mt-1 text-destructive">
                              &quot;{histAppt.cancellation_reason}&quot;
                            </p>
                          )}
                      </div>
                      <div className="flex items-center gap-2 flex-col">
                        <Badge
                          variant="outline"
                          className={cn('cursor-default', statusBadgeClass(histAppt.status))}
                        >
                          {getStatusLabel(histAppt.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(histAppt.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disabled State Content */}
      {isDisabled && (
        <div className="p-5 text-center">
          <p className="text-sm text-muted-foreground">
            {title} appointment not scheduled yet.
          </p>
        </div>
      )}
    </Card>
  );
}
