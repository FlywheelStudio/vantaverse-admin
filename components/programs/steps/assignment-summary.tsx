"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Users, FileText, Layers, Dumbbell, Hash, Clock } from "lucide-react";
import {
    ProgramTemplate,
    PhaseTemplate,
    BlockTemplate,
    AssignedExerciseTemplate,
    ExerciseSetTemplate,
    ProgramPhaseRelation,
    PhaseBlockRelation,
    BlockExerciseRelation,
    ExerciseSetRelation,
} from "@/lib/types/program-templates";
import { EXERCISES } from "@/lib/mock-data";
import { getTeamsAction } from "@/app/assign-program/actions";
import { PATIENTS } from "@/lib/mock-data";
import { useState, useEffect } from "react";
import { Team } from "@/lib/mock-data";

type AssignmentSummaryProps = {
    program: ProgramTemplate;
    phases: PhaseTemplate[];
    blocks: BlockTemplate[];
    exercises: AssignedExerciseTemplate[];
    sets: ExerciseSetTemplate[];
    programPhases: ProgramPhaseRelation[];
    phaseBlocks: PhaseBlockRelation[];
    blockExercises: BlockExerciseRelation[];
    exerciseSets: ExerciseSetRelation[];
    teamId: string;
    onAssign: () => Promise<void>;
};

export function AssignmentSummary({
    program,
    phases,
    blocks,
    exercises,
    sets,
    programPhases,
    phaseBlocks,
    blockExercises,
    exerciseSets,
    teamId,
    onAssign,
}: AssignmentSummaryProps) {
    const [team, setTeam] = useState<Team>();
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        getTeamsAction().then((teams) => {
            setTeam(teams.find((t: Team) => t.id === teamId));
        });
    }, [teamId]);

    const teamPatients = team ? PATIENTS.filter(p => team.patientIds.includes(p.id)) : [];

    const handleAssign = async () => {
        setIsAssigning(true);
        await onAssign();
        setIsAssigning(false);
    };

    // Build the structure from relations
    const orderedPhases = programPhases
        .filter(pp => pp.programId === program.id)
        .sort((a, b) => a.order - b.order)
        .map(pp => {
            const phase = phases.find(p => p.id === pp.phaseId);
            if (!phase) return null;

            const phaseBlockRels = phaseBlocks
                .filter(pb => pb.phaseId === phase.id)
                .sort((a, b) => a.order - b.order);

            const phaseBlocksData = phaseBlockRels.map(pb => {
                const block = blocks.find(b => b.id === pb.blockId);
                if (!block) return null;

                const blockExRels = blockExercises
                    .filter(be => be.blockId === block.id)
                    .sort((a, b) => a.order - b.order);

                const blockExercisesData = blockExRels.map(be => {
                    const exercise = exercises.find(e => e.id === be.exerciseId);
                    if (!exercise) return null;

                    const exSetRels = exerciseSets
                        .filter(es => es.exerciseId === exercise.id)
                        .sort((a, b) => a.order - b.order);

                    const exerciseSetsData = exSetRels
                        .map(es => sets.find(s => s.id === es.setId))
                        .filter((s): s is ExerciseSetTemplate => s !== undefined);

                    return { exercise, sets: exerciseSetsData };
                }).filter((e): e is { exercise: AssignedExerciseTemplate; sets: ExerciseSetTemplate[] } => e !== null);

                return { block, exercises: blockExercisesData };
            }).filter((b): b is { block: BlockTemplate; exercises: Array<{ exercise: AssignedExerciseTemplate; sets: ExerciseSetTemplate[] }> } => b !== null);

            return { phase, blocks: phaseBlocksData };
        }).filter((p): p is { phase: PhaseTemplate; blocks: Array<{ block: BlockTemplate; exercises: Array<{ exercise: AssignedExerciseTemplate; sets: ExerciseSetTemplate[] }> }> } => p !== null);

    const totalExercises = orderedPhases.reduce(
        (acc, phaseData) => acc + phaseData.blocks.reduce((acc2, blockData) => acc2 + blockData.exercises.length, 0),
        0
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Program Summary</h2>
                <p className="text-muted-foreground">Review and assign this program to the team</p>
            </div>

            {/* Team Info */}
            <Card className="border-primary">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                {team?.name}
                            </CardTitle>
                            <CardDescription className="mt-2">
                                {teamPatients.length} {teamPatients.length === 1 ? "patient" : "patients"} will receive this program
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Program Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {program.name}
                    </CardTitle>
                    <CardDescription>{program.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Badge variant="secondary" className="text-sm">
                            {orderedPhases.length} {orderedPhases.length === 1 ? "Phase" : "Phases"}
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                            {orderedPhases.reduce((acc, p) => acc + p.blocks.length, 0)} Blocks
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                            {totalExercises} Exercises
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Program Structure */}
            <Card>
                <CardHeader>
                    <CardTitle>Program Structure</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" className="w-full">
                        {orderedPhases.map((phaseData, phaseIdx) => (
                            <AccordionItem key={phaseData.phase.id} value={phaseData.phase.id}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline">Phase {phaseIdx + 1}</Badge>
                                        <span className="font-semibold">{phaseData.phase.title}</span>
                                        <Badge variant="secondary" className="ml-auto mr-4">
                                            {phaseData.blocks.length} {phaseData.blocks.length === 1 ? "block" : "blocks"}
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 pl-4 pt-2">
                                        {phaseData.blocks.map((blockData) => (
                                            <Card key={blockData.block.id} className="border-l-4 border-l-primary">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Layers className="w-4 h-4 text-primary" />
                                                        <CardTitle className="text-base">{blockData.block.name}</CardTitle>
                                                        {blockData.block.isSuperset && (
                                                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                                                Superset
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    {blockData.exercises.map((exData) => {
                                                        const exercise = EXERCISES.find(e => e.id === exData.exercise.exerciseId);
                                                        if (!exercise) return null;

                                                        return (
                                                            <div key={exData.exercise.id} className="border-l-2 border-muted pl-4 space-y-2">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Dumbbell className="w-4 h-4 text-muted-foreground" />
                                                                        <span className="font-medium">{exercise.name}</span>
                                                                    </div>
                                                                </div>

                                                                {exData.exercise.equipment.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {exData.exercise.equipment.map(eq => (
                                                                            <Badge key={eq} variant="outline" className="text-xs">
                                                                                {eq}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {exData.sets.length > 0 && (
                                                                    <div className="space-y-1">
                                                                        {exData.sets.map(set => (
                                                                            <div key={set.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    Set {set.setNumber}
                                                                                </Badge>
                                                                                {set.reps && (
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Hash className="w-3 h-3" />
                                                                                        {set.reps} reps
                                                                                    </span>
                                                                                )}
                                                                                {set.time && (
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Clock className="w-3 h-3" />
                                                                                        {set.time}s
                                                                                    </span>
                                                                                )}
                                                                                {set.rest && (
                                                                                    <span className="text-blue-600">• Rest: {set.rest}s</span>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            {/* Assign Button */}
            <div className="flex gap-3">
                <Button
                    size="lg"
                    className="flex-1"
                    onClick={handleAssign}
                    disabled={isAssigning || orderedPhases.length === 0}
                >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {isAssigning ? "Assigning..." : "Assign to Team"}
                </Button>
            </div>
        </div>
    );
}
