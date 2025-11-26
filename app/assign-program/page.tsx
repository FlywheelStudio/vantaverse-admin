"use client";

import { useState, useEffect, useMemo } from "react";
import { ProgramManagementView, ProgramTemplate } from "@/components/programs/program-management-view";
import { ProgramBuilderView } from "@/components/programs/program-builder-view";
import { getTeamsAction, getAllTeamAssignments, saveTeamAssignment, getAllPrograms } from "@/app/assign-program/actions";
import { Team } from "@/lib/mock-data";
import { TeamProgramAssignment } from "@/lib/types/program-templates";
import { toast } from "sonner";
import { useSidebar } from "@/components/providers/sidebar-provider";

type ViewMode = "management" | "builder";

export default function AssignProgramPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("management");
    const [teams, setTeams] = useState<Team[]>([]);
    const [assignments, setAssignments] = useState<TeamProgramAssignment[]>([]);
    const [programs, setPrograms] = useState<ProgramTemplate[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<ProgramTemplate | null>(null);
    const { setCollapsed } = useSidebar();

    // Collapse sidebar on mount
    useEffect(() => {
        setCollapsed(true);
        return () => setCollapsed(false); // Expand on unmount
    }, [setCollapsed]);

    useEffect(() => {
        setTeams(getTeamsAction());
        setAssignments(getAllTeamAssignments());
        setPrograms(getAllPrograms());
    }, []);

    // Calculate program stats based on assignments
    const programStats = useMemo(() => {
        const stats: Record<string, { activeUsers: number; assignedTeams: number; assignedProgramName?: string }> = {};
        
        // Initialize stats for all programs
        programs.forEach(prog => {
            stats[prog.id] = { activeUsers: 0, assignedTeams: 0 };
        });

        // Calculate stats from assignments - group by programId
        const programTeamMap: Record<string, string[]> = {};
        assignments.forEach(assignment => {
            if (!programTeamMap[assignment.programId]) {
                programTeamMap[assignment.programId] = [];
            }
            programTeamMap[assignment.programId].push(assignment.teamId);
        });

        // Calculate distinct patients and team counts for each program
        Object.entries(programTeamMap).forEach(([programId, teamIds]) => {
            const allPatientIds = new Set<string>();
            teamIds.forEach(teamId => {
                const team = teams.find(t => t.id === teamId);
                if (team) {
                    team.patientIds.forEach(pid => allPatientIds.add(pid));
                }
            });
            
            stats[programId] = {
                activeUsers: allPatientIds.size,
                assignedTeams: teamIds.length
            };
        });

        return stats;
    }, [assignments, teams, programs]);

    const handleCreateProgram = () => {
        setSelectedProgram(null);
        setViewMode("builder");
    };

    const handleEditProgram = (program: ProgramTemplate) => {
        setSelectedProgram(program);
        setViewMode("builder");
    };

    const handleAssignProgram = (programId: string, teamId: string) => {
        const team = teams.find((t) => t.id === teamId);
        const program = programs.find((p) => p.id === programId);
        
        if (!program) {
            toast.error("Program not found");
            return;
        }

        try {
            // Create a minimal assignment (just the program, no structure yet)
            const assignment: TeamProgramAssignment = {
                id: `assignment-${teamId}-${Date.now()}`,
                teamId,
                programId,
                assignedAt: new Date().toISOString(),
                programPhases: [],
                phaseBlocks: [],
                blockExercises: [],
                exerciseSets: [],
            };

            saveTeamAssignment(assignment);
            
            // Update local state
            setAssignments(prev => {
                const filtered = prev.filter(a => a.teamId !== teamId);
                return [...filtered, assignment];
            });

            toast.success(`Program "${program.name}" assigned to ${team?.name || "team"}!`);
        } catch (error: unknown) {
            toast.error("Failed to assign program");
            console.error(error);
        }
    };

    const handleSaveProgram = (programData: Omit<ProgramTemplate, "id">) => {
        console.log("Saving program:", programData);
        toast.success("Program saved successfully!");
        setViewMode("management");
        // Refresh programs
        setPrograms(getAllPrograms());
    };

    return (
        <div className="h-screen overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20 p-6">
            <div className="max-w-7xl mx-auto">
                {viewMode === "management" ? (
                    <ProgramManagementView
                        teams={teams}
                        programs={programs}
                        assignments={assignments}
                        programStats={programStats}
                        onCreateProgram={handleCreateProgram}
                        onEditProgram={handleEditProgram}
                        onAssignProgram={handleAssignProgram}
                    />
                ) : (
                    <ProgramBuilderView
                        initialProgram={selectedProgram}
                        onBack={() => setViewMode("management")}
                        onSave={handleSaveProgram}
                    />
                )}
            </div>
        </div>
    );
}
