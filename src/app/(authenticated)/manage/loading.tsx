import { ManageLoadingSkeleton } from './manage-loading-skeleton';

/** Route-level fallback while the manage admins segment resolves. */
export default function ManageLoading(): React.ReactElement {
  return <ManageLoadingSkeleton />;
}
