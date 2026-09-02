'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Icon } from '@/components/medvanta';
import { Checkbox } from '@/components/medvanta/forms/Checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { HtmlModal } from '../../users/[id]/partials/intake-survey-placeholder-modal';
import {
  getOrganizationPatients,
  bulkAssignProgramToUsers,
} from '../actions';
import {
  calculateEndDate,
  formatDateForDB,
  getNextProgramStartMonday,
  isProgramStartDateDisabled,
} from '@/lib/utils';
import { programAssignmentsKeys } from '@/hooks/use-passignments';

interface QuickAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateAssignmentId: string;
  weeks: number;
  organizationId: string | null;
  /** User IDs that already have this template; shown disabled. */
  assignedUserIds: string[];
  onAssigned?: () => void;
}

/** Quick bulk assign: pick members + one shared start date; end dates auto-calculate. */
export function QuickAssignModal({
  open,
  onOpenChange,
  templateAssignmentId,
  weeks,
  organizationId,
  assignedUserIds,
  onAssigned,
}: QuickAssignModalProps): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<Date | undefined>(
    getNextProgramStartMonday(),
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: patientsResult } = useQuery({
    queryKey: ['organization-patients', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      return getOrganizationPatients(organizationId);
    },
    enabled: open && !!organizationId,
  });

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setStartDate(getNextProgramStartMonday());
    }
  }, [open]);

  const patients = patientsResult?.success ? patientsResult.data : [];
  const assignedSet = useMemo(
    () => new Set(assignedUserIds),
    [assignedUserIds],
  );
  const endDate =
    startDate && weeks >= 1
      ? (() => {
          const end = calculateEndDate(startDate, weeks);
          return end ? startOfDay(end) : undefined;
        })()
      : undefined;

  const toggle = (userId: string, checked: boolean): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const handleAssign = async (): Promise<void> => {
    if (!startDate || selectedIds.size === 0) return;
    setIsSaving(true);
    try {
      const result = await bulkAssignProgramToUsers(
        templateAssignmentId,
        Array.from(selectedIds),
        formatDateForDB(startDate),
      );
      await queryClient.invalidateQueries({
        queryKey: programAssignmentsKeys.all,
      });
      onAssigned?.();
      router.refresh();
      if (result.failed.length === 0) {
        toast.success(`Assigned to ${result.assigned} member${result.assigned !== 1 ? 's' : ''}`);
      } else {
        toast.success(`Assigned ${result.assigned}, ${result.failed.length} failed`);
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to assign');
    } finally {
      setIsSaving(false);
    }
  };

  const dateRange: DateRange | undefined = startDate
    ? { from: startDate, to: endDate }
    : undefined;

  return (
    <HtmlModal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Quick assign"
      subtitle={
        weeks >= 1
          ? `Pick members and a start date. Each program runs ${weeks} week${weeks === 1 ? '' : 's'} from its start date.`
          : 'Pick members and a start date.'
      }
      width={560}
      style={{ maxHeight: 'min(90vh, 720px)', display: 'flex', flexDirection: 'column' }}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      footer={
        <>
          <button
            type="button"
            className="btn btn-sec"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-acc"
            onClick={() => void handleAssign()}
            disabled={!startDate || selectedIds.size === 0 || isSaving}
          >
            {isSaving ? (
              <Icon name="LoaderCircle" size={17} className="animate-spin" />
            ) : (
              <Icon name="ClipboardList" size={17} />
            )}
            Assign {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}
            member{selectedIds.size === 1 ? '' : 's'}
          </button>
        </>
      }
    >
      {!organizationId ? (
        <p className="mut">No organization linked to this template.</p>
      ) : (
        <>
          <div className="list-rows" style={{ maxHeight: 320, overflowY: 'auto' }}>
            {(patients ?? []).length === 0 ? (
              <p className="mut" style={{ padding: 12 }}>
                No members found in this organization.
              </p>
            ) : (
              (patients ?? []).map((patient) => {
                const name =
                  [patient.first_name, patient.last_name]
                    .filter(Boolean)
                    .join(' ') ||
                  patient.email ||
                  'Unknown member';
                const alreadyAssigned = assignedSet.has(patient.id);
                return (
                  <div key={patient.id} className="lrow">
                    <Checkbox
                      checked={selectedIds.has(patient.id) && !alreadyAssigned}
                      disabled={alreadyAssigned}
                      onChange={(checked) => toggle(patient.id, checked)}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 'var(--text-md)',
                          fontWeight: 'var(--fw-medium)',
                          color: 'var(--text-strong)',
                        }}
                      >
                        {name}
                      </span>
                      {patient.email ? (
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {patient.email}
                        </span>
                      ) : null}
                    </span>
                    {alreadyAssigned ? (
                      <span className="bdg" style={{ fontSize: 10 }}>
                        Already assigned
                      </span>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <label className="lbl" style={{ marginTop: 14, marginBottom: 8 }}>
            Shared start date<span className="req">*</span>
          </label>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="btn btn-sec btn-full"
                style={{ justifyContent: 'flex-start' }}
              >
                <Icon name="Calendar" size={16} />
                {startDate ? format(startDate, 'EEE, MMM d, yyyy') : 'Select start date'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from) setStartDate(startOfDay(range.from));
                }}
                disabled={isProgramStartDateDisabled}
                defaultMonth={startDate}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
          <div className="hint" style={{ marginTop: 8 }}>
            {endDate
              ? `End date auto-calculated: ${format(endDate, 'EEE, MMM d, yyyy')}`
              : 'Configure the week count in Workout Schedule to set an end date.'}
          </div>
        </>
      )}
    </HtmlModal>
  );
}
