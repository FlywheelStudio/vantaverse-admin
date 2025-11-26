"use client";

import { Exercise } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (exercise: Exercise) => void;
}

export function ExerciseDetailModal({
  exercise,
  open,
  onOpenChange,
  onAssign,
}: ExerciseDetailModalProps) {
  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl">{exercise.name}</DialogTitle>
              <DialogDescription>
                {exercise.category} • {exercise.difficulty}
              </DialogDescription>
            </DialogHeader>

            {/* Video Player */}
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              {exercise.thumbnailUrl && (
                <video
                  src={exercise.thumbnailUrl}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                />
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {exercise.muscleGroups.map((muscle) => (
                  <Badge key={muscle} variant="secondary">
                    {muscle}
                  </Badge>
                ))}
                {exercise.equipment.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  {exercise.instructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Common Modifications</h3>
                <p className="text-muted-foreground">
                  If this exercise causes discomfort, try reducing the range of
                  motion or using a lighter weight. Ensure proper form is
                  maintained throughout the movement.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onAssign(exercise)}>Assign to Patient</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
