import { AuthProvider } from '@context/AuthContext';
import { UIScaleProvider } from '@context/UIScaleContext';
import AccountMenu from '@components/auth/AccountMenu';
import '@styles/globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const RootLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            <filter id="hand-drawn" x="-200%" y="-10%" width="500%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.065" numOctaves="2" result="noise">
                <animate
                  attributeName="seed"
                  values="3;9;6;2;11;3"
                  dur="18s"
                  calcMode="discrete"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>

            <filter id="hand-drawn-bg" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.18" numOctaves="4" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <UIScaleProvider>
            <AuthProvider>
              <AccountMenu />
              <main>{children}</main>
            </AuthProvider>
          </UIScaleProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
