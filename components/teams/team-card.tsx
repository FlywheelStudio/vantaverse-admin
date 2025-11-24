'use client';

import { Team } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Users, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeamCardProps {
    team: Team;
    patients: any[]; // Using any for now to avoid circular deps or complex imports, will refine
    onAssignClick: (teamId: string) => void;
    onEditClick: (team: Team) => void;
}

export function TeamCard({ team, patients, onAssignClick, onEditClick }: TeamCardProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: team.id,
        data: { type: 'team', team },
    });

    const teamPatients = patients.filter(p => team.patientIds.includes(p.id));

    return (
        <Card
            ref={setNodeRef}
            className={cn(
                "transition-colors duration-200",
                isOver ? "border-primary bg-primary/5" : ""
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {team.name}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{teamPatients.length}</div>
                <p className="text-xs text-muted-foreground">
                    Members
                </p>

                <div className="mt-4 flex -space-x-2 overflow-hidden">
                    {teamPatients.slice(0, 5).map((patient) => (
                        <Avatar key={patient.id} className="inline-block border-2 border-background h-8 w-8">
                            <AvatarImage src={patient.avatarUrl} />
                            <AvatarFallback>{patient.firstName[0]}{patient.lastName[0]}</AvatarFallback>
                        </Avatar>
                    ))}
                    {teamPatients.length > 5 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                            +{teamPatients.length - 5}
                        </div>
                    )}
                </div>

                <div className="flex space-x-2 mt-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => onAssignClick(team.id)}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Assign Users
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => onEditClick(team)}
                        title="Edit Team"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 21v-2.5l11.5-11.5 2.5 2.5L6.5 21H4zm14.7-13.3a1 1 0 0 0-1.4 0l-1.3 1.3 2.5 2.5 1.3-1.3a1 1 0 0 0 0-1.4l-1.1-1.1z" /></svg>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
