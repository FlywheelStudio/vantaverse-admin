'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Icon } from '@/components/medvanta';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';
import { HtmlMoreButton } from './html-toolbar';
import {
  cloneProgramAssignment,
  deleteProgramAssignment,
} from '../actions';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

interface BuilderSaveBarProps {
  activeStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2) => void;
  detailsHref?: string;
  workoutHref?: string;
  reviewAssignHref?: string;
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLoading?: boolean;
  showUnsaved?: boolean;
  /** Assignment of the open template; overflow actions render only when present. */
  assignmentId?: string;
  templateName?: string;
}

/** HTML `saveBar()` step rail for program builder / workout screens. */
function SaveBarStep({
  active,
  href,
  onClick,
  disabled,
  title,
  children,
}: {
  active: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}): React.ReactElement {
  const router = useRouter();
  const className = active ? 'on' : undefined;

  if (href && !active) {
    return (
      <button
        type="button"
        className={className}
        title={title}
        onClick={() => router.push(href)}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

export function BuilderSaveBar({
  activeStep,
  onStepClick,
  detailsHref,
  workoutHref,
  reviewAssignHref,
  onSave,
  saveDisabled = false,
  saveLoading = false,
  showUnsaved = false,
  assignmentId,
  templateName,
}: BuilderSaveBarProps): React.ReactElement {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Native warning when leaving with unsaved changes (tab close, refresh,
  // external navigation). In-app routing is not covered.
  useEffect(() => {
    if (!showUnsaved) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showUnsaved]);

  const handleDiscard = (): void => {
    window.location.reload();
  };

  const handleDuplicate = async (): Promise<void> => {
    if (!assignmentId) return;
    try {
      const result = await cloneProgramAssignment(assignmentId);
      if (!result.success) throw new Error(result.error);
      toast.success('Template duplicated');
      router.push(`/builder/${result.data.assignmentId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clone program');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!assignmentId) return;
    try {
      const result = await deleteProgramAssignment(assignmentId);
      if (!result.success) throw new Error(result.error);
      toast.success('Template deleted');
      router.push('/builder');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  return (
    <div className="row" style={{ gap: 10, marginBottom: 18 }}>
      <span className="seg seg-lg">
        <SaveBarStep
          active={activeStep === 1}
          href={detailsHref}
          onClick={detailsHref ? undefined : () => onStepClick?.(1)}
        >
          <Icon name="FileText" size={16} />
          1 · Details
        </SaveBarStep>
        <SaveBarStep
          active={activeStep === 2}
          href={workoutHref}
          onClick={workoutHref ? undefined : () => onStepClick?.(2)}
        >
          <Icon name="CalendarDays" size={16} />
          2 · Workout schedule
        </SaveBarStep>
        <SaveBarStep
          active={activeStep === 3}
          href={reviewAssignHref}
          disabled={!reviewAssignHref && activeStep !== 3}
          title={
            reviewAssignHref || activeStep === 3
              ? undefined
              : 'Review & assign — open a program first'
          }
        >
          <Icon name="BadgeCheck" size={16} />
          3 · Review &amp; assign
        </SaveBarStep>
      </span>
      <span className="sp row" style={{ gap: 10 }}>
        {showUnsaved ? (
          <span
            className="row"
            style={{
              gap: 6,
              whiteSpace: 'nowrap',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              fontWeight: 'var(--fw-medium)',
            }}
          >
            <Icon name="CircleDot" size={14} style={{ color: 'var(--cyan-500)' }} />
            Unsaved changes
          </span>
        ) : null}
        <div className="tip">
          <button
            type="button"
            className="ib ib-sec"
            aria-label="Preview as member"
            onClick={() => toastUnavailable('Preview as member')}
          >
            <Icon name="Eye" size={18} />
          </button>
          <span className="tt">Preview as a member sees it</span>
        </div>
        <button
          type="button"
          className="btn btn-acc"
          disabled={saveDisabled || saveLoading}
          onClick={onSave}
        >
          {saveLoading ? (
            <Icon name="LoaderCircle" size={17} className="animate-spin" />
          ) : (
            <Icon name="Save" size={17} />
          )}
          Save template
        </button>
        {assignmentId ? (
          <>
            <HtmlMoreButton
              items={[
                {
                  id: 'discard',
                  label: 'Discard changes',
                  disabled: !showUnsaved,
                  onSelect: handleDiscard,
                },
                {
                  id: 'duplicate',
                  label: 'Duplicate template',
                  onSelect: () => void handleDuplicate(),
                },
                {
                  id: 'delete',
                  label: 'Delete',
                  danger: true,
                  onSelect: () => setDeleteOpen(true),
                },
              ]}
            />
            <DeleteConfirmationDialog
              open={deleteOpen}
              onOpenChange={(open) => {
                if (!open) setDeleteOpen(false);
              }}
              title={`Delete “${templateName || 'this template'}”?`}
              description="This permanently removes the template and its schedule. Type the template name below to confirm."
              confirmText={templateName || undefined}
              onConfirm={handleDelete}
            />
          </>
        ) : null}
      </span>
    </div>
  );
}
