import { getAuthProfile } from '@/app/(authenticated)/auth/actions';
import { PageWrapper } from '@/components/page-wrapper';

export default async function HomePage() {
  const result = await getAuthProfile();
  const firstName = result.success ? result.data?.first_name : undefined;

  return (
    <PageWrapper
      subheader={
        <h1 className="text-2xl font-medium">
          Welcome back{firstName ? `, ${firstName}` : ''}!
        </h1>
      }
    >
      <div className="text-white">
        <p className="text-base opacity-80">
          Click the Vanta Buddy to open the menu and start today&apos;s journey
        </p>
      </div>
    </PageWrapper>
  );
}
