"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Calendar as CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { addWeeks, differenceInWeeks, format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { ProgramTemplate } from "./program-management-view";
import { ProgramWeekCard } from "./program-week-card";

interface ProgramBuilderViewProps {
    initialProgram?: ProgramTemplate | null;
    onBack: () => void;
    onSave: (program: Omit<ProgramTemplate, "id">) => void;
}

export function ProgramBuilderView({ initialProgram, onBack, onSave }: ProgramBuilderViewProps) {
    const [name, setName] = useState(initialProgram?.name || "");
    const [description, setDescription] = useState(initialProgram?.description || "");
    const [durationWeeks, setDurationWeeks] = useState(initialProgram?.durationWeeks || 4);
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(addWeeks(new Date(), 4));

    // Update End Date when Duration changes
    const handleDurationChange = (weeks: string) => {
        const w = parseInt(weeks);
        setDurationWeeks(w);
        if (startDate) {
            setEndDate(addWeeks(startDate, w));
        }
    };

    // Update Duration when Date Range changes
    useEffect(() => {
        if (startDate && endDate) {
            const diff = differenceInWeeks(endDate, startDate);
            if (diff > 0 && diff !== durationWeeks) {
                setDurationWeeks(diff);
            }
        }
    }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

    // Generate weeks array based on duration
    const weeks = Array.from({ length: durationWeeks }, (_, i) => i + 1);

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border">
                <CardContent className="p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Program Builder</h2>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onBack} className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <Button onClick={() => onSave({ name, description, durationWeeks })} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                            <Save className="w-4 h-4" />
                            Save Program
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Program Details Form */}
            <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border">
                <CardContent className="p-0">
                    <Accordion type="single" collapsible defaultValue="program-details" className="w-full">
                        <AccordionItem value="program-details" className="border-0">
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                <h3 className="text-lg font-semibold">Program Details</h3>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Program Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="Enter program name..."
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="max-w-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Describe the program objectives and target audience..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="min-h-[100px]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label>Duration</Label>
                                            <Select value={durationWeeks.toString()} onValueChange={handleDurationChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select duration" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[4, 6, 8, 10, 12, 16].map((w) => (
                                                        <SelectItem key={w} value={w.toString()}>
                                                            {w} Weeks
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-sm text-muted-foreground">Custom:</span>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="52"
                                                    value={durationWeeks}
                                                    onChange={(e) => handleDurationChange(e.target.value)}
                                                    className="w-20 h-8"
                                                />
                                                <span className="text-sm text-muted-foreground">weeks</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !startDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={startDate}
                                                        onSelect={(date) => {
                                                            setStartDate(date);
                                                            if (date && durationWeeks) {
                                                                setEndDate(addWeeks(date, durationWeeks));
                                                            }
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !endDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={endDate}
                                                        onSelect={setEndDate}
                                                        initialFocus
                                                        disabled={(date) => (startDate ? date < startDate : false)}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            {/* Weeks Assignment */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    {/* Week Navigation could go here if we want tabs instead of list */}
                </div>

                {/* For now, let's show the first week expanded or a list of weeks */}
                {/* The user request showed "Week 1", "Week 2" buttons at the top, so let's implement tabs */}
                <WeekTabs weeks={weeks} />
            </div>
        </div>
    );
}

function WeekTabs({ weeks }: { weeks: number[] }) {
    const [activeWeek, setActiveWeek] = useState(1);
    const [assignToAllWeeks, setAssignToAllWeeks] = useState(true);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button variant="outline" size="icon" onClick={() => setActiveWeek(Math.max(1, activeWeek - 1))} disabled={activeWeek === 1}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>

                {weeks.map((week) => (
                    <Button
                        key={week}
                        variant={activeWeek === week ? "default" : "outline"}
                        className={cn(activeWeek === week ? "bg-indigo-600 hover:bg-indigo-700" : "")}
                        onClick={() => setActiveWeek(week)}
                    >
                        Week {week}
                    </Button>
                ))}

                <Button variant="outline" size="icon" onClick={() => setActiveWeek(Math.min(weeks.length, activeWeek + 1))} disabled={activeWeek === weeks.length}>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>

                <div className="flex items-center gap-2 ml-4 px-3 py-2 border rounded-md bg-background">
                    <Checkbox
                        id="assign-to-all"
                        checked={assignToAllWeeks}
                        onCheckedChange={(checked) => setAssignToAllWeeks(checked === true)}
                    />
                    <label
                        htmlFor="assign-to-all"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        Assign to all weeks
                    </label>
                </div>

                <Button className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <PlusIcon className="w-4 h-4" />
                    Add Week
                </Button>
            </div>

            <ProgramWeekCard 
                weekNumber={activeWeek} 
                assignToAllWeeks={assignToAllWeeks}
                onAssignToAllWeeksChange={setAssignToAllWeeks}
            />
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
