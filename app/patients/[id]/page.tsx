import { PATIENTS, MOCK_WORKOUT_WEEKS } from "@/lib/mock-data";
import { PatientHeader } from "@/components/patients/patient-header";
import { ProgramProgress } from "@/components/patients/program-progress";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return PATIENTS.map((patient) => ({
    id: patient.id,
  }));
}

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = PATIENTS.find((p) => p.id === id);

  if (!patient) {
    return notFound();
  }

  return (
    <div className="flex-1 space-y-8">
      <PatientHeader patient={patient} />
      <ProgramProgress weeks={MOCK_WORKOUT_WEEKS} />
    </div>
  );
}
