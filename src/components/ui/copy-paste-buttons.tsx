'use client';

import { ClipboardIcon, CopyIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CopyPasteButtonsProps {
  size?: 'sm' | 'md' | 'lg';
  onCopy: () => void;
  onPaste: () => void;
  isCopied: boolean;
  isPasteDisabled: boolean;
  copyTooltip: string;
  pasteTooltip: string;
  copiedTooltip?: string;
  showCopy?: boolean;
  showPaste?: boolean;
}

const sizeClasses = {
  sm: {
    container: '',
    icon: 'h-3 w-3',
    button: 'h-9 px-3',
  },
  md: {
    container: '',
    icon: 'h-4 w-4',
    button: 'h-10 px-4',
  },
  lg: {
    container: '',
    icon: 'h-5 w-5',
    button: 'h-11 px-5',
  },
};

export function CopyPasteButtons({
  size = 'md',
  onCopy,
  onPaste,
  isCopied,
  isPasteDisabled,
  copyTooltip,
  pasteTooltip,
  copiedTooltip = 'Already copied',
  showCopy = true,
  showPaste = true,
}: CopyPasteButtonsProps) {
  const sizeClass = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-2', sizeClass.container)}>
      {showCopy && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onCopy}
              className={cn(
                'flex items-center justify-center rounded-[var(--radius-pill)] transition-colors shadow-[var(--shadow-sm)]',
                sizeClass.button,
                isCopied
                  ? 'bg-[oklch(0.66_0.17_155)] cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 cursor-pointer',
              )}
            >
              <CopyIcon className={cn(sizeClass.icon, 'text-white')} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isCopied ? copiedTooltip : copyTooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {showPaste && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onPaste}
              disabled={isPasteDisabled}
              className={cn(
                'flex items-center justify-center rounded-[var(--radius-pill)] transition-colors shadow-[var(--shadow-sm)]',
                sizeClass.button,
                isPasteDisabled
                  ? 'opacity-50 cursor-not-allowed bg-primary'
                  : 'bg-primary hover:bg-primary/90 cursor-pointer',
              )}
            >
              <ClipboardIcon className={cn(sizeClass.icon, 'text-white')} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isCopied ? copiedTooltip : pasteTooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
