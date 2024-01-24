import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import React from 'react';
import { HomeIcon } from '@/components/icons/home';
import { Twitter } from '@/components/icons/twitter';
import { Discord } from '@/components/icons/discord';
import { FaXTwitter} from 'react-icons/fa6';
import { FaDiscord } from 'react-icons/fa6';
import { GoGlobe } from 'react-icons/go';

require('@demox-labs/aleo-wallet-adapter-reactui/dist/styles.css');

export function Footer() {
  const isMounted = useIsMounted();

  return (
    <div className="flex h-full items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10 3xl:p-12">
        {process.env.URL && <a className="mx-2 rounded-full bg-black p-2 border border-white" href={`${process.env.URL}`}>
          <GoGlobe width="18" height="18" />
        </a>
        }
        {process.env.TWITTER && <a className="mx-2 rounded-full bg-black p-2 border border-white" href={`${process.env.TWITTER}`}>
          <FaXTwitter width="18" height="18" />
        </a>
        }
        {process.env.DISCORD && <a className="mx-2 rounded-full bg-black p-2 border border-white" href={`${process.env.DISCORD}`}>
          <FaDiscord width="18" height="18" />
        </a>
        }
      </div>
  );
}

interface LayoutProps {}

export default function Layout({
  children,
}: React.PropsWithChildren<LayoutProps>) {
  return (
    <div className="bg-image bg-light-100 bg-black bg-no-repeat bg-cover flex min-h-screen flex-col">
      <main className="flex flex-grow flex-col sm:pt-2">
        {children}
      </main>
      <Footer />
    </div>
  );
}
