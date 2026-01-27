'use client';

import { useState } from 'react';
import { ChevronUp, FileText, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Blurhash } from 'react-blurhash';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { HabitPledge } from '@/lib/supabase/queries/habit-pledge';
import Image from 'next/image';

interface HabitPledgeCardProps {
  pledge: HabitPledge | null;
}

// okLCH blueish color palette
const primaryBlue = 'oklch(0.55 0.2 250)';
const lightBlue = 'oklch(0.95 0.05 250)';
const darkGray = 'oklch(0.25 0 0)';

export function HabitPledgeCard({ pledge }: HabitPledgeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [signatureLoaded, setSignatureLoaded] = useState(false);

  const color = primaryBlue;

  return (
    <Card
      className={cn(
        'border gap-2 overflow-hidden',
        isExpanded && 'cursor-pointer'
      )}
      style={{ 
        minHeight: '166px',
        borderColor: primaryBlue,
        background: `linear-gradient(135deg, ${lightBlue} 0%, white 100%)`
      }}
      onClick={isExpanded ? () => setIsExpanded(false) : undefined}
    >
      {/* Card Header */}
      <div>
        {/* Title and Badge Section */}
        <div className="pt-4 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <FileText className="shrink-0 w-5 h-5" style={{ color: primaryBlue }} />
              <h3 className="text-xs truncate" style={{ color: darkGray }}>Pledge</h3>
            </div>
            {pledge && isExpanded && (
              <div className="flex items-center gap-2 shrink-0">
                <ChevronUp className="h-5 w-5" style={{ color }} />
              </div>
            )}
          </div>
        </div>

        {/* Collapsed Preview */}
        {!isExpanded && (
          <div 
            className="px-4 py-2 flex flex-col justify-center relative"
          >
            {pledge !== null ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" style={{ color: primaryBlue }} />
                  <div className="text-xl font-bold py-3" style={{ color: primaryBlue }}>
                    Signed
                  </div>
                </div>
                <a 
                  href="#" 
                  className="text-xs inline-flex items-center gap-1 hover:underline self-start"
                  style={{ color: primaryBlue }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                >
                  View Pledge <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic text-center pt-5">Pledge not signed yet</p>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${lightBlue} 0%, white 100%)`
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.div
              className="p-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              {pledge !== null ? (
                <div className="relative flex flex-col min-h-[280px] sm:min-h-[320px]">
                  {/* Photo area – flexible, min height; overlays inside */}
                  <div className="relative flex-1 min-h-[160px] sm:min-h-[200px] rounded-lg overflow-hidden bg-muted/30">
                    {pledge.photo?.image_url && (
                      <>
                        {!photoLoaded && pledge.photo.blur_hash && (
                          <Blurhash
                            hash={pledge.photo.blur_hash}
                            width="100%"
                            height="100%"
                            resolutionX={32}
                            resolutionY={32}
                            punch={1}
                            className="absolute inset-0"
                          />
                        )}
                        <Image
                          src={pledge.photo.image_url}
                          alt="Pledge background"
                          fill
                          className={cn(
                            'object-cover transition-opacity duration-300',
                            photoLoaded ? 'opacity-100' : 'opacity-0',
                          )}
                          onLoad={() => setPhotoLoaded(true)}
                          priority
                        />
                      </>
                    )}

                    {/* Pledge text – absolute top */}
                    <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 w-fit max-w-[85%]">
                      <div className="bg-background/70 backdrop-blur-sm rounded-[var(--radius-lg)] p-3 shadow-[var(--shadow-md)] border border-border/50">
                        <p className="text-sm font-semibold text-foreground italic">
                          &quot;{pledge.pledge}&quot;
                        </p>
                      </div>
                    </div>

                    {/* Signature – bottom right, 30% of parent width */}
                    {pledge.signature?.image_url && (
                      <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-10 w-[30%] min-w-[80px] max-w-[160px]">
                        <div className="bg-zinc-800 rounded-[var(--radius-lg)] p-2 shadow-[var(--shadow-md)] border border-zinc-600/50">
                          <div className="relative w-full aspect-[2.4/1]">
                            {!signatureLoaded && pledge.signature.blur_hash && (
                              <Blurhash
                                hash={pledge.signature.blur_hash}
                                width="100%"
                                height="100%"
                                resolutionX={32}
                                resolutionY={32}
                                punch={1}
                                className="absolute inset-0 rounded"
                              />
                            )}
                            <Image
                              src={pledge.signature.image_url}
                              alt="Signature"
                              fill
                              className={cn(
                                'object-contain transition-opacity duration-300',
                                signatureLoaded ? 'opacity-100' : 'opacity-0',
                              )}
                              onLoad={() => setSignatureLoaded(true)}
                              priority
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 min-h-[120px]">
                  <p className="text-sm text-muted-foreground italic">Pledge not signed yet</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
