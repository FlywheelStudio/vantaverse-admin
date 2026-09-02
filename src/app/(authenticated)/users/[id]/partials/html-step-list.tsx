'use client';

import { Icon } from '@/components/medvanta';

export type HtmlStepTone = 'done' | 'now' | 'todo' | 'warn' | 'fail';

export interface HtmlStepItem {
  title: string;
  meta: React.ReactNode;
  tone: HtmlStepTone;
  /** Lucide name when done, else step number string */
  knob: string | number;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  sla?: { label: string; fail?: boolean };
}

function knobIcon(tone: HtmlStepTone, knob: string | number): React.ReactNode {
  if (tone === 'done') {
    return <Icon name="Check" size={15} strokeWidth={2.4} />;
  }
  if (tone === 'fail') {
    return <Icon name="X" size={15} />;
  }
  if (typeof knob === 'string' && Number.isNaN(Number(knob))) {
    return <Icon name={knob} size={15} />;
  }
  return knob;
}

export function HtmlStepList({
  steps,
}: {
  steps: HtmlStepItem[];
}): React.ReactElement {
  return (
    <ol className="sl">
      {steps.map((step, index) => (
        <li key={`${step.title}-${index}`} className={`sl-step ${step.tone}`}>
          <div className="sl-rail">
            <span className="sl-knob">{knobIcon(step.tone, step.knob)}</span>
            <span className="sl-line" />
          </div>
          <div className="sl-pane">
            <div className="sl-hd">
              <span className="sl-title">{step.title}</span>
              {step.badge}
            </div>
            <div className="sl-meta">{step.meta}</div>
            {step.sla ? (
              <div className={`sla${step.sla.fail ? ' fail' : ''}`}>{step.sla.label}</div>
            ) : null}
            {step.actions ? <div className="sl-acts">{step.actions}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
