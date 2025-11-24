"use client";

import { Patient } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ExternalLink } from "lucide-react";

interface PatientHeaderProps {
  patient: Patient;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const complianceColor =
    patient.compliancePercent >= 80
      ? "text-green-500"
      : patient.compliancePercent >= 60
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={patient.avatarUrl} />
            <AvatarFallback className="text-xl">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground">{patient.email}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Message</Button>
          <Button>
            View in Bridge Athletics <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Current Program
            </div>
            <div className="text-xl font-bold mb-2">
              {patient.program?.name || "No Active Program"}
            </div>
            {patient.program && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Week {patient.program.currentWeek}</span>
                  <span>{patient.program.totalWeeks} Weeks</span>
                </div>
                <Progress
                  value={
                    (patient.program.currentWeek / patient.program.totalWeeks) *
                    100
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Compliance Score
            </div>
            <div className={`text-4xl font-bold ${complianceColor}`}>
              {patient.compliancePercent}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on assigned workouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Workouts Status
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-bold">
                  {patient.workoutsCompleted}
                  <span className="text-muted-foreground text-base font-normal">
                    /{patient.workoutsAssigned}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
