'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrganizations } from '@/hooks/use-organizations';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { useAddUserToOrganization } from '../hooks/use-user-mutations';

interface AssignGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onAssignSuccess?: () => void;
  userFirstName?: string | null;
  userLastName?: string | null;
}

export function AssignGroupModal({
  open,
  onOpenChange,
  userId,
  onAssignSuccess,
  userFirstName,
  userLastName,
}: AssignGroupModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);

  const debouncedSearch = useDebounce(searchQuery, 200);
  const { data: organizations, isLoading, error } = useOrganizations();
  const addToOrganization = useAddUserToOrganization(userId);

  const filteredOrganizations = useMemo(() => {
    const orgs = organizations ?? [];
    const allowed = orgs.filter((o) => o.is_super_admin !== true);
    const query = (debouncedSearch ?? '').trim().toLowerCase();
    if (!query) return allowed;
    return allowed.filter((o) => o.name.toLowerCase().includes(query));
  }, [organizations, debouncedSearch]);

  const userName = [userFirstName, userLastName].filter(Boolean).join(' ');

  const handleCancel = () => {
    setSearchQuery('');
    setSelectedOrganizationId(null);
    onOpenChange(false);
  };

  const handleAssign = async () => {
    if (!selectedOrganizationId) return;

    await addToOrganization.mutateAsync(selectedOrganizationId, {
      onSuccess: () => {
        onAssignSuccess?.();
        handleCancel();
      },
    });
  };

  const isAssigning = addToOrganization.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleCancel())}
    >
      <DialogContent className="w-[min(560px,calc(100%-2rem))] h-[560px] max-h-[85vh] flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={
            open
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.95, y: 20 }
          }
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-col flex-1 min-h-0"
        >
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F]">Assign to group</DialogTitle>
            <DialogDescription>
              {userName ? `Select a group for ${userName}.` : 'Select a group.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-4">
            <Input
              placeholder="Search by group name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isAssigning}
            />
          </div>

          <ScrollArea className="flex-1 min-h-0 mt-4">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-500">
                Error loading groups: {error.message}
              </div>
            ) : filteredOrganizations.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No groups found
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {filteredOrganizations.map((org) => {
                  const isSelected = selectedOrganizationId === org.id;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => setSelectedOrganizationId(org.id)}
                      disabled={isAssigning}
                      className={cn(
                        'w-full text-left p-4 border-2 rounded-lg transition-all',
                        'hover:border-blue-500 hover:bg-blue-50',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        isSelected && 'border-blue-500 bg-blue-50',
                      )}
                    >
                      <div className="font-semibold text-base text-[#1E3A5F] truncate">
                        {org.name}
                      </div>
                      {org.description && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {org.description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 mt-auto">
            <Button variant="outline" onClick={handleCancel} disabled={isAssigning}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedOrganizationId || isAssigning}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isAssigning ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign'
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

