import Image from 'next/image';
import { NotificationsButton } from '@/components/header/notifications-button';
import { UserAvatar } from '@/components/header/user-avatar';

export default function Header() {
  return (
    <header className="sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/medvanta-text.png"
              alt="Medvanta"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationsButton />
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
