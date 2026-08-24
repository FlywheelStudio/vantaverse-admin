import { getUsersWithStats } from '../users/actions';
import { getConsultationSettings } from './actions';
import { ManagePageUI } from './ui';

export default async function ManagePage(): Promise<React.ReactElement> {
  const [result, settings] = await Promise.all([
    getUsersWithStats({ role: 'admin' }),
    getConsultationSettings(),
  ]);
  const initialAdmins = result.success ? result.data : [];

  return (
    <ManagePageUI
      initialAdmins={initialAdmins}
      initialConsultationUrl={settings.success ? settings.data : null}
    />
  );
}
