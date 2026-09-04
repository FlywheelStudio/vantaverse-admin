import { AuthenticatedMainFallback } from './authenticated-main-fallback';

/** Route-level fallback while authenticated segment data resolves (main column only). */
export default function AuthenticatedLoading(): React.ReactElement {
  return <AuthenticatedMainFallback />;
}
