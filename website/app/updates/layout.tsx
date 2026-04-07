import type { ReactNode } from 'react';

export default function UpdatesLayout({ children }: { children: ReactNode }) {
  return <section className="w-full px-4 pb-12 md:px-6">{children}</section>;
}
