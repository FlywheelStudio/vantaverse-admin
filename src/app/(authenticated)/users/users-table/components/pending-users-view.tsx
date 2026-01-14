'use client';

import toast from 'react-hot-toast';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePendingUsers } from '../contexts/pending-users-context';

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-default';

  const variant =
    s === 'pending'
      ? 'bg-amber-100 text-amber-800'
      : s === 'invited'
        ? 'bg-blue-100 text-blue-800'
        : s === 'failed'
          ? 'bg-red-100 text-red-800'
          : s === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-slate-100 text-slate-700';

  return <span className={`${base} ${variant}`}>{status || 'unknown'}</span>;
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-xl border border-[#E5E9F0] bg-white px-4 py-3 text-center">
      <div className="text-2xl font-semibold text-[#1E3A5F]">{value}</div>
      <div className="text-xs uppercase tracking-wide text-[#64748B]">
        {label}
      </div>
    </div>
  );
}

export function PendingUsersView({
  onClose,
  onAddMore,
}: {
  onClose: () => void;
  onAddMore: () => void;
}) {
  const { rows, counts, removeUser } = usePendingUsers();

  const handleSendInvitations = () => {
    toast('Send Invitations: coming soon');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="space-y-1">
        <div className="text-2xl font-semibold text-[#1E3A5F]">
          Pending Users
        </div>
        <div className="text-sm text-muted-foreground">
          Review and manage users before sending invitations.
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <StatBox label="Pending" value={counts.pending} />
        <StatBox label="Invited" value={counts.invited} />
        <StatBox label="Active" value={counts.activeExisting} />
      </div>

      <div className="mt-4 flex flex-col flex-1 min-h-0 rounded-xl border border-[#E5E9F0] bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wide text-[#64748B] bg-[#F8FAFC] border-b border-[#E5E9F0]">
          <div>Name</div>
          <div>Email</div>
          <div className="text-right">Status</div>
        </div>

        <ScrollArea className="flex-1">
          <div className="divide-y divide-[#E5E9F0]">
            {rows.length === 0 ? (
              <div className="p-6 text-sm text-[#64748B] text-center">
                No users yet.
              </div>
            ) : (
              rows.map((u) => (
                <div
                  key={u.id}
                  className={`grid grid-cols-[1fr_1fr_auto] items-center gap-3 px-4 py-3 ${
                    u.isOld ? 'opacity-50' : ''
                  }`}
                >
                  <div className="text-sm text-[#1E3A5F]">
                    {
                      (u.firstName || u.lastName
                        ? `${u.firstName} ${u.lastName}`.trim()
                        : '—') as string
                    }
                  </div>
                  <div className="text-sm text-[#64748B]">{u.email}</div>
                  <div className="flex items-center justify-end gap-3">
                    <StatusBadge status={u.status} />
                    <button
                      type="button"
                      onClick={() => removeUser(u.id)}
                      className="text-red-500 hover:text-red-600"
                      aria-label="Remove user"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-4 rounded-lg border border-[#91d5ff] bg-[#e6f7ff] px-4 py-3 text-sm text-[#0050b3]">
        Click &quot;Send Invitations&quot; to email all pending users.
        They&apos;ll move to &quot;Invited&quot; status.
      </div>

      <div className="mt-4 flex justify-between gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onAddMore}>
            + Add More Users
          </Button>
          <Button
            onClick={handleSendInvitations}
            className="bg-red-500 hover:bg-red-600 text-white"
            disabled={counts.pending === 0}
          >
            Send Invitations ({counts.pending})
          </Button>
        </div>
      </div>
    </div>
  );
}
