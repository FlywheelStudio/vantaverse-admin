"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbStep = {
    id: string;
    label: string;
    completed: boolean;
    current: boolean;
    unlocked?: boolean; // New: whether this step is accessible
};

type ProgramBreadcrumbProps = {
    steps: BreadcrumbStep[];
    onStepClick: (stepId: string) => void;
};

export function ProgramBreadcrumb({ steps, onStepClick }: ProgramBreadcrumbProps) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            {steps.map((step, index) => {
                // Only show steps that are explicitly unlocked
                const isVisible = step.unlocked === true;

                if (!isVisible) return null;

                return (
                    <div key={step.id} className="flex items-center gap-2">
                        <motion.button
                            onClick={() => (step.unlocked) && onStepClick(step.id)}
                            disabled={!step.unlocked}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium transition-all",
                                "hover:scale-105 active:scale-95",
                                step.current && "bg-primary text-primary-foreground shadow-lg",
                                step.completed && !step.current && "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer",
                                !step.completed && !step.current && "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                            )}
                            whileHover={step.completed || step.current ? { scale: 1.05 } : {}}
                            whileTap={step.completed || step.current ? { scale: 0.95 } : {}}
                        >
                            {step.label}
                        </motion.button>

                        {index < steps.filter(s => s.unlocked === true).length - 1 && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
