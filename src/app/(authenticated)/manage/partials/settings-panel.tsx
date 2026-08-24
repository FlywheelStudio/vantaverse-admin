'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Icon } from '@/components/medvanta';
import {
  getConsultationTestLink,
  updateOrganizationConsultationUrl,
} from '../actions';

export function ManageSettingsPanel({
  initialConsultationUrl,
}: {
  initialConsultationUrl: string | null;
}): React.ReactElement {
  const [value, setValue] = useState(initialConsultationUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [testLink, setTestLink] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      const result = await updateOrganizationConsultationUrl(value);
      if (result.success) {
        toast.success('Consultation link saved');
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(): Promise<void> {
    const result = await getConsultationTestLink(value);
    if (result.success) {
      setTestLink(result.data);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="ch" style={{ marginBottom: 14 }}>
          <div>
            <div className="ch-t" style={{ fontSize: 'var(--text-base)' }}>
              Onboarding consultation
            </div>
            <div className="ch-s">
              Link members open to book their consultation call
            </div>
          </div>
        </div>
        {!value ? (
          <div className="hint" style={{ marginBottom: 12 }}>
            No link saved yet.
          </div>
        ) : null}
        <div className="ff">
          <label className="lbl">Calendly event URL</label>
          <span className="fld">
            <Icon name="CalendarDays" size={16} />
            <input
              className="mono"
              placeholder="https://calendly.com/your-org/consultation"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </span>
          <div className="hint">
            Paste your Calendly event link. Applies to every organization.
          </div>
        </div>
        <div className="row" style={{ gap: 10, marginBottom: 0 }}>
          <button
            type="button"
            className="btn btn-acc"
            disabled={saving}
            onClick={handleSave}
          >
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
      </div>

      {testLink ? (
        <div
          role="dialog"
          aria-label="Consultation link preview"
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
            <div
              className="row"
              style={{ justifyContent: 'space-between', marginBottom: 8 }}
            >
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
              title="Calendly consultation preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{ flex: 1, width: '100%', border: 0, borderRadius: 8 }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
