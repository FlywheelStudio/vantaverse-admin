'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/medvanta';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import type { PhysicianInfo } from '../hooks/use-groups';

function groupInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function physicianName(physician: PhysicianInfo | null): string | null {
  if (!physician) return null;
  if (physician.firstName && physician.lastName) {
    return `${physician.firstName} ${physician.lastName}`;
  }
  return physician.firstName || physician.lastName || null;
}

export interface GroupHeroCardProps {
  organization: Pick<Organization, 'id' | 'name' | 'description' | 'picture_url' | 'created_at'>;
  memberCount: number;
  programCount: number;
  physician: PhysicianInfo | null;
  onAddMembers: () => void;
  onAssignPhysician: () => void;
}

/** HTML scGroupDetail hero card — logo, stats, physiologist, actions. */
export function GroupHeroCard({
  organization,
  memberCount,
  programCount,
  physician,
  onAddMembers,
  onAssignPhysician,
}: GroupHeroCardProps): React.ReactElement {
  const router = useRouter();
  const physName = physicianName(physician);
  const createdLabel = organization.created_at
    ? new Date(organization.created_at).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="card" style={{ marginBottom: 16, padding: 22 }}>
      <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
        <div
          className="thmb gr"
          style={{
            width: 60,
            height: 60,
            borderRadius: 'var(--radius-sm)',
            flex: '0 0 auto',
            overflow: 'hidden',
          }}
        >
          {organization.picture_url ? (
            <Image
              src={organization.picture_url}
              alt=""
              width={60}
              height={60}
              className="size-full object-cover"
            />
          ) : (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--navy-700)',
              }}
            >
              {groupInitials(organization.name)}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 10 }}>
            <h2
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 800,
                letterSpacing: '-.02em',
              }}
            >
              {organization.name}
            </h2>
            <span className="bdg bdg-b">Partner group</span>
          </div>
          <div style={{ fontSize: 'var(--text-md)', color: 'var(--text-muted)', marginTop: 5 }}>
            {organization.description || 'No description yet'}
            {organization.created_at ? (
              <>
                {' · '}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                  Created {createdLabel}
                </span>
              </>
            ) : null}
          </div>

          <div className="row" style={{ gap: 22, flexWrap: 'wrap', marginTop: 14 }}>
            <HeroStat icon="UsersRound" label="Members" value={String(memberCount)} />
            <HeroStat icon="ClipboardList" label="Active programs" value={String(programCount)} />
            <HeroStat icon="Calendar" label="Created" value={createdLabel} />
            <span>
              <span
                className="row"
                style={{
                  gap: 5,
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-faint)',
                }}
              >
                <Icon name="UserRound" size={12} />
                Physiologist
              </span>
              <span className="row" style={{ gap: 7, marginTop: 3 }}>
                {physician ? (
                  <button
                    type="button"
                    className="row"
                    style={{ gap: 7, cursor: 'pointer', border: 'none', background: 'transparent' }}
                    onClick={() =>
                      router.push(
                        `/users/${physician.userId}?from=/groups/${organization.id}`,
                      )
                    }
                  >
                    <MemberAvatar
                      name={physName || 'Admin'}
                      src={physician.avatarUrl}
                      size={24}
                    />
                    <span
                      style={{
                        fontSize: 'var(--text-md)',
                        fontWeight: 'var(--fw-semibold)',
                        color: 'var(--text-strong)',
                      }}
                    >
                      {physName || 'Admin'}
                    </span>
                  </button>
                ) : (
                  <span className="faint" style={{ fontSize: 'var(--text-sm)' }}>
                    Not assigned
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ height: 24, padding: '0 9px', fontSize: 'var(--text-xs)' }}
                  onClick={onAssignPhysician}
                >
                  Change
                </button>
              </span>
            </span>
          </div>
        </div>

        <div className="row" style={{ gap: 8, flex: '0 0 auto' }}>
          <button type="button" className="btn btn-pri" onClick={onAddMembers}>
            <Icon name="UserPlus" size={17} />
            Add members
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <span>
      <span
        className="row"
        style={{
          gap: 5,
          fontSize: 'var(--text-2xs)',
          fontWeight: 700,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}
      >
        <Icon name={icon} size={12} />
        {label}
      </span>
      <span
        style={{
          display: 'block',
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--fw-semibold)',
          color: 'var(--text-strong)',
          marginTop: 3,
        }}
      >
        {value}
      </span>
    </span>
  );
}

function MemberAvatar({
  name,
  src,
  size,
}: {
  name: string;
  src: string | null | undefined;
  size: number;
}): React.ReactElement {
  const initials = groupInitials(name);
  return (
    <span
      className="av av-t1"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
