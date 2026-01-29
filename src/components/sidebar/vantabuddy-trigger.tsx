import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect } from 'react';
import { VANTABUDDY_CONFIG } from '@/lib/configs/sidebar';

export function VantaBuddyTrigger() {
  const { rive, RiveComponent } = useRive({
    src: '/vantabuddy.riv',
    stateMachines: 'vantabuddy',
    autoplay: true,
  });

  const idleInput = useStateMachineInput(rive, 'vantabuddy', 'idle');

  useEffect(() => {
    if (idleInput) {
      idleInput.fire();
    }
  }, [idleInput]);

  return (
    <div
      className="fixed touch-manipulation"
      role="img"
      aria-label="VantaBuddy"
      style={{
        zIndex: 50,
        touchAction: 'manipulation',
        top: `${VANTABUDDY_CONFIG.top}px`,
        left: `${VANTABUDDY_CONFIG.left}px`,
        width: `${VANTABUDDY_CONFIG.width}px`,
        height: `${VANTABUDDY_CONFIG.height}px`,
      }}
    >
      <div
        className="pointer-events-none"
        style={{
          width: `${VANTABUDDY_CONFIG.width}px`,
          height: `${VANTABUDDY_CONFIG.height}px`,
        }}
      >
        <RiveComponent />
      </div>
    </div>
  );
}
