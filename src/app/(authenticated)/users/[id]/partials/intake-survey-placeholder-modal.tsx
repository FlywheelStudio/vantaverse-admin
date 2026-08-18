'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Icon } from '@/components/medvanta';
import { Avatar } from '@/components/medvanta/data-display/Avatar';
import { cn } from '@/lib/utils';
import type { McIntakeSurvey } from '@/lib/supabase/queries/mc-intake';

interface HtmlModalProps {
  open?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerExtra?: React.ReactNode;
  /** Rendered in the header trailing cluster before the close button (e.g. day nav). */
  headerTrailing?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  footerInfo?: React.ReactNode;
  onClose?: () => void;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
  bodyClassName?: string;
  bodyStyle?: React.CSSProperties;
  headerClassName?: string;
  /** When true, omit default `.mb` padding (dual-pane modals). */
  flushBody?: boolean;
}

/** HTML `.scrim` / `.mwrap` / `.modal` chrome for in-scope dialogs. */
export function HtmlModal({
  open = true,
  title,
  subtitle,
  headerExtra,
  headerTrailing,
  children,
  footer,
  footerInfo,
  onClose,
  width = 480,
  className,
  style,
  bodyClassName,
  bodyStyle,
  headerClassName,
  flushBody = false,
}: HtmlModalProps): React.ReactElement {
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen) onClose?.();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="scrim fixed inset-0 z-[1000]" />
        <div className="mwrap fixed inset-0 z-[1001] flex items-center justify-center overflow-auto p-7 pointer-events-none">
          <DialogPrimitive.Content
            className={cn('modal pointer-events-auto outline-none', className)}
            style={{ width: '100%', maxWidth: width, ...style }}
          >
            <div className={cn('mh', headerClassName)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {title ? (
                  <DialogPrimitive.Title asChild>
                    <h3>{title}</h3>
                  </DialogPrimitive.Title>
                ) : (
                  <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
                )}
                {subtitle ? <div className="ms">{subtitle}</div> : null}
                {headerExtra}
              </div>
              {(headerTrailing || onClose) ? (
                <div className="row" style={{ gap: 7, flex: '0 0 auto' }}>
                  {headerTrailing}
                  {onClose ? (
                    <DialogPrimitive.Close
                      type="button"
                      className="ib ib-sm"
                      aria-label="Close"
                      style={{ marginLeft: headerTrailing ? 4 : -6 }}
                    >
                      <Icon name="X" size={19} />
                    </DialogPrimitive.Close>
                  ) : null}
                </div>
              ) : null}
            </div>
            {children ? (
              <div
                className={cn(!flushBody && 'mb', bodyClassName)}
                style={
                  flushBody
                    ? { flex: 1, minHeight: 0, overflow: 'hidden', padding: 0, ...bodyStyle }
                    : bodyStyle
                }
              >
                {children}
              </div>
            ) : null}
            {footer ? (
              <div className="mf">
                {footerInfo ? <span className="fi">{footerInfo}</span> : null}
                <span className="r">{footer}</span>
              </div>
            ) : null}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface IntakeSurveyPlaceholderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey: McIntakeSurvey | null;
  memberName?: string;
}

function QaRow({
  question,
  answer,
  none = false,
}: {
  question: string;
  answer: React.ReactNode;
  none?: boolean;
}): React.ReactElement {
  return (
    <div className="qa">
      <div className="q">{question}</div>
      <div className={cn('a', none && 'none')}>{answer}</div>
    </div>
  );
}

function SurveySection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="row" style={{ gap: 8, marginBottom: 4 }}>
        <Icon name={icon} size={16} style={{ color: 'var(--navy-600)' }} />
        <span
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--text-strong)',
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/** Read-only intake survey layout placeholder (`mdIntakeSurvey`). */
export function IntakeSurveyPlaceholderModal({
  open,
  onOpenChange,
  survey,
  memberName = 'Member',
}: IntakeSurveyPlaceholderModalProps): React.ReactElement {
  const handleClose = (): void => onOpenChange(false);

  const commitment =
    survey?.commitment_days != null && survey.commitment_minutes != null
      ? `${survey.commitment_days} days · ${survey.commitment_minutes} min/session`
      : survey?.commitment_days != null
        ? `${survey.commitment_days} days per week`
        : survey?.commitment_minutes != null
          ? `${survey.commitment_minutes} minutes per session`
          : '—';

  return (
    <HtmlModal
      open={open}
      onClose={handleClose}
      title="Intake survey"
      subtitle="Gate 1 of 4. Read-only — members can only change their answers by resubmitting."
      width={660}
      footerInfo="Gate 1 of 4 · layout placeholder"
      footer={
        <>
          <button type="button" className="btn btn-sec" disabled title="Placeholder">
            <Icon name="Download" size={17} />
            Export PDF
          </button>
          <button type="button" className="btn btn-pri" onClick={handleClose}>
            Close
          </button>
        </>
      }
    >
      <div
        className="row"
        style={{
          gap: 12,
          padding: '13px 15px',
          background: 'var(--navy-50)',
          border: '1px solid var(--navy-200)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
        }}
      >
        <Avatar name={memberName} size="md" />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--fw-semibold)',
              color: 'var(--text-strong)',
            }}
          >
            {memberName}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Submitted date unavailable · survey data from existing RPC
          </span>
        </span>
        <span className="bdg bdg-b">
          <Icon name="CircleCheck" size={12} />
          {survey ? 'Complete' : 'Pending'}
        </span>
      </div>

      {!survey ? (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          No intake survey on file for this member.
        </p>
      ) : (
        <>
          <SurveySection title="About you" icon="UserRound">
            <QaRow question="Occupation" answer={survey.occupation ?? '—'} none={!survey.occupation} />
            <QaRow
              question="Activity level"
              answer={survey.activity_level ?? '—'}
              none={!survey.activity_level}
            />
          </SurveySection>

          <SurveySection title="Symptoms and history" icon="HeartPulse">
            <QaRow
              question="Reported symptoms"
              answer={
                survey.symptoms.length > 0 ? survey.symptoms.join(', ') : 'None reported'
              }
              none={survey.symptoms.length === 0}
            />
            <QaRow
              question="Health conditions"
              answer={
                survey.health_conditions.length > 0
                  ? survey.health_conditions.join(', ')
                  : 'None reported'
              }
              none={survey.health_conditions.length === 0}
            />
            <QaRow
              question="Preconditions flagged"
              answer={
                survey.preconditions
                  ? survey.preconditions_details ?? 'Yes'
                  : 'No'
              }
            />
          </SurveySection>

          <SurveySection title="Availability" icon="CalendarDays">
            <QaRow question="Weekly commitment" answer={commitment} />
          </SurveySection>

          <SurveySection title="Goals" icon="Target">
            <QaRow
              question="Goal details"
              answer="Placeholder — full survey Q&A not wired in admin"
              none
            />
          </SurveySection>
        </>
      )}
    </HtmlModal>
  );
}
