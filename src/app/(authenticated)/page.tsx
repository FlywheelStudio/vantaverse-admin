import { useProfile } from '@/hooks/use-profile';
import { PageWrapper } from '@/components/page-wrapper';

export default function HomePage() {
  const { data: profile } = useProfile();

  const firstName = profile?.first_name || profile?.username;

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
