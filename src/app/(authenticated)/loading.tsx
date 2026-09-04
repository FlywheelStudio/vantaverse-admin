import { DashboardLoadingShell } from '@/components/widgets/dashboard/skeleton';

/** Route-level fallback while the dashboard segment resolves (main column only). */
export default function AuthenticatedLoading(): React.ReactElement {
  return <DashboardLoadingShell />;
}
