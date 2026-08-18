'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Avatar, Icon } from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import { cn } from '@/lib/utils';

import { type ImportUsersResult } from '../../actions';
import { FileUploadTab } from './file-upload-tab';
import { PendingUsersView } from './pending-users-view';
import {
  PendingUsersProvider,
  usePendingUsers,
} from '../contexts/pending-users-context';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';
import { useCreateUserQuickAdd } from '../hooks/use-users-table-mutations';
import {
  CHOOSE_GROUP_VALUE,
  KEEP_GROUP_VALUE,
  KEEP_ONBOARDING_VALUE,
  KEEP_ROLE_VALUE,
  INVITE_ONBOARDING_OPTIONS,
  INVITE_ROLE_OPTIONS,
  MOCK_INVITE_GROUPS,
  SAMPLE_INVITEES,
  createInviteeFromEmail,
  getMockGroupName,
  parseInviteEmails,
  type InviteOnboarding,
  type InviteRole,
  type MockInvitee,
} from './invite-mock-data';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: MemberRole;
  title?: string;
}

type InviteMode = 'type' | 'paste' | 'csv';

function inviteeDisplayName(invitee: MockInvitee): string {
  const name = [invitee.firstName, invitee.lastName].filter(Boolean).join(' ');
  if (name) return name;
  return invitee.email.split('@')[0] || invitee.email;
}

function MedvantaSelect({
  id,
  value,
  onChange,
  children,
  'aria-label': ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  'aria-label'?: string;
}): React.ReactElement {
  return (
    <span className="sel" style={{ width: '100%' }}>
      <select
        id={id}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <span className="ci">
        <Icon name="ChevronDown" size={16} />
      </span>
    </span>
  );
}

export function AddUserModal({
  open,
  onOpenChange,
  role = 'patient',
  title,
}: AddUserModalProps): React.ReactElement {
  return (
    <PendingUsersProvider>
      <AddUserModalInner
        open={open}
        onOpenChange={onOpenChange}
        role={role}
        title={title}
      />
    </PendingUsersProvider>
  );
}

