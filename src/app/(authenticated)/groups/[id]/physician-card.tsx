'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

export type PhysicianInfo = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  description: string | null;
};

export function PhysicianCard({
  physician,
  onAssignClick,
}: {
  physician: PhysicianInfo | null;
  onAssignClick: () => void;
}) {
  const fullName =
    physician?.firstName && physician?.lastName
      ? `${physician.firstName} ${physician.lastName}`
      : physician?.firstName || physician?.lastName || null;

  if (!physician) {
    return (
      <Card className="p-6 border-2 border-yellow-400 bg-yellow-50 h-full flex flex-col">
        <div className="flex items-start justify-between gap-4 flex-1">
          <div className="min-w-0">
            <div className="font-semibold text-yellow-800">
              No physician assigned
            </div>
            <div className="text-sm text-yellow-700">
              Assign a physician to co-manage this group.
            </div>
          </div>
          <Button
            onClick={onAssignClick}
            className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white cursor-pointer"
          >
            Assign physician
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-white/50 bg-white/95 h-full flex flex-col">
      <div className="flex items-start justify-between gap-4 flex-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-12 shrink-0 flex items-center justify-center">
              <Avatar
                src={physician.avatarUrl}
                firstName={physician.firstName}
                lastName={physician.lastName}
                userId={physician.userId}
                size={48}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[#1E3A5F] truncate">
                {fullName || 'Physician'}
              </div>
              <div className="text-sm text-[#64748B] truncate">
                {physician.email || '—'}
              </div>
            </div>
          </div>
          {physician.description && (
            <div className="mt-2 text-sm text-[#64748B] italic">
              {physician.description}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          className="cursor-pointer shrink-0"
          onClick={onAssignClick}
        >
          Change
        </Button>
      </div>
    </Card>
  );
}
