"use client";

import { motion, Reorder } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { PhaseTemplate, ProgramPhaseRelation, PhaseBlockRelation } from "@/lib/types/program-templates";
import { useState, forwardRef, useImperativeHandle } from "react";
import { Badge } from "@/components/ui/badge";

type PhaseSelectionProps = {
    programId: string;
    phases: PhaseTemplate[];
    programPhases: ProgramPhaseRelation[];
    phaseBlocks: PhaseBlockRelation[];
    onSelect: (phaseId: string) => void;
    onAddPhase: (title: string) => Promise<void>;
    onDeletePhase: (phaseId: string) => Promise<void>;
    onReorderPhases: (phaseIds: string[]) => Promise<void>;
};

export const PhaseSelection = forwardRef<{ triggerCreate: () => void }, PhaseSelectionProps>(({
    programId,
    phases,
    programPhases,
    phaseBlocks,
    onSelect,
    onAddPhase,
    onDeletePhase,
    onReorderPhases
}, ref) => {
    const [newPhaseTitle, setNewPhaseTitle] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    // Get phases for this program, sorted by order
    const programPhaseIds = programPhases
        .filter(pp => pp.programId === programId)
        .sort((a, b) => a.order - b.order)
        .map(pp => pp.phaseId);

    const orderedPhases = programPhaseIds
        .map(id => phases.find(p => p.id === id))
        .filter((p): p is PhaseTemplate => p !== undefined);

    // Get block count for a phase
    const getBlockCount = (phaseId: string) => {
        return phaseBlocks.filter(pb => pb.phaseId === phaseId).length;
    };

    const handleAddPhase = async () => {
        if (!newPhaseTitle.trim()) return;

        await onAddPhase(newPhaseTitle);
        setNewPhaseTitle("");
        setIsAdding(false);
    };

    useImperativeHandle(ref, () => ({
        triggerCreate: () => {
            if (!isAdding) {
                setIsAdding(true);
            }
        },
    }));

    const handleDeletePhase = async (phaseId: string) => {
        await onDeletePhase(phaseId);
    };

    const handleReorder = async (newOrder: PhaseTemplate[]) => {
        const newPhaseIds = newOrder.map(p => p.id);
        await onReorderPhases(newPhaseIds);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Program Phases</h2>
                    <p className="text-muted-foreground">Organize your program into phases</p>
                </div>
                <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Phase
                </Button>
            </div>

            <div className="space-y-3">
                {/* Add new phase input */}
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="border-dashed border-2 border-primary">
                            <CardContent className="pt-6">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Phase title (e.g., Foundation, Strength Building)"
                                        value={newPhaseTitle}
                                        onChange={(e) => setNewPhaseTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleAddPhase();
                                            if (e.key === "Escape") {
                                                setIsAdding(false);
                                                setNewPhaseTitle("");
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <Button onClick={handleAddPhase} disabled={!newPhaseTitle.trim()}>
                                        Add
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsAdding(false);
                                            setNewPhaseTitle("");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Existing phases */}
                {orderedPhases.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <h3 className="text-lg font-semibold mb-2">No Phases Yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Add your first phase to get started
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Reorder.Group axis="y" values={orderedPhases} onReorder={handleReorder} className="space-y-3">
                        {orderedPhases.map((phase, index) => (
                            <Reorder.Item key={phase.id} value={phase}>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <Card
                                        className="cursor-pointer hover:shadow-lg transition-all"
                                        onClick={() => onSelect(phase.id)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        Phase {index + 1}: {phase.title}
                                                        <Badge variant="secondary">
                                                            {getBlockCount(phase.id)} {getBlockCount(phase.id) === 1 ? "block" : "blocks"}
                                                        </Badge>
                                                    </CardTitle>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePhase(phase.id);
                                                    }}
                                                    className="hover:bg-destructive hover:text-destructive-foreground"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </motion.div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </div>
        </div>
    );
});
PhaseSelection.displayName = "PhaseSelection";
