import { AdminProfileLoadingSkeleton } from './admin-profile-loading-skeleton';

/** Route-level fallback while admin profile data resolves. */
export default function AdminProfileLoading(): React.ReactElement {
  return <AdminProfileLoadingSkeleton />;
}
