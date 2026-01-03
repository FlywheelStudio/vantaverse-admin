'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Users,
  Building2,
  Users2,
  AlertCircle,
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
          {user.organizationName && (
            <span className="text-xs bg-[#F5F7FA] px-2 py-0.5 rounded">
              {user.organizationName}
            </span>
          )}
          {user.teamName && (
            <span className="text-xs bg-[#E5E9F0] px-2 py-0.5 rounded">
              {user.teamName}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function OrganizationList({ organizations }: { organizations: string[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {organizations.map((org) => (
        <li key={org} className="text-[#1E3A5F]">
          {org}
        </li>
      ))}
    </ul>
  );
}

function TeamList({
  teams,
}: {
  teams: { name: string; organizationName: string }[];
}) {
  return (
    <ul className="space-y-1 text-sm">
      {teams.map((team) => (
        <li
          key={`${team.organizationName}-${team.name}`}
          className="flex items-center gap-2"
        >
          <span className="text-[#1E3A5F]">{team.name}</span>
          <span className="text-xs text-[#64748B]">
            in {team.organizationName}
          </span>
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
}: ImportValidationModalProps) {
  if (!validationResult) return null;

  const {
    usersToAdd,
    usersToUpdate,
    organizationsToCreate,
    teamsToCreate,
    errors,
  } = validationResult;
  const hasErrors = errors.length > 0;
  const hasData = usersToAdd.length > 0 || usersToUpdate.length > 0;

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

            {/* Users to Add */}
            <CollapsibleSection
              title="users to be added"
              count={usersToAdd.length}
              icon={<Users className="h-4 w-4 text-green-600" />}
            >
              <UserList users={usersToAdd} showEmail />
            </CollapsibleSection>

            {/* Users to Update */}
            <CollapsibleSection
              title="users to be updated"
              count={usersToUpdate.length}
              icon={<Users className="h-4 w-4 text-blue-600" />}
            >
              <UserList users={usersToUpdate} showEmail />
            </CollapsibleSection>

            {/* Organizations to Create */}
            <CollapsibleSection
              title="organizations to be created"
              count={organizationsToCreate.length}
              icon={<Building2 className="h-4 w-4 text-purple-600" />}
            >
              <OrganizationList organizations={organizationsToCreate} />
            </CollapsibleSection>

            {/* Teams to Create */}
            <CollapsibleSection
              title="teams to be created"
              count={teamsToCreate.length}
              icon={<Users2 className="h-4 w-4 text-orange-600" />}
            >
              <TeamList teams={teamsToCreate} />
            </CollapsibleSection>
          </div>
        </ScrollArea>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              className="border-[#2454FF] text-[#2454FF]"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={onAccept}
            disabled={hasErrors || !hasData}
            className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white"
          >
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
