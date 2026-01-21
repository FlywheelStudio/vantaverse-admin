'use client';

import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface PatientListProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onPatientSelect: (patientId: string) => void;
}

export function PatientList({
  patients,
  selectedPatientId,
  onPatientSelect,
}: PatientListProps) {
  if (patients.length === 0) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center p-8 text-muted-foreground">
        No patients in this organization
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="space-y-1 p-2">
        {patients.map((patient) => {
          const fullName =
            `${patient.first_name || ''} ${patient.last_name || ''}`.trim() ||
            'Unknown';
          const isSelected = selectedPatientId === patient.id;

          return (
            <button
              key={patient.id}
              onClick={() => onPatientSelect(patient.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted',
                isSelected && 'bg-primary/10 border border-primary/20',
              )}
            >
              <div className="size-10 shrink-0">
                <Avatar
                  src={patient.avatar_url}
                  firstName={patient.first_name || ''}
                  lastName={patient.last_name || ''}
                  userId={patient.id}
                  size={40}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{fullName}</p>
                {patient.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {patient.email}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
