'use client';

import { useEffect } from 'react';
import { serverSaveNext } from '../../actions';
interface AuthNextProps {
  next?: string;
}

export function AuthNext({ next }: AuthNextProps) {
  useEffect(() => {
    if (next) {
      serverSaveNext(next);
    }
  }, [next]);
  return null;
}
