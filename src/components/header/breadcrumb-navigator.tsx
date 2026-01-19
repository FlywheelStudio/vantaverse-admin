'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useOrganization } from '@/hooks/use-organizations';
import { useUserProfile } from '@/hooks/use-users';

type BreadcrumbItem = {
  label: string;
  href: string | null; // null for current page
  segment?: BreadcrumbSegment;
};

type BreadcrumbSegment = {
  type: 'groups' | 'users' | 'programs' | 'exercises';
  id?: string;
  path: string;
};

function parseFromPath(encodedPath: string): BreadcrumbSegment[] {
  try {
    const decoded = decodeURIComponent(encodedPath);
    const path = decoded.startsWith('/') ? decoded : `/${decoded}`;
    const segments = path.split('/').filter(Boolean);
    const result: BreadcrumbSegment[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (segment === 'groups' && segments[i + 1]) {
        result.push({
          type: 'groups',
          id: segments[i + 1],
          path: `/groups/${segments[i + 1]}`,
        });
        i++; // Skip the ID segment
      } else if (segment === 'users' && segments[i + 1]) {
        result.push({
          type: 'users',
          id: segments[i + 1],
          path: `/users/${segments[i + 1]}`,
        });
        i++; // Skip the ID segment
      } else if (segment === 'programs') {
        result.push({
          type: 'programs',
          path: '/programs',
        });
      } else if (segment === 'exercises') {
        result.push({
          type: 'exercises',
          path: '/exercises',
        });
      }
    }

    return result;
  } catch {
    return [];
  }
}

function getCurrentPageSegment(pathname: string): BreadcrumbSegment | null {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments[0] === 'groups' && segments[1]) {
    return { type: 'groups', id: segments[1], path: `/groups/${segments[1]}` };
  }
  if (segments[0] === 'groups' && !segments[1]) {
    return { type: 'groups', path: '/groups' };
  }
  if (segments[0] === 'users' && segments[1]) {
    return { type: 'users', id: segments[1], path: `/users/${segments[1]}` };
  }
  if (segments[0] === 'users' && !segments[1]) {
    return { type: 'users', path: '/users' };
  }
  if (segments[0] === 'programs') {
    return { type: 'programs', path: '/programs' };
  }
  if (segments[0] === 'exercises') {
    return { type: 'exercises', path: '/exercises' };
  }
  
  return null;
}

function BreadcrumbLabel({ segment }: { segment: BreadcrumbSegment }) {
  const { data: organization } = useOrganization(
    segment.type === 'groups' ? segment.id : null,
  );
  const { data: userProfile } = useUserProfile(
    segment.type === 'users' ? segment.id : null,
  );

  if (segment.type === 'groups' && segment.id) {
    if (organization) {
      return <>{organization.name}</>;
    }
    return <>Loading...</>;
  }

  if (segment.type === 'users' && segment.id) {
    if (userProfile) {
      const fullName =
        userProfile.first_name && userProfile.last_name
          ? `${userProfile.first_name} ${userProfile.last_name}`
          : userProfile.first_name || userProfile.last_name || 'Unknown';
      return <>{fullName}&apos;s Profile</>;
    }
    return <>Loading...</>;
  }

  if (segment.type === 'users' && !segment.id) {
    return <>Users</>;
  }

  if (segment.type === 'groups' && !segment.id) {
    return <>Groups</>;
  }

  if (segment.type === 'programs') {
    return <>Programs</>;
  }

  if (segment.type === 'exercises') {
    return <>Exercises</>;
  }

  return null;
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

  useEffect(() => {
    if (isAtTop) {
      if (scrollDirection > 0 && !isHiddenRef.current) {
        isHiddenRef.current = true;
        controls.start('slideUp');
      } else if (scrollDirection < 0 && isHiddenRef.current) {
        isHiddenRef.current = false;
        controls.start('slideDown');
      }
    }
  }, [scrollDirection, isAtTop, controls]);

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
      if (segment.type === 'groups' && segment.id) {
        items.push({ label: 'Groups', href: '/groups' });
        items.push({ label: '', href: segment.path, segment });
      } else if (segment.type === 'users' && segment.id) {
        items.push({ label: 'Users', href: '/users' });
        items.push({ label: '', href: segment.path, segment });
      } else if (segment.type === 'programs') {
        items.push({ label: 'Programs', href: segment.path, segment });
      } else if (segment.type === 'exercises') {
        items.push({ label: 'Exercises', href: segment.path, segment });
      }
    });

    // Always add current page segment as the last item
    if (currentSegment) {
      if (currentSegment.type === 'groups' && currentSegment.id) {
        // Only add "Groups" if not already in fromSegments
        const hasGroupsInFrom = fromSegments.some((s) => s.type === 'groups');
        if (!hasGroupsInFrom) {
          items.push({ label: 'Groups', href: '/groups' });
        }
        items.push({ label: '', href: null, segment: currentSegment });
      } else if (currentSegment.type === 'groups' && !currentSegment.id) {
        items.push({ label: 'Groups', href: null, segment: currentSegment });
      } else if (currentSegment.type === 'users' && currentSegment.id) {
        // Only add "Users" if not already in fromSegments
        const hasUsersInFrom = fromSegments.some((s) => s.type === 'users');
        if (!hasUsersInFrom) {
          items.push({ label: 'Users', href: '/users' });
        }
        items.push({ label: '', href: null, segment: currentSegment });
      } else if (currentSegment.type === 'users' && !currentSegment.id) {
        items.push({ label: 'Users', href: null, segment: currentSegment });
      } else if (currentSegment.type === 'programs') {
        items.push({
          label: 'Programs',
          href: null,
          segment: currentSegment,
        });
      } else if (currentSegment.type === 'exercises') {
        items.push({
          label: 'Exercises',
          href: null,
          segment: currentSegment,
        });
      }
    }

    return items;
  }, [fromSegments, currentSegment]);

  const variants = {
    visible: {
      y: 0,
      z: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
      transitionEnd: {
        display: 'block',
      },
    },
    slideUp: {
      y: -100,
      z: -200,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
      transitionEnd: {
        display: 'none',
      },
    },
    slideDown: {
      y: 0,
      z: 0,
      opacity: 1,
      display: 'block',
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div
      className="mb-4 px-4 h-12 text-card-foreground flex items-center bg-white/95 rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden backdrop-blur-sm"
      variants={variants}
      animate={controls}
      initial="visible"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        display: 'block',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      <nav aria-label="Breadcrumb" className="h-full flex items-center">
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
                    className="text-gray-800 font-medium ml-2"
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