"use client";

import { WeeklyProgram, Workout } from "@/lib/mock-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle, Circle, XCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ProgramProgressProps {
  weeks: WeeklyProgram[];
}

export function ProgramProgress({ weeks }: ProgramProgressProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Program Progress</h3>
      <Accordion type="single" collapsible className="w-full space-y-4">
        {weeks.map((week) => (
          <AccordionItem
            key={week.weekNumber}
            value={`week-${week.weekNumber}`}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-lg">
                    Week {week.weekNumber}
                  </span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {format(week.startDate, "MMM d")} -{" "}
                    {format(week.endDate, "MMM d")}
                  </span>
                </div>
                <div className="flex gap-2">
                  {/* Mini status indicators for the week */}
                  {week.workouts.map((w) => (
                    <div
                      key={w.id}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        w.status === "completed"
                          ? "bg-green-500"
                          : w.status === "skipped"
                          ? "bg-red-500"
                          : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-4 space-y-4">
              {week.workouts.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden border-l-4 border-l-transparent hover:border-l-primary transition-all">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {workout.status === "completed" ? (
              <CheckCircle className="text-green-500 h-5 w-5" />
            ) : workout.status === "skipped" ? (
              <XCircle className="text-red-500 h-5 w-5" />
            ) : (
              <Circle className="text-gray-300 h-5 w-5" />
            )}
            <div>
              <h4 className="font-medium">{workout.name}</h4>
              <p className="text-xs text-muted-foreground">
                {format(workout.scheduledDate, "EEEE, MMM d")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {workout.status}
            </Badge>
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                expanded && "rotate-90"
              )}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="bg-muted/30 p-4 border-t space-y-4">
          {workout.blocks.map((block) => (
            <div key={block.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-primary">
                  {block.name}
                </h5>
                <Badge variant="secondary" className="text-xs">
                  {block.type}
                </Badge>
              </div>
              <div className="grid gap-2">
                {block.exercises.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm bg-background p-2 rounded border"
                  >
                    <span className="font-medium">
                      Exercise {i + 1} {/* In real app, fetch name by ID */}
                    </span>
                    <div className="text-muted-foreground text-xs flex gap-3">
                      {ex.sets && <span>{ex.sets} sets</span>}
                      {ex.reps && <span>{ex.reps} reps</span>}
                      {ex.time && <span>{ex.time}</span>}
                      {ex.rest && <span>{ex.rest} rest</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
