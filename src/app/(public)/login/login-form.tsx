'use client';

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  serverSignInWithMagicLink,
  serverVerifyOtp,
} from '@/app/(authenticated)/auth/actions';

/** HTML login form — email OTP (scLoginEmail / scLoginOtp). */
export function LoginForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otpSent, setOtpSent] = useState(
    searchParams.get('otpSent') === 'true',
  );
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleEmailSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      await serverSignInWithMagicLink(email);
      setOtpSent(true);
    });
  };

  const handleOtpChange = (index: number, value: string): void => {
    if (!/^\d*$/.test(value)) return;

    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const next = [...otp];
    for (let i = 0; i < 6; i++) {
      next[i] = pastedData[i] || '';
    }
    setOtp(next);

    const nextEmptyIndex = next.findIndex((val) => !val);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleOtpSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    setIsVerifying(true);
    startTransition(async () => {
      await serverVerifyOtp(email, otpCode);
    });
  };

  const handleBackToEmail = (): void => {
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
    setIsVerifying(false);
  };

  useEffect(() => {
    if (otpSent) {
      inputRefs.current[0]?.focus();
    }
  }, [otpSent]);

  if (!otpSent) {
    return (
      <div style={{ width: '100%', maxWidth: 372 }}>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '-.02em',
          }}
        >
          Admin sign in
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            margin: '7px 0 26px',
          }}
        >
          Enter your email to receive a verification code.
        </p>

        <form
          onSubmit={handleEmailSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <label className="lbl" htmlFor="login-email">
            Work email
          </label>
          <div className="fld fld-lg">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-acc btn-lg btn-full"
            disabled={isPending || !email.trim()}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending code…
              </>
            ) : (
              'Send verification code'
            )}
          </button>
        </form>

        <p
          style={{
            fontSize: 12,
            color: 'var(--text-faint)',
            marginTop: 26,
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          Protected by MedVanta identity.
          <br />
          HIPAA-compliant access · Sessions expire after 12 hours.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: 372 }}>
      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '-.02em',
        }}
      >
        Enter code
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          margin: '7px 0 26px',
        }}
      >
        Verification code sent to{' '}
        <span style={{ color: 'var(--text-strong)', fontWeight: 600 }}>
          {email}
        </span>
      </p>

      <form
        onSubmit={handleOtpSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        <div className="otp" role="group" aria-label="Verification code">
          {otp.map((value, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={value}
              aria-label={`Digit ${index + 1}`}
              className={[
                'o',
                value ? 'fill' : '',
                activeIndex === index ? 'act' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={handleOtpPaste}
              onFocus={() => setActiveIndex(index)}
              disabled={isVerifying || isPending}
            />
          ))}
        </div>

        <button
          type="submit"
          className="btn btn-acc btn-lg btn-full"
          disabled={isVerifying || isPending || otp.join('').length !== 6}
        >
          {isVerifying || isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Verifying…
            </>
          ) : (
            'Verify and continue'
          )}
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-full"
          onClick={handleBackToEmail}
          disabled={isVerifying || isPending}
        >
          Use a different email
        </button>
      </form>
    </div>
  );
}
