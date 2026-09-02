'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Icon } from '@/components/medvanta';
import { Checkbox } from '@/components/medvanta/forms/Checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HtmlModal } from '../../users/[id]/partials/intake-survey-placeholder-modal';
import type { ProgramAssignmentMember } from '@/lib/supabase/schemas/program-assignments';
import { PROGRAM_ASSIGNMENT_STATUS } from '@/lib/constants/program-assignment-status';
import { getMemberName, isOngoingProgram } from './program-window';

interface PropagateDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Other assignments sharing this template. */
  members: ProgramAssignmentMember[];
  startDate?: Date;
  endDate?: Date;
  loading: boolean;
  onConfirm: (selectedIds: string[]) => void;
}

/**
 * Ask whether the new program window should propagate to other assigned
 * users. Ongoing programs are locked and pinned to the bottom.
 */
export function PropagateDatesDialog({
  open,
  onOpenChange,
  members,
  startDate,
  endDate,
  loading,
  onConfirm,
}: PropagateDatesDialogProps): React.ReactElement {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { unlocked, locked } = useMemo(() => {
    const isLocked = (member: ProgramAssignmentMember): boolean =>
      isOngoingProgram(member.status, member.start_date);
    const all = [...members].sort((a, b) =>
      getMemberName(a).localeCompare(getMemberName(b)),
    );
    return {
      unlocked: all.filter((member) => !isLocked(member)),
      locked: all.filter(isLocked),
    };
  }, [members]);

  // Pre-select every editable member each time the dialog opens.
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(unlocked.map((member) => member.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: string, checked: boolean): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const windowLabel =
    startDate && endDate
      ? `${format(startDate, 'EEE, MMM d')} – ${format(endDate, 'EEE, MMM d, yyyy')}`
      : 'the picked dates';

  return (
    <HtmlModal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Apply to other users?"
      subtitle={`Selected users will receive the same program window: ${windowLabel}.`}
      width={520}
      style={{ maxHeight: 'min(90vh, 720px)', display: 'flex', flexDirection: 'column' }}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      footer={
        <>
          <button
            type="button"
            className="btn btn-sec"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Only this user
          </button>
          <button
            type="button"
            className="btn btn-acc"
            onClick={() => onConfirm(Array.from(selectedIds))}
            disabled={loading}
          >
            {loading ? (
              <Icon name="LoaderCircle" size={17} className="animate-spin" />
            ) : null}
            Apply to {selectedIds.size}{' '}
            user{selectedIds.size === 1 ? '' : 's'}
          </button>
        </>
      }
    >
      <div className="list-rows" style={{ maxHeight: 340, overflowY: 'auto' }}>
        {members.length === 0 ? (
          <p className="mut" style={{ padding: 12 }}>
            No other users are assigned to this template.
          </p>
        ) : (
          <>
            {unlocked.map((member) => (
              <div key={member.id} className="lrow">
                <Checkbox
                  checked={selectedIds.has(member.id)}
                  onChange={(checked) => toggle(member.id, checked)}
                />
                <span style={{ flex: 1, minWidth: 0 }}>{getMemberName(member)}</span>
                <span
                  className={`bdg${member.status === PROGRAM_ASSIGNMENT_STATUS.ACTIVE ? ' bdg-b' : ''}`}
                  style={{ fontSize: 10 }}
                >
                  {member.status === PROGRAM_ASSIGNMENT_STATUS.ACTIVE
                    ? 'Active'
                    : 'Pre-program'}
                </span>
              </div>
            ))}
            {locked.map((member) => (
              <Tooltip key={member.id}>
                <TooltipTrigger asChild>
                  <div className="lrow" style={{ opacity: 0.6 }}>
                    <Checkbox checked disabled onChange={() => {}} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {getMemberName(member)}
                    </span>
                    <span className="row" style={{ gap: 6 }}>
                      <Icon name="Lock" size={13} />
                      <span className="bdg bdg-b" style={{ fontSize: 10 }}>
                        Active
                      </span>
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Ongoing program — start date locked; extend weeks in Workout
                  Schedule to change its end date
                </TooltipContent>
              </Tooltip>
            ))}
          </>
        )}
      </div>
    </HtmlModal>
  );
}
