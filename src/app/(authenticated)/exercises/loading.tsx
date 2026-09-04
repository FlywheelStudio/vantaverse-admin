import { ExercisesLoadingSkeleton } from './exercises-loading-skeleton';

/** Route-level fallback while the exercise library segment resolves. */
export default function ExercisesLoading(): React.ReactElement {
  return <ExercisesLoadingSkeleton />;
}
