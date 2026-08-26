'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Checkbox, Icon, Input } from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useProgramAssignmentsInfinite } from '@/hooks/use-passignments-for-user';
import { useDebounce } from '@/hooks/use-debounce';
import {
  cn,
  isProgramStartDateDisabled,
  calculateEndDate,
} from '@/lib/utils';
import { format, startOfDay } from 'date-fns';
import type { BulkAssignSkip } from '../actions';
import {
  useBulkAssignGroupProgram,
  useReplaceGroupMemberProgram,
  type BulkAssignInput,
} from '../hooks/use-group-programs';

type SelectableMember = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  program_name: string | null;
};

interface AssignGroupProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  groupName: string;
  members: SelectableMember[];
  /** Members pre-checked when opening (e.g. from the "No program" pill). */
  presetUserIds?: string[];
  /** When set, modal runs in replace mode for this single member. */
  replaceUser?: { userId: string; name: string } | null;
}

const displayName = (m: SelectableMember): string =>
  [m.first_name, m.last_name].filter(Boolean).join(' ') ||
  m.email ||
  'Unnamed member';

function ProgramPreview({
  imageUrl,
}: {
  imageUrl: string | null;
}): React.ReactElement {
  return (
    <span
      className="thmb gr"
      style={{
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-sm)',
        background: imageUrl
          ? `center / cover no-repeat url(${imageUrl})`
          : 'linear-gradient(140deg,var(--navy-800),var(--navy-600))',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
      }}
    >
      {!imageUrl ? (
        <Icon name="ClipboardList" size={17} style={{ color: 'rgba(255,255,255,.9)' }} />
      ) : null}
    </span>
  );
}

