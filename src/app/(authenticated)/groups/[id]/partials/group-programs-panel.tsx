'use client';

import { useMemo, useState } from 'react';
import { HtmlSearchField } from '../../partials/html-search-field';
import { HtmlTableFooter } from '../../partials/html-table-footer';
import { Badge, Icon } from '@/components/medvanta';
import { useCancelGroupMemberProgram } from '../hooks/use-group-programs';
import {
  AssignGroupProgramModal,
} from './assign-group-program-modal';
import { PROGRAM_ASSIGNMENT_STATUS } from '@/lib/constants/program-assignment-status';
import type { GroupProgramRowData } from '../actions';

type Pill = 'all' | 'active' | 'pre_program' | 'completed' | 'cancelled';

const PILLS: Array<{ id: Pill; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'pre_program', label: 'Pre-program' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_TONE: Record<string, 'success' | 'neutral' | 'warning' | 'danger' | 'brand'> = {
  active: 'success',
  completed: 'neutral',
  cancelled: 'danger',
  pre_program: 'brand',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pre_program: 'Pre-program',
};

const formatAssignmentStatus = (status: string): string =>
  STATUS_LABEL[status] ??
  status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const canManageAssignment = (status: string): boolean =>
  status === PROGRAM_ASSIGNMENT_STATUS.ACTIVE ||
  status === PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM;

type MemberRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  program_name: string | null;
};

interface GroupProgramsPanelProps {
  organizationId: string;
  groupName: string;
  members: MemberRow[];
  programs: GroupProgramRowData[];
  isLoading: boolean;
}

