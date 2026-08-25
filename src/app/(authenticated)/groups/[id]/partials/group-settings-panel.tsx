'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Icon, Tooltip } from '@/components/medvanta';
import {
  getScreeningTestLink,
  updateOrganizationScreeningUrl,
  updateOrganizationDescription,
  getConsultationTestLink,
  updateOrganizationConsultationUrl,
} from '../actions';
import {
  uploadOrganizationPicture,
  updateOrganizationPicture,
} from '@/app/(authenticated)/groups/actions';

type Preview = { src: string; title: string };

export function GroupSettingsPanel({
  groupName,
  organizationId,
  initialScreeningUrl,
  initialDescription,
  pictureUrl,
  initialConsultationUrl,
  canEditConsultation,
}: {
  groupName: string;
  organizationId: string;
  initialScreeningUrl?: string | null;
  initialDescription?: string | null;
  pictureUrl?: string | null;
  initialConsultationUrl?: string | null;
  canEditConsultation?: boolean;
}): React.ReactElement {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialScreeningUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [savingDescription, setSavingDescription] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [consultationValue, setConsultationValue] = useState(
    initialConsultationUrl ?? '',
  );
  const [savingConsultation, setSavingConsultation] = useState(false);
  const canEditConsultationFinal = canEditConsultation === true;
  const [logoPreview, setLogoPreview] = useState<string | null>(
    pictureUrl ?? null,
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function handleLogoChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
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

  async function handleSaveScreening(): Promise<void> {
    setSaving(true);
    try {
      const result = await updateOrganizationScreeningUrl(
        organizationId,
        value,
      );
      if (result.success) {
        toast.success('Screening link saved');
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTestScreening(): Promise<void> {
    const result = await getScreeningTestLink(organizationId, value);
    if (result.success) {
      setPreview({ src: result.data, title: 'Calendly screening preview' });
    } else {
      toast.error(result.error);
    }
  }

  async function handleSaveConsultation(): Promise<void> {
    setSavingConsultation(true);
    try {
      const result = await updateOrganizationConsultationUrl(consultationValue);
      if (result.success) {
        toast.success('Consultation link saved');
      } else {
        toast.error(result.error);
      }
    } finally {
      setSavingConsultation(false);
    }
  }

  async function handleTestConsultation(): Promise<void> {
    const result = await getConsultationTestLink(consultationValue);
    if (result.success) {
      setPreview({ src: result.data, title: 'Calendly consultation preview' });
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        hidden
        onChange={handleLogoChange}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
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
                disabled={
                  savingDescription ||
                  description === (initialDescription ?? '')
                }
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
                Group logo
              </div>
              <div className="ch-s">Shown next to the group name</div>
            </div>
          </div>
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
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
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
            <button
              type="button"
              className="btn btn-acc"
              disabled={saving}
              onClick={handleSaveScreening}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={saving}
              onClick={handleTestScreening}
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
                Onboarding consultation
              </div>
              <div className="ch-s">
                Link members open to book their consultation call
              </div>
            </div>
          </div>
          {!consultationValue ? (
            <div className="hint" style={{ marginBottom: 12 }}>
              No custom link set.
            </div>
          ) : null}
          <div className="ff">
            <label className="lbl">Calendly event URL</label>
            <span className={`fld${canEditConsultationFinal ? '' : ' ro'}`}>
              <Icon name="CalendarDays" size={16} />
              <input
                className="mono"
                placeholder="https://calendly.com/your-org/consultation"
                value={consultationValue}
                disabled={!canEditConsultationFinal}
                onChange={(e) => setConsultationValue(e.target.value)}
              />
            </span>
            <div className="hint">
              Global link shared by every organization. Paste your Calendly
              event link.
            </div>
          </div>
          <div className="row" style={{ gap: 10, marginBottom: 0 }}>
            {(() => {
              const disabled = !canEditConsultationFinal;
              const saveButton = (
                <button
                  type="button"
                  className="btn btn-acc"
                  disabled={savingConsultation || disabled}
                  onClick={handleSaveConsultation}
                >
                  {savingConsultation ? 'Saving…' : 'Save'}
                </button>
              );
              const testButton = (
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={savingConsultation || disabled}
                  onClick={handleTestConsultation}
                >
                  Test
                  <Icon name="ExternalLink" size={15} />
                </button>
              );
              if (!disabled) {
                return (
                  <>
                    {saveButton}
                    {testButton}
                  </>
                );
              }
              return (
                <>
                  <Tooltip label="Only super admins can edit this link">
                    <span style={{ display: 'inline-flex' }}>{saveButton}</span>
                  </Tooltip>
                  <Tooltip label="Only super admins can test this link">
                    <span style={{ display: 'inline-flex' }}>{testButton}</span>
                  </Tooltip>
                </>
              );
            })()}
          </div>
        </div>
      </div>
      {preview ? (
        <div
          role="dialog"
          aria-label="Booking link preview"
          onClick={() => setPreview(null)}
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
                onClick={() => setPreview(null)}
              >
                Close
                <Icon name="X" size={15} />
              </button>
            </div>
            <iframe
              src={preview.src}
              title={preview.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{ flex: 1, width: '100%', border: 0, borderRadius: 8 }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
