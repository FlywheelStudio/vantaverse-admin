'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Icon } from '@/components/medvanta';
import { PlaceholderBlock } from '@/components/medvanta/shell';
import {
  getScreeningTestLink,
  updateOrganizationScreeningUrl,
} from '../actions';

export function GroupSchedulingCard({
  organizationId,
  initialScreeningUrl,
}: {
  organizationId: string;
  initialScreeningUrl?: string | null;
}): React.ReactElement {
  const [value, setValue] = useState(initialScreeningUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [testLink, setTestLink] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      const result = await updateOrganizationScreeningUrl(organizationId, value);
      if (result.success) {
        toast.success('Screening link saved');
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(): Promise<void> {
    const result = await getScreeningTestLink(organizationId);
    if (result.success) {
      setTestLink(result.data);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <PlaceholderBlock title="Screening meeting" className="card">
        {!value ? (
          <div className="hint" style={{ marginBottom: 12 }}>
            No custom link set — members fall back to the default pilot screening link.
          </div>
        ) : null}
        <div className="ff">
          <label className="lbl">Calendly event URL</label>
          <span className="fld">
            <Icon name="CalendarDays" size={16} />
            <input
              className="mono"
              placeholder="https://calendly.com/your-org/screening"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </span>
          <div className="hint">
            Paste your Calendly event link. Members book with their name, email and user id
            pre-filled ({'utm_term'}, {'utm_content=onboarding_screening'}).
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className="btn btn-acc" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={saving}
            onClick={handleTest}
          >
            Test
            <Icon name="ExternalLink" size={15} />
          </button>
        </div>
      </PlaceholderBlock>

      {testLink ? (
        <div
          role="dialog"
          aria-label="Screening link preview"
          onClick={() => setTestLink(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: 'min(680px, 92vw)',
              height: 'min(760px, 90vh)',
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
            }}
          >
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="et">Screening booking preview (your profile)</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setTestLink(null)}
              >
                Close
                <Icon name="X" size={15} />
              </button>
            </div>
            <iframe
              src={testLink}
              title="Calendly screening preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{ flex: 1, width: '100%', border: 0, borderRadius: 8 }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
