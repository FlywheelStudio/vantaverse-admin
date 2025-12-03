"use client";

import * as React from "react";
import { PATIENTS, Patient } from "@/lib/mock-data";
import { createColumns } from "@/components/patients/columns";
import { DataTable } from "@/components/patients/patient-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { PatientConversationSheet } from "@/components/patients/patient-conversation-sheet";

export default function PatientsPage() {
    const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
    const [isConversationOpen, setIsConversationOpen] = React.useState(false);
    
    const totalPatients = PATIENTS.length;
    const avgCompliance = Math.round(
      PATIENTS.reduce((acc, p) => acc + p.compliancePercent, 0) / totalPatients
    );
    const needsAttention = PATIENTS.filter((p) => p.status === "needs-attention").length;
    const workoutsThisWeek = 42;

    const handleMessageClick = (patient: Patient) => {
      setSelectedPatient(patient);
      setIsConversationOpen(true);
    };

    const columns = React.useMemo(() => createColumns(handleMessageClick), []);

  return (
    <>
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Active Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Compliance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompliance}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Needs Attention
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{needsAttention}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Workouts This Week
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workoutsThisWeek}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable columns={columns} data={PATIENTS} />
    </div>
    <PatientConversationSheet
      open={isConversationOpen}
      onOpenChange={setIsConversationOpen}
      patient={selectedPatient}
    />
    </>
  );
}
