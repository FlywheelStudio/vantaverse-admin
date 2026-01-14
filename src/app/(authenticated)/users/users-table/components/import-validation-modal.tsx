'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Users,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  ImportValidationResult,
  ImportUserRow,
  ValidationError,
} from '../../actions';

interface ImportValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationResult: ImportValidationResult | null;
  onAccept?: () => void;
  isImporting?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'error';
}

function CollapsibleSection({
  title,
  count,
  icon,
  children,
  variant = 'default',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (count === 0) return null;

  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        variant === 'error' ? 'border-red-300 bg-red-50' : 'border-[#E5E9F0]'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 text-left hover:bg-opacity-80 transition-colors ${
          variant === 'error' ? 'hover:bg-red-100' : 'hover:bg-[#F5F7FA]'
        }`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span
            className={`font-medium ${
              variant === 'error' ? 'text-red-700' : 'text-[#1E3A5F]'
            }`}
          >
            {count} {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-[#64748B]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[#64748B]" />
        )}
      </button>
      {isOpen && (
        <div
          className={`border-t p-3 ${
            variant === 'error' ? 'border-red-200' : 'border-[#E5E9F0]'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function UserList({
  users,
  showEmail = false,
}: {
  users: ImportUserRow[];
  showEmail?: boolean;
}) {
  return (
    <ul className="space-y-1 text-sm text-[#64748B]">
      {users.map((user) => (
        <li
          key={`${user.rowNumber}-${user.email}`}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-[#94A3B8] w-12">
            Row {user.rowNumber}
          </span>
          <span className="text-[#1E3A5F]">
            {user.firstName} {user.lastName}
          </span>
          {showEmail && <span className="text-[#64748B]">({user.email})</span>}
        </li>
      ))}
    </ul>
  );
}

function ErrorList({ errors }: { errors: ValidationError[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {errors.map((error, index) => (
        <li
          key={`${error.rowNumber}-${error.field}-${index}`}
          className="text-red-700"
        >
          <span className="font-medium">Row {error.rowNumber}</span>
          <span className="mx-1">-</span>
          <span>{error.field}:</span>
          <span className="ml-1">{error.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function ImportValidationModal({
  open,
  onOpenChange,
  validationResult,
  onAccept,
  isImporting = false,
}: ImportValidationModalProps) {
  if (!validationResult) return null;

  const { usersToAdd, existingUsers, errors } = validationResult;
  const hasErrors = errors.length > 0;
  const hasData = usersToAdd.length > 0 || existingUsers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-[#1E3A5F]">Import Preview</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3">
            {/* Errors Section */}
            <CollapsibleSection
              title="validation errors"
              count={errors.length}
              icon={<AlertCircle className="h-4 w-4 text-red-500" />}
              variant="error"
            >
              <ErrorList errors={errors} />
            </CollapsibleSection>

            {!hasData ? (
              <div className="text-center py-8 text-[#64748B]">
                <p className="text-sm">No data to import</p>
              </div>
            ) : (
              <>
                {/* Users to Add */}
                <CollapsibleSection
                  title="users to be added"
                  count={usersToAdd.length}
                  icon={<Users className="h-4 w-4 text-green-600" />}
                >
                  <UserList users={usersToAdd} showEmail />
                </CollapsibleSection>

                {/* Existing Users */}
                <CollapsibleSection
                  title="users already in the database"
                  count={existingUsers.length}
                  icon={<Users className="h-4 w-4 text-slate-600" />}
                >
                  <UserList users={existingUsers} showEmail />
                </CollapsibleSection>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              className="border-[#2454FF] text-[#2454FF]"
              disabled={isImporting}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={onAccept}
            disabled={hasErrors || !hasData || isImporting}
            className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Accept'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
