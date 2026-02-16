'use client';

import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect } from 'react';
import { VANTABUDDY_CONFIG } from '@/lib/configs/sidebar';
import Image from 'next/image';

export const VANTABUDDY_LOOK_RIGHT_EVENT = 'vantabuddy-look-right';
export const VANTABUDDY_LOOK_DOWN_EVENT = 'vantabuddy-look-down';

export function VantaBuddyTrigger() {
  const { rive, RiveComponent } = useRive({
    src: '/vantabuddy.riv',
    stateMachines: 'vantabuddy',
    autoplay: true,
  });

  const idleInput = useStateMachineInput(rive, 'vantabuddy', 'idle');
  const turnrightInput = useStateMachineInput(rive, 'vantabuddy', 'turnright');
  const turndownInput = useStateMachineInput(rive, 'vantabuddy', 'turndown');

  useEffect(() => {
    if (idleInput) {
      idleInput.fire();
    }
  }, [idleInput]);

  useEffect(() => {
    const handler = () => {
      if (turnrightInput) turnrightInput.fire();
    };
    window.addEventListener(VANTABUDDY_LOOK_RIGHT_EVENT, handler);
    return () => window.removeEventListener(VANTABUDDY_LOOK_RIGHT_EVENT, handler);
  }, [turnrightInput]);

  useEffect(() => {
    const handler = () => {
      if (turndownInput) turndownInput.fire();
    };
    window.addEventListener(VANTABUDDY_LOOK_DOWN_EVENT, handler);
    return () => window.removeEventListener(VANTABUDDY_LOOK_DOWN_EVENT, handler);
  }, [turndownInput]);

  return (
    <div
      className="fixed touch-manipulation flex items-center gap-2"
      role="img"
      aria-label="VantaBuddy"
      style={{
        zIndex: 50,
        touchAction: 'manipulation',
        top: `${VANTABUDDY_CONFIG.top}px`,
        left: `${VANTABUDDY_CONFIG.left}px`,
        height: `${VANTABUDDY_CONFIG.height}px`,
      }}
    >
      <div
        className="pointer-events-none shrink-0"
        style={{
          width: `${VANTABUDDY_CONFIG.width}px`,
          height: `${VANTABUDDY_CONFIG.height}px`,
        }}
      >
        <RiveComponent />
      </div>
      <Image
        width={64}
        height={54}
        src="/vantathrive-logo-min.png"
        alt="VantaThrive"
        className="h-10 pb-2 w-auto object-contain"
      />
    </div>
  );
}
