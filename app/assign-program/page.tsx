"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgramBreadcrumb, BreadcrumbStep } from "@/components/programs/program-breadcrumb";
import { TeamSelection } from "@/components/programs/steps/team-selection";
import { ProgramSelection } from "@/components/programs/steps/program-selection";
import { PhaseSelection } from "@/components/programs/steps/phase-selection";
import { BlockSelection } from "@/components/programs/steps/block-selection";
import { ExerciseSelection } from "@/components/programs/steps/exercise-selection";
import { SetsConfiguration } from "@/components/programs/steps/sets-configuration";
import { AssignmentSummary } from "@/components/programs/steps/assignment-summary";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProgramAssignment } from "@/hooks/use-program-assignment";
import { getTeamsAction } from "@/app/assign-program/actions";
import { Team } from "@/lib/mock-data";

type StepId = "team" | "program" | "phase" | "block" | "exercise" | "sets" | "summary";

export default function AssignProgramPage() {
    const router = useRouter();
    const [currentStepId, setCurrentStepId] = useState<StepId>("team");
    const [selectedTeamId, setSelectedTeamId] = useState<string>();
    const [teams, setTeams] = useState<Team[]>([]);
    const [currentPhaseId, setCurrentPhaseId] = useState<string>();
    const [currentBlockId, setCurrentBlockId] = useState<string>();
    const [currentExerciseId, setCurrentExerciseId] = useState<string>();

    // Use the normalized program assignment hook
    const {
        program,
        setProgram,
        phases,
        blocks,
        exercises,
        sets,
        programPhases,
        phaseBlocks,
        blockExercises,
        exerciseSets,
        addPhase,
        addBlock,
        addExercise,
        addSet,
        deletePhase,
        reorderPhases,
        saveAssignment,
    } = useProgramAssignment(selectedTeamId);

    const stepOrder: StepId[] = useMemo(() => ["team", "program", "phase", "block", "exercise", "sets", "summary"], []);

    // Determine which steps are unlocked based on completion
    const isStepUnlocked = useCallback((stepId: StepId): boolean => {
        switch (stepId) {
            case "team":
                return true;
            case "program":
                return !!selectedTeamId;
            case "phase":
                return !!program;
            case "block":
                return !!program && programPhases.length > 0;
            case "exercise":
                return !!currentPhaseId && phaseBlocks.filter(pb => pb.phaseId === currentPhaseId).length > 0;
            case "sets":
                return !!currentExerciseId;
            case "summary":
                return !!program && programPhases.length > 0;
            default:
                return false;
        }
    }, [selectedTeamId, program, programPhases.length, currentPhaseId, phaseBlocks, currentExerciseId]);

    const breadcrumbSteps: BreadcrumbStep[] = stepOrder.map((id, index) => {
        const currentIndex = stepOrder.indexOf(currentStepId);
        const isUnlocked = isStepUnlocked(id);

        return {
            id,
            label: id.charAt(0).toUpperCase() + id.slice(1),
            completed: index < currentIndex,
            current: id === currentStepId,
            unlocked: isUnlocked,
        };
    });

    const handleStepClick = useCallback((stepId: string) => {
        setCurrentStepId(stepId as StepId);
    }, []);

    const goToNextStep = useCallback(() => {
        const currentIndex = stepOrder.indexOf(currentStepId);
        if (currentIndex < stepOrder.length - 1) {
            setCurrentStepId(stepOrder[currentIndex + 1]);
        }
    }, [currentStepId, stepOrder]);

    const handleTeamSelect = useCallback((teamId: string) => {
        setSelectedTeamId(teamId);
        // Reset current selections when changing teams
        setCurrentPhaseId(undefined);
        setCurrentBlockId(undefined);
        setCurrentExerciseId(undefined);
        goToNextStep();
    }, [goToNextStep]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleProgramSelect = useCallback((_programId: string, _name: string, _description: string) => {
        // Program will be set by the ProgramSelection component via setProgram
        goToNextStep();
    }, [goToNextStep]);

    const handlePhaseSelect = useCallback((phaseId: string) => {
        setCurrentPhaseId(phaseId);
        goToNextStep();
    }, [goToNextStep]);

    const handleBlockSelect = useCallback((blockId: string) => {
        setCurrentBlockId(blockId);
        goToNextStep();
    }, [goToNextStep]);

    const handleExerciseSelect = useCallback((exerciseId: string) => {
        setCurrentExerciseId(exerciseId);
        goToNextStep();
    }, [goToNextStep]);

    const handleSetsComplete = useCallback(() => {
        setCurrentExerciseId(undefined);
        setCurrentStepId("exercise");
    }, []);

    const handleViewSummary = useCallback(() => {
        setCurrentStepId("summary");
    }, []);

    const handleFinalAssignment = useCallback(async () => {
        await saveAssignment();
        alert("Program assigned successfully!");
        router.push("/teams");
    }, [saveAssignment, router]);

    // Refs for step components to trigger create actions
    const phaseSelectionRef = useRef<{ triggerCreate: () => void } | null>(null);
    const blockSelectionRef = useRef<{ triggerCreate: () => void } | null>(null);
    const exerciseSelectionRef = useRef<{ triggerCreate: () => void } | null>(null);
    const setsConfigurationRef = useRef<{ triggerCreate: () => void } | null>(null);

    // Fetch teams on mount
    useEffect(() => {
        getTeamsAction().then(setTeams);
    }, []);

    // Find selected team
    const selectedTeam = useMemo(() => {
        return teams.find(t => t.id === selectedTeamId);
    }, [teams, selectedTeamId]);

    // Keyboard navigation handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle if user is typing in an input, textarea, or if a modal/dialog is open
            const target = e.target as HTMLElement;
            const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
            const isModalOpen = document.querySelector('[role="dialog"]') !== null;
            
            if (isInputFocused || isModalOpen) {
                // Allow arrow keys in TeamSelection even when input is focused (for team card navigation)
                if (currentStepId === "team" && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
                    // Let TeamSelection handle it
                    return;
                }
                return;
            }

            // Arrow keys: navigate between steps
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                const currentIndex = stepOrder.indexOf(currentStepId);
                if (currentIndex > 0) {
                    // Find previous unlocked step
                    for (let i = currentIndex - 1; i >= 0; i--) {
                        if (isStepUnlocked(stepOrder[i])) {
                            setCurrentStepId(stepOrder[i]);
                            break;
                        }
                    }
                }
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                const currentIndex = stepOrder.indexOf(currentStepId);
                if (currentIndex < stepOrder.length - 1) {
                    // Find next unlocked step
                    for (let i = currentIndex + 1; i < stepOrder.length; i++) {
                        if (isStepUnlocked(stepOrder[i])) {
                            setCurrentStepId(stepOrder[i]);
                            break;
                        }
                    }
                }
            } else if (e.key === "Enter") {
                // Enter key: trigger create flow for current step
                e.preventDefault();
                switch (currentStepId) {
                    case "phase":
                        phaseSelectionRef.current?.triggerCreate();
                        break;
                    case "block":
                        blockSelectionRef.current?.triggerCreate();
                        break;
                    case "exercise":
                        exerciseSelectionRef.current?.triggerCreate();
                        break;
                    case "sets":
                        setsConfigurationRef.current?.triggerCreate();
                        break;
                    // Other steps don't have create flows
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentStepId, stepOrder, isStepUnlocked]);

    return (
        <div className="bg-gradient-to-br from-background via-background to-muted/20 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="hover:bg-muted"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Assign Program</h1>
                            <p className="text-muted-foreground">Create and assign workout programs to teams</p>
                        </div>
                    </div>

                    {currentStepId !== "summary" && program && (
                        <Button onClick={handleViewSummary} variant="outline">
                            View Summary
                        </Button>
                    )}
                </div>

                {/* Breadcrumb */}
                <ProgramBreadcrumb steps={breadcrumbSteps} onStepClick={handleStepClick} />

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStepId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {currentStepId === "team" && (
                            <TeamSelection onSelect={handleTeamSelect} selectedTeamId={selectedTeamId} />
                        )}
                        {currentStepId === "program" && selectedTeam && (
                            <ProgramSelection
                                selectedTeam={selectedTeam}
                                onSelect={handleProgramSelect}
                                currentProgram={program}
                                setCurrentProgram={setProgram}
                            />
                        )}
                        {currentStepId === "phase" && program && (
                            <PhaseSelection
                                ref={phaseSelectionRef}
                                programId={program.id}
                                phases={phases}
                                programPhases={programPhases}
                                phaseBlocks={phaseBlocks}
                                onSelect={handlePhaseSelect}
                                onAddPhase={addPhase}
                                onDeletePhase={deletePhase}
                                onReorderPhases={reorderPhases}
                            />
                        )}
                        {currentStepId === "block" && currentPhaseId && (() => {
                            const currentPhase = phases.find(p => p.id === currentPhaseId);
                            return (
                                <BlockSelection
                                    ref={blockSelectionRef}
                                    phaseId={currentPhaseId}
                                    phaseTitle={currentPhase?.title || ""}
                                    blocks={blocks}
                                    phaseBlocks={phaseBlocks}
                                    blockExercises={blockExercises}
                                    onSelect={handleBlockSelect}
                                    onAddBlock={async (phaseId, name, isSuperset) => {
                                        await addBlock(phaseId, name, isSuperset);
                                    }}
                                />
                            );
                        })()}
                        {currentStepId === "exercise" && currentBlockId && (() => {
                            const currentBlock = blocks.find(b => b.id === currentBlockId);
                            return (
                                <ExerciseSelection
                                    ref={exerciseSelectionRef}
                                    blockId={currentBlockId}
                                    blockName={currentBlock?.name || ""}
                                    exercises={exercises}
                                    blockExercises={blockExercises}
                                    onSelect={handleExerciseSelect}
                                    onAddExercise={addExercise}
                                />
                            );
                        })()}
                        {currentStepId === "sets" && currentExerciseId && (
                            <SetsConfiguration
                                ref={setsConfigurationRef}
                                exerciseId={currentExerciseId}
                                exercises={exercises}
                                sets={sets}
                                exerciseSets={exerciseSets}
                                onComplete={handleSetsComplete}
                                onAddSet={addSet}
                            />
                        )}
                        {currentStepId === "summary" && program && selectedTeamId && (
                            <AssignmentSummary
                                program={program}
                                phases={phases}
                                blocks={blocks}
                                exercises={exercises}
                                sets={sets}
                                programPhases={programPhases}
                                phaseBlocks={phaseBlocks}
                                blockExercises={blockExercises}
                                exerciseSets={exerciseSets}
                                teamId={selectedTeamId}
                                onAssign={handleFinalAssignment}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
