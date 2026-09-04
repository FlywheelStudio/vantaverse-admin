import { UserDetailLoadingSkeleton } from './user-detail-loading-skeleton';

/** Route-level fallback while member profile data resolves. */
export default function UserDetailLoading(): React.ReactElement {
  return <UserDetailLoadingSkeleton />;
}
