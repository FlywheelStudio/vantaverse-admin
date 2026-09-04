import { getOrganizationById, getCurrentPhysiologist } from '../actions';
import {
  getConsultationSettings,
  getOrganizationAdmins,
  getOrganizationMembersWithPrograms,
  getOrganizationPrograms,
} from './actions';
import { GroupDetailsPageUI } from './ui';
import { notFound } from 'next/navigation';

export default async function GroupDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const organization = await getOrganizationById(id);

  if (!organization.success) {
    notFound();
  }

  const isSuperAdminOrg = organization.data.is_super_admin === true;
  if (isSuperAdminOrg) {
    notFound();
  }

  const [
    physicianResult,
    membersResult,
    adminsResult,
    programsResult,
    consultationResult,
  ] = await Promise.all([
    getCurrentPhysiologist(id),
    getOrganizationMembersWithPrograms(id),
    getOrganizationAdmins(id),
    getOrganizationPrograms(id),
    getConsultationSettings(),
  ]);

  const physician = physicianResult.success ? physicianResult.data : null;
  const members = membersResult.success ? membersResult.data : [];
  const admins = adminsResult.success ? adminsResult.data : [];
  const programs = programsResult.success ? programsResult.data : [];
  const consultation = consultationResult.success ? consultationResult.data : null;

  return (
    <GroupDetailsPageUI
      organization={organization.data}
      physician={physician}
      initialMembers={members}
      initialAdmins={admins}
      initialPrograms={programs}
      consultation={consultation}
    />
  );
}
