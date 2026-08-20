'use client';

import { useState } from 'react';
import { Icon } from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import {
  AFFECTED_MEMBER_NAMES,
  AFFECTED_STACK_VISIBLE,
  DEFAULT_TEMPLATE_NAME,
  UPDATE_DERIVED_IMPACT_COUNTS,
  getAvatarToneClass,
  getStackInitials,
} from './update-derived-mock-data';

interface UpdateDerivedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (updateDerived: boolean) => void;
  loading?: boolean;
  /** Template name shown as modal subtitle (HTML). */
  templateName?: string;
}

function UpdateDerivedDialogBody({
  onOpenChange,
  onConfirm,
  loading = false,
  templateName,
}: Omit<UpdateDerivedDialogProps, 'open'>): React.ReactElement {
  const [updateDerived, setUpdateDerived] = useState(false);
  const counts = UPDATE_DERIVED_IMPACT_COUNTS;
  const displayName = templateName?.trim() || DEFAULT_TEMPLATE_NAME;
  const visibleNames = AFFECTED_MEMBER_NAMES.slice(0, AFFECTED_STACK_VISIBLE);
  const overflow =
    AFFECTED_MEMBER_NAMES.length > AFFECTED_STACK_VISIBLE
      ? AFFECTED_MEMBER_NAMES.length - AFFECTED_STACK_VISIBLE
      : 0;

  const handleConfirm = (): void => {
    onConfirm(updateDerived);
    setUpdateDerived(false);
  };

  const handleCancel = (): void => {
    onOpenChange(false);
    setUpdateDerived(false);
  };

  const primaryLabel = updateDerived
    ? 'Save and update programs'
    : 'Save template only';

  return (
    <HtmlModal
      open
      title="Save changes to this template?"
      subtitle={displayName}
      onClose={handleCancel}
      width={520}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn-acc" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <Icon name="LoaderCircle" size={17} className="animate-spin" />
            ) : (
              <Icon name="Save" size={17} />
            )}
            {primaryLabel}
          </button>
        </>
      }
    >
      <div className="alert alert-i" style={{ marginBottom: 18 }}>
        <Icon name="Info" size={18} />
        <div>
          <div className="at">
            {counts.members} members are on a program built from this template
          </div>
          Their completed weeks are never changed. Only weeks they have not reached yet can be
          rebuilt.
        </div>
      </div>

      <label className="lbl" style={{ marginBottom: 9, display: 'block' }}>
        What should this save do?
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16 }}>
        <button
          type="button"
          className={`choice${!updateDerived ? ' on' : ''}`}
          disabled={loading}
          onClick={() => setUpdateDerived(false)}
        >
          <span className={`rd${!updateDerived ? ' on' : ''}`}>
            {!updateDerived ? <i /> : null}
          </span>
          <span>
            <span className="ct">Update this template only</span>
            <span className="cd">
              The {counts.activePrograms} active member programs keep the schedule they were assigned.
              New assignments use the updated template.
            </span>
          </span>
        </button>
        <button
          type="button"
          className={`choice${updateDerived ? ' on' : ''}`}
          disabled={loading}
          onClick={() => setUpdateDerived(true)}
        >
          <span className={`rd${updateDerived ? ' on' : ''}`}>
            {updateDerived ? <i /> : null}
          </span>
          <span>
            <span className="ct">
              Update the template and rebuild {counts.activePrograms} active programs
            </span>
            <span className="cd">
              Remaining weeks are replaced with the new schedule. {counts.midWeekMembers} members
              are mid-week — their current week finishes first.
            </span>
          </span>
        </button>
      </div>

      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <div
          className="row"
          style={{
            gap: 9,
            padding: '10px 13px',
            background: 'var(--slate-50)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span className="ovl">Affected members</span>
          <span className="bdg bdg-b">{counts.members}</span>
          <button
            type="button"
            className="sp lnk"
            style={{ fontSize: 'var(--text-sm)', background: 'none', border: 'none', padding: 0 }}
            disabled
            aria-disabled="true"
          >
            Review the list
          </button>
        </div>
        <div className="row" style={{ gap: 11, padding: '12px 13px' }}>
          <span className="stk">
            {visibleNames.map((name) => (
              <span
                key={name}
                className={`av av-28 ${getAvatarToneClass(name)}`}
                title={name}
              >
                {getStackInitials(name)}
              </span>
            ))}
            {overflow > 0 ? <span className="more">+{overflow}</span> : null}
          </span>
          <span className="mut" style={{ fontSize: 'var(--text-sm)' }}>
            across {counts.groups} groups
          </span>
        </div>
      </div>
    </HtmlModal>
  );
}

/**
 * Save-template decision dialog (HTML `mdUpdateDerived`).
 * Remounts on open so the choice resets without effect setState.
 */
export function UpdateDerivedDialog({
  open,
  ...props
}: UpdateDerivedDialogProps): React.ReactElement | null {
  if (!open) return null;
  return <UpdateDerivedDialogBody key="update-derived-open" {...props} />;
}
