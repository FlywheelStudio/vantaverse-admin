import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/context/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  VANTABUDDY_CONFIG,
  SIDEBAR_CONFIG,
  HEADER_HEIGHT,
  NAV_LINKS,
} from '@/lib/configs/sidebar';

export function Sidebar() {
  const { isOpen, isExpanded, collapse, expand } = useSidebar();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isMobile) {
      collapse();
    }
  }, [isMobile, collapse]);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && !isMobile) {
      expand();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, isMobile, expand]);

  // Sidebar starts at vantabuddy top-left corner position
  const vantabuddyX = VANTABUDDY_CONFIG.left;
  const vantabuddyY = VANTABUDDY_CONFIG.top;

  // On mobile, always use collapsed width
  const sidebarWidth = isMobile
    ? VANTABUDDY_CONFIG.width
    : isExpanded
      ? SIDEBAR_CONFIG.width
      : VANTABUDDY_CONFIG.width;

  return (
    <>
      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{
              width: 0,
              height: 0,
              opacity: 0,
              scale: SIDEBAR_CONFIG.animation.initialScale,
            }}
            animate={{
              width: sidebarWidth,
              height: isMobile
                ? `calc(100vh - ${HEADER_HEIGHT}px)`
                : `calc(100vh - ${HEADER_HEIGHT}px)`,
              opacity: 1,
              scale: 1,
            }}
            exit={{
              width: 0,
              height: 0,
              opacity: 0,
              scale: SIDEBAR_CONFIG.animation.initialScale,
            }}
            transition={{
              duration: SIDEBAR_CONFIG.animation.duration,
              ease: SIDEBAR_CONFIG.animation.ease,
            }}
            className={`${isMobile ? 'relative' : 'fixed'} shadow-xl z-10 rounded-lg overflow-hidden`}
            style={{
              top: isMobile ? 'auto' : vantabuddyY,
              left: isMobile ? 'auto' : vantabuddyX,
              transformOrigin: 'top left',
            }}
            onMouseEnter={() => {
              if (!isMobile && !isExpanded) {
                expand();
              }
            }}
            onMouseLeave={() => {
              if (!isMobile && isExpanded) {
                collapse();
              }
            }}
          >
            <div
              className={`${isMobile || !isExpanded ? '' : 'pr-6'} pb-6 h-full overflow-y-auto slim-scrollbar`}
              style={{
                paddingTop: `${VANTABUDDY_CONFIG.height}px`,
              }}
            >
              <motion.nav
                className="space-y-2"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
              >
                {NAV_LINKS.map((link, index) => {
                  const isActive = pathname === link.href;
                  const isCollapsed = isMobile || !isExpanded;

                  return (
                    <motion.div
                      id={index.toString()}
                      key={link.href}
                      variants={{
                        hidden: {
                          opacity: 0,
                          x: -20,
                        },
                        visible: {
                          opacity: 1,
                          x: 0,
                          transition: {
                            duration: 0.3,
                            ease: [0.4, 0, 0.2, 1],
                          },
                        },
                      }}
                    >
                      <Link
                        href={link.href}
                        className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} rounded-r-lg py-3 transition-colors text-white ${
                          isCollapsed
                            ? isActive
                              ? 'bg-[#2454FF]/70'
                              : 'hover:bg-[#2454FF]/40'
                            : isActive
                              ? 'bg-[#2454FF]/70'
                              : 'hover:bg-[#2454FF]/40'
                        }`}
                        title={isCollapsed ? link.label : undefined}
                      >
                        <span className="text-xl">{link.icon}</span>
                        {!isMobile && isExpanded && (
                          <span className="font-medium">{link.label}</span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