function AddUserModalInner({
  open,
  onOpenChange,
  role = 'patient',
  title,
}: AddUserModalProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { addBatch, reset } = usePendingUsers();
  const createUserMutation = useCreateUserQuickAdd();

  const [mode, setMode] = useState<'compose' | 'pending'>('compose');
  const [inviteMode, setInviteMode] = useState<InviteMode>('type');
  const [individualEmail, setIndividualEmail] = useState('');
  const [individualFirstName, setIndividualFirstName] = useState('');
  const [individualLastName, setIndividualLastName] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [invitees, setInvitees] = useState<MockInvitee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [bulkRole, setBulkRole] = useState<string>(KEEP_ROLE_VALUE);
  const [bulkGroup, setBulkGroup] = useState<string>(KEEP_GROUP_VALUE);
  const [bulkOnboarding, setBulkOnboarding] = useState<string>(
    KEEP_ONBOARDING_VALUE,
  );

  const canSubmitIndividual = useMemo(
    () => individualEmail.trim().length > 0,
    [individualEmail],
  );

  const resetIndividual = (): void => {
    setIndividualEmail('');
    setIndividualFirstName('');
    setIndividualLastName('');
  };

  const wasOpen = useRef(false);

  const handleClose = (): void => {
    resetIndividual();
    setMode('compose');
    setInviteMode('type');
    setPasteText('');
    setInvitees([]);
    setSelectedIds([]);
    setBulkRole(KEEP_ROLE_VALUE);
    setBulkGroup(KEEP_GROUP_VALUE);
    setBulkOnboarding(KEEP_ONBOARDING_VALUE);
    reset();
    onOpenChange(false);
  };

  useEffect(() => {
    if (wasOpen.current && !open) {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    }
    wasOpen.current = open;
  }, [open, queryClient]);

  const selectedInvitees = useMemo(
    () => invitees.filter((inv) => selectedIds.includes(inv.id)),
    [invitees, selectedIds],
  );

  const activeInvitee = useMemo(() => {
    if (selectedInvitees.length === 1) return selectedInvitees[0] ?? null;
    return null;
  }, [selectedInvitees]);

  const isMulti = selectedInvitees.length > 1;
  const missingGroupCount = useMemo(
    () => invitees.filter((inv) => !inv.groupId).length,
    [invitees],
  );
  const canReview = invitees.length > 0 && missingGroupCount === 0;

  const syncPendingFromInvitees = (next: MockInvitee[]): void => {
    reset();
    if (next.length === 0) return;
    addBatch({
      createdUsers: next.map((inv) => ({
        id: inv.id,
        email: inv.email,
        firstName: inv.firstName,
        lastName: inv.lastName,
        status: 'pending',
      })),
      existingUsers: [],
    });
  };

  const replaceInvitees = (
    next: MockInvitee[],
    selectIds?: string[],
  ): void => {
    setInvitees(next);
    syncPendingFromInvitees(next);
    if (selectIds) setSelectedIds(selectIds);
  };

  const upsertInvitees = (incoming: MockInvitee[]): MockInvitee[] => {
    const seen = new Set(invitees.map((p) => p.email.toLowerCase()));
    const added: MockInvitee[] = [];
    for (const inv of incoming) {
      const key = inv.email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      added.push(inv);
    }
    if (added.length === 0) return invitees;
    const next = [...invitees, ...added];
    const nextSelection =
      selectedIds.length === 0 && added[0]
        ? [added[0].id]
        : selectedIds;
    replaceInvitees(next, nextSelection);
    return next;
  };

  const updateInviteesByIds = (
    ids: string[],
    updater: (invitee: MockInvitee) => MockInvitee,
  ): void => {
    const idSet = new Set(ids);
    const next = invitees.map((inv) =>
      idSet.has(inv.id) ? updater(inv) : inv,
    );
    replaceInvitees(next);
  };

  const removeInvitee = (id: string): void => {
    const next = invitees.filter((inv) => inv.id !== id);
    replaceInvitees(
      next,
      selectedIds.filter((sid) => sid !== id),
    );
  };

  const handleAddToList = async (): Promise<void> => {
    if (!individualEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      const result = await createUserMutation.mutateAsync({
        email: individualEmail.trim(),
        firstName: individualFirstName.trim(),
        lastName: individualLastName.trim(),
        role,
      });

      const invitee = createInviteeFromEmail(individualEmail.trim(), {
        id: result.userId,
        firstName: individualFirstName.trim(),
        lastName: individualLastName.trim(),
        role: role === 'admin' ? 'admin' : 'member',
      });

      const seen = new Set(invitees.map((p) => p.email.toLowerCase()));
      if (!seen.has(invitee.email)) {
        replaceInvitees([...invitees, invitee], [invitee.id]);
      } else {
        setSelectedIds([invitee.id]);
      }
      resetIndividual();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleParsePaste = (): void => {
    const emails = parseInviteEmails(pasteText);
    if (emails.length === 0) {
      toast.error('No valid emails found');
      return;
    }

    const defaultRole: InviteRole = role === 'admin' ? 'admin' : 'member';
    const created = emails.map((email) =>
      createInviteeFromEmail(email, { role: defaultRole }),
    );
    upsertInvitees(created);
    setPasteText('');
    toast.success(
      `Added ${created.length} invitation${created.length === 1 ? '' : 's'}`,
    );
  };

  const handleLoadSampleInvitees = (): void => {
    upsertInvitees(
      SAMPLE_INVITEES.map((sample) => ({
        ...sample,
        id: `${sample.id}-${Date.now()}`,
      })),
    );
  };

  const handleImported = async (result: ImportUsersResult): Promise<void> => {
    try {
      const now = Date.now();
      const defaultRole: InviteRole = role === 'admin' ? 'admin' : 'member';

      const fromCreated = (result.createdUsers ?? []).map((u) =>
        createInviteeFromEmail(u.email, {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          role: defaultRole,
        }),
      );
      const fromExisting = (result.existingUsers ?? []).map((u) =>
        createInviteeFromEmail(u.email, {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          role: defaultRole,
        }),
      );
      const fromFailed = (result.failedUsers ?? []).map((u, idx) =>
        createInviteeFromEmail(u.email || `failed-${idx}@invalid.local`, {
          id: `failed:${now}:${u.rowNumber}:${idx}`,
          firstName: u.firstName,
          lastName: u.lastName,
          role: defaultRole,
        }),
      );

      upsertInvitees([...fromCreated, ...fromExisting, ...fromFailed]);

      // Prefer real import batch metadata for the review step.
      reset();
      addBatch({
        createdUsers:
          result.createdUsers?.map((u) => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            status: u.status,
          })) || [],
        existingUsers:
          result.existingUsers?.map((u) => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            status: u.status,
          })) || [],
        failedUsers:
          result.failedUsers?.map((u, idx) => ({
            id: `failed:${now}:${u.rowNumber}:${idx}`,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            status: 'failed',
          })) || [],
      });
      setMode('pending');
    } catch (error) {
      console.error('Error handling imported users:', error);
      setMode('pending');
    }
  };

  const handleSelectAll = (): void => {
    setSelectedIds(invitees.map((inv) => inv.id));
  };

  const handleClearSelection = (): void => {
    setSelectedIds([]);
  };

  const handleRowClick = (id: string): void => {
    setSelectedIds([id]);
  };

  const handleToggleCheckbox = (
    id: string,
    event: React.MouseEvent,
  ): void => {
    event.stopPropagation();
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((sid) => sid !== id);
      return [...prev, id].sort(
        (a, b) =>
          invitees.findIndex((inv) => inv.id === a) -
          invitees.findIndex((inv) => inv.id === b),
      );
    });
  };

  const handleSingleFieldChange = (
    field: keyof MockInvitee,
    value: string,
  ): void => {
    if (!activeInvitee) return;

    updateInviteesByIds([activeInvitee.id], (inv) => {
      if (field === 'role') {
        return { ...inv, role: value as InviteRole };
      }
      if (field === 'onboarding') {
        return { ...inv, onboarding: value as InviteOnboarding };
      }
      if (field === 'groupId') {
        const groupId = value || null;
        return {
          ...inv,
          groupId,
          groupName: getMockGroupName(groupId),
        };
      }
      if (field === 'firstName' || field === 'lastName' || field === 'email') {
        return { ...inv, [field]: value };
      }
      return inv;
    });
  };

  const handleApplyBulk = (): void => {
    if (!isMulti) return;
    const ids = selectedInvitees.map((inv) => inv.id);

    updateInviteesByIds(ids, (inv) => {
      let next = inv;
      if (bulkRole !== KEEP_ROLE_VALUE) {
        next = { ...next, role: bulkRole as InviteRole };
      }
      if (bulkGroup !== KEEP_GROUP_VALUE) {
        const groupId = bulkGroup || null;
        next = {
          ...next,
          groupId,
          groupName: getMockGroupName(groupId),
        };
      }
      if (bulkOnboarding !== KEEP_ONBOARDING_VALUE) {
        next = {
          ...next,
          onboarding: bulkOnboarding as InviteOnboarding,
        };
      }
      return next;
    });

    toast.success(`Applied to ${ids.length} people`);
  };

  const modalTitle =
    title ?? (role === 'admin' ? 'Invite admins' : 'Invite members');

  const footerInfoNode =
    invitees.length === 0 ? (
      <>0 invitations</>
    ) : missingGroupCount > 0 ? (
      <>
        {invitees.length} invitation{invitees.length === 1 ? '' : 's'} ·{' '}
        <b style={{ color: 'var(--danger)' }}>
          {missingGroupCount} missing a group
        </b>
      </>
    ) : (
      <>
        {invitees.length} invitation{invitees.length === 1 ? '' : 's'} · all
        complete
      </>
    );

  if (mode === 'pending') {
    return (
      <HtmlModal
        open={open}
        onClose={handleClose}
        title={modalTitle}
        subtitle="Review pending invites before sending."
        width={920}
        style={{
          height: 'min(660px, calc(100dvh - 56px))',
          display: 'flex',
          flexDirection: 'column',
        }}
        flushBody
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <PendingUsersView
          onClose={handleClose}
          onAddMore={() => setMode('compose')}
          role={role}
        />
      </HtmlModal>
    );
  }

  return (
    <HtmlModal
      open={open}
      onClose={handleClose}
      title={modalTitle}
      subtitle="Build the list on the left, set each person's details on the right."
      width={920}
      style={{
        height: 'min(660px, calc(100dvh - 56px))',
        display: 'flex',
        flexDirection: 'column',
      }}
      flushBody
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      footerInfo={footerInfoNode}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className={cn('btn btn-pri', !canReview && 'dis')}
            disabled={!canReview}
            onClick={() => setMode('pending')}
          >
            <Icon name="Send" size={17} />
            {invitees.length > 0
              ? `Send ${invitees.length} invitations`
              : 'Send invitations'}
          </button>
        </>
      }
    >
      <div
        className="dual"
        style={{ gridTemplateColumns: '352px minmax(0,1fr)' }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            borderRight: '1px solid var(--border-subtle)',
            background: 'var(--slate-50)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 16px 12px' }}>
            <span
              className="seg"
              style={{ width: '100%', marginBottom: 12, display: 'flex' }}
            >
              {(
                [
                  ['type', 'Type'],
                  ['paste', 'Paste'],
                  ['csv', 'CSV'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={inviteMode === id ? 'on' : undefined}
                  style={{ flex: 1, padding: '0 8px' }}
                  onClick={() => setInviteMode(id)}
                >
                  {label}
                </button>
              ))}
            </span>

            {inviteMode === 'type' ? (
              <>
                <div className="row" style={{ gap: 7 }}>
                  <span className="fld fld-sm" style={{ flex: 1 }}>
                    <Icon name="Mail" size={15} />
                    <input
                      placeholder="name@practice.com"
                      value={individualEmail}
                      onChange={(e) => setIndividualEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleAddToList();
                        }
                      }}
                    />
                  </span>
                  <button
                    type="button"
                    className="btn btn-sec btn-sm"
                    onClick={handleAddToList}
                    disabled={
                      !canSubmitIndividual || createUserMutation.isPending
                    }
                  >
                    {createUserMutation.isPending ? (
                      <Icon
                        name="LoaderCircle"
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <Icon name="Plus" size={15} />
                    )}
                    Add
                  </button>
                </div>
                <div className="hint" style={{ marginTop: 6 }}>
                  Enter adds and keeps the field focused.
                </div>
              </>
            ) : null}

            {inviteMode === 'paste' ? (
              <>
                <textarea
                  className="ta"
                  style={{ minHeight: 88 }}
                  placeholder="Paste emails, one per line or comma-separated"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <div className="hint" style={{ marginTop: 6 }}>
                  Each valid email becomes an invitee with default role and
                  onboarding.
                </div>
                <button
                  type="button"
                  className="btn btn-sec btn-sm"
                  style={{ marginTop: 8 }}
                  disabled={!pasteText.trim()}
                  onClick={handleParsePaste}
                >
                  Parse paste
                </button>
              </>
            ) : null}

            {inviteMode === 'csv' ? (
              <div style={{ marginTop: 4 }}>
                <FileUploadTab
                  fileType="csv"
                  onImported={handleImported}
                  onCancel={handleClose}
                  role={role}
                />
              </div>
            ) : null}
          </div>

          <div
            className="row"
            style={{
              gap: 8,
              padding: '9px 16px',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--surface-card)',
            }}
          >
            <span className="ovl">{invitees.length} to invite</span>
            <span className="sp row" style={{ gap: 10 }}>
              <button
                type="button"
                className="lnk"
                style={{
                  fontSize: 'var(--text-xs)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={handleSelectAll}
                disabled={invitees.length === 0}
              >
                Select all
              </button>
              <button
                type="button"
                className="lnk"
                style={{
                  fontSize: 'var(--text-xs)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={handleClearSelection}
              >
                Clear
              </button>
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
              background: 'var(--surface-card)',
            }}
          >
            {invitees.length === 0 ? (
              <div style={{ padding: 16 }}>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-muted)',
                    marginBottom: 12,
                  }}
                >
                  No one on the list yet.
                </p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleLoadSampleInvitees}
                >
                  Load sample invitees
                </button>
              </div>
            ) : (
              invitees.map((inv) => {
                const on = selectedIds.includes(inv.id);
                const incomplete = !inv.groupId;
                const hasName = Boolean(inv.firstName || inv.lastName);
                return (
                  <div
                    key={inv.id}
                    role="button"
                    tabIndex={0}
                    className={cn('inv-row', on && 'on', incomplete && 'warn')}
                    onClick={() => handleRowClick(inv.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(inv.id);
                      }
                    }}
                  >
                    <span
                      className={cn('cb', on && 'on')}
                      onClick={(e) => handleToggleCheckbox(inv.id, e)}
                      role="checkbox"
                      aria-checked={on}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedIds((prev) => {
                            if (prev.includes(inv.id)) {
                              return prev.filter((sid) => sid !== inv.id);
                            }
                            return [...prev, inv.id];
                          });
                        }
                      }}
                    >
                      {on ? <Icon name="Check" size={13} /> : null}
                    </span>
                    <Avatar name={inviteeDisplayName(inv)} size="sm" />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--fw-semibold)',
                          color: 'var(--text-strong)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {hasName ? (
                          [inv.firstName, inv.lastName]
                            .filter(Boolean)
                            .join(' ')
                        ) : (
                          <span
                            style={{
                              color: 'var(--text-muted)',
                              fontWeight: 'var(--fw-regular)',
                            }}
                          >
                            No name yet
                          </span>
                        )}
                      </span>
                      <span
                        className="mono"
                        style={{
                          display: 'block',
                          fontSize: '10.5px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {inv.email}
                      </span>
                    </span>
                    {incomplete ? (
                      <span className="tip">
                        <span className="iw">
                          <Icon name="CircleAlert" size={15} />
                        </span>
                        <span className="tt">No group assigned</span>
                      </span>
                    ) : (
                      <span
                        className="bdg"
                        title={inv.groupName ?? undefined}
                        style={{
                          fontSize: '9.5px',
                          padding: '2px 7px',
                          maxWidth: 88,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'inline-block',
                        }}
                      >
                        {inv.groupName}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {missingGroupCount > 0 ? (
            <div
              className="row"
              style={{
                gap: 8,
                padding: '11px 16px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--danger-soft)',
                fontSize: 'var(--text-xs)',
                color: 'var(--danger)',
              }}
            >
              <Icon name="CircleAlert" size={15} />
              <span>
                {missingGroupCount} person has no group yet
              </span>
            </div>
          ) : null}
        </div>

        <div
          id="invdetail"
          style={{ padding: '20px 22px', overflow: 'auto', minHeight: 0 }}
        >
          {selectedInvitees.length === 0 ? (
            <div className="empty" style={{ padding: '60px 20px' }}>
              <span className="ei">
                <Icon name="UserRound" size={24} />
              </span>
              <div className="et">Nobody selected</div>
              <div className="es">
                Pick someone on the left to fill in their details, or tick
                several to set their group and role together.
              </div>
            </div>
          ) : isMulti ? (
            <>
              <div className="row" style={{ gap: 10, marginBottom: 3 }}>
                <Icon
                  name="UsersRound"
                  size={17}
                  style={{ color: 'var(--navy-600)' }}
                />
                <span
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--fw-bold)',
                    color: 'var(--text-strong)',
                  }}
                >
                  {selectedInvitees.length} people selected
                </span>
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  marginBottom: 16,
                }}
              >
                Changes below apply to all {selectedInvitees.length}. Fields
                left blank keep their current value.
              </div>

              <div className="ff">
                <label className="lbl" htmlFor="invite-bulk-role">
                  Role
                </label>
                <MedvantaSelect
                  id="invite-bulk-role"
                  value={bulkRole}
                  onChange={setBulkRole}
                >
                  <option value={KEEP_ROLE_VALUE}>
                    Keep each person&apos;s role
                  </option>
                  {INVITE_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </MedvantaSelect>
              </div>

              <div className="ff">
                <label className="lbl" htmlFor="invite-bulk-group">
                  Group
                </label>
                <MedvantaSelect
                  id="invite-bulk-group"
                  value={bulkGroup}
                  onChange={setBulkGroup}
                >
                  <option value={KEEP_GROUP_VALUE}>
                    Keep each person&apos;s group
                  </option>
                  {MOCK_INVITE_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </MedvantaSelect>
                <div className="hint row" style={{ gap: 5 }}>
                  <Icon name="Link" size={12} />
                  The group decides which screening link they receive.
                </div>
              </div>

              <div style={{ marginBottom: 0 }}>
                <label className="lbl" htmlFor="invite-bulk-onboarding">
                  Onboarding path
                </label>
                <MedvantaSelect
                  id="invite-bulk-onboarding"
                  value={bulkOnboarding}
                  onChange={setBulkOnboarding}
                >
                  <option value={KEEP_ONBOARDING_VALUE}>
                    Keep each person&apos;s path
                  </option>
                  {INVITE_ONBOARDING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </MedvantaSelect>
              </div>

              <button
                type="button"
                className="btn btn-pri btn-full"
                style={{ marginTop: 18 }}
                onClick={handleApplyBulk}
              >
                <Icon name="Check" size={17} />
                Apply to {selectedInvitees.length} people
              </button>
            </>
          ) : activeInvitee ? (
            <>
              <div className="row" style={{ gap: 11, marginBottom: 16 }}>
                <Avatar name={inviteeDisplayName(activeInvitee)} size="md" />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--fw-bold)',
                      color: 'var(--text-strong)',
                    }}
                  >
                    {inviteeDisplayName(activeInvitee)}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {activeInvitee.email}
                  </span>
                </span>
                <button
                  type="button"
                  className="ib ib-sm ib-dan"
                  aria-label="Remove from list"
                  onClick={() => removeInvitee(activeInvitee.id)}
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>

              <div className="g g2" style={{ gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="lbl" htmlFor="invite-first-name">
                    First name
                  </label>
                  <span className="fld">
                    <input
                      id="invite-first-name"
                      placeholder="Optional"
                      value={activeInvitee.firstName}
                      onChange={(e) =>
                        handleSingleFieldChange('firstName', e.target.value)
                      }
                    />
                  </span>
                </div>
                <div>
                  <label className="lbl" htmlFor="invite-last-name">
                    Last name
                  </label>
                  <span className="fld">
                    <input
                      id="invite-last-name"
                      placeholder="Optional"
                      value={activeInvitee.lastName}
                      onChange={(e) =>
                        handleSingleFieldChange('lastName', e.target.value)
                      }
                    />
                  </span>
                </div>
              </div>

              <div className="ff">
                <label className="lbl" htmlFor="invite-email">
                  Email address<span className="req">*</span>
                </label>
                <span className="fld">
                  <Icon name="Mail" size={16} />
                  <input
                    id="invite-email"
                    value={activeInvitee.email}
                    onChange={(e) =>
                      handleSingleFieldChange('email', e.target.value)
                    }
                  />
                </span>
              </div>

              <div className="ff">
                <label className="lbl" htmlFor="invite-role">
                  Role
                </label>
                <MedvantaSelect
                  id="invite-role"
                  value={activeInvitee.role}
                  onChange={(value) => handleSingleFieldChange('role', value)}
                >
                  {INVITE_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </MedvantaSelect>
              </div>

              <div className="ff">
                <label className="lbl" htmlFor="invite-group">
                  Group<span className="req">*</span>
                </label>
                <MedvantaSelect
                  id="invite-group"
                  value={activeInvitee.groupId ?? CHOOSE_GROUP_VALUE}
                  onChange={(value) =>
                    handleSingleFieldChange('groupId', value)
                  }
                >
                  <option value={CHOOSE_GROUP_VALUE}>Choose a group…</option>
                  {MOCK_INVITE_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </MedvantaSelect>
                <div className="hint row" style={{ gap: 5 }}>
                  <Icon name="Link" size={12} />
                  The group decides which screening link they receive.
                </div>
              </div>

              <div style={{ marginBottom: 0 }}>
                <label className="lbl" htmlFor="invite-onboarding">
                  Onboarding path
                </label>
                <MedvantaSelect
                  id="invite-onboarding"
                  value={activeInvitee.onboarding}
                  onChange={(value) =>
                    handleSingleFieldChange('onboarding', value)
                  }
                >
                  {INVITE_ONBOARDING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </MedvantaSelect>
              </div>
            </>
          ) : null}

          {inviteMode === 'type' &&
          selectedInvitees.length === 0 &&
          invitees.length === 0 ? (
            <div className="g g2" style={{ marginTop: 16 }}>
              <div>
                <label className="lbl" htmlFor="invite-compose-first">
                  First name (optional)
                </label>
                <div className="fld">
                  <input
                    id="invite-compose-first"
                    placeholder="First name"
                    value={individualFirstName}
                    onChange={(e) => setIndividualFirstName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="lbl" htmlFor="invite-compose-last">
                  Last name (optional)
                </label>
                <div className="fld">
                  <input
                    id="invite-compose-last"
                    placeholder="Last name"
                    value={individualLastName}
                    onChange={(e) => setIndividualLastName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </HtmlModal>
  );
}
