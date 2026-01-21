'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Blurhash } from 'react-blurhash';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { HabitPledge } from '@/lib/supabase/queries/habit-pledge';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

interface HabitPledgeCardProps {
  pledge: HabitPledge | null;
}

export function HabitPledgeCard({ pledge }: HabitPledgeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [signatureLoaded, setSignatureLoaded] = useState(false);

  const color = 'var(--color-blue-600)';

  return (
    <Card
      className={cn(
        'rounded-3xl p-2 border-2 transition-all gap-2 duration-300 overflow-hidden hover:shadow-xl bg-white',
      )}
      style={{ borderColor: color, minHeight: '166px' }}
    >
      {/* Card Header */}
      <div
        className="bg-linear-to-b from-white to-gray-50/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Title and Badge Section */}
        <div
          className={cn('p-4 border-b-2 cursor-pointer')}
          style={{ borderColor: color }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="font-bold text-[#1E3A5F] text-lg truncate">
                Pledge
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                className={cn(
                  'transition-transform duration-200',
                  isExpanded && 'rotate-180',
                )}
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" style={{ color }} />
                ) : (
                  <ChevronDown className="h-5 w-5" style={{ color }} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsed Preview */}
        {!isExpanded && (
          <div className="p-5 pt-4 px-2">
            {pledge !== null ? (
              <>
                <p className="text-sm text-[#64748B] line-clamp-3 italic">
                  &quot;{pledge.pledge}&quot;
                </p>
                <p className="text-sm text-[#64748B] pt-2">
                  {formatDate(pledge.created_at, 'long')}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#64748B] italic">
                Pledge not signed yet
              </p>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="bg-white overflow-hidden"
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
                <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden">
                  {/* Background Photo */}
                  {pledge.photo?.image_url && (
                    <>
                      {/* Blurhash placeholder */}
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

                  {/* Pledge Text Overlay - Bottom Left */}
                  <div className="absolute bottom-6 left-6 z-10">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg w-fit max-w-md">
                      <p className="text-sm font-semibold text-[#1E3A5F] italic">
                        {pledge.pledge}
                      </p>
                    </div>
                  </div>

                  {/* Signature Overlay - Bottom Right */}
                  {pledge.signature?.image_url && (
                    <div className="absolute bottom-6 right-6 z-10">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                        <div className="relative w-48 h-20">
                          {!signatureLoaded && pledge.signature.blur_hash && (
                            <Blurhash
                              hash={pledge.signature.blur_hash}
                              width={192}
                              height={80}
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
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-[#64748B] italic">
                    Pledge not signed yet
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
