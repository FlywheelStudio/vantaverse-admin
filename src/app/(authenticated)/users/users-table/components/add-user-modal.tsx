'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Icon } from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';

import { type ImportUsersResult } from '../../actions';
import { FileUploadTab } from './file-upload-tab';
import { PendingUsersView } from './pending-users-view';
import {
  PendingUsersProvider,
  usePendingUsers,
} from '../contexts/pending-users-context';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';
import { useCreateUserQuickAdd } from '../hooks/use-users-table-mutations';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: MemberRole;
  title?: string;
}

type InviteMode = 'type' | 'paste' | 'csv';

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
  const { addBatch, reset, rows } = usePendingUsers();
  const createUserMutation = useCreateUserQuickAdd();

  const [mode, setMode] = useState<'compose' | 'pending'>('compose');
  const [inviteMode, setInviteMode] = useState<InviteMode>('type');
  const [individualEmail, setIndividualEmail] = useState('');
  const [individualFirstName, setIndividualFirstName] = useState('');
  const [individualLastName, setIndividualLastName] = useState('');
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState('');

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
    setSelectedPendingId(null);
    reset();
    onOpenChange(false);
  };

  useEffect(() => {
    if (wasOpen.current && !open) {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    }
    wasOpen.current = open;
  }, [open, queryClient]);

  const activePendingId = useMemo(() => {
    if (rows.length === 0) return null;
    if (selectedPendingId && rows.some((r) => r.id === selectedPendingId)) {
      return selectedPendingId;
    }
    return rows[0]?.id ?? null;
  }, [rows, selectedPendingId]);

  const selectedPending = useMemo(
    () => rows.find((r) => r.id === activePendingId) ?? null,
    [rows, activePendingId],
  );

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

      const createdUser = {
        id: result.userId,
        email: individualEmail.trim().toLowerCase(),
        firstName: individualFirstName.trim(),
        lastName: individualLastName.trim(),
        status: 'pending',
      };

      addBatch({ createdUsers: [createdUser], existingUsers: [] });
      setSelectedPendingId(result.userId);
      resetIndividual();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleImported = async (result: ImportUsersResult): Promise<void> => {
    try {
      const now = Date.now();
      const batchData = {
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
      };

      addBatch(batchData);
      setMode('pending');
    } catch (error) {
      console.error('Error handling imported users:', error);
      setMode('pending');
    }
  };

  const modalTitle =
    title ?? (role === 'admin' ? 'Invite admins' : 'Invite members');

  if (mode === 'pending') {
    return (
      <HtmlModal
        open={open}
        onClose={handleClose}
        title={modalTitle}
        subtitle="Review pending invites before sending."
        width={920}
        style={{
          maxWidth: 920,
          height: 'min(660px, calc(100% - 8px))',
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
        maxWidth: 920,
        height: 'min(660px, calc(100% - 8px))',
        display: 'flex',
        flexDirection: 'column',
      }}
      flushBody
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      footerInfo={
        <>
          {rows.length} invitation{rows.length === 1 ? '' : 's'}
          {rows.length > 0 ? ' · ready to review' : ''}
        </>
      }
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-pri"
            disabled={rows.length === 0}
            onClick={() => setMode('pending')}
          >
            <Icon name="Send" size={17} />
            {rows.length > 0 ? `Review ${rows.length} invitations` : 'Send invitations'}
          </button>
        </>
      }
    >
      <div className="dual" style={{ gridTemplateColumns: '352px minmax(0,1fr)', flex: 1, minHeight: 0 }}>
        {/* Left — HTML invite list builder */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            borderRight: '1px solid var(--border-subtle)',
            background: 'var(--slate-50)',
          }}
        >
          <div style={{ padding: '16px 16px 12px' }}>
            <span className="seg" style={{ width: '100%', marginBottom: 12, display: 'flex' }}>
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
                    disabled={!canSubmitIndividual || createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? (
                      <Icon name="LoaderCircle" size={15} className="animate-spin" />
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
                  className="fld"
                  style={{
                    width: '100%',
                    minHeight: 88,
                    padding: 10,
                    fontSize: 'var(--text-sm)',
                    resize: 'vertical',
                  }}
                  placeholder="Paste emails, one per line"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <div className="hint" style={{ marginTop: 6 }}>
                  Placeholder — paste import uses CSV/Excel flow for bulk.
                </div>
                <button
                  type="button"
                  className="btn btn-sec btn-sm"
                  style={{ marginTop: 8 }}
                  disabled
                  title="Use CSV tab for bulk import"
                >
                  Parse paste (placeholder)
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
            <span className="ovl">{rows.length} to invite</span>
            <span className="sp row" style={{ gap: 10 }}>
              <button
                type="button"
                className="lnk"
                style={{ fontSize: 'var(--text-xs)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => {
                  if (rows[0]) setSelectedPendingId(rows[0].id);
                }}
              >
                Select all
              </button>
              <button
                type="button"
                className="lnk"
                style={{ fontSize: 'var(--text-xs)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => reset()}
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
            {rows.length === 0 ? (
              <p
                style={{
                  padding: 16,
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)',
                }}
              >
                No one on the list yet.
              </p>
            ) : (
              rows.map((r) => {
                const name =
                  [r.firstName, r.lastName].filter(Boolean).join(' ') || r.email;
                const on = activePendingId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`lrow${on ? ' on' : ''}`}
                    onClick={() => setSelectedPendingId(r.id)}
                  >
                    <span className={`cb${on ? ' on' : ''}`}>
                      {on ? <Icon name="Check" size={13} /> : null}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <span className="nm">{name}</span>
                      <span className="em">{r.email}</span>
                    </span>
                    <span className="bdg">{r.status}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right — detail pane */}
        <div style={{ padding: '20px 22px', overflow: 'auto', minHeight: 0 }}>
          {selectedPending ? (
            <>
              <div className="ch" style={{ marginBottom: 14 }}>
                <div>
                  <div className="ch-t">
                    {[selectedPending.firstName, selectedPending.lastName]
                      .filter(Boolean)
                      .join(' ') || selectedPending.email}
                  </div>
                  <div className="ch-s mono">{selectedPending.email}</div>
                </div>
                <span className="bdg bdg-b">{selectedPending.status}</span>
              </div>
              <div className="g g2" style={{ marginBottom: 12 }}>
                <label className="fld">
                  <span className="lbl">First name</span>
                  <input value={selectedPending.firstName || ''} readOnly />
                </label>
                <label className="fld">
                  <span className="lbl">Last name</span>
                  <input value={selectedPending.lastName || ''} readOnly />
                </label>
              </div>
              <div className="alert alert-i">
                <Icon name="Info" size={19} />
                <div>
                  <div className="at">Group assignment</div>
                  <div>
                    Assign a group after invite from the member profile, or use Add members on a
                    group. Placeholder — group picker not wired in this modal.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="alert alert-i">
              <Icon name="Info" size={19} />
              <div>
                <div className="at">No one selected</div>
                <div>Add an email on the left to build the invite list.</div>
              </div>
            </div>
          )}

          {inviteMode === 'type' && !selectedPending ? (
            <div className="g g2" style={{ marginTop: 16 }}>
              <label className="fld">
                <span className="lbl">First name (optional)</span>
                <input
                  placeholder="First name"
                  value={individualFirstName}
                  onChange={(e) => setIndividualFirstName(e.target.value)}
                />
              </label>
              <label className="fld">
                <span className="lbl">Last name (optional)</span>
                <input
                  placeholder="Last name"
                  value={individualLastName}
                  onChange={(e) => setIndividualLastName(e.target.value)}
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>
    </HtmlModal>
  );
}
