'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useMemo } from 'react';
import { Patient, Team } from '@/lib/mock-data';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PatientAssignmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  patients: Patient[];
  teams: Team[]; // To check existing assignments
  onAssign: (patientIds: string[]) => void;
  selectedPatientIds: string[];
  onTogglePatient: (patientId: string, checked: boolean) => void;
}

function DraggablePatientItem({ patient, isSelected, onToggle, disabled }: { patient: Patient, isSelected: boolean, onToggle: (checked: boolean) => void, disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: patient.id,
    data: { type: 'patient', patient },
    disabled: disabled,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center space-x-4 p-2 rounded-md border mb-2 transition-colors",
        disabled
          ? "opacity-50 cursor-not-allowed bg-muted"
          : "hover:bg-muted/50 cursor-grab active:cursor-grabbing bg-background"
      )}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onToggle(checked as boolean)}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
      />
      <Avatar className="h-8 w-8">
        <AvatarImage src={patient.avatarUrl} />
        <AvatarFallback>{patient.firstName[0]}{patient.lastName[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{patient.firstName} {patient.lastName}</p>
        <p className="text-xs text-muted-foreground">{patient.email}</p>
      </div>
    </div>
  );
}

function DraggableTeamHeader({ team, count, children }: { team: Team, count: number, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `team-group-${team.id}`,
    data: { type: 'team-group', patientIds: team.patientIds },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center w-full">
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded mr-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

export function PatientAssignmentSheet({ isOpen, onClose, team, patients, teams, onAssign, selectedPatientIds, onTogglePatient }: PatientAssignmentSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'assigned' | 'unassigned'>('all');

  // Filter patients based on search
  const searchedPatients = useMemo(() => {
    return patients.filter(patient =>
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [patients, searchQuery]);

  const handleAssignSelected = () => {
    onAssign(selectedPatientIds);
  };

  const renderContent = () => {
    if (filterType === 'assigned') {
      // Group by Team
      const teamsWithMembers = teams.filter(t => t.patientIds.length > 0);

      return (
        <Accordion type="multiple" className="w-full">
          {teamsWithMembers.map(t => {
            const teamPatients = searchedPatients.filter(p => t.patientIds.includes(p.id));
            if (teamPatients.length === 0) return null;

            return (
              <AccordionItem key={t.id} value={t.id}>
                <AccordionTrigger className="hover:no-underline py-2">
                  <DraggableTeamHeader team={t} count={teamPatients.length}>
                    <span className="font-medium">{t.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({teamPatients.length} members)</span>
                  </DraggableTeamHeader>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pl-4">
                  {teamPatients.map(patient => (
                    <DraggablePatientItem
                      key={patient.id}
                      patient={patient}
                      isSelected={selectedPatientIds.includes(patient.id)}
                      onToggle={(checked) => onTogglePatient(patient.id, checked)}
                      // If we are in "assigned" view, we can still move them to the current team (re-assign)
                      // Unless they are already in the current team
                      disabled={team?.id === t.id}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
          {teamsWithMembers.length === 0 && <div className="text-center py-4 text-muted-foreground">No teams have members.</div>}
        </Accordion>
      );
    }

    // Default View (All or Unassigned)
    // Split into "Available" and "Already in Current Team"

    const currentTeamId = team?.id;
    const assignedToCurrent = searchedPatients.filter(p => team?.patientIds.includes(p.id));
    const available = searchedPatients.filter(p => !team?.patientIds.includes(p.id));

    // If filter is 'unassigned', further filter 'available' to only those not in ANY team
    const displayAvailable = filterType === 'unassigned'
      ? available.filter(p => !teams.some(t => t.patientIds.includes(p.id)))
      : available;

    return (
      <div className="space-y-4">
        {displayAvailable.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Available Users</h4>
            <div className="overflow-y-auto h-[calc(100vh-20rem)]">
              {displayAvailable.map(patient => (
                <DraggablePatientItem
                  key={patient.id}
                  patient={patient}
                  isSelected={selectedPatientIds.includes(patient.id)}
                  onToggle={(checked) => onTogglePatient(patient.id, checked)}
                />
              ))}
              {assignedToCurrent.length > 0 && (
                <Accordion type="single" collapsible className="w-full border rounded-md">
                  <AccordionItem value="assigned-current" className="border-none">
                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                      <span className="text-sm font-medium">Already in {team?.name} ({assignedToCurrent.length})</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-2">
                      {assignedToCurrent.map(patient => (
                        <DraggablePatientItem
                          key={patient.id}
                          patient={patient}
                          isSelected={false}
                          onToggle={() => { }}
                          disabled={true}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </div>
        )}
        {displayAvailable.length === 0 && assignedToCurrent.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No patients found.
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Assign Patients to {team?.name}</SheetTitle>
          <SheetDescription>
            Drag patients to the team card or select multiple and click assign.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4 h-full flex flex-col">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="assigned">In a Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selectedPatientIds.length} selected
            </span>
            <Button
              size="sm"
              onClick={handleAssignSelected}
              disabled={selectedPatientIds.length === 0}
            >
              Assign Selected
            </Button>
          </div>

          <ScrollArea className="flex-1 -mr-4 pr-4">
            {renderContent()}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