export function AssignGroupProgramModal({
  open,
  onOpenChange,
  organizationId,
  groupName,
  members,
  presetUserIds,
  replaceUser,
}: AssignGroupProgramModalProps): React.ReactElement {
  const isReplaceMode = !!replaceUser;

  const [memberSearch, setMemberSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(startOfDay(new Date()));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [result, setResult] = useState<{
    assignedCount: number;
    skipped: BulkAssignSkip[];
    failed: Array<{ user_id: string; error: string }>;
  } | null>(null);

  const debouncedTemplateSearch = useDebounce(templateSearch, 300);
  const {
    data,
    isLoading: templatesLoading,
    error: templatesError,
  } = useProgramAssignmentsInfinite(debouncedTemplateSearch, false);
  const assignments = useMemo(() => data?.pages.flat() ?? [], [data]);

  const bulkAssign = useBulkAssignGroupProgram(organizationId);
  const replaceProgram = useReplaceGroupMemberProgram(organizationId);

  // Reset state whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setMemberSearch('');
    setTemplateSearch('');
    setSelectedAssignmentId(null);
    setStartDate(startOfDay(new Date()));
    setIsDatePickerOpen(false);
    setResult(null);
    if (isReplaceMode) {
      setSelectedUserIds(new Set([replaceUser!.userId]));
    } else {
      // Members come unselected unless preset (e.g. via the "No program" pill).
      setSelectedUserIds(new Set(presetUserIds ?? []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedTemplate = assignments.find(
    (a) => a.id === selectedAssignmentId,
  );
  const endDate =
    startDate && selectedTemplate?.program_template?.weeks
      ? calculateEndDate(startDate, selectedTemplate.program_template.weeks)
      : undefined;

  const filteredMembers = useMemo(() => {
    const term = memberSearch.trim().toLowerCase();
    if (!term) return members;
    return members.filter(
      (m) =>
        displayName(m).toLowerCase().includes(term) ||
        (m.email ?? '').toLowerCase().includes(term),
    );
  }, [members, memberSearch]);

  const toggleMember = (userId: string): void => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const allFilteredSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedUserIds.has(m.user_id));

  const toggleAllMembers = (): void => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredMembers.forEach((m) => next.delete(m.user_id));
      } else {
        filteredMembers.forEach((m) => next.add(m.user_id));
      }
      return next;
    });
  };

  const canSubmit =
    isReplaceMode
      ? !!selectedAssignmentId && !replaceProgram.isPending
      : selectedUserIds.size > 0 && !!selectedAssignmentId && !bulkAssign.isPending;

  const handleSubmit = async (): Promise<void> => {
    if (!selectedAssignmentId || !startDate) return;
    const formatted = format(startDate, 'yyyy-MM-dd');

    try {
      if (isReplaceMode && replaceUser) {
        await replaceProgram.mutateAsync({
          userId: replaceUser.userId,
          templateAssignmentId: selectedAssignmentId,
          startDate: formatted,
        });
        onOpenChange(false);
        return;
      }

      const input: BulkAssignInput = {
        templateAssignmentId: selectedAssignmentId,
        userIds: Array.from(selectedUserIds),
        startDate: formatted,
      };
      const data = await bulkAssign.mutateAsync(input);
      setResult({
        assignedCount: data.assignedCount,
        skipped: data.skipped,
        failed: data.failed,
      });
    } catch {
      /* toast handled in hook */
    }
  };

  const replaceSkipped = async (skip: BulkAssignSkip): Promise<void> => {
    if (!selectedAssignmentId || !startDate) return;
    try {
      await replaceProgram.mutateAsync({
        userId: skip.user_id,
        templateAssignmentId: selectedAssignmentId,
        startDate: format(startDate, 'yyyy-MM-dd'),
      });
      setResult((prev) =>
        prev
          ? {
              ...prev,
              assignedCount: prev.assignedCount + 1,
              skipped: prev.skipped.filter((s) => s.user_id !== skip.user_id),
            }
          : prev,
      );
    } catch {
      /* toast handled in hook */
    }
  };

  const close = (): void => onOpenChange(false);

  const busy = bulkAssign.isPending || replaceProgram.isPending;

  const templateColumn = (
    <>
      <div className="lbl" style={{ display: 'flex', alignItems: 'center', height: 24, marginBottom: 6 }}>
        Choose template
      </div>
      <Input
        placeholder="Search programs…"
        value={templateSearch}
        onChange={(e) => setTemplateSearch(e.target.value)}
        iconLeft="Search"
        style={{ marginBottom: 8 }}
      />
      <div
        className="slim-scrollbar"
        style={{
          ...(isReplaceMode ? { height: 200 } : { flex: 1, minHeight: 0 }),
          overflowY: 'auto',
          display: 'grid',
          gap: 4,
          alignContent: 'start',
        }}
      >
        {templatesLoading ? (
          <div className="mut" style={{ textAlign: 'center', padding: 16 }}>Loading…</div>
        ) : templatesError ? (
          <div className="mut" style={{ textAlign: 'center', padding: 16, color: 'var(--danger)' }}>
            {(templatesError as Error).message}
          </div>
        ) : assignments.length === 0 ? (
          <div className="mut" style={{ textAlign: 'center', padding: 16 }}>No programs found.</div>
        ) : (
          assignments.map((assignment) => {
            const template = assignment.program_template;
            const isSelected = selectedAssignmentId === assignment.id;
            return (
              <button
                key={assignment.id}
                type="button"
                className="cellp"
                onClick={() => setSelectedAssignmentId(assignment.id || null)}
                disabled={busy}
                style={{
                  cursor: 'pointer',
                  padding: '8px 10px',
                  border: `1px solid ${isSelected ? 'var(--navy-500)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--navy-50)' : undefined,
                  textAlign: 'left',
                }}
              >
                <ProgramPreview
                  imageUrl={
                    typeof template?.image_url === 'string' ? template.image_url : null
                  }
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="nm" style={{ display: 'block' }}>
                    {template?.name || 'Unnamed Program'}
                  </span>
                  <span className="em">{template?.weeks || 0} weeks</span>
                </span>
                <span className={cn('rd', isSelected && 'on')}>{isSelected ? <i /> : null}</span>
              </button>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <HtmlModal
      open={open}
      onClose={close}
      title={isReplaceMode ? 'Replace program' : 'Assign a program'}
      subtitle={
        isReplaceMode
          ? `Choose a replacement template and start date for ${replaceUser!.name}.`
          : `Bulk-assign a program to members of ${groupName}.`
      }
      width={780}
      style={{ maxHeight: 'min(90vh, 720px)', display: 'flex', flexDirection: 'column' }}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      footer={
        result ? (
          <button type="button" className="btn btn-acc" onClick={close}>
            Done
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-sec" onClick={close} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-acc"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {busy ? (
                <Icon name="LoaderCircle" size={17} className="animate-spin" />
              ) : (
                <Icon name="ClipboardList" size={17} />
              )}
              {isReplaceMode ? 'Replace program' : `Assign to ${selectedUserIds.size} member${selectedUserIds.size === 1 ? '' : 's'}`}
            </button>
          </>
        )
      }
    >
      {result ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="alert alert-s">
            <Icon name="CheckCircle2" size={20} />
            <div>
              Assigned to {result.assignedCount} member{result.assignedCount === 1 ? '' : 's'}.
            </div>
          </div>

          {result.skipped.length > 0 ? (
            <div>
              <div className="lbl" style={{ marginBottom: 6 }}>
                Skipped — already on a program
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {result.skipped.map((skip) => (
                  <div key={skip.user_id} className="cellp" style={{ padding: '8px 10px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="nm" style={{ display: 'block' }}>{skip.name}</span>
                      <span className="em">Currently on: {skip.current_program ?? '—'}</span>
                    </span>
                    <button
                      type="button"
                      className="btn btn-sec"
                      onClick={() => replaceSkipped(skip)}
                      disabled={busy}
                    >
                      {busy ? (
                        <Icon name="LoaderCircle" size={15} className="animate-spin" />
                      ) : null}
                      Replace
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {result.failed.length > 0 ? (
            <div className="alert alert-d">
              <Icon name="AlertTriangle" size={20} />
              <div>
                {result.failed.length} assignment{result.failed.length === 1 ? '' : 's'} failed:
                {result.failed.map((f) => (
                  <div key={f.user_id} style={{ fontSize: 'var(--text-xs)' }}>{f.error}</div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          {/* Steps: members (bulk mode only, left column) + template (right column) */}
          {!isReplaceMode ? (
            <div className="grid min-h-0 grid-cols-2 gap-5" style={{ marginBottom: 14, height: 380 }}>
              <div className="flex min-h-0 flex-col">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    height: 24,
                    marginBottom: 6,
                  }}
                >
                  <span className="lbl">Select members ({selectedUserIds.size})</span>
                  {filteredMembers.length > 0 ? (
                    <button
                      type="button"
                      className="mut"
                      onClick={toggleAllMembers}
                      disabled={busy}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        fontSize: 'var(--text-xs)',
                        textDecoration: 'underline',
                      }}
                    >
                      {allFilteredSelected ? 'Deselect all' : 'Select all'}
                    </button>
                  ) : null}
                </div>
                <Input
                  placeholder="Search members…"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  iconLeft="Search"
                  style={{ marginBottom: 8 }}
                />
                <div
                  className="slim-scrollbar"
                  style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'grid', gap: 4, alignContent: 'start' }}
                >
                  {filteredMembers.length === 0 ? (
                    <div className="mut" style={{ textAlign: 'center', padding: 16 }}>
                      No members match.
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <label
                        key={member.user_id}
                        className="cellp"
                        style={{ cursor: 'pointer', padding: '8px 10px' }}
                      >
                        <Checkbox
                          checked={selectedUserIds.has(member.user_id)}
                          onChange={() => toggleMember(member.user_id)}
                          label=""
                        />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span className="nm">{displayName(member)}</span>
                        </span>
                        {member.program_name ? null : (
                          <Badge tone="accent" dot>No program</Badge>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex min-h-0 flex-col">
                {templateColumn}
              </div>
            </div>
          ) : (
            templateColumn
          )}

          {/* Step: start date */}
          <div style={{ marginTop: 14 }}>
            <div className="lbl" style={{ marginBottom: 6 }}>
              Start date <span style={{ color: 'var(--danger)' }}>*</span>
            </div>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="btn btn-sec" style={{ minWidth: 220 }}>
                  <Icon name="Calendar" size={16} />
                  {format(startDate, 'EEE, MMM d, yyyy')}
                  {endDate ? ` – ${format(endDate, 'MMM d, yyyy')}` : ''}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(startOfDay(date));
                      setIsDatePickerOpen(false);
                    }
                  }}
                  disabled={isProgramStartDateDisabled}
                  defaultMonth={startDate}
                  weekStartsOn={1}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            <p className="mut" style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>
              Defaults to today. Any day can be a start day.
            </p>
          </div>
        </>
      )}
    </HtmlModal>
  );
}
