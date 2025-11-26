"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ProgramTemplate,
  PhaseTemplate,
  BlockTemplate,
  AssignedExerciseTemplate,
  ExerciseSetTemplate,
  TeamProgramAssignment,
  ProgramPhaseRelation,
  PhaseBlockRelation,
  BlockExerciseRelation,
  ExerciseSetRelation,
} from "@/lib/types/program-templates";
import {
  loadTeamProgramStructure,
  saveTeamAssignment,
  upsertProgram,
  upsertPhase,
  upsertBlock,
  upsertAssignedExercise,
  upsertExerciseSet,
} from "@/app/assign-program/actions";

export function useProgramAssignment(teamId?: string) {
  const [program, setProgram] = useState<ProgramTemplate>();
  const [programPhases, setProgramPhases] = useState<ProgramPhaseRelation[]>([]);
  const [phaseBlocks, setPhaseBlocks] = useState<PhaseBlockRelation[]>([]);
  const [blockExercises, setBlockExercises] = useState<BlockExerciseRelation[]>([]);
  const [exerciseSets, setExerciseSets] = useState<ExerciseSetRelation[]>([]);
  
  const [phases, setPhases] = useState<PhaseTemplate[]>([]);
  const [blocks, setBlocks] = useState<BlockTemplate[]>([]);
  const [exercises, setExercises] = useState<AssignedExerciseTemplate[]>([]);
  const [sets, setSets] = useState<ExerciseSetTemplate[]>([]);

  // Load team's existing assignment
  useEffect(() => {
    if (!teamId) return;
    
    const structure = loadTeamProgramStructure(teamId);
    if (!structure) {
      // No assignment yet, reset everything
      setProgram(undefined);
      setProgramPhases([]);
      setPhaseBlocks([]);
      setBlockExercises([]);
      setExerciseSets([]);
      setPhases([]);
      setBlocks([]);
      setExercises([]);
      setSets([]);
      return;
    }
      
      // Load the structure
      setProgram(structure.program);
      
      const allPhases: PhaseTemplate[] = [];
      const allBlocks: BlockTemplate[] = [];
      const allExercises: AssignedExerciseTemplate[] = [];
      const allSets: ExerciseSetTemplate[] = [];
      const ppRels: ProgramPhaseRelation[] = [];
      const pbRels: PhaseBlockRelation[] = [];
      const beRels: BlockExerciseRelation[] = [];
      const esRels: ExerciseSetRelation[] = [];
      
      structure.phases.forEach((phaseData, phaseOrder) => {
        allPhases.push(phaseData.phase);
        ppRels.push({
          programId: structure.program.id,
          phaseId: phaseData.phase.id,
          order: phaseOrder,
        });
        
        phaseData.blocks.forEach((blockData, blockOrder) => {
          allBlocks.push(blockData.block);
          pbRels.push({
            phaseId: phaseData.phase.id,
            blockId: blockData.block.id,
            order: blockOrder,
          });
          
          blockData.exercises.forEach((exerciseData, exerciseOrder) => {
            allExercises.push(exerciseData.exercise);
            beRels.push({
              blockId: blockData.block.id,
              exerciseId: exerciseData.exercise.id,
              order: exerciseOrder,
            });
            
            exerciseData.sets.forEach((set, setOrder) => {
              allSets.push(set);
              esRels.push({
                exerciseId: exerciseData.exercise.id,
                setId: set.id,
                order: setOrder,
              });
            });
          });
        });
      });
      
    setPhases(allPhases);
    setBlocks(allBlocks);
    setExercises(allExercises);
    setSets(allSets);
    setProgramPhases(ppRels);
    setPhaseBlocks(pbRels);
    setBlockExercises(beRels);
    setExerciseSets(esRels);
  }, [teamId]);

  // Save assignment
  const saveAssignment = useCallback(() => {
    if (!teamId || !program) return;
    
    const assignment: TeamProgramAssignment = {
      id: `assignment-${teamId}-${Date.now()}`,
      teamId,
      programId: program.id,
      assignedAt: new Date().toISOString(),
      programPhases,
      phaseBlocks,
      blockExercises,
      exerciseSets,
    };
    
    saveTeamAssignment(assignment);
  }, [teamId, program, programPhases, phaseBlocks, blockExercises, exerciseSets]);

  // Add phase to program
  const addPhase = useCallback((title: string) => {
    if (!program) return;
    
    const phase = upsertPhase(title);
    setPhases(prev => [...prev, phase]);
    
    const newRel: ProgramPhaseRelation = {
      programId: program.id,
      phaseId: phase.id,
      order: programPhases.length,
    };
    setProgramPhases(prev => [...prev, newRel]);
  }, [program, programPhases.length]);

  // Add block to phase
  const addBlock = useCallback((phaseId: string, name: string, isSuperset: boolean) => {
    const block = upsertBlock(name, isSuperset);
    setBlocks(prev => [...prev, block]);
    
    const currentBlocks = phaseBlocks.filter(pb => pb.phaseId === phaseId);
    const newRel: PhaseBlockRelation = {
      phaseId,
      blockId: block.id,
      order: currentBlocks.length,
    };
    setPhaseBlocks(prev => [...prev, newRel]);
    
    return block;
  }, [phaseBlocks]);

  // Add exercise to block
  const addExercise = useCallback((blockId: string, exerciseId: string, equipment: string[]) => {
    const exercise = upsertAssignedExercise(exerciseId, equipment);
    setExercises(prev => [...prev, exercise]);
    
    const currentExercises = blockExercises.filter(be => be.blockId === blockId);
    const newRel: BlockExerciseRelation = {
      blockId,
      exerciseId: exercise.id,
      order: currentExercises.length,
    };
    setBlockExercises(prev => [...prev, newRel]);
    
    return exercise;
  }, [blockExercises]);

  // Add set to exercise
  const addSet = useCallback((
    exerciseId: string,
    setNumber: number,
    reps?: number,
    time?: number,
    rest?: number,
    notes?: string
  ) => {
    const set = upsertExerciseSet(setNumber, reps, time, rest, notes);
    setSets(prev => [...prev, set]);
    
    const currentSets = exerciseSets.filter(es => es.exerciseId === exerciseId);
    const newRel: ExerciseSetRelation = {
      exerciseId,
      setId: set.id,
      order: currentSets.length,
    };
    setExerciseSets(prev => [...prev, newRel]);
    
    return set;
  }, [exerciseSets]);

  // Delete phase from program
  const deletePhase = useCallback((phaseId: string) => {
    if (!program) return;
    
    // Remove the phase
    setPhases(prev => prev.filter(p => p.id !== phaseId));
    
    // Remove the program-phase relation
    setProgramPhases(prev => prev.filter(pp => pp.phaseId !== phaseId));
    
    // Remove all related phase-block relations
    const blockIdsToRemove = phaseBlocks
      .filter(pb => pb.phaseId === phaseId)
      .map(pb => pb.blockId);
    
    setPhaseBlocks(prev => prev.filter(pb => pb.phaseId !== phaseId));
    
    // Remove all related block-exercise relations
    const exerciseIdsToRemove = blockExercises
      .filter(be => blockIdsToRemove.includes(be.blockId))
      .map(be => be.exerciseId);
    
    setBlockExercises(prev => prev.filter(be => !blockIdsToRemove.includes(be.blockId)));
    
    // Remove all related exercise-set relations
    setExerciseSets(prev => prev.filter(es => !exerciseIdsToRemove.includes(es.exerciseId)));
    
    // Clean up orphaned blocks, exercises, and sets
    setBlocks(prev => prev.filter(b => !blockIdsToRemove.includes(b.id)));
    setExercises(prev => prev.filter(e => !exerciseIdsToRemove.includes(e.id)));
    setSets(prev => prev.filter(s => !exerciseSets.some(es => es.setId === s.id && exerciseIdsToRemove.includes(es.exerciseId))));
  }, [program, phaseBlocks, blockExercises, exerciseSets]);

  // Reorder phases
  const reorderPhases = useCallback((phaseIds: string[]) => {
    if (!program) return;
    
    // Update the order in programPhases relations
    setProgramPhases(prev => {
      const updated = prev.map(pp => {
        const newOrder = phaseIds.indexOf(pp.phaseId);
        return newOrder >= 0 ? { ...pp, order: newOrder } : pp;
      });
      return updated;
    });
  }, [program]);

  return {
    program,
    setProgram,
    phases,
    blocks,
    exercises,
    sets,
    programPhases,
    phaseBlocks,
    blockExercises,
    exerciseSets,
    addPhase,
    addBlock,
    addExercise,
    addSet,
    deletePhase,
    reorderPhases,
    saveAssignment,
  };
}
