'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  FormField,
  Input,
} from '@/components/medvanta';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useProgramAssignmentsInfinite } from '@/hooks/use-passignments-for-user';
import { useAssignProgramToUser } from '../hooks/use-user-mutations';
import { useDebounce } from '@/hooks/use-debounce';
import { format, startOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { generateColorFromSeed } from '@/components/ui/avatar';
import {
  cn,
  isProgramStartDateDisabled,
  getNextProgramStartMonday,
  calculateEndDate,
} from '@/lib/utils';

function ProgramPreview({
  seed,
  imageUrl,
  className,
}: {
  seed: string | null | undefined;
  imageUrl: string | null | undefined;
  className?: string;
}): React.ReactElement {
  const bg = generateColorFromSeed(seed || 'default', {
    gradient: true,
    style: 'program',
  });
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden bg-[var(--slate-100)] ring-1 ring-[var(--border-subtle)]',
        'rounded-[var(--radius-md)]',
        className,
      )}
      aria-hidden
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="72px"
          className="object-cover"
        />
      ) : (
        <div className="size-full" style={{ backgroundImage: bg }} />
      )}
    </div>
  );
}

interface AssignProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onAssignSuccess?: () => void;
  userFirstName?: string | null;
  userLastName?: string | null;
  fromPath?: string;
}

