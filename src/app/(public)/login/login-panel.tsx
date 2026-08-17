import Image from 'next/image';

/** HTML `.login-l` marketing panel from scLoginEmail. */
export function LoginPanel(): React.ReactElement {
  return (
    <div className="login-l">
      <span className="glow" aria-hidden />
      <span className="glow2" aria-hidden />
      <div style={{ position: 'relative' }}>
        <Image
          src="/medvanta-text.png"
          alt="MedVanta"
          width={160}
          height={48}
          className="h-auto w-auto max-w-[160px] object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
          priority
        />
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '.01em',
            color: 'var(--cyan-300)',
            marginTop: 8,
          }}
        >
          VantaThrive admin
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            fontSize: 33,
            fontWeight: 800,
            color: 'var(--white)',
            lineHeight: 1.15,
            letterSpacing: '-.02em',
            maxWidth: 430,
          }}
        >
          Musculoskeletal care, connected end to end.
        </div>
        <div
          style={{
            fontSize: 15,
            color: 'var(--navy-200)',
            marginTop: 16,
            maxWidth: 410,
            lineHeight: 1.6,
          }}
        >
          The VantaThrive admin console — manage members, groups, programs and
          the exercise library across the MedVanta network.
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          gap: 18,
          color: 'var(--navy-300)',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span>190+ locations</span>
        <span style={{ color: 'var(--navy-500)' }}>·</span>
        <span>12,480 patients</span>
        <span style={{ color: 'var(--navy-500)' }}>·</span>
        <span>38 partner orgs</span>
      </div>
    </div>
  );
}
