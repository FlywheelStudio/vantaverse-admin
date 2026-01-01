'use client';

import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, getInitials } from '@/components/ui/avatar';

interface SingleAvatarProps {
  src?: string;
  label?: string;
  size: number;
  overlap: number;
  index: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const SingleAvatar = ({
  src,
  label,
  size,
  overlap,
  index,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: SingleAvatarProps) => {
  const colorSeed = label || `avatar-${index}`;
  const initials = getInitials(undefined, undefined, undefined, label);

  return (
    <div
      className="border-4 border-background rounded-full bg-background transition-all duration-300 relative"
      style={{
        width: size,
        height: size,
        zIndex: isHovered ? 100 : index,
        marginLeft: -overlap,
        position: 'relative',
        transition:
          'margin-left 0.3s cubic-bezier(0.4,0,0.2,1), z-index 0s, box-shadow 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: isHovered ? 'translateY(-10px)' : 'translateY(0)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Avatar
        src={src || null}
        alt={label || `Avatar ${index + 1}`}
        initials={initials}
        colorSeed={colorSeed}
        size={size}
      />
      <AnimatePresence>
        {isHovered && label && (
          <motion.div
            key="tooltip"
            initial={{
              x: '-50%',
              y: 10,
              opacity: 0,
              scale: 0.7,
            }}
            animate={{
              x: '-50%',
              y: 0,
              opacity: 1,
              scale: 1,
            }}
            exit={{
              x: '-50%',
              y: 10,
              opacity: 0,
              scale: 0.7,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 24,
            }}
            className="absolute z-50 px-2 py-1 bg-primary text-primary-foreground text-xs rounded shadow-lg whitespace-nowrap pointer-events-none font-semibold"
            style={{
              top: -size * 0.7,
              left: '50%',
            }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface AvatarGroupProps {
  avatars: { src?: string; alt?: string; label?: string }[];
  maxVisible?: number;
  size?: number;
  overlap?: number;
}

const AvatarGroup = ({
  avatars,
  maxVisible = 5,
  size = 40,
  overlap = 14,
}: AvatarGroupProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const visibleAvatars = avatars.slice(0, maxVisible);
  const extraCount = avatars.length - maxVisible;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-3">
        {visibleAvatars.map((avatar, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <SingleAvatar
              key={idx}
              src={avatar.src}
              label={avatar.label}
              size={size}
              overlap={overlap}
              index={visibleAvatars.length - idx}
              isHovered={isHovered}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}
        {extraCount > 0 && (
          <div
            className="flex items-center justify-center bg-primary text-primary-foreground font-semibold border-4 border-background rounded-full"
            style={{
              width: size,
              height: size,
              marginLeft: -overlap,
              zIndex: 0,
              fontSize: size * 0.32,
              transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            +{extraCount}
          </div>
        )}
      </div>
    </div>
  );
};

export { AvatarGroup };
