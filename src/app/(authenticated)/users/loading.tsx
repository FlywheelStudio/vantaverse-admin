import { UsersLoadingSkeleton } from './users-loading-skeleton';

/** Route-level fallback while the members list segment resolves. */
export default function UsersLoading(): React.ReactElement {
  return <UsersLoadingSkeleton />;
}
