'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Icon } from '@/components/medvanta';
import {
  getScreeningTestLink,
  updateOrganizationScreeningUrl,
  updateOrganizationDescription,
} from '../actions';
import {
  uploadOrganizationPicture,
  updateOrganizationPicture,
} from '@/app/(authenticated)/groups/actions';

export function GroupSettingsPanel({
  groupName,
  organizationId,
  initialScreeningUrl,
  initialDescription,
  pictureUrl,
}: {
  groupName: string;
  organizationId: string;
  initialScreeningUrl?: string | null;
  initialDescription?: string | null;
  pictureUrl?: string | null;
}): React.ReactElement {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialScreeningUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [savingDescription, setSavingDescription] = useState(false);
  const [testLink, setTestLink] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    pictureUrl ?? null,
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingLogo(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setLogoPreview(base64); // optimistic preview
      const upload = await uploadOrganizationPicture(
        organizationId,
        base64,
        logoPreview,
      );
      if (!upload.success || !upload.data) {
        const msg = 'error' in upload ? upload.error : 'Failed to upload logo';
        throw new Error(msg);
      }

      const update = await updateOrganizationPicture(
        organizationId,
        upload.data,
      );
      if (!update.success) {
        throw new Error(update.error || 'Failed to save logo');
      }

      setLogoPreview(upload.data);
      toast.success('Logo updated');
      router.refresh();
    } catch (error) {
      setLogoPreview(pictureUrl ?? null);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSaveDescription(): Promise<void> {
    setSavingDescription(true);
    try {
      const result = await updateOrganizationDescription(
        organizationId,
        description,
      );
      if (result.success) {
        toast.success('Description saved');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSavingDescription(false);
    }
  }

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
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="ch" style={{ marginBottom: 14 }}>
          <div>
            <div className="ch-t" style={{ fontSize: 'var(--text-base)' }}>
              Group details
            </div>
            <div className="ch-s">Basic information about this group</div>
          </div>
        </div>
        <div className="ff">
          <label className="lbl">
            Group name<span className="req">*</span>
          </label>
          <span className="fld ro">
            <input value={groupName} readOnly disabled />
          </span>
        </div>
        <div className="ff">
          <label className="lbl">Email domain</label>
          <span className="fld ro">
            <Icon name="AtSign" size={16} />
            <input
              className="mono"
              value=""
              placeholder="Not configured"
              readOnly
              disabled
            />
          </span>
          <div className="hint">
            Domain-based auto-assignment is not available in this build.
          </div>
        </div>
        <div style={{ marginBottom: 0 }}>
          <label className="lbl">Description</label>
          <textarea
            className="ta"
            rows={2}
            value={description}
            placeholder="Add a short description of this group"
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="row" style={{ gap: 10, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-acc btn-sm"
              disabled={savingDescription || description === (initialDescription ?? '')}
              onClick={handleSaveDescription}
            >
              {savingDescription ? 'Saving…' : 'Save description'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="ch" style={{ marginBottom: 14 }}>
          <div>
            <div className="ch-t" style={{ fontSize: 'var(--text-base)' }}>
              Screening meeting
            </div>
            <div className="ch-s">
              Link members open to book their screening call
            </div>
          </div>
        </div>
        {!value ? (
          <div className="hint" style={{ marginBottom: 12 }}>
            No custom link set.
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
          <div className="hint">Paste your Calendly event link.</div>
        </div>
        <div className="row" style={{ gap: 10, marginBottom: 0 }}>
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
      </div>

      <div className="card">
        <div className="ch" style={{ marginBottom: 14 }}>
          <div>
            <div className="ch-t" style={{ fontSize: 'var(--text-base)' }}>
              Group logo
            </div>
            <div className="ch-s">Shown next to the group name</div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          onChange={handleLogoChange}
        />
        <div className="row" style={{ gap: 14, marginBottom: 0 }}>
          <span
            className="thmb gr"
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Group logo"
                width={56}
                height={56}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <Icon name="Building2" size={24} />
            )}
          </span>
          <span>
            <button
              type="button"
              className="btn btn-sec btn-sm"
              disabled={uploadingLogo}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="Upload" size={15} />
              {uploadingLogo
                ? 'Uploading…'
                : logoPreview
                  ? 'Replace logo'
                  : 'Upload a logo'}
            </button>
            <div className="hint">JPEG or PNG.</div>
          </span>
        </div>
      </div>

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
