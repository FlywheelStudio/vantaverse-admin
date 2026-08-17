'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Badge,
  Button,
  Checkbox,
  Icon,
  Input,
} from '@/components/medvanta';
import { HtmlModal } from './intake-survey-placeholder-modal';
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
  const memberLabel = [userFirstName, userLastName].filter(Boolean).join(' ');

  return (
    <HtmlModal
      open={open}
      onClose={handleCancel}
      title="Assign program"
      subtitle={
        memberLabel
          ? `Choose a template and start date for ${memberLabel}.`
          : 'Choose a template and start date for this member.'
      }
      width={640}
      style={{ maxHeight: 'min(90vh, 720px)', display: 'flex', flexDirection: 'column' }}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      headerExtra={
        <div className="msteps" style={{ marginTop: 10 }}>
          <span className="on">1 · Template</span>
          <span className="sep">›</span>
          <span className={startDate ? 'on' : ''}>2 · Start date</span>
        </div>
      }
      footer={
        <>
          <button type="button" className="btn btn-sec" onClick={handleCancel} disabled={isAssigning}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-pri"
            onClick={handleAssignClick}
            disabled={!selectedAssignmentId || !startDate || isAssigning}
          >
            {isAssigning ? (
              <Icon name="LoaderCircle" size={17} className="animate-spin" />
            ) : (
              <Icon name="ClipboardList" size={17} />
            )}
            Assign program
          </button>
        </>
      }
    >
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

        <ScrollArea className="list-rows mt-3 min-h-0 flex-1 pr-2" style={{ maxHeight: 280 }}>
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
            <>
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
                    className={`lrow${isSelected ? ' on' : ''}`}
                    onClick={() => handleCardSelect(assignment.id || null)}
                    disabled={isAssigning}
                  >
                    <span className={`rd${isSelected ? ' on' : ''}`}>
                      {isSelected ? <i /> : null}
                    </span>
                    <ProgramPreview
                      seed={template?.id || assignment.id}
                      imageUrl={programImageUrl}
                      className="h-9 w-9 shrink-0"
                    />
                    <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <span className="row" style={{ gap: 8 }}>
                        <span className="nm">{template?.name || 'Unnamed Program'}</span>
                        <Badge tone={assignment.status === 'active' ? 'brand' : 'neutral'}>
                          {assignment.status || 'template'}
                        </Badge>
                      </span>
                      {template?.description ? (
                        <span className="em">{template.description}</span>
                      ) : null}
                      <span className="em" style={{ display: 'block' }}>
                        {template?.weeks || 0} weeks
                        {userName && assignment.status === 'active'
                          ? ` · Assigned to ${userName}`
                          : ''}
                      </span>
                    </span>
                  </button>
                );
              })}
              <div ref={observerTargetRef} className="h-4" />
              {isFetchingNextPage ? (
                <div className="py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  Loading more…
                </div>
              ) : null}
            </>
          )}
        </ScrollArea>

        <div className="ff mt-3">
          <label className="lbl" htmlFor="assign-program-start">
            Start date <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <p className="mut" style={{ fontSize: 'var(--text-xs)', marginBottom: 8 }}>
            Start date must be a Monday (today or later).
          </p>
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
        </div>
    </HtmlModal>
  );
}
