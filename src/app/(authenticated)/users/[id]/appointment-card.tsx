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
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4" style={{ color }} />
          <a
            href={locationValue}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline truncate"
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
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#64748B]" />
          <span className="text-sm font-semibold text-[#1E3A5F] truncate">
            {locationValue}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[#64748B]" />
        <span className="text-sm font-semibold text-[#1E3A5F] truncate">
          {locationValue}
        </span>
      </div>
    );
  };

  return (
    <Card
      className={cn(
        'rounded-3xl p-2 border-2 transition-all duration-300 overflow-hidden',
        isDisabled
          ? 'opacity-40! hover:opacity-50! cursor-not-allowed! bg-white/50! shadow-none!'
          : 'hover:shadow-xl bg-white',
      )}
      style={{ borderColor: color, minHeight: '146px' }}
    >
      {/* Card Header */}
      <div
        className="bg-linear-to-b from-white to-gray-50/30"
        onClick={() => !isDisabled && setIsExpanded(!isExpanded)}
      >
        {/* Title and Badge Section */}
        <div
          className="p-4 cursor-pointer border-b-2"
          style={{ borderColor: color }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="font-bold text-[#1E3A5F] text-lg truncate">
                {title}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className="font-semibold border"
                style={{
                  backgroundColor: `${color}1A`,
                  color: color,
                  borderColor: `${color}4D`,
                }}
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
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Clock className="h-4 w-4" />
                <span>
                  {formatScheduledTime(
                    latestAppointment.start_time,
                    latestAppointment.end_time,
                  )}
                </span>
              </div>
            )}
            {getLocationDisplay(latestAppointment)}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && !isDisabled && (
          <motion.div
            className="bg-white overflow-hidden"
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
                  <CheckCircle2 className="h-5 w-5" color={'#00C896'} />
                  <h4 className="font-bold text-[#1E3A5F]">Current Status</h4>
                </motion.div>

                <motion.div
                  className="p-4"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  {status === 'canceled' && latestAppointment.canceled_by && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-[#64748B] min-w-[100px]">
                        Canceled by:
                      </span>
                      <span className="text-sm font-semibold text-[#1E3A5F]">
                        {latestAppointment.canceled_by}
                      </span>
                    </div>
                  )}
                  {status === 'canceled' &&
                    latestAppointment.cancellation_reason && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-[#64748B] min-w-[100px]">
                          Reason:
                        </span>
                        <span className="text-sm font-semibold text-[#1E3A5F]">
                          {latestAppointment.cancellation_reason}
                        </span>
                      </div>
                    )}
                  {latestAppointment.start_time &&
                    latestAppointment.end_time && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-[#64748B] min-w-[100px]">
                          Meeting time:
                        </span>
                        <span className="text-sm font-semibold text-[#1E3A5F]">
                          {formatScheduledTime(
                            latestAppointment.start_time,
                            latestAppointment.end_time,
                          )}
                        </span>
                      </div>
                    )}

                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-[#64748B] min-w-[100px]">
                      Location:
                    </span>
                    <div>{getLocationDisplay(latestAppointment)}</div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-[#64748B] min-w-[100px]">
                      Scheduled on:
                    </span>
                    <span className="text-sm text-[#64748B]">
                      {formatScheduledAt(latestAppointment.created_at)}
                    </span>
                  </div>
                </motion.div>
              </>
            ) : (
              <motion.div
                className="pt-4 text-sm text-[#64748B]"
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
                      className="flex-1 min-w-0 rounded-lg bg-transparent cursor-pointer"
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
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${color}1A`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
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
                      className="flex-1 min-w-0 text-[#FF4D6D] border-[#FF4D6D] hover:bg-[#FF4D6D]/10 rounded-lg bg-transparent cursor-pointer"
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
                <h4 className="font-bold text-[#1E3A5F] mb-3 pb-4">History</h4>
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
                      className="flex items-start justify-between gap-3 p-3 bg-[#F5F7FA] rounded-lg"
                      variants={{
                        hidden: { opacity: 0, y: -8 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <div className="flex-1">
                        {histAppt.start_time && (
                          <p className="text-sm text-[#64748B]">
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
                            <p className="text-xs mt-1 text-[#FF4D6D]">
                              &quot;{histAppt.cancellation_reason}&quot;
                            </p>
                          )}
                      </div>
                      <div className="flex items-center gap-2 flex-col">
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: '#FF4D6D/10',
                            color: '#FF4D6D',
                            borderColor: '#FF4D6D/30',
                          }}
                        >
                          {getStatusLabel(histAppt.status)}
                        </Badge>
                        <span className="text-xs text-[#64748B] whitespace-nowrap">
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
          <p className="text-sm text-[#64748B]">
            {title} appointment not scheduled yet.
          </p>
        </div>
      )}
    </Card>
  );
}
