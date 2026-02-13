'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useOrganization } from '@/hooks/use-organizations';
import { useUserProfile } from '@/hooks/use-users';
import { useProgramAssignment } from '@/hooks/use-passignments';

type BreadcrumbItem = {
  label: string;
  href: string | null; // null for current page
  segment?: BreadcrumbSegment;
};

type BreadcrumbSegment = {
  type: string;
  id?: string;
  path: string;
};

// Check if a segment looks like an ID (UUID, numeric, or long alphanumeric)
function isIdSegment(segment: string): boolean {
  // UUID pattern
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return true;
  }
  // Long alphanumeric (likely an ID)
  if (/^[a-z0-9]{20,}$/i.test(segment)) {
    return true;
  }
  // Numeric ID
  if (/^\d+$/.test(segment)) {
    return true;
  }
  return false;
}

// Parse segments from a path string
function parseSegmentsFromPath(path: string): BreadcrumbSegment[] {
  const segments = path.split('/').filter(Boolean);
  const result: BreadcrumbSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    
    // If current segment is an ID, skip it (should be handled by previous iteration)
    if (isIdSegment(segment)) {
      continue;
    }

    // If next segment exists and looks like an ID, this is a resource with ID
    if (nextSegment && isIdSegment(nextSegment)) {
      const path = `/${segment}/${nextSegment}`;
      result.push({
        type: segment,
        id: nextSegment,
        path,
      });
      i++; // Skip the ID segment
    } else {
      // This is a resource without ID (list page)
      result.push({
        type: segment,
        path: `/${segment}`,
      });
    }
  }

  return result;
}

function parseFromPath(encodedPath: string): BreadcrumbSegment[] {
  try {
    const decoded = decodeURIComponent(encodedPath);
    const path = decoded.startsWith('/') ? decoded : `/${decoded}`;
    return parseSegmentsFromPath(path);
  } catch {
    return [];
  }
}

function getCurrentPageSegment(pathname: string): BreadcrumbSegment | null {
  const segments = parseSegmentsFromPath(pathname);
  return segments.length > 0 ? segments[segments.length - 1] : null;
}

// Capitalize first letter and handle plural forms
function formatLabel(type: string): string {
  if (type === 'builder') {
    return 'Programs';
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function BreadcrumbLabel({ segment }: { segment: BreadcrumbSegment }) {
  const { data: organization } = useOrganization(
    segment.type === 'groups' ? segment.id : null,
  );
  const { data: userProfile } = useUserProfile(
    segment.type === 'users' ? segment.id : null,
  );
  const { data: programAssignment } = useProgramAssignment(
    segment.type === 'builder' ? segment.id : null,
  );
 
  // Special handling for groups with ID
  if (segment.type === 'groups' && segment.id) {
    if (organization) {
      return <>{organization.name}</>;
    }
    return <>Loading...</>;
  }

  // Special handling for users with ID
  if (segment.type === 'users' && segment.id) {
    if (userProfile) {
      const fullName =
        userProfile.first_name ||
           userProfile.first_name || 'Unknown';
      return <>{fullName}&apos;s Profile</>;
    }
    return <>Loading...</>;
  }

  // Special handling for builder with ID
  if (segment.type === 'builder' && segment.id) {
    if (programAssignment) {
      let userName = '';
      if (programAssignment.profiles) {
        userName = programAssignment.profiles.first_name || programAssignment.profiles.last_name || 'Unknown';
      }
      return <>{programAssignment.program_template?.name + (userName ? ' (' + userName + ')' : '') || 'Unknown Program'}</>;
    }
    return <>Loading...</>;
  }
}

export default function BreadcrumbNavigator({
  scrollPosition,
}: {
  scrollPosition: number[];
}) {
  const [scrollDirection = 0, scrollTop = 0] = scrollPosition;
  const isAtTop = scrollTop === 0;
  const isHiddenRef = useRef(false);
  const controls = useAnimation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHome = pathname === '/';

  useEffect(() => {
    if (isHome) return;
    isHiddenRef.current = false;
    controls.set('slideDown');
  }, [controls, isHome, pathname]);

  useEffect(() => {
    if (isHome) return;

    // Scroll container behavior:
    // - scrolling DOWN (away from top): hide
    // - returning to scrollTop === 0: show again
    if (scrollDirection > 0 && scrollTop > 0 && !isHiddenRef.current) {
      isHiddenRef.current = true;
      controls.start('slideUp');
      return;
    }

    if (isAtTop && isHiddenRef.current) {
      isHiddenRef.current = false;
      controls.start('slideDown');
    }
  }, [isHome, scrollDirection, scrollTop, isAtTop, controls]);

  const fromParam = searchParams.get('from');
  const fromSegments = useMemo(
    () => (fromParam ? parseFromPath(fromParam) : []),
    [fromParam],
  );
  const currentSegment = useMemo(
    () => getCurrentPageSegment(pathname),
    [pathname],
  );

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    // Add segments from ?from parameter
    fromSegments.forEach((segment) => {
      if (segment.id) {
        // Resource with ID: add parent list page, then the resource
        items.push({ 
          label: formatLabel(segment.type), 
          href: `/${segment.type}` 
        });
        items.push({ label: '', href: segment.path, segment });
      } else {
        // List page: add directly
        items.push({ label: formatLabel(segment.type), href: segment.path, segment });
      }
    });

    // Always add current page segment as the last item
    if (currentSegment) {
      if (currentSegment.id) {
        // Resource with ID: check if parent is already in fromSegments
        const hasParentInFrom = fromSegments.some((s) => s.type === currentSegment.type);
        if (!hasParentInFrom) {
          items.push({ 
            label: formatLabel(currentSegment.type), 
            href: `/${currentSegment.type}` 
          });
        }
        items.push({ label: '', href: null, segment: currentSegment });
      } else {
        // List page: add directly
        items.push({ 
          label: formatLabel(currentSegment.type), 
          href: null, 
          segment: currentSegment 
        });
      }
    }

    return items;
  }, [fromSegments, currentSegment]);

  const variants = {
    visible: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      pointerEvents: 'auto',
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
    slideUp: {
      y: -64,
      opacity: 0,
      rotateX: 55,
      pointerEvents: 'none',
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
    slideDown: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      pointerEvents: 'auto',
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div
      className="mb-4 h-12 text-card-foreground flex items-center bg-card/95 rounded-3xl border-2 border-border shadow-2xl overflow-hidden backdrop-blur-sm sticky top-0 z-10 shrink-0"
      variants={variants}
      animate={controls}
      initial="visible"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        transformOrigin: 'top center',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      <nav aria-label="Breadcrumb" className="h-full flex items-center px-4">
        <ol className="flex items-center gap-2">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const segment = item.segment;

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <svg
                    viewBox="0 0 24 44"
                    fill="currentColor"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    className="h-6 w-3 text-gray-400 shrink-0 opacity-60"
                  >
                    <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z"></path>
                  </svg>
                )}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="ml-2 flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors opacity-70"
                  >
                    {index === 0 && (
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                        aria-hidden="true"
                      >
                        <path
                          d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                          clipRule="evenodd"
                          fillRule="evenodd"
                        />
                      </svg>
                    )}
                    {item.label || (segment && <BreadcrumbLabel segment={segment} />)}
                  </Link>
                ) : (
                  <span
                    className="cursor-default text-gray-800 font-medium ml-2"
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label || (segment && <BreadcrumbLabel segment={segment} />)}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </motion.div>
  );
}