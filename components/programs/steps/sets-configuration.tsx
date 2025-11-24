"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Clock, Hash } from "lucide-react";
import { ExerciseSetTemplate, AssignedExerciseTemplate, ExerciseSetRelation } from "@/lib/types/program-templates";
import { EXERCISES } from "@/lib/mock-data";
import { useState, forwardRef, useImperativeHandle, useRef } from "react";

type SetsConfigurationProps = {
    exerciseId: string;
    exercises: AssignedExerciseTemplate[];
    sets: ExerciseSetTemplate[];
    exerciseSets: ExerciseSetRelation[];
    onComplete: () => void;
    onAddSet: (exerciseId: string, setNumber: number, reps?: number, time?: number, rest?: number, notes?: string) => Promise<ExerciseSetTemplate>;
};

export const SetsConfiguration = forwardRef<{ triggerCreate: () => void }, SetsConfigurationProps>(({
    exerciseId,
    exercises,
    sets,
    exerciseSets,
    onComplete,
    onAddSet,
}, ref) => {
    const [setType, setSetType] = useState<"reps" | "time">("reps");
    const [reps, setReps] = useState("");
    const [time, setTime] = useState("");
    const [rest, setRest] = useState("");
    const [notes, setNotes] = useState("");
    const repsInputRef = useRef<HTMLInputElement>(null);
    const timeInputRef = useRef<HTMLInputElement>(null);

    const assignedExercise = exercises.find(e => e.id === exerciseId);
    const exercise = EXERCISES.find(e => e.id === assignedExercise?.exerciseId);

    // Get sets for this exercise
    const currentExerciseSets = exerciseSets
        .filter(es => es.exerciseId === exerciseId)
        .sort((a, b) => a.order - b.order)
        .map(es => sets.find(s => s.id === es.setId))
        .filter((s): s is ExerciseSetTemplate => s !== undefined);

    useImperativeHandle(ref, () => ({
        triggerCreate: () => {
            // Focus the first input field to start adding a set
            if (setType === "reps") {
                repsInputRef.current?.focus();
            } else {
                timeInputRef.current?.focus();
            }
        },
    }));

    if (!assignedExercise || !exercise) return null;

    const handleAddSet = async () => {
        const setNumber = currentExerciseSets.length + 1;
        await onAddSet(
            exerciseId,
            setNumber,
            setType === "reps" && reps ? parseInt(reps) : undefined,
            setType === "time" && time ? parseInt(time) : undefined,
            rest ? parseInt(rest) : undefined,
            notes || undefined
        );

        // Reset form
        setReps("");
        setTime("");
        setRest("");
        setNotes("");
    };

    const handleDeleteSet = (setId: string) => {
        // TODO: Implement delete set functionality
        console.log("Delete set:", setId);
    };

    const canAddSet = setType === "reps" ? reps : time;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Configure Sets for {exercise.name}</h2>
                <p className="text-muted-foreground">Define the sets and reps for this exercise</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Set Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add Set</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Set Type</Label>
                            <RadioGroup value={setType} onValueChange={(value) => setSetType(value as "reps" | "time")}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="reps" id="reps" />
                                    <Label htmlFor="reps" className="cursor-pointer flex items-center gap-2">
                                        <Hash className="w-4 h-4" />
                                        Reps
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="time" id="time" />
                                    <Label htmlFor="time" className="cursor-pointer flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Time (seconds)
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {setType === "reps" ? (
                            <div>
                                <Label htmlFor="reps-input">Reps</Label>
                                <Input
                                    ref={repsInputRef}
                                    id="reps-input"
                                    type="number"
                                    placeholder="e.g., 10"
                                    value={reps}
                                    onChange={(e) => setReps(e.target.value)}
                                    min="1"
                                />
                            </div>
                        ) : (
                            <div>
                                <Label htmlFor="time-input">Time (seconds)</Label>
                                <Input
                                    ref={timeInputRef}
                                    id="time-input"
                                    type="number"
                                    placeholder="e.g., 30"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    min="1"
                                />
                            </div>
                        )}

                        <div>
                            <Label htmlFor="rest-input">Rest (seconds)</Label>
                            <Input
                                id="rest-input"
                                type="number"
                                placeholder="e.g., 60"
                                value={rest}
                                onChange={(e) => setRest(e.target.value)}
                                min="0"
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes-input">Notes (optional)</Label>
                            <Textarea
                                id="notes-input"
                                placeholder="Special instructions for this set..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <Button onClick={handleAddSet} disabled={!canAddSet} className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Set
                        </Button>
                    </CardContent>
                </Card>

                {/* Sets Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sets ({currentExerciseSets.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentExerciseSets.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No sets added yet</p>
                                <p className="text-sm">Add your first set to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {currentExerciseSets.map((set, index) => (
                                    <motion.div
                                        key={set.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className="border-2">
                                            <CardContent className="pt-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant="secondary">Set {set.setNumber}</Badge>
                                                            {set.reps && (
                                                                <Badge variant="outline">
                                                                    <Hash className="w-3 h-3 mr-1" />
                                                                    {set.reps} reps
                                                                </Badge>
                                                            )}
                                                            {set.time && (
                                                                <Badge variant="outline">
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    {set.time}s
                                                                </Badge>
                                                            )}
                                                            {set.rest && (
                                                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                                    Rest: {set.rest}s
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {set.notes && (
                                                            <p className="text-sm text-muted-foreground">{set.notes}</p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteSet(set.id)}
                                                        className="hover:bg-destructive hover:text-destructive-foreground"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Equipment Display */}
            {assignedExercise.equipment.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Equipment for this exercise</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {assignedExercise.equipment.map(eq => (
                                <Badge key={eq} variant="secondary">{eq}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <Button onClick={onComplete} variant="outline" className="flex-1">
                    Add Another Exercise
                </Button>
                <Button
                    onClick={onComplete}
                    disabled={currentExerciseSets.length === 0}
                    className="flex-1"
                >
                    Done with Block
                </Button>
            </div>
        </div>
    );
});
SetsConfiguration.displayName = "SetsConfiguration";
