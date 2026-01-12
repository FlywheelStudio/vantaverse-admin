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
    container: 'h-7 px-1.5',
    icon: 'h-3 w-3',
    button: 'px-1.5',
  },
  md: {
    container: 'h-9 px-2',
    icon: 'h-4 w-4',
    button: 'px-2',
  },
  lg: {
    container: 'h-11 px-2.5',
    icon: 'h-5 w-5',
    button: 'px-2.5',
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
                'flex items-center justify-center h-full rounded transition-colors',
                sizeClass.button,
                isCopied
                  ? 'bg-green-500 cursor-not-allowed'
                  : 'bg-[#2454FF] hover:bg-[#1E3FCC] cursor-pointer',
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
                'flex items-center justify-center h-full rounded transition-colors',
                sizeClass.button,
                isPasteDisabled
                  ? 'opacity-50 cursor-not-allowed bg-[#2454FF] hover:bg-[#1E3FCC]'
                  : 'bg-[#2454FF] hover:bg-[#1E3FCC] cursor-pointer',
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
