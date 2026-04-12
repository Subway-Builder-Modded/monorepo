import type { Metadata } from 'next';
import { THEME_HYDRATION_SCRIPT } from '@subway-builder-modded/lifecycle-web/theme-script';
import '../styles/globals.css';
import { AppLayoutShell } from '@/components/app-shell/root-layout-shell';
import {
  resolveSiteMetadataBase,
  SITE_DESCRIPTION,
  SITE_OG_IMAGE_PATH,
  SITE_NAME,
} from '@/config/site/metadata';

export const metadata: Metadata = {
  metadataBase: resolveSiteMetadataBase(),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    images: [{ url: SITE_OG_IMAGE_PATH }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SITE_OG_IMAGE_PATH],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_HYDRATION_SCRIPT }} />
      </head>
      <body className="antialiased">
        <AppLayoutShell>{children}</AppLayoutShell>
      </body>
    </html>
  );
}
