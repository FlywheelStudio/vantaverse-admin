'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader, Clock, CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useProgramAssignmentsInfinite } from '@/hooks/use-passignments-for-user';
import { useAssignProgramToUser } from '../hooks/use-user-mutations';
import { useDebounce } from '@/hooks/use-debounce';
import { format, startOfDay, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

interface AssignProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onAssignSuccess?: () => void;
  userFirstName?: string | null;
  userLastName?: string | null;
}

export function AssignProgramModal({
  open,
  onOpenChange,
  userId,
  onAssignSuccess,
  userFirstName,
  userLastName,
}: AssignProgramModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssigned, setShowAssigned] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const assignProgram = useAssignProgramToUser(userId);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useProgramAssignmentsInfinite(
    debouncedSearch || undefined,
    showAssigned,
    25,
  );

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTargetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten pages into single array
  const assignments = data?.pages.flat() ?? [];

  const handleCardSelect = (assignmentId: string | null) => {
    setSelectedAssignmentId(assignmentId);
  };

  const handleAssignClick = async () => {
    if (!selectedAssignmentId || !startDate) {
      return;
    }

    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    await assignProgram.mutateAsync(
      {
        templateAssignmentId: selectedAssignmentId,
        startDate: formattedStartDate,
      },
      {
        onSuccess: () => {
          onAssignSuccess?.();
          handleCancel();
        },
      },
    );
  };

  const handleCancel = () => {
    setSearchQuery('');
    setShowAssigned(false);
    setSelectedAssignmentId(null);
    setStartDate(undefined);
    onOpenChange(false);
  };

  const isAssigning = assignProgram.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleCancel())}
    >
      <DialogContent className="w-[min(760px,calc(100%-2rem))] h-[680px] max-h-[85vh] flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={
            open
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.95, y: 20 }
          }
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-col flex-1 min-h-0"
        >
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F]">Assign Program</DialogTitle>
            <DialogDescription>
              {userFirstName || userLastName
                ? `Select a program template for ${[userFirstName, userLastName].filter(Boolean).join(' ')}.`
                : 'Select a program to assign to this user.'}
            </DialogDescription>
          </DialogHeader>

          {/* Search and Controls */}
          <div className="space-y-3 pt-4">
            <Input
              placeholder="Search by program name, user name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-assigned"
                checked={showAssigned}
                onCheckedChange={(checked) => setShowAssigned(checked === true)}
                disabled={false}
              />
              <label
                htmlFor="show-assigned"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Show assigned
              </label>
            </div>
          </div>

          {/* Program List */}
          <ScrollArea className="flex-1 min-h-0 mt-4">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-500">
                Error loading programs: {error.message}
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No programs found
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {assignments.map((assignment) => {
                  const template = assignment.program_template;
                  const isSelected = selectedAssignmentId === assignment.id;
                  const profiles = assignment.profiles as
                    | {
                        first_name?: string | null;
                        last_name?: string | null;
                        email?: string | null;
                      }
                    | null
                    | undefined;
                  const userName = profiles
                    ? [
                        profiles.first_name,
                        profiles.last_name,
                      ]
                        .filter(Boolean)
                        .join(' ') || profiles.email || 'Unknown User'
                    : null;

                  return (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => handleCardSelect(assignment.id || null)}
                      disabled={isAssigning}
                      className={cn(
                        'w-full text-left p-4 border-2 rounded-lg transition-all',
                        'hover:border-blue-500 hover:bg-blue-50',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        isSelected && 'border-blue-500 bg-blue-50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold text-base text-[#1E3A5F] truncate">
                              {template?.name || 'Unnamed Program'}
                            </div>
                            <span
                              className={cn(
                                'text-xs px-2 py-1 rounded flex-shrink-0',
                                assignment.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              )}
                            >
                              {assignment.status || 'template'}
                            </span>
                          </div>
                          {template?.description && (
                            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {template.description}
                            </div>
                          )}
                          {userName && assignment.status === 'active' && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Assigned to: {userName}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{template?.weeks || 0} weeks</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {/* Infinite scroll trigger */}
                <div ref={observerTargetRef} className="h-4" />
                {isFetchingNextPage && (
                  <div className="py-4 text-center text-muted-foreground">
                    Loading more...
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

        {/* Start Date Picker */}
        <div className="space-y-2 mt-2 ml-4">
              <label className="text-sm font-medium text-[#64748B]">
                Start Date <span className="text-red-500">*</span>
              </label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'MM/dd/yyyy') : 'Select start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setIsDatePickerOpen(false);
                    }}
                    disabled={(date) => {
                      const today = startOfDay(new Date());
                      const dateToCheck = startOfDay(date);
                      return isBefore(dateToCheck, today);
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 mt-auto">
            <Button variant="outline" onClick={handleCancel} disabled={isAssigning}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignClick}
              disabled={!selectedAssignmentId || !startDate || isAssigning}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isAssigning ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign'
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
