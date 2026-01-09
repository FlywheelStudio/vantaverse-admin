'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, ClipboardPaste, Check, Save } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
interface TemplateConfigActionsProps {
  onCopy: () => void;
  onPaste: () => void;
  canPaste: boolean;
  onSave: () => void;
}

export function TemplateConfigActions({
  onCopy,
  onPaste,
  canPaste,
  onSave,
}: TemplateConfigActionsProps) {
  const [showCopyCheck, setShowCopyCheck] = useState(false);
  const [showPasteCheck, setShowPasteCheck] = useState(false);
  const [showSaveCheck, setShowSaveCheck] = useState(false);

  const handleCopy = useCallback(() => {
    onCopy();
    setShowCopyCheck(true);
    setTimeout(() => setShowCopyCheck(false), 2000);
  }, [onCopy]);

  const handlePaste = useCallback(() => {
    if (canPaste) {
      onPaste();
      setShowPasteCheck(true);
      setTimeout(() => setShowPasteCheck(false), 2000);
    }
  }, [onPaste, canPaste]);

  const handleSave = useCallback(async () => {
    await onSave();
    setShowSaveCheck(true);
    setTimeout(() => setShowSaveCheck(false), 2000);
  }, [onSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          handleCopy();
        } else if (e.key === 'v' || e.key === 'V') {
          if (canPaste) {
            e.preventDefault();
            handlePaste();
          }
        }
      } else if (e.key === 'Enter' && !isInputField) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handlePaste, canPaste, handleSave]);

  return (
    <div className="flex gap-2 px-3 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {showCopyCheck ? (
              <Check className="size-4 m-3 cursor-pointer text-green-500" />
            ) : (
              <Copy
                className="size-4 m-3 cursor-pointer"
                onClick={handleCopy}
              />
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>Ctrl + C</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {showPasteCheck ? (
              <Check className="size-4 m-3 cursor-pointer text-green-500" />
            ) : (
              <ClipboardPaste
                className={cn(
                  canPaste
                    ? 'cursor-pointer'
                    : 'cursor-not-allowed text-gray-500',
                  'size-4 m-3',
                )}
                onClick={handlePaste}
              />
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>Ctrl + V</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="flex-1" />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {showSaveCheck ? (
              <Check className="size-4 m-3 cursor-pointer text-green-500" />
            ) : (
              <Save
                className="size-4 m-3 cursor-pointer"
                onClick={handleSave}
              />
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>Enter</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
