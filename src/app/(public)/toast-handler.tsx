'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export function ToastHandler() {
  const searchParams = useSearchParams();
  const lastParams = useRef<string>('');

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const currentParams = `${error || ''}-${message || ''}`;

    if (currentParams === lastParams.current || (!error && !message)) {
      return;
    }

    lastParams.current = currentParams;

    if (error) {
      toast.error(error);
    } else if (message) {
      toast.success(message);
    }
  }, [searchParams]);

  return null;
}
