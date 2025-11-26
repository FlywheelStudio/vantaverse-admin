"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { EXERCISES, Exercise } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

interface ExerciseSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (exercise: Exercise) => void;
}

export function ExerciseSelectionModal({ open, onOpenChange, onSelect }: ExerciseSelectionModalProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredExercises = EXERCISES.filter((ex) =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.muscleGroups.some(mg => mg.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Exercise</DialogTitle>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <ScrollArea className="flex-1 pr-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredExercises.map((exercise) => (
                            <div
                                key={exercise.id}
                                className="flex gap-4 p-3 rounded-lg border hover:border-indigo-500 hover:bg-indigo-50/50 cursor-pointer transition-all"
                                onClick={() => onSelect(exercise)}
                            >
                                <div className="w-20 h-20 rounded-md bg-slate-100 flex-shrink-0 overflow-hidden">
                                    {exercise.thumbnailUrl ? (
                                        <video
                                            src={exercise.thumbnailUrl}
                                            className="w-full h-full object-cover"
                                            muted
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">No Video</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-white truncate">{exercise.name}</h4>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {exercise.muscleGroups.slice(0, 2).map((mg) => (
                                            <Badge key={mg} variant="secondary" className="text-xs">
                                                {mg}
                                            </Badge>
                                        ))}
                                        <Badge variant="outline" className="text-xs">
                                            {exercise.difficulty}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
