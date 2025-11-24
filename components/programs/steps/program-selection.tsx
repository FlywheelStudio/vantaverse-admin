"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Sparkles } from "lucide-react";
import { ProgramTemplate } from "@/lib/types/program-templates";
import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { upsertProgram, getAllPrograms } from "@/app/assign-program/actions";
import { Team } from "@/lib/mock-data";

const programSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
});

type ProgramFormData = z.infer<typeof programSchema>;

type ProgramSelectionProps = {
    onSelect: (programId: string, name: string, description: string) => void;
    currentProgram?: ProgramTemplate;
    setCurrentProgram: (program: ProgramTemplate) => void;
    selectedTeam: Team;
};

export function ProgramSelection({ onSelect, currentProgram, setCurrentProgram, selectedTeam }: ProgramSelectionProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
    const [focusedCardIndex, setFocusedCardIndex] = useState<number>(0); // 0 = Create New, 1 = Use Template
    const [focusedTemplateIndex, setFocusedTemplateIndex] = useState<number>(0);
    const createCardRef = useRef<HTMLDivElement>(null);
    const templateCardRef = useRef<HTMLDivElement>(null);
    const templateRefs = useRef<(HTMLDivElement | null)[]>([]);

    const form = useForm<ProgramFormData>({
        resolver: zodResolver(programSchema),
        defaultValues: {
            name: currentProgram?.name || "",
            description: currentProgram?.description || "",
        },
    });

    // Load all programs as templates
    useEffect(() => {
        getAllPrograms().then(setTemplates);
    }, []);

    const handleSelectTemplate = useCallback((template: ProgramTemplate) => {
        setCurrentProgram(template);
        onSelect(template.id, template.name, template.description);
        setIsTemplateDialogOpen(false);
    }, [setCurrentProgram, onSelect]);

    // Keyboard navigation for main cards
    useEffect(() => {
        if (isCreateDialogOpen || isTemplateDialogOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
            
            if (isInputFocused) return;

            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setFocusedCardIndex((prev) => {
                    const newIndex = e.key === "ArrowDown" 
                        ? (prev + 1) % 2 
                        : (prev - 1 + 2) % 2;
                    return newIndex;
                });
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (focusedCardIndex === 0) {
                    setIsCreateDialogOpen(true);
                } else if (focusedCardIndex === 1 && templates.length > 0) {
                    setIsTemplateDialogOpen(true);
                    setFocusedTemplateIndex(0);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isCreateDialogOpen, isTemplateDialogOpen, focusedCardIndex, templates.length]);

    // Scroll focused card into view
    useEffect(() => {
        if (isCreateDialogOpen || isTemplateDialogOpen) return;
        
        const focusedRef = focusedCardIndex === 0 ? createCardRef : templateCardRef;
        focusedRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
        });
    }, [focusedCardIndex, isCreateDialogOpen, isTemplateDialogOpen]);

    // Keyboard navigation for template dialog
    useEffect(() => {
        if (!isTemplateDialogOpen || templates.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
            
            if (isInputFocused) return;

            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setFocusedTemplateIndex((prev) => {
                    const newIndex = e.key === "ArrowDown"
                        ? (prev + 1) % templates.length
                        : (prev - 1 + templates.length) % templates.length;
                    return newIndex;
                });
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (templates[focusedTemplateIndex]) {
                    handleSelectTemplate(templates[focusedTemplateIndex]);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                setIsTemplateDialogOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isTemplateDialogOpen, templates, focusedTemplateIndex, handleSelectTemplate]);

    // Scroll focused template into view
    useEffect(() => {
        if (!isTemplateDialogOpen) return;
        
        templateRefs.current[focusedTemplateIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
        });
    }, [focusedTemplateIndex, isTemplateDialogOpen]);

    // Reset template focus when dialog closes
    useEffect(() => {
        if (!isTemplateDialogOpen) {
            setFocusedTemplateIndex(0);
        }
    }, [isTemplateDialogOpen]);

    const handleCreateProgram = async (data: ProgramFormData) => {
        const program = await upsertProgram(data.name, data.description);
        setCurrentProgram(program);
        onSelect(program.id, program.name, program.description);
        setIsCreateDialogOpen(false);
        form.reset();
    };

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold mb-2">{selectedTeam?.name}: Choose or Create a Program</h2>
                <p className="text-muted-foreground">Start with a template or build from scratch</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create New Program */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <motion.div
                            ref={createCardRef}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Card className={`cursor-pointer border-dashed border-2 hover:border-primary hover:shadow-lg transition-all h-full ${
                                focusedCardIndex === 0 && !isCreateDialogOpen && !isTemplateDialogOpen ? "ring-2 ring-primary shadow-lg" : ""
                            }`}>
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                        <Plus className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Create New Program</h3>
                                    <p className="text-muted-foreground">
                                        Build a custom program from scratch
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Program</DialogTitle>
                            <DialogDescription>
                                Give your program a name and description
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleCreateProgram)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Program Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., ACL Recovery Program" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe the program goals and target audience..."
                                                    rows={4}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">Create Program</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* Use Template */}
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                    <DialogTrigger asChild>
                        <motion.div
                            ref={templateCardRef}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Card className={`cursor-pointer border-2 hover:shadow-lg transition-all h-full ${
                                templates.length === 0 ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary'
                            } ${
                                focusedCardIndex === 1 && !isCreateDialogOpen && !isTemplateDialogOpen ? "ring-2 ring-primary shadow-lg" : ""
                            }`}>
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${templates.length > 0 ? 'bg-purple-100' : 'bg-muted'}`}>
                                        <Sparkles className={`w-8 h-8 ${templates.length > 0 ? 'text-purple-600' : 'text-muted-foreground'}`} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Use Template</h3>
                                    <p className="text-muted-foreground">
                                        {templates.length > 0 ? `${templates.length} templates available` : 'No templates available yet'}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </DialogTrigger>
                    {templates.length > 0 && (
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Select a Template</DialogTitle>
                                <DialogDescription>
                                    Choose from existing programs
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                                {templates.map((template, index) => (
                                    <Card
                                        key={template.id}
                                        ref={(el) => {
                                            templateRefs.current[index] = el;
                                        }}
                                        className={`cursor-pointer hover:border-primary transition-all ${
                                            focusedTemplateIndex === index ? "ring-2 ring-primary shadow-lg" : ""
                                        }`}
                                        onClick={() => handleSelectTemplate(template)}
                                    >
                                        <CardHeader>
                                            <CardTitle className="text-base">{template.name}</CardTitle>
                                            <CardDescription className="text-sm">{template.description}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </DialogContent>
                    )}
                </Dialog>
            </div>

            {/* Show current program if exists */}
            {currentProgram && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border-primary">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        {currentProgram.name}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        {currentProgram.description}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCreateDialogOpen(true)}
                                >
                                    Edit
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
