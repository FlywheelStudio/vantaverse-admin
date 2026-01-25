'use client';

import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/avatar';

export type UserCardUser = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type UserCardProps = {
  user: UserCardUser;
  action: React.ReactNode;
  index?: number;
};

export function UserCard({ user, action, index = 0 }: UserCardProps) {
  const fullName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || user.last_name || 'Unknown';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: index * 0.04,
      }}
      className="min-w-0 overflow-hidden"
    >
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-muted/60 px-4 py-3 min-w-0 shadow-[var(--shadow-sm)] ring-1 ring-border/50">
        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
          <div className="size-10 shrink-0 flex items-center justify-center">
            <Avatar
              src={user.avatar_url}
              firstName={user.first_name || ''}
              lastName={user.last_name || ''}
              userId={user.user_id}
              size={40}
            />
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="text-sm text-highlighted font-medium truncate">
              {fullName}
            </div>
            {user.email ? (
              <div className="text-xs text-dimmed truncate">{user.email}</div>
            ) : null}
          </div>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </motion.div>
  );
}
