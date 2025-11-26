"use client";

import { useState, useMemo } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search } from "lucide-react";
import { Team } from "@/lib/mock-data";
import { TeamProgramAssignment } from "@/lib/types/program-templates";
import { cn } from "@/lib/utils";

// Program Template type
export type ProgramTemplate = {
    id: string;
    name: string;
    description: string;
    durationWeeks?: number;
    activeUsers?: number;
};

interface ProgramManagementViewProps {
    teams: Team[];
    programs: ProgramTemplate[];
    assignments: TeamProgramAssignment[];
    programStats: Record<string, { activeUsers: number; assignedTeams: number; assignedProgramName?: string }>;
    onEditProgram: (program: ProgramTemplate) => void;
    onCreateProgram: () => void;
    onAssignProgram: (programId: string, teamId: string) => void;
}

export function ProgramManagementView({ teams, programs, assignments, programStats, onEditProgram, onCreateProgram, onAssignProgram }: ProgramManagementViewProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [programSearch, setProgramSearch] = useState("");
    const [teamSearch, setTeamSearch] = useState("");

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && over.data.current?.type === "Team") {
            onAssignProgram(active.id as string, over.id as string);
        }

        setActiveId(null);
    };

    // Filter programs by search
    const filteredPrograms = useMemo(() => {
        if (!programSearch.trim()) return programs;
        const searchLower = programSearch.toLowerCase();
        return programs.filter(p => p.name.toLowerCase().includes(searchLower));
    }, [programs, programSearch]);

    // Filter teams by search
    const filteredTeams = useMemo(() => {
        if (!teamSearch.trim()) return teams;
        const searchLower = teamSearch.toLowerCase();
        return teams.filter(t => t.name.toLowerCase().includes(searchLower));
    }, [teams, teamSearch]);

    const activeProgram = programs.find((p) => p.id === activeId);

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-8">
                {/* Header Card */}
                <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border">
                    <CardContent className="p-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Program Management</h2>
                        <div className="flex gap-3">
                            <Button onClick={onCreateProgram} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="w-4 h-4" />
                                Create New Program
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Program Templates */}
                <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Program Templates</h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search programs..."
                                value={programSearch}
                                onChange={(e) => setProgramSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPrograms.map((program) => {
                            const stats = programStats[program.id] || { activeUsers: 0, assignedTeams: 0 };
                            const programWithStats = { ...program, activeUsers: stats.activeUsers, assignedTeams: stats.assignedTeams };
                            return (
                                <DraggableProgramCard key={program.id} program={programWithStats} onEdit={() => onEditProgram(program)} />
                            );
                        })}
                    </div>
                </div>

                {/* Teams */}
                <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Teams</h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search teams..."
                                value={teamSearch}
                                onChange={(e) => setTeamSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTeams.map((team) => {
                            const assignment = assignments.find(a => a.teamId === team.id);
                            const assignedProgram = assignment ? programs.find(p => p.id === assignment.programId) : null;
                            return (
                                <DroppableTeamCard key={team.id} team={team} assignedProgramName={assignedProgram?.name} />
                            );
                        })}
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeId && activeProgram ? (
                    <div className="opacity-90 rotate-3 cursor-grabbing">
                        <ProgramCardContent program={activeProgram} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function DraggableProgramCard({ program, onEdit }: { program: ProgramTemplate; onEdit: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: program.id,
        data: { type: "Program", program },
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-50")}>
            <ProgramCardContent program={program} onEdit={onEdit} />
        </div>
    );
}

function ProgramCardContent({ program, onEdit }: { program: ProgramTemplate & { assignedTeams?: number }; onEdit?: () => void }) {
    return (
        <Card className="h-full hover:shadow-md transition-shadow border-border bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{program.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-sm mt-1">{program.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                            {program.activeUsers || 0} Active Users
                        </Badge>
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="hover:text-foreground"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent drag start when clicking edit
                                    onEdit();
                                }}
                                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                            >
                                Edit
                            </Button>
                        )}
                    </div>
                    <Badge variant="outline" className="w-fit">
                        {program.assignedTeams || 0} Teams
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

function DroppableTeamCard({ team, assignedProgramName }: { team: Team; assignedProgramName?: string }) {
    const { setNodeRef, isOver } = useDroppable({
        id: team.id,
        data: { type: "Team", team },
    });

    return (
        <div ref={setNodeRef}>
            <Card className={cn("h-full transition-colors border-border bg-card/80 backdrop-blur-sm", isOver ? "bg-indigo-500/20 border-indigo-500/50 ring-2 ring-indigo-500/20" : "")}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        {team.name}
                    </CardTitle>
                    <CardDescription>Created {new Date(team.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">{team.patientIds.length}</span> Members
                        </div>
                        {assignedProgramName && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Assigned Program:</span>
                                <span className="font-medium text-foreground">{assignedProgramName}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
