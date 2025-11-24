'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Team, Patient } from '@/lib/mock-data';
import { TeamCard } from './team-card';
import { PatientAssignmentSheet } from './patient-assignment-sheet';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { createTeam, assignMultiplePatientsToTeam } from '@/app/teams/actions';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface TeamsViewProps {
    initialTeams: Team[];
    patients: Patient[];
}

export function TeamsView({ initialTeams, patients }: TeamsViewProps) {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);

    // Edit modal state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [editTeamName, setEditTeamName] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleAssignClick = (teamId: string) => {
        // Reorder teams - bring clicked team to front
        setTeams(prev => {
            const idx = prev.findIndex(t => t.id === teamId);
            if (idx === -1) return prev;
            const reordered = [...prev];
            const [team] = reordered.splice(idx, 1);
            return [team, ...reordered];
        });
        setActiveTeamId(teamId);
        setIsSheetOpen(true);
    };

    const handleEditClick = (team: Team) => {
        setEditingTeam(team);
        setEditTeamName(team.name);
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (!editingTeam) return;
        const updated = { ...editingTeam, name: editTeamName };
        setTeams(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        setIsEditDialogOpen(false);
        toast.success('Team updated');
        router.refresh();
    };

    const handleDeassign = (teamId: string, patientId: string) => {
        setTeams(prev =>
            prev.map(t =>
                t.id === teamId ? { ...t, patientIds: t.patientIds.filter(id => id !== patientId) } : t
            )
        );
        toast.success('Patient removed from team');
        router.refresh();
    };

    const handleDeleteTeam = () => {
        if (!editingTeam) return;
        setTeams(prev => prev.filter(t => t.id !== editingTeam.id));
        setIsEditDialogOpen(false);
        toast.success('Team deleted');
        router.refresh();
    };

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;
        try {
            const newTeam = await createTeam(newTeamName);
            setTeams([...teams, newTeam]);
            setIsCreateDialogOpen(false);
            setNewTeamName('');
            toast.success('Team created successfully');
        } catch {
            toast.error('Failed to create team');
        }
    };

    const handleDragStart = (event: any) => {
        setActiveDragId(event.active.id);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (!over || over.data.current?.type !== 'team') return;

        try {
            const ids: string[] = [];
            if (active.data.current?.type === 'patient') {
                const pid = active.id as string;
                ids.push(pid);
                if (selectedPatientIds.includes(pid)) {
                    ids.push(...selectedPatientIds.filter(id => id !== pid));
                }
            } else if (active.data.current?.type === 'team-group') {
                ids.push(...active.data.current.patientIds);
            }

            if (ids.length && over.id) {
                await assignMultiplePatientsToTeam(over.id as string, ids);
                setTeams(prev =>
                    prev.map(t =>
                        t.id === over.id ? { ...t, patientIds: Array.from(new Set([...t.patientIds, ...ids])) } : t
                    )
                );
                toast.success('Patients assigned successfully');
                router.refresh();
            }
        } catch {
            toast.error('Failed to assign patients');
        }
    };

    const handleTogglePatient = (patientId: string, checked: boolean) => {
        setSelectedPatientIds(prev => (checked ? [...prev, patientId] : prev.filter(id => id !== patientId)));
    };

    const handleSheetAssign = async (patientIds: string[]) => {
        if (!activeTeamId) {
            toast.error('No active team selected');
            return;
        }
        try {
            await assignMultiplePatientsToTeam(activeTeamId, patientIds);
            setTeams(prev =>
                prev.map(t =>
                    t.id === activeTeamId ? { ...t, patientIds: Array.from(new Set([...t.patientIds, ...patientIds])) } : t
                )
            );
            toast.success('Patients assigned successfully');
            setSelectedPatientIds([]);
            setIsSheetOpen(false);
            router.refresh();
        } catch {
            toast.error('Failed to assign patients');
        }
    };

    const activeTeam = teams.find(t => t.id === activeTeamId) || null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
                        <p className="text-muted-foreground">Manage teams and assign patients.</p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Create Team
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Team</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input id="name" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateTeam}>Create Team</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <AnimatePresence>
                    <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" layout>
                        {teams.map(team => (
                            <motion.div
                                key={team.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <TeamCard
                                    team={team}
                                    patients={patients}
                                    onAssignClick={handleAssignClick}
                                    onEditClick={handleEditClick}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                <PatientAssignmentSheet
                    isOpen={isSheetOpen}
                    onClose={() => setIsSheetOpen(false)}
                    team={activeTeam}
                    patients={patients}
                    teams={teams}
                    onAssign={handleSheetAssign}
                    selectedPatientIds={selectedPatientIds}
                    onTogglePatient={handleTogglePatient}
                />

                {/* Edit Team Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Team</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="team-name" className="text-right">Name</Label>
                                <Input
                                    id="team-name"
                                    value={editTeamName}
                                    onChange={e => setEditTeamName(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            {editingTeam && editingTeam.patientIds.length > 0 && (
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right pt-2">Members</Label>
                                    <div className="col-span-3 flex flex-wrap gap-2">
                                        {editingTeam.patientIds.map(pid => {
                                            const patient = patients.find(p => p.id === pid);
                                            if (!patient) return null;
                                            return (
                                                <div key={patient.id} className="relative group">
                                                    <Avatar className="h-10 w-10 border-2 border-background">
                                                        <AvatarImage src={patient.avatarUrl} />
                                                        <AvatarFallback>{patient.firstName[0]}{patient.lastName[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDeassign(editingTeam.id, patient.id)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="flex justify-between">
                            <Button variant="destructive" onClick={handleDeleteTeam}>
                                Delete Team
                            </Button>
                            <Button onClick={handleSaveEdit}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <DragOverlay>
                    {activeDragId ? (
                        <div className="bg-background border p-2 rounded shadow-lg opacity-80 w-[200px]">
                            {selectedPatientIds.includes(activeDragId) && selectedPatientIds.length > 1
                                ? `Dragging ${selectedPatientIds.length} Patients...`
                                : 'Dragging Patient...'}
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
