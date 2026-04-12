import { AppFrame } from '@subway-builder-modded/shared-ui';
import React from 'react';

import { AppFooter } from '@/components/layout/AppFooter';

import { GetCurrentVersion } from '../../../wailsjs/go/main/App';
import { Navbar } from './Navbar';

export function Layout({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = React.useState<string>('');

  React.useEffect(() => {
    GetCurrentVersion().then((response) => {
      if (response.status !== 'success') {
        return;
      }
      const sanitized = [...(response.version || '')]
        .filter((c) => c !== '\u0000')
        .join('');
      setVersion(sanitized);
    });
  }, []);

  return (
    <AppFrame navbar={<Navbar />} footer={<AppFooter version={version} />}>
      {children}
    </AppFrame>
  );
}
