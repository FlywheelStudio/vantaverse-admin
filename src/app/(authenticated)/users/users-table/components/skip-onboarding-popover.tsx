'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { setOnboardingStateForUsers } from '../../actions';
import type { SetOnboardingStateTarget } from '@/lib/supabase/queries/profiles';

type SkipOnboardingPopoverProps = {
  trigger: React.ReactNode;
  userIds: string[];
  onSuccess?: (
    userIds: string[],
    target: SetOnboardingStateTarget,
  ) => void;
  successMessage?: (count: number) => string;
  /** When true, trigger is not clickable (e.g. no users selected). */
  disabled?: boolean;
  /** Optional tooltip; hidden when popover is open. */
  tooltipContent?: React.ReactNode;
  /** When false, do not invalidate users query (e.g. inside Add User modal; invalidate on modal close instead). Default true. */
  invalidateOnSuccess?: boolean;
};

export function SkipOnboardingPopover({
  trigger,
  userIds,
  onSuccess,
  successMessage,
  disabled = false,
  tooltipContent,
  invalidateOnSuccess = true,
}: SkipOnboardingPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [skipping, setSkipping] = React.useState(false);
  const queryClient = useQueryClient();

  const handleSkip = async (target: SetOnboardingStateTarget) => {
    if (!userIds.length || skipping) return;
    setSkipping(true);
    try {
      const result = await setOnboardingStateForUsers(userIds, target, {
        skipRevalidate: !invalidateOnSuccess,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      onSuccess?.(userIds, target);
      toast.success(
        successMessage
          ? successMessage(result.updatedCount)
          : `Updated onboarding state for ${result.updatedCount} user${result.updatedCount === 1 ? '' : 's'}.`,
      );
      if (invalidateOnSuccess) {
        void queryClient.invalidateQueries({ queryKey: ['users'] });
      }
    } finally {
      setSkipping(false);
    }
  };

  const popover = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className={disabled ? 'pointer-events-none opacity-50' : 'inline-flex'}>
          {trigger}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-auto min-w-0 p-1 flex flex-col gap-2 bg-transparent border-0 shadow-none"
      >
        <AnimatePresence>
          {open && (
            <>
              {skipping ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 h-10 rounded-full bg-background border border-border shadow-sm px-4 text-sm text-muted-foreground"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </motion.div>
              ) : (
                <>
                  <motion.button
                    key="screening"
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.2, delay: 0.1 },
                    }}
                    exit={{
                      opacity: 0,
                      y: 10,
                      transition: { duration: 0.2, delay: 0 },
                    }}
                    onClick={() => void handleSkip('screening')}
                    className="w-full justify-center h-10 rounded-full bg-background border border-border shadow-sm hover:bg-primary hover:text-primary-foreground cursor-pointer px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50 order-1"
                  >
                    Skip Screening
                  </motion.button>
                  <motion.button
                    key="consultation"
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.2, delay: 0 },
                    }}
                    exit={{
                      opacity: 0,
                      y: 10,
                      transition: { duration: 0.2, delay: 0.1 },
                    }}
                    onClick={() => void handleSkip('consultation')}
                    className="w-full justify-center h-10 rounded-full bg-background border border-border shadow-sm hover:bg-primary hover:text-primary-foreground cursor-pointer px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50 order-2"
                  >
                    Skip Consultation
                  </motion.button>
                </>
              )}
            </>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );

  if (tooltipContent) {
    return (
      <Tooltip open={open ? false : undefined}>
        <TooltipTrigger asChild>
          <span className="inline-flex">{popover}</span>
        </TooltipTrigger>
        {tooltipContent}
      </Tooltip>
    );
  }
  return popover;
}
