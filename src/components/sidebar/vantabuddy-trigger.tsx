import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useSidebar } from '@/context/sidebar';
import { useEffect } from 'react';
import { VANTABUDDY_CONFIG } from '@/lib/configs/sidebar';

export function VantaBuddyTrigger() {
  const { isOpen, isExpanded, toggle } = useSidebar();

  const { rive, RiveComponent } = useRive({
    src: '/vantabuddy.riv',
    stateMachines: 'vantabuddy',
    autoplay: true,
  });

  const idleInput = useStateMachineInput(rive, 'vantabuddy', 'idle');
  const turnrightInput = useStateMachineInput(rive, 'vantabuddy', 'turnright');
  const turnleftInput = useStateMachineInput(rive, 'vantabuddy', 'turnleft');
  const turndownInput = useStateMachineInput(rive, 'vantabuddy', 'turndown');

  useEffect(() => {
    if (idleInput) {
      idleInput.fire();
    }
  }, [idleInput]);

  useEffect(() => {
    if (!isExpanded && turnrightInput) {
      turnrightInput.fire();
    }
  }, [isExpanded, turnrightInput]);

  const handleClick = () => {
    const newIsOpen = !isOpen;

    if (newIsOpen) {
      turndownInput?.fire();
    } else {
      turnleftInput?.fire();
    }

    toggle();
  };

  return (
    <button
      onClick={handleClick}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleClick();
      }}
      className="fixed cursor-pointer hover:opacity-80 transition-opacity touch-manipulation"
      aria-label="Toggle sidebar"
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
    </button>
  );
}