/** Programs tab — real assignment data, filter pills, and quick admin actions. */
export function GroupProgramsPanel({
  organizationId,
  groupName,
  members,
  programs,
  isLoading,
}: GroupProgramsPanelProps): React.ReactElement {
  const [search, setSearch] = useState('');
  const [pill, setPill] = useState<Pill>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [presetUserIds, setPresetUserIds] = useState<string[] | undefined>(undefined);
  const [replaceUser, setReplaceUser] = useState<{ userId: string; name: string } | null>(null);

  const cancelMutation = useCancelGroupMemberProgram(organizationId);


  const filtered = useMemo(() => {
    let rows = programs;
    if (pill !== 'all') {
      rows = rows.filter((p) =>
        p.members.some((m) => m.status === pill),
      );
    }
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (p) =>
        p.template_name.toLowerCase().includes(term) ||
        p.members.some((m) => m.name.toLowerCase().includes(term)),
    );
  }, [programs, pill, search]);

  const openAssign = (userIds?: string[]): void => {
    setReplaceUser(null);
    setPresetUserIds(userIds);
    setAssignOpen(true);
  };

  const openReplace = (userId: string, name: string): void => {
    setPresetUserIds(undefined);
    setReplaceUser({ userId, name });
    setAssignOpen(true);
  };

  const handleRemove = (assignmentId: string): void => {
    if (!confirmingId || confirmingId !== assignmentId) {
      setConfirmingId(assignmentId);
      return;
    }
    setConfirmingId(null);
    cancelMutation.mutate(assignmentId);
  };

  return (
    <>
      <div className="tbar">
        <HtmlSearchField
          placeholder="Search programs in this group…"
          value={search}
          onChange={setSearch}
        />
        <span className="sp">
          <button
            type="button"
            className="btn btn-acc"
            onClick={() => openAssign()}
          >
            <Icon name="Plus" size={17} />
            Assign a program
          </button>
        </span>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0 12px' }}>
        {PILLS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPill(p.id)}
            style={{
              border: `1px solid ${pill === p.id ? 'var(--navy-600)' : 'var(--border-subtle)'}`,
              background: pill === p.id ? 'var(--navy-50)' : undefined,
              color: pill === p.id ? 'var(--navy-700)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-pill)',
              padding: '4px 12px',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="tw">
        <table className="tbl">
          <thead>
            <tr>
              <th>Program</th>
              <th>Members on it</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="mut" style={{ textAlign: 'center', padding: 24 }}>
                  Loading programs…
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((program) => (
                <ProgramRow
                  key={program.template_id}
                  program={program}
                  expanded={expandedId === program.template_id}
                  onToggle={() =>
                    setExpandedId((prev) =>
                      prev === program.template_id ? null : program.template_id,
                    )
                  }
                  confirmingId={confirmingId}
                  onConfirmRemove={handleRemove}
                  onCancelConfirm={() => setConfirmingId(null)}
                  onReplace={openReplace}
                  removing={cancelMutation.isPending}
                />
              ))
            ) : (
              <tr>
                <td colSpan={3} className="mut" style={{ textAlign: 'center', padding: 24 }}>
                  No programs match this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <HtmlTableFooter
          summary={
            <>{filtered.length} program{filtered.length === 1 ? '' : 's'} in {groupName}</>
          }
          page={1}
          pageCount={1}
          onPageChange={() => undefined}
        />
      </div>

      <AssignGroupProgramModal
        open={assignOpen}
        onOpenChange={setAssignOpen}
        organizationId={organizationId}
        groupName={groupName}
        members={members}
        presetUserIds={presetUserIds}
        replaceUser={replaceUser}
      />
    </>
  );
}

interface ProgramRowProps {
  program: GroupProgramRowData;
  expanded: boolean;
  onToggle: () => void;
  confirmingId: string | null;
  onConfirmRemove: (assignmentId: string) => void;
  onCancelConfirm: () => void;
  onReplace: (userId: string, name: string) => void;
  removing: boolean;
}

function ProgramRow({
  program,
  expanded,
  onToggle,
  confirmingId,
  onConfirmRemove,
  onCancelConfirm,
  onReplace,
  removing,
}: ProgramRowProps): React.ReactElement {
  const activeCount = program.members.filter((m) => m.status === 'active').length;

  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer' }}>
        <td>
          <div className="cellp">
            <span
              className="thmb gr"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                background: program.image_url
                  ? `center / cover no-repeat url(${program.image_url})`
                  : 'linear-gradient(140deg,var(--navy-800),var(--navy-600))',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto',
              }}
            >
              {!program.image_url ? (
                <Icon name="ClipboardList" size={17} style={{ color: 'rgba(255,255,255,.9)' }} />
              ) : null}
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="nm" style={{ display: 'block' }}>
                {program.template_name}
              </span>
              {program.weeks ? (
                <span className="em">{program.weeks} weeks</span>
              ) : null}
            </span>
          </div>
        </td>
        <td>
          <span
            className="mono"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            {activeCount} active / {program.members.length}
          </span>
        </td>
        <td style={{ textAlign: 'center' }}>
          <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={16} />
        </td>
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={3} style={{ background: 'var(--slate-50)', padding: '10px 16px 14px 60px' }}>
            <div style={{ display: 'grid', gap: 6 }}>
              {program.members.map((member) => (
                <div
                  key={member.assignment_id}
                  className="cellp"
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 10px',
                  }}
                >
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="nm" style={{ display: 'block' }}>{member.name}</span>
                    {member.start_date ? (
                      <span className="em">
                        {member.start_date}
                        {member.end_date ? ` – ${member.end_date}` : ''}
                      </span>
                    ) : null}
                  </span>
                  <Badge tone={STATUS_TONE[member.status] ?? 'neutral'} dot>
                    {formatAssignmentStatus(member.status)}
                  </Badge>
                  {canManageAssignment(member.status) ? (
                    <>
                      {confirmingId === member.assignment_id ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-dgr"
                            disabled={removing}
                            onClick={() => onConfirmRemove(member.assignment_id)}
                          >
                            Confirm remove
                          </button>
                          <button type="button" className="btn btn-sec" onClick={onCancelConfirm}>
                            Keep
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sec"
                          onClick={() => onConfirmRemove(member.assignment_id)}
                        >
                          <Icon name="Trash2" size={15} />
                          Remove
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sec"
                        onClick={() => onReplace(member.user_id, member.name)}
                      >
                        Replace…
                      </button>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
