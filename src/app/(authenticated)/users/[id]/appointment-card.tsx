'use client';

import type { Appointment } from '@/lib/supabase/queries/appointments';
import { useState } from 'react';
import { Phone, Home, ChevronDown, Video, ExternalLink, CalendarClock, Ban, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
    title: string;
    color: string;
    appointments: Appointment[];
}

export function AppointmentCard({ title, color, appointments }: AppointmentCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Sort appointments: latest created first
    const sortedAppointments = [...appointments].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // The active or most relevant appointment is usually the latest one
    // But if we want to show the currently scheduled one vs a later cancelled one, logic might vary.
    // For now, assuming the latest created is the current state of affairs (e.g. current schedule or final cancellation).
    const latestAppointment = sortedAppointments[0];
    const history = sortedAppointments.slice(1);

    // Determine status from latest appointment
    let status: 'not_programmed' | 'canceled' | 'scheduled' | 'attended' = 'not_programmed';
    if (latestAppointment) {
        status = latestAppointment.status;
    }

    // Visual styling based on status
    const getOpacity = () => {
        if (status === 'not_programmed') return '0.5';
        if (status === 'canceled') return '0.7';
        return '1';
    };

    const getStatusLabel = (statusStr: string) => {
        if (statusStr === 'not_programmed') return 'Not Programmed';
        if (statusStr === 'canceled') return 'Canceled';
        if (statusStr === 'scheduled') return 'Scheduled';
        if (statusStr === 'attended') return 'Attended';
        return statusStr;
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
            year: 'numeric'
        });
        const timeStr = start.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).toLowerCase();

        return `${dateStr} ${timeStr} (${durationMin} min)`;
    };

    const formatScheduledAt = (createdAt: string) => {
        const date = new Date(createdAt);
        return date.toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).toLowerCase();
    };

    // Check if location is a meeting URL
    const isMeetingUrl = (location?: string | null) => {
        if (!location) return false;
        return location.startsWith('http://') || location.startsWith('https://');
    };

    const getLocationDisplay = (apt: Appointment) => {
        const locationValue = apt.location_value || apt.location_type;
        if (!locationValue) return null;

        const isPhone = apt.location_type?.toLowerCase().includes('call') ||
            apt.location_type?.toLowerCase().includes('phone');
        const isMeeting = isMeetingUrl(locationValue);

        if (isMeeting) {
            return (
                <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" style={{ color }} />
                    <a
                        href={locationValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color }}
                    >
                        Meeting
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            );
        }

        if (isPhone) {
            return (
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" style={{ color }} />
                    <span className="text-sm font-medium truncate">{locationValue}</span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <Home className="w-4 h-4" style={{ color }} />
                <span className="text-sm font-medium truncate">{locationValue}</span>
            </div>
        );
    };

    return (
        <div className="h-fit"> {/* Wrapper to prevent grid stretching affects */}
            <div
                className="relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg group bg-background"
                style={{
                    opacity: getOpacity(),
                    borderColor: color,
                    borderWidth: '2px',
                    // Using a gradient background that fades out
                    background: `linear-gradient(135deg, ${color}08 0%, transparent 100%)`,
                }}
            >
                {/* Accent bar */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-2"
                    style={{ backgroundColor: color }}
                />

                <div
                    className="p-5 pl-6 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-2.5 h-2.5 rounded-full shadow-lg"
                                style={{
                                    backgroundColor: color,
                                    boxShadow: `0 0 12px ${color}80`
                                }}
                            />
                            <h3 className="font-semibold text-lg">{title}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <span
                                className="text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap"
                                style={{
                                    backgroundColor: `${color}20`,
                                    color: color
                                }}
                            >
                                {getStatusLabel(status)}
                            </span>
                            <ChevronDown
                                className={`w-5 h-5 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                style={{ color }}
                            />
                        </div>
                    </div>

                    {/* Always visible info in collapsed state (Latest Appointment) */}
                    {latestAppointment && !isExpanded && (
                        <div className="space-y-2 text-sm">
                            {latestAppointment.start_time && latestAppointment.end_time && (
                                <div className="text-muted-foreground flex items-center gap-2">
                                    <CalendarClock className="w-4 h-4" />
                                    {formatScheduledTime(latestAppointment.start_time, latestAppointment.end_time)}
                                </div>
                            )}
                            {getLocationDisplay(latestAppointment)}
                        </div>
                    )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                    <div className="px-5 pb-5 pl-6 border-t" style={{ borderColor: `${color}30` }}>

                        {/* Latest Appointment Details */}
                        {latestAppointment ? (
                            <div className="pt-4 space-y-3 text-sm">
                                <div className="font-medium text-base mb-2 flex items-center gap-2">
                                    Current Status
                                    {status === 'scheduled' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                    {status === 'canceled' && <Ban className="w-4 h-4 text-red-500" />}
                                </div>

                                {status === 'canceled' && latestAppointment.canceled_by && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-muted-foreground min-w-[100px]">Canceled by:</span>
                                        <span className="font-medium">{latestAppointment.canceled_by}</span>
                                    </div>
                                )}
                                {status === 'canceled' && latestAppointment.cancellation_reason && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-muted-foreground min-w-[100px]">Reason:</span>
                                        <span className="font-medium">{latestAppointment.cancellation_reason}</span>
                                    </div>
                                )}
                                {latestAppointment.start_time && latestAppointment.end_time && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-muted-foreground min-w-[100px]">Scheduled for:</span>
                                        <span className="font-medium">
                                            {formatScheduledTime(latestAppointment.start_time, latestAppointment.end_time)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-start gap-2">
                                    <span className="text-muted-foreground min-w-[100px]">Location:</span>
                                    <div>{getLocationDisplay(latestAppointment)}</div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-muted-foreground min-w-[100px]">Scheduled at:</span>
                                    <span className="font-medium">{formatScheduledAt(latestAppointment.created_at)}</span>
                                </div>

                                {/* Action Links */}
                                {(latestAppointment.reschedule_url || latestAppointment.cancel_url) && (
                                    <div className="pt-3 mt-3 border-t flex gap-3" style={{ borderColor: `${color}30` }}>
                                        {latestAppointment.reschedule_url && (
                                            <a
                                                href={latestAppointment.reschedule_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium hover:underline flex items-center gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ color }}
                                            >
                                                Reschedule
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                        {latestAppointment.cancel_url && (
                                            <a
                                                href={latestAppointment.cancel_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium hover:underline flex items-center gap-1 text-red-500"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Cancel
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="pt-4 text-sm text-muted-foreground">
                                No appointment scheduled yet.
                            </div>
                        )}

                        {/* History Section */}
                        {history.length > 0 && (
                            <div className="mt-6 pt-4 border-t" style={{ borderColor: `${color}30` }}>
                                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">History</h4>
                                <div className="space-y-3 max-h-[200px] overflow-y-auto slim-scrollbar pr-2">
                                    {history.map((histAppt) => (
                                        <div key={histAppt.id} className="text-sm bg-muted/30 p-3 rounded-md border border-border/50">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={cn(
                                                    "text-xs font-medium px-2 py-0.5 rounded-full border",
                                                    histAppt.status === 'canceled' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                        histAppt.status === 'attended' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                            "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                                )}>
                                                    {getStatusLabel(histAppt.status)}
                                                </span>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                    {new Date(histAppt.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {histAppt.start_time && (
                                                <div className="mb-1">
                                                    <span className="text-muted-foreground mr-1">For:</span>
                                                    {new Date(histAppt.start_time).toLocaleString('en-US', {
                                                        month: 'numeric', day: 'numeric', year: 'numeric',
                                                        hour: 'numeric', minute: '2-digit', hour12: true
                                                    })}
                                                </div>
                                            )}

                                            {histAppt.status === 'canceled' && histAppt.cancellation_reason && (
                                                <div className="text-xs mt-1 text-red-400">
                                                    &quot;{histAppt.cancellation_reason}&quot;
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
