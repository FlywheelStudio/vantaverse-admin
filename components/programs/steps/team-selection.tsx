"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { getTeamsAction } from "@/app/assign-program/actions";
import { PATIENTS } from "@/lib/mock-data";
import { useEffect, useState, useRef } from "react";
import { Team } from "@/lib/mock-data";

type TeamSelectionProps = {
    onSelect: (teamId: string) => void;
    selectedTeamId?: string;
};

export function TeamSelection({ onSelect, selectedTeamId }: TeamSelectionProps) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [focusedIndex, setFocusedIndex] = useState<number>(0);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        getTeamsAction().then((data) => {
            setTeams(data);
            setIsLoading(false);
            // Reset focus when teams load
            setFocusedIndex(0);
        });
    }, []);

    // Keyboard navigation for team cards
    useEffect(() => {
        if (teams.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
            
            // Only handle arrow keys and Enter if not typing in an input
            if (isInputFocused && e.key !== "Enter") return;

            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                setFocusedIndex((prev) => (prev + 1) % teams.length);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                setFocusedIndex((prev) => (prev - 1 + teams.length) % teams.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (teams[focusedIndex]) {
                    onSelect(teams[focusedIndex].id);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [teams, focusedIndex, onSelect]);

    // Scroll focused card into view
    useEffect(() => {
        if (cardRefs.current[focusedIndex]) {
            cardRefs.current[focusedIndex]?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    }, [focusedIndex]);

    if (isLoading) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mb-4 animate-pulse" />
                    <h3 className="text-xl font-semibold mb-2">Loading teams...</h3>
                </CardContent>
            </Card>
        );
    }

    if (teams.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Teams Yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Create a team first to assign programs
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold mb-2">Select a Team</h2>
                <p className="text-muted-foreground">Choose which team will receive this program</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team, index) => {
                    const teamPatients = PATIENTS.filter(p => team.patientIds.includes(p.id));
                    const isSelected = team.id === selectedTeamId;
                    const isFocused = index === focusedIndex;

                    return (
                        <motion.div
                            key={team.id}
                            ref={(el) => {
                                cardRefs.current[index] = el;
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Card
                                className={`cursor-pointer transition-all hover:shadow-lg ${
                                    isSelected ? "ring-2 ring-primary shadow-lg" : ""
                                } ${
                                    isFocused && !isSelected ? "ring-2 ring-primary/50 shadow-md" : ""
                                }`}
                                onClick={() => {
                                    setFocusedIndex(index);
                                    onSelect(team.id);
                                }}
                                onMouseEnter={() => setFocusedIndex(index)}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{team.name}</CardTitle>
                                        <Badge variant="secondary">
                                            <Users className="w-3 h-3 mr-1" />
                                            {team.patientIds.length}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Created {new Date(team.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex -space-x-2">
                                        {teamPatients.slice(0, 5).map((patient) => (
                                            <Avatar key={patient.id} className="border-2 border-background w-8 h-8">
                                                <AvatarImage src={patient.avatarUrl} alt={patient.firstName} />
                                                <AvatarFallback className="text-xs">
                                                    {patient.firstName[0]}{patient.lastName[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                        {team.patientIds.length > 5 && (
                                            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                                +{team.patientIds.length - 5}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
