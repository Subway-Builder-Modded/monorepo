import type { Metadata } from 'next';
import Link from 'next/link';
import { TrainFront } from 'lucide-react';

import { LineBullet } from '@/components/ui/line-bullet';
import { buildNoEmbedMetadata } from '@/config/site/metadata';

const LINES = [
  { id: '4', color: '#419245' },
  { id: '0', color: '#818284' },
  { id: '4', color: '#B3488F' },
] as const;

export const metadata: Metadata = buildNoEmbedMetadata({
  title: '404 | Subway Builder Modded',
  description: 'The requested page could not be found.',
});

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden bg-background px-6 py-12 text-foreground sm:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <TrainFront
          aria-hidden="true"
          strokeWidth={1.5}
          className="h-auto w-[min(88vw,52rem)] text-muted-foreground"
        />
      </div>

      <section className="relative w-full max-w-3xl rounded-3xl border border-border/45 bg-card/80 p-7 text-center dark:bg-card/80 sm:p-10">
        <div className="mx-auto flex w-fit items-center gap-2 sm:gap-3">
          {LINES.map((line, index) => (
            <LineBullet
              key={`${line.id}-${index}`}
              theme="default"
              text={line.id}
              colorRole="accentColor"
              textRole="textColorInverted"
              colorOverride={{ light: line.color, dark: line.color }}
              hoverColorOverride={{ light: line.color, dark: line.color }}
              invertOnHover
              shape="circle"
              size="sm"
              className="drop-shadow-sm"
            />
          ))}
        </div>

        <h1 className="mt-5 text-[clamp(1.85rem,5.1vw,3rem)] font-black tracking-tight">
          We can&apos;t find this station.
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          The page you requested was moved, is currently out of service, or
          never arrived at this railyard. Head back home and we&apos;ll get you
          back on track.
        </p>

        <div className="mt-7">
          <Link
            href="/"
            data-color-scheme="default"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Return Home
          </Link>
        </div>
      </section>
    </main>
  );
}
