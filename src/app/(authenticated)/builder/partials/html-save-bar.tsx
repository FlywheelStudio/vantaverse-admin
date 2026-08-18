'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/medvanta';
import { HtmlMoreButton } from './html-toolbar';

export interface BuilderSaveBarProps {
  activeStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2) => void;
  detailsHref?: string;
  workoutHref?: string;
  reviewAssignHref?: string;
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLoading?: boolean;
  showUnsaved?: boolean;
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
}: BuilderSaveBarProps): React.ReactElement {
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
          <button type="button" className="ib ib-sec" disabled aria-label="Preview as member">
            <Icon name="Eye" size={18} />
          </button>
          <span className="tt">Preview as a member sees it</span>
        </div>
        <button
          type="button"
          className="btn btn-pri"
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
        <HtmlMoreButton
          items={[
            { id: 'discard', label: 'Discard changes' },
            { id: 'duplicate', label: 'Duplicate template' },
            { id: 'archive', label: 'Archive' },
            { id: 'delete', label: 'Delete', danger: true },
          ]}
        />
      </span>
    </div>
  );
}
