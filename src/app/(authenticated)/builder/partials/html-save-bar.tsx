'use client';

import { Icon } from '@/components/medvanta';
import { HtmlMoreButton } from './html-toolbar';

export interface BuilderSaveBarProps {
  activeStep: 1 | 2;
  onStepClick?: (step: 1 | 2) => void;
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLoading?: boolean;
  showUnsaved?: boolean;
}

/** HTML `saveBar()` step rail for program builder / workout screens. */
export function BuilderSaveBar({
  activeStep,
  onStepClick,
  onSave,
  saveDisabled = false,
  saveLoading = false,
  showUnsaved = false,
}: BuilderSaveBarProps): React.ReactElement {
  return (
    <div className="row" style={{ gap: 10, marginBottom: 18 }}>
      <span className="seg seg-lg">
        <button
          type="button"
          className={activeStep === 1 ? 'on' : ''}
          onClick={() => onStepClick?.(1)}
        >
          <Icon name="FileText" size={16} />
          1 · Details
        </button>
        <button
          type="button"
          className={activeStep === 2 ? 'on' : ''}
          onClick={() => onStepClick?.(2)}
        >
          <Icon name="CalendarDays" size={16} />
          2 · Workout schedule
        </button>
        <button type="button" disabled title="Review & assign — Task 9">
          <Icon name="BadgeCheck" size={16} />
          3 · Review &amp; assign
        </button>
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
        <HtmlMoreButton tooltip="Discard changes · Duplicate template · Archive · Delete" />
      </span>
    </div>
  );
}
