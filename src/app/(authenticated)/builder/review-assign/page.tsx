import { ReviewAssignUI } from './review-assign-ui';

export default async function ReviewAssignPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<React.ReactElement> {
  const { id } = await searchParams;
  return <ReviewAssignUI assignmentId={id} />;
}
