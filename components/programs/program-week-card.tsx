"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExerciseSelectionModal } from "./exercise-selection-modal";
import { Exercise } from "@/lib/mock-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EQUIPMENT_OPTIONS } from "@/lib/mock-data/equipment";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

interface ProgramWeekCardProps {
    weekNumber: number;
    assignToAllWeeks?: boolean;
    onAssignToAllWeeksChange?: (value: boolean) => void;
}

type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type AssignedExercise = {
    id: string;
    exerciseId: string;
    name: string;
    sets: number;
    reps?: string;
    time?: string;
    category?: string;
    equipment?: string[];
};

export function ProgramWeekCard({ 
    weekNumber, // eslint-disable-line @typescript-eslint/no-unused-vars
    assignToAllWeeks = true, // eslint-disable-line @typescript-eslint/no-unused-vars
    onAssignToAllWeeksChange // eslint-disable-line @typescript-eslint/no-unused-vars
}: ProgramWeekCardProps) {
    // weekNumber, assignToAllWeeks, and onAssignToAllWeeksChange are available for multi-week assignment logic
    // When assignToAllWeeks is false, changes should only apply to the current week
    
    const [assignments, setAssignments] = useState<Record<DayOfWeek, AssignedExercise[]>>({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
    });

    const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDayId, setActiveDayId] = useState<DayOfWeek | null>(null);
    const [expandedDays, setExpandedDays] = useState<Set<DayOfWeek>>(new Set());
    const [hoveredDay, setHoveredDay] = useState<DayOfWeek | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleAddExercise = (day: DayOfWeek) => {
        setSelectedDay(day);
        setIsExerciseModalOpen(true);
    };

    const handleSelectExercise = (exercise: Exercise) => {
        if (!selectedDay) return;

        const newAssignment: AssignedExercise = {
            id: Math.random().toString(36).substr(2, 9),
            exerciseId: exercise.id,
            name: exercise.name,
            sets: 3,
            reps: "10",
            category: exercise.category,
            equipment: exercise.equipment || [],
        };

        setAssignments((prev) => ({
            ...prev,
            [selectedDay]: [...prev[selectedDay], newAssignment],
        }));

        setIsExerciseModalOpen(false);
    };

    const handleRemoveExercise = (day: DayOfWeek, id: string) => {
        setAssignments((prev) => ({
            ...prev,
            [day]: prev[day].filter((ex) => ex.id !== id),
        }));
    };

    const handleUpdateExercise = (day: DayOfWeek, id: string, updates: Partial<AssignedExercise>) => {
        setAssignments((prev) => ({
            ...prev,
            [day]: prev[day].map((ex) => (ex.id === id ? { ...ex, ...updates } : ex)),
        }));
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        // Find which day contains this exercise and expand it
        const day = DAYS.find(d => assignments[d].some(ex => ex.id === event.active.id));
        if (day) {
            setExpandedDays(prev => new Set(prev).add(day));
        }
    };

    const handleDragEnd = (event: DragEndEvent, day: DayOfWeek) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setAssignments((prev) => {
                const items = prev[day];
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = [...items];
                const [removed] = newItems.splice(oldIndex, 1);
                newItems.splice(newIndex, 0, removed);

                return {
                    ...prev,
                    [day]: newItems,
                };
            });
        }

        setActiveId(null);
        // Clean up expanded state if not hovering
        if (hoveredDay !== day) {
            setExpandedDays(prev => {
                const next = new Set(prev);
                next.delete(day);
                return next;
            });
        }
    };

    const handleDayDragStart = (event: DragStartEvent) => {
        const dayId = event.active.id as DayOfWeek;
        setActiveDayId(dayId);
        // Expand the day being dragged
        setExpandedDays(prev => new Set(prev).add(dayId));
    };

    const handleDayDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const sourceDay = active.id as DayOfWeek;
            const targetDay = over.id as DayOfWeek;

            setAssignments((prev) => {
                const sourceExercises = prev[sourceDay];
                // Copy exercises with new IDs to avoid conflicts
                const copiedExercises = sourceExercises.map((ex) => ({
                    ...ex,
                    id: Math.random().toString(36).substr(2, 9),
                }));

                return {
                    ...prev,
                    [targetDay]: [...prev[targetDay], ...copiedExercises],
                };
            });
        }

        const draggedDay = active.id as DayOfWeek;
        setActiveDayId(null);
        // Clean up expanded state if not hovering
        if (hoveredDay !== draggedDay) {
            setExpandedDays(prev => {
                const next = new Set(prev);
                next.delete(draggedDay);
                return next;
            });
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDayDragStart}
            onDragEnd={handleDayDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {DAYS.map((day) => {
                    const isDraggingAny = activeId !== null || activeDayId !== null;
                    const isExpanded = expandedDays.has(day) || hoveredDay === day || (isDraggingAny && (assignments[day].length > 0 || activeDayId === day));
                    const hasExercises = assignments[day].length > 0;
                    
                    return (
                        <Card
                            key={day}
                            className={cn(
                                "flex-shrink-0 snap-center border-2 bg-card/80 backdrop-blur-sm transition-all",
                                hasExercises ? "border-indigo-500/50 bg-indigo-500/10" : "border-border",
                                isExpanded ? "min-w-[200px]" : "min-w-[120px]"
                            )}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                        >
                            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                                <DraggableDayTitle day={day} />
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                                                onClick={() => handleAddExercise(day)}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardHeader>
                            <DroppableDayContent day={day}>
                                <AnimatePresence mode="wait">
                                    {!isExpanded && hasExercises ? (
                                        <motion.div
                                            key="collapsed"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="h-20 flex items-center justify-center"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="text-2xl font-bold text-indigo-600">
                                                    {assignments[day].length}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {assignments[day].length === 1 ? "exercise" : "exercises"}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : isExpanded ? (
                                        <motion.div
                                            key="expanded"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            {assignments[day].length === 0 ? (
                                                <div className="h-20 flex items-center justify-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                                                    Rest Day
                                                </div>
                                            ) : (
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={(e) => handleDragEnd(e, day)}
                                                >
                                                    <SortableContext
                                                        items={assignments[day].map((ex) => ex.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="space-y-3">
                                                            {assignments[day].map((ex, index) => (
                                                                <SortableExerciseCard
                                                                    key={ex.id}
                                                                    exercise={ex}
                                                                    index={index + 1}
                                                                    isDragging={activeId === ex.id}
                                                                    onRemove={() => handleRemoveExercise(day, ex.id)}
                                                                    onUpdate={(updates) => handleUpdateExercise(day, ex.id, updates)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </SortableContext>
                                                    <DragOverlay>
                                                        {activeId && assignments[day].some((ex) => ex.id === activeId) ? (
                                                            <div className="bg-card/90 backdrop-blur-sm p-3 rounded-lg border border-border shadow-lg opacity-90 w-[200px]">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                                        {assignments[day].findIndex((ex) => ex.id === activeId) + 1}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        <Activity className="w-4 h-4 text-indigo-500" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium line-clamp-1">{assignments[day].find((ex) => ex.id === activeId)?.name}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </DragOverlay>
                                                </DndContext>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="rest"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="h-20 flex items-center justify-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm"
                                        >
                                            Rest Day
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </DroppableDayContent>
                        </Card>
                    );
                })}
            </div>
            <DragOverlay>
                {activeDayId ? (
                    <div className="bg-card border border-border px-4 py-2 rounded-lg shadow-lg text-foreground font-medium text-base">
                        {activeDayId}
                    </div>
                ) : null}
            </DragOverlay>

            <ExerciseSelectionModal
                open={isExerciseModalOpen}
                onOpenChange={setIsExerciseModalOpen}
                onSelect={handleSelectExercise}
            />
        </DndContext>
    );
}

function SortableExerciseCard({ 
    exercise, 
    index, 
    isDragging,
    onRemove, 
    onUpdate 
}: { 
    exercise: AssignedExercise; 
    index: number; 
    isDragging: boolean;
    onRemove: () => void; 
    onUpdate: (updates: Partial<AssignedExercise>) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: exercise.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <ExerciseCard
                exercise={exercise}
                index={index}
                onRemove={onRemove}
                onUpdate={onUpdate}
            />
        </div>
    );
}

function DraggableDayTitle({ day }: { day: DayOfWeek }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: day,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="text-base font-medium cursor-grab active:cursor-grabbing"
        >
            {day}
        </div>
    );
}

function DroppableDayContent({ day, children }: { day: DayOfWeek; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: day,
    });

    return (
        <CardContent
            ref={setNodeRef}
            className={cn("p-4", isOver && "bg-indigo-500/20 border-2 border-indigo-500 rounded-lg")}
        >
            {children}
        </CardContent>
    );
}

function ExerciseCard({ exercise, index, onRemove, onUpdate }: { exercise: AssignedExercise; index: number; onRemove: () => void; onUpdate: (updates: Partial<AssignedExercise>) => void }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="bg-card/90 backdrop-blur-sm p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow group relative cursor-grab active:cursor-grabbing">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            {index}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Activity className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1" title={exercise.name}>{exercise.name}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                                <span>{exercise.sets} sets</span>
                                {exercise.reps && (
                                    <>
                                        <span>×</span>
                                        <span>{exercise.reps} reps</span>
                                    </>
                                )}
                                {exercise.time && (
                                    <>
                                        {exercise.reps && <span>•</span>}
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{exercise.time}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity z-10"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-4">
                    <h4 className="font-medium leading-none">Edit Exercise Details</h4>
                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="sets">Sets</Label>
                            <Input
                                id="sets"
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => onUpdate({ sets: parseInt(e.target.value) })}
                                className="col-span-2 h-8"
                            />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="reps">Reps</Label>
                            <Input
                                id="reps"
                                value={exercise.reps || ""}
                                onChange={(e) => onUpdate({ reps: e.target.value })}
                                className="col-span-2 h-8"
                            />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="time">Time</Label>
                            <Input
                                id="time"
                                value={exercise.time || ""}
                                onChange={(e) => onUpdate({ time: e.target.value })}
                                className="col-span-2 h-8"
                                placeholder="e.g. 30s"
                            />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="equipment">Equipment</Label>
                            <Select
                                value={exercise.equipment?.[0] || ""}
                                onValueChange={(value) => onUpdate({ equipment: value ? [value] : [] })}
                            >
                                <SelectTrigger className="col-span-2 h-8">
                                    <SelectValue placeholder="Select equipment" />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {EQUIPMENT_OPTIONS.map((equipment) => (
                                        <SelectItem key={equipment} value={equipment}>
                                            {equipment}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
