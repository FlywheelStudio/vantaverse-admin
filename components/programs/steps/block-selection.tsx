"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Layers, Trash2 } from "lucide-react";
import { BlockTemplate, PhaseBlockRelation, BlockExerciseRelation } from "@/lib/types/program-templates";
import { useState, forwardRef, useImperativeHandle } from "react";
import { Badge } from "@/components/ui/badge";

type BlockSelectionProps = {
    phaseId: string;
    phaseTitle: string;
    blocks: BlockTemplate[];
    phaseBlocks: PhaseBlockRelation[];
    blockExercises: BlockExerciseRelation[];
    onSelect: (blockId: string) => void;
    onAddBlock: (phaseId: string, name: string, isSuperset: boolean) => Promise<void>;
};

export const BlockSelection = forwardRef<{ triggerCreate: () => void }, BlockSelectionProps>(({ phaseId, phaseTitle, blocks, phaseBlocks, blockExercises, onSelect, onAddBlock }, ref) => {
    const [newBlockName, setNewBlockName] = useState("");
    const [isSuperset, setIsSuperset] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Get blocks for this phase
    const currentPhaseBlocks = phaseBlocks
        .filter(pb => pb.phaseId === phaseId)
        .sort((a, b) => a.order - b.order)
        .map(pb => blocks.find(b => b.id === pb.blockId))
        .filter((b): b is BlockTemplate => b !== undefined);

    // Get exercise count for a block
    const getExerciseCount = (blockId: string) => {
        return blockExercises.filter(be => be.blockId === blockId).length;
    };

    const handleAddBlock = async () => {
        if (!newBlockName.trim()) return;

        await onAddBlock(phaseId, newBlockName, isSuperset);

        setNewBlockName("");
        setIsSuperset(false);
        setIsAdding(false);
    };

    const handleDeleteBlock = (blockId: string) => {
        // TODO: Implement delete block functionality
        console.log("Delete block:", blockId);
    };

    useImperativeHandle(ref, () => ({
        triggerCreate: () => {
            if (!isAdding) {
                setIsAdding(true);
            }
        },
    }));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Blocks in {phaseTitle}</h2>
                    <p className="text-muted-foreground">Add workout blocks to this phase</p>
                </div>
                <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Block
                </Button>
            </div>

            <div className="space-y-3">
                {/* Add new block form */}
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="border-dashed border-2 border-primary">
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <Label htmlFor="block-name">Block Name</Label>
                                    <Input
                                        id="block-name"
                                        placeholder="e.g., Warm Up, Main Lift, Accessory Work"
                                        value={newBlockName}
                                        onChange={(e) => setNewBlockName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleAddBlock();
                                            if (e.key === "Escape") {
                                                setIsAdding(false);
                                                setNewBlockName("");
                                                setIsSuperset(false);
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="superset"
                                        checked={isSuperset}
                                        onCheckedChange={(checked) => setIsSuperset(checked as boolean)}
                                    />
                                    <Label htmlFor="superset" className="cursor-pointer">
                                        This is a superset
                                    </Label>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleAddBlock} disabled={!newBlockName.trim()}>
                                        Add Block
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsAdding(false);
                                            setNewBlockName("");
                                            setIsSuperset(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Existing blocks */}
                {currentPhaseBlocks.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Layers className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Blocks Yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Add your first block to organize exercises
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {currentPhaseBlocks.map((block, index) => {
                            const exerciseCount = getExerciseCount(block.id);
                            return (
                                <motion.div
                                    key={block.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <Card
                                        className="cursor-pointer hover:shadow-lg transition-all"
                                        onClick={() => onSelect(block.id)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Layers className="w-5 h-5 text-primary" />
                                                    <div>
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            {block.name}
                                                            {block.isSuperset && (
                                                                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                                                    Superset
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline">
                                                                {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
                                                            </Badge>
                                                        </CardTitle>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteBlock(block.id);
                                                    }}
                                                    className="hover:bg-destructive hover:text-destructive-foreground"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
});
BlockSelection.displayName = "BlockSelection";