export function AssignProgramModal({
  open,
  onOpenChange,
  userId,
  onAssignSuccess,
  userFirstName,
  userLastName,
  fromPath,
}: AssignProgramModalProps): React.ReactElement {
  const router = useRouter();
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

  const assignments = data?.pages.flat() ?? [];
  const selectedAssignment = assignments.find(
    (a) => a.id === selectedAssignmentId,
  );
  const programWeeks = selectedAssignment?.program_template?.weeks ?? 0;
  const dateRange: DateRange | undefined =
    startDate && programWeeks >= 1
      ? {
          from: startDate,
          to: (() => {
            const end = calculateEndDate(startDate, programWeeks);
            return end ? startOfDay(end) : undefined;
          })(),
        }
      : startDate
        ? { from: startDate, to: undefined }
        : undefined;

  const handleCardSelect = (assignmentId: string | null): void => {
    setSelectedAssignmentId(assignmentId);
    if (assignmentId) {
      setStartDate(getNextProgramStartMonday());
      setIsDatePickerOpen(true);
    }
  };

  const handleDateSelect = (range: DateRange | undefined): void => {
    if (
      startDate &&
      range?.from &&
      startOfDay(range.from).getTime() === startOfDay(startDate).getTime()
    ) {
      setStartDate(undefined);
      return;
    }
    if (range?.from) {
      setStartDate(startOfDay(range.from));
    } else {
      setStartDate(undefined);
    }
  };

  const handleAssignClick = async (): Promise<void> => {
    if (!selectedAssignmentId || !startDate) {
      return;
    }

    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const created = await assignProgram.mutateAsync({
      templateAssignmentId: selectedAssignmentId,
      startDate: formattedStartDate,
    });
    if (created?.id) {
      onAssignSuccess?.();
      handleCancel();
      const from = fromPath ?? `/users/${userId}`;
      const url = `/builder/${created.id}?from=${encodeURIComponent(from)}&collapsed=1`;
      router.push(url);
    }
  };

  const handleCancel = (): void => {
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
      onClose={handleCancel}
      title="Assign Program"
      width={760}
      className="flex max-h-[85vh] flex-col overflow-hidden"
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignClick}
            disabled={!selectedAssignmentId || !startDate || isAssigning}
            loading={isAssigning}
          >
            Assign
          </Button>
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={
          open
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.95, y: 20 }
        }
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <p className="mb-4 text-[length:var(--text-sm)] text-[var(--text-muted)]">
          {userFirstName || userLastName
            ? `Select a program template for ${[userFirstName, userLastName].filter(Boolean).join(' ')}.`
            : 'Select a program to assign to this user.'}
        </p>

        <div className="space-y-3">
          <Input
            placeholder="Search by program name, user name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            iconLeft="Search"
          />
          <Checkbox
            checked={showAssigned}
            onChange={setShowAssigned}
            label="Show assigned"
          />
        </div>

        <ScrollArea className="mt-3 min-h-0 flex-1 pr-2" style={{ maxHeight: 280 }}>
          {isLoading ? (
            <div className="py-8 text-center text-[var(--text-muted)]">
              Loading...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-[var(--danger)]">
              Error loading programs: {error.message}
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-muted)]">
              No programs found
            </div>
          ) : (
            <div className="space-y-3 p-2">
              {assignments.map((assignment) => {
                const template = assignment.program_template;
                const isSelected = selectedAssignmentId === assignment.id;
                const programImageUrl =
                  typeof template?.image_url === 'string'
                    ? template.image_url
                    : null;
                const profiles = assignment.profiles as
                  | {
                      first_name?: string | null;
                      last_name?: string | null;
                      email?: string | null;
                    }
                  | null
                  | undefined;
                const userName = profiles
                  ? [profiles.first_name, profiles.last_name]
                      .filter(Boolean)
                      .join(' ') ||
                    profiles.email ||
                    'Unknown User'
                  : null;

                return (
                  <button
                    key={assignment.id}
                    type="button"
                    onClick={() => handleCardSelect(assignment.id || null)}
                    disabled={isAssigning}
                    className={cn(
                      'w-full cursor-pointer p-4 text-left transition-colors',
                      'rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]',
                      'hover:bg-[color-mix(in_oklch,var(--primary)_12%,var(--surface-card))] hover:shadow-[var(--shadow-md)]',
                      'focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      isSelected &&
                        'border-[var(--primary)] bg-[var(--slate-50)] ring-2 ring-[var(--primary)]',
                    )}
                  >
                    <div className="flex min-h-18 min-w-0 items-stretch gap-4">
                      <ProgramPreview
                        seed={template?.id || assignment.id}
                        imageUrl={programImageUrl}
                        className="w-18"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <div className="truncate text-[length:var(--text-base)] font-[var(--fw-semibold)] text-[var(--text-strong)]">
                            {template?.name || 'Unnamed Program'}
                          </div>
                          <Badge
                            tone={
                              assignment.status === 'active' ? 'brand' : 'neutral'
                            }
                          >
                            {assignment.status || 'template'}
                          </Badge>
                        </div>
                        {template?.description ? (
                          <div className="mt-1 line-clamp-2 text-[length:var(--text-sm)] text-[var(--text-muted)]">
                            {template.description}
                          </div>
                        ) : null}
                        <div className="mt-2 flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--text-muted)]">
                          <span>{template?.weeks || 0} weeks</span>
                          {userName && assignment.status === 'active' ? (
                            <span>| Assigned to: {userName}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              <div ref={observerTargetRef} className="h-4" />
              {isFetchingNextPage ? (
                <div className="py-4 text-center text-[var(--text-muted)]">
                  Loading more...
                </div>
              ) : null}
            </div>
          )}
        </ScrollArea>

        <FormField
          label="Start Date"
          required
          hint="Start date must be a Monday (today or later)."
          className="mt-3"
        >
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                fullWidth
                iconLeft="Calendar"
                className={cn(
                  'justify-start text-left font-normal',
                  !startDate && 'text-[var(--text-muted)]',
                )}
              >
                {startDate
                  ? format(startDate, 'EEE, MMM d, yyyy')
                  : 'Select start date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {programWeeks >= 1 ? (
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  disabled={isProgramStartDateDisabled}
                  defaultMonth={startDate ?? getNextProgramStartMonday()}
                  weekStartsOn={1}
                  numberOfMonths={1}
                  autoFocus
                />
              ) : (
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date ?? undefined);
                    setIsDatePickerOpen(false);
                  }}
                  disabled={isProgramStartDateDisabled}
                  defaultMonth={startDate ?? getNextProgramStartMonday()}
                  weekStartsOn={1}
                  autoFocus
                />
              )}
            </PopoverContent>
          </Popover>
        </FormField>
      </motion.div>
    </Dialog>
  );
}
