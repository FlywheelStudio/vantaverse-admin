"use client";

import { useState } from "react";
import { Exercise, EXERCISES } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Dumbbell } from "lucide-react";
import { ExerciseDetailModal } from "./exercise-detail-modal";
import { AssignmentModal } from "./assignment-modal";
import { toast } from "sonner";

export function ExerciseGrid() {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const filteredExercises = EXERCISES.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle =
      muscleFilter === "all" || ex.muscleGroups.includes(muscleFilter);
    const matchesDifficulty =
      difficultyFilter === "all" || ex.difficulty === difficultyFilter;
    return matchesSearch && matchesMuscle && matchesDifficulty;
  });

  const handleExerciseClick = (ex: Exercise) => {
    setSelectedExercise(ex);
    setDetailOpen(true);
  };

  const handleAssignClick = (ex: Exercise) => {
    setSelectedExercise(ex);
    setDetailOpen(false); // Close detail if open
    setAssignOpen(true);
  };

  const handleAssignmentComplete = () => {
    setAssignOpen(false);
    toast.success("Exercise assigned successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={muscleFilter} onValueChange={setMuscleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Muscle Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Muscles</SelectItem>
            <SelectItem value="Quads">Quads</SelectItem>
            <SelectItem value="Glutes">Glutes</SelectItem>
            <SelectItem value="Hamstrings">Hamstrings</SelectItem>
            <SelectItem value="Chest">Chest</SelectItem>
            <SelectItem value="Back">Back</SelectItem>
            <SelectItem value="Core">Core</SelectItem>
            <SelectItem value="Shoulders">Shoulders</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredExercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No exercises found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search terms.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setMuscleFilter("all");
              setDifficultyFilter("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredExercises.map((ex) => (
            <Card
              key={ex.id}
              className="overflow-hidden cursor-pointer hover:border-primary transition-colors group"
              onClick={() => handleExerciseClick(ex)}
            >
              <div className="aspect-video relative bg-muted">
                {ex.thumbnailUrl && (
                  <img
                    src={ex.thumbnailUrl}
                    alt={ex.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <Badge
                    variant="secondary"
                    className="bg-background/80 backdrop-blur"
                  >
                    {ex.difficulty}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate" title={ex.name}>
                  {ex.name}
                </h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  {ex.muscleGroups.slice(0, 2).map((m) => (
                    <Badge key={m} variant="outline" className="text-xs">
                      {m}
                    </Badge>
                  ))}
                  {ex.muscleGroups.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{ex.muscleGroups.length - 2}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ExerciseDetailModal
        exercise={selectedExercise}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAssign={handleAssignClick}
      />

      <AssignmentModal
        exercise={selectedExercise}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssign={handleAssignmentComplete}
      />
    </div>
  );
}
