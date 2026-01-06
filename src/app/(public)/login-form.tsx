'use client';

import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { useTransition, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  serverSignInWithMagicLink,
  serverVerifyOtp,
} from '@/app/(authenticated)/auth/actions';

export function LoginForm() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otpSent, setOtpSent] = useState(
    searchParams.get('otpSent') === 'true',
  );
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) {
      return;
    }

    startTransition(async () => {
      await serverSignInWithMagicLink(email);
      setOtpSent(true);
    });
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);

    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  }

  function handleOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      return;
    }

    setIsVerifying(true);
    startTransition(async () => {
      await serverVerifyOtp(email, otpCode);
    });
  }

  useEffect(() => {
    if (otpSent) {
      inputRefs.current[0]?.focus();
    }
  }, [otpSent]);

  if (!otpSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full space-y-4"
      >
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-[#1E3A5F] dark:text-foreground">
          Admin Login
        </h1>
        <p className="mb-6 text-center text-sm text-[#64748B] dark:text-muted-foreground">
          Enter your email to receive a verification code
        </p>
        <form
          onSubmit={handleEmailSubmit}
          className="flex w-full flex-col items-center space-y-4"
        >
          <div className="w-full max-w-xs">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isPending}
              className="w-full h-12 px-4 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-background text-gray-900 dark:text-foreground placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2454FF] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <Button
            type="submit"
            disabled={isPending || !email.trim()}
            className="w-full max-w-xs bg-[#2454FF] hover:bg-[#1E3A5F] text-white font-semibold h-12 rounded-full"
          >
            {isPending ? (
              <>
                <Loader className="mr-2 h-5 w-5 animate-spin" />
                Sending code...
              </>
            ) : (
              'Send verification code'
            )}
          </Button>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full space-y-4"
    >
      <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-[#1E3A5F] dark:text-foreground">
        Enter Code
      </h1>
      <form
        onSubmit={handleOtpSubmit}
        className="flex w-full flex-col items-center space-y-4"
      >
        <div className="space-y-2">
          <p className="text-sm text-center text-[#64748B] dark:text-muted-foreground">
            Enter the verification code sent to
          </p>
          <p className="text-sm text-center font-semibold text-gray-900 dark:text-foreground">
            {email}
          </p>
        </div>
        <div className="flex justify-center gap-2">
          {otp.map((value, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={handleOtpPaste}
              disabled={isVerifying || isPending}
              className="h-12 w-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-background text-center text-lg font-semibold text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#2454FF] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ))}
        </div>
        <Button
          type="submit"
          disabled={isVerifying || isPending || otp.join('').length !== 6}
          className="w-full max-w-xs bg-[#2454FF] hover:bg-[#1E3A5F] text-white font-semibold h-12 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying || isPending ? (
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" />
              Verifying...
            </>
          ) : (
            'Confirm'
          )}
        </Button>
      </form>
    </motion.div>
  );
}
