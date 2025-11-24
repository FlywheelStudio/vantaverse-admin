"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Dumbbell, Plus, X, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BlockExerciseRelation, AssignedExerciseTemplate } from "@/lib/types/program-templates";
import { EXERCISES } from "@/lib/mock-data";
import { EQUIPMENT_OPTIONS } from "@/lib/mock-data/equipment";
import { useState, forwardRef, useImperativeHandle } from "react";

type ExerciseSelectionProps = {
    blockId: string;
    blockName: string;
    exercises: AssignedExerciseTemplate[];
    blockExercises: BlockExerciseRelation[];
    onSelect: (exerciseId: string) => void;
    onAddExercise: (blockId: string, exerciseId: string, equipment: string[]) => Promise<AssignedExerciseTemplate>;
};

export const ExerciseSelection = forwardRef<{ triggerCreate: () => void }, ExerciseSelectionProps>(({ blockId, blockName, exercises, blockExercises, onSelect, onAddExercise }, ref) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all");
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
    const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>();
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
    const [customEquipment, setCustomEquipment] = useState("");

    // Get exercises for this block
    const currentBlockExercises = blockExercises
        .filter(be => be.blockId === blockId)
        .sort((a, b) => a.order - b.order)
        .map(be => exercises.find(e => e.id === be.exerciseId))
        .filter((e): e is AssignedExerciseTemplate => e !== undefined);

    // Get assigned exercise IDs for this block
    const assignedExerciseIds = new Set(currentBlockExercises.map(ae => ae.exerciseId));

    // Get unique muscle groups and difficulties
    const muscleGroups = Array.from(new Set(EXERCISES.flatMap(e => e.muscleGroups)));
    const difficulties = Array.from(new Set(EXERCISES.map(e => e.difficulty)));

    // Filter exercises
    const allFilteredExercises = EXERCISES.filter(exercise => {
        const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMuscleGroup = selectedMuscleGroup === "all" || exercise.muscleGroups.includes(selectedMuscleGroup);
        const matchesDifficulty = selectedDifficulty === "all" || exercise.difficulty === selectedDifficulty;
        return matchesSearch && matchesMuscleGroup && matchesDifficulty;
    });

    // Separate into assigned and unassigned
    const assignedExercises = allFilteredExercises.filter(ex => assignedExerciseIds.has(ex.id));
    const unassignedExercises = allFilteredExercises.filter(ex => !assignedExerciseIds.has(ex.id));

    const handleExerciseClick = (exerciseId: string, isAssigned: boolean) => {
        if (isAssigned) {
            // For assigned exercises, navigate to sets configuration
            const assignedExercise = currentBlockExercises.find(ae => ae.exerciseId === exerciseId);
            if (assignedExercise) {
                onSelect(assignedExercise.id);
            }
        } else {
            // For unassigned exercises, show equipment dialog
            setSelectedExerciseId(exerciseId);
            setSelectedEquipment([]);
            setCustomEquipment("");
            setIsEquipmentDialogOpen(true);
        }
    };

    const handleAddEquipment = () => {
        if (customEquipment.trim()) {
            setSelectedEquipment([...selectedEquipment, customEquipment.trim()]);
            setCustomEquipment("");
        }
    };

    const handleRemoveEquipment = (equipment: string) => {
        setSelectedEquipment(selectedEquipment.filter(e => e !== equipment));
    };

    const handleConfirmExercise = async () => {
        if (!selectedExerciseId) return;

        const newExercise = await onAddExercise(blockId, selectedExerciseId, selectedEquipment);
        setIsEquipmentDialogOpen(false);
        onSelect(newExercise.id);
    };

    useImperativeHandle(ref, () => ({
        triggerCreate: () => {
            // Open equipment dialog for first unassigned exercise if available
            if (unassignedExercises.length > 0 && !isEquipmentDialogOpen) {
                handleExerciseClick(unassignedExercises[0].id, false);
            }
        },
    }));

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold mb-2">Add Exercise to {blockName}</h2>
                <p className="text-muted-foreground">Choose an exercise from the library</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                    <SelectTrigger>
                        <SelectValue placeholder="Muscle Group" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Muscle Groups</SelectItem>
                        {muscleGroups.map(group => (
                            <SelectItem key={group} value={group}>{group}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger>
                        <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Difficulties</SelectItem>
                        {difficulties.map(diff => (
                            <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Assigned Exercises Section */}
            {assignedExercises.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Assigned Exercises ({assignedExercises.length})</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignedExercises.map((exercise, index) => (
                            <motion.div
                                key={exercise.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Card
                                    className="cursor-pointer hover:shadow-lg transition-all h-full border-primary/50 bg-primary/5"
                                    onClick={() => handleExerciseClick(exercise.id, true)}
                                >
                                    {exercise.thumbnailUrl && (
                                        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                                            <img
                                                src={exercise.thumbnailUrl}
                                                alt={exercise.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-base">{exercise.name}</CardTitle>
                                            <Badge variant="default" className="bg-primary text-primary-foreground">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Assigned
                                            </Badge>
                                        </div>
                                        <CardDescription>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {exercise.muscleGroups.slice(0, 2).map(group => (
                                                    <Badge key={group} variant="secondary" className="text-xs">
                                                        {group}
                                                    </Badge>
                                                ))}
                                                <Badge variant="outline" className="text-xs">
                                                    {exercise.difficulty}
                                                </Badge>
                                            </div>
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                    <Separator className="my-6" />
                </div>
            )}

            {/* Unassigned Exercises Section */}
            <div className="space-y-3">
                {assignedExercises.length > 0 && (
                    <h3 className="text-lg font-semibold">Available Exercises ({unassignedExercises.length})</h3>
                )}
                {unassignedExercises.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unassignedExercises.map((exercise, index) => (
                            <motion.div
                                key={exercise.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Card
                                    className="cursor-pointer hover:shadow-lg transition-all h-full"
                                    onClick={() => handleExerciseClick(exercise.id, false)}
                                >
                                    {exercise.thumbnailUrl && (
                                        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                                            <img
                                                src={exercise.thumbnailUrl}
                                                alt={exercise.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle className="text-base">{exercise.name}</CardTitle>
                                        <CardDescription>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {exercise.muscleGroups.slice(0, 2).map(group => (
                                                    <Badge key={group} variant="secondary" className="text-xs">
                                                        {group}
                                                    </Badge>
                                                ))}
                                                <Badge variant="outline" className="text-xs">
                                                    {exercise.difficulty}
                                                </Badge>
                                            </div>
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : assignedExercises.length === 0 && allFilteredExercises.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Dumbbell className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Exercises Found</h3>
                            <p className="text-muted-foreground">Try adjusting your filters</p>
                        </CardContent>
                    </Card>
                ) : null}
            </div>

            {/* Equipment Selection Dialog */}
            <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Equipment</DialogTitle>
                        <DialogDescription>
                            Choose the equipment needed for this exercise
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Predefined Equipment</Label>
                            <Select
                                onValueChange={(value) => {
                                    if (!selectedEquipment.includes(value)) {
                                        setSelectedEquipment([...selectedEquipment, value]);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select equipment..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {EQUIPMENT_OPTIONS.map(eq => (
                                        <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Custom Equipment</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter custom equipment..."
                                    value={customEquipment}
                                    onChange={(e) => setCustomEquipment(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleAddEquipment();
                                    }}
                                />
                                <Button onClick={handleAddEquipment} disabled={!customEquipment.trim()}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {selectedEquipment.length > 0 && (
                            <div>
                                <Label>Selected Equipment</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedEquipment.map(eq => (
                                        <Badge key={eq} variant="secondary" className="gap-1">
                                            {eq}
                                            <X
                                                className="w-3 h-3 cursor-pointer"
                                                onClick={() => handleRemoveEquipment(eq)}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEquipmentDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmExercise}>
                            Continue to Sets
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
});
ExerciseSelection.displayName = "ExerciseSelection";
