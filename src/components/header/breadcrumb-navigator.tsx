'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useOrganization } from '@/hooks/use-organizations';
import { useUserProfile } from '@/hooks/use-users';
import { useProgramAssignment } from '@/hooks/use-passignments';
import { Breadcrumb, type Crumb } from '@/components/medvanta';

type BreadcrumbItem = {
  label: string;
  href: string | null;
  segment?: BreadcrumbSegment;
};

type BreadcrumbSegment = {
  type: string;
  id?: string;
  path: string;
};

function isIdSegment(segment: string): boolean {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return true;
  }
  if (/^[a-z0-9]{20,}$/i.test(segment)) {
    return true;
  }
  if (/^\d+$/.test(segment)) {
    return true;
  }
  return false;
}

function parseSegmentsFromPath(path: string): BreadcrumbSegment[] {
  const segments = path.split('/').filter(Boolean);
  const result: BreadcrumbSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];

    if (isIdSegment(segment)) {
      continue;
    }

    if (nextSegment && isIdSegment(nextSegment)) {
      const segmentPath = `/${segment}/${nextSegment}`;
      result.push({
        type: segment,
        id: nextSegment,
        path: segmentPath,
      });
      i++;
    } else {
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

function formatLabel(type: string): string {
  if (type === 'builder') {
    return 'Programs';
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function BreadcrumbLabel({ segment }: { segment: BreadcrumbSegment }): React.ReactElement {
  const { data: organization } = useOrganization(
    segment.type === 'groups' ? segment.id : null,
  );
  const { data: userProfile } = useUserProfile(
    segment.type === 'users' ? segment.id : null,
  );
  const { data: programAssignment } = useProgramAssignment(
    segment.type === 'builder' ? segment.id : null,
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
        userProfile.first_name ||
        userProfile.first_name || 'Unknown';
      return <>{fullName}&apos;s Profile</>;
    }
    return <>Loading...</>;
  }

  if (segment.type === 'builder' && segment.id) {
    if (programAssignment) {
      let userName = '';
      if (programAssignment.profiles) {
        userName =
          programAssignment.profiles.first_name ||
          programAssignment.profiles.last_name ||
          'Unknown';
      }
      return (
        <>
          {programAssignment.program_template?.name +
            (userName ? ' (' + userName + ')' : '') || 'Unknown Program'}
        </>
      );
    }
    return <>Loading...</>;
  }

  return <>{formatLabel(segment.type)}</>;
}

export default function BreadcrumbNavigator({
  scrollPosition,
}: {
  scrollPosition: number[];
}): React.ReactElement {
  const [scrollDirection = 0, scrollTop = 0] = scrollPosition;
  const isAtTop = scrollTop === 0;
  const isHiddenRef = useRef(false);
  const controls = useAnimation();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    isHiddenRef.current = false;
    controls.set('slideDown');
  }, [controls, pathname]);

  useEffect(() => {
    if (scrollDirection > 0 && scrollTop > 0 && !isHiddenRef.current) {
      isHiddenRef.current = true;
      controls.start('slideUp');
      return;
    }

    if (isAtTop && isHiddenRef.current) {
      isHiddenRef.current = false;
      controls.start('slideDown');
    }
  }, [scrollDirection, scrollTop, isAtTop, controls]);

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

    fromSegments.forEach((segment) => {
      if (segment.id) {
        items.push({
          label: formatLabel(segment.type),
          href: `/${segment.type}`,
        });
        items.push({ label: '', href: segment.path, segment });
      } else {
        items.push({ label: formatLabel(segment.type), href: segment.path, segment });
      }
    });

    if (currentSegment) {
      if (currentSegment.id) {
        const hasParentInFrom = fromSegments.some((s) => s.type === currentSegment.type);
        if (!hasParentInFrom) {
          items.push({
            label: formatLabel(currentSegment.type),
            href: `/${currentSegment.type}`,
          });
        }
        items.push({ label: '', href: null, segment: currentSegment });
      } else {
        items.push({
          label: formatLabel(currentSegment.type),
          href: null,
          segment: currentSegment,
        });
      }
    }

    return items;
  }, [fromSegments, currentSegment]);

  const crumbs = useMemo<Crumb[]>(
    () =>
      breadcrumbItems.map((item) => ({
        label: item.label || (item.segment ? <BreadcrumbLabel segment={item.segment} /> : ''),
        href: item.href ?? undefined,
      })),
    [breadcrumbItems],
  );

  const variants = {
    visible: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      pointerEvents: 'auto' as const,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
    slideUp: {
      y: -64,
      opacity: 0,
      rotateX: 55,
      pointerEvents: 'none' as const,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
    slideDown: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      pointerEvents: 'auto' as const,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div
      className="sticky top-0 z-10 mb-4 flex h-12 shrink-0 items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 shadow-[var(--shadow-sm)]"
      variants={variants}
      animate={controls}
      initial="visible"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        transformOrigin: 'top center',
      }}
    >
      <Breadcrumb items={crumbs} />
    </motion.div>
  );
}
