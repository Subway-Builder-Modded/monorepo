import type { Metadata } from 'next';
import { Globe } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { buildEmbedMetadata } from '@/config/site/metadata';
import { WorldMap } from '@/features/railyard/components/world-map';

export const metadata: Metadata = buildEmbedMetadata({
  title: 'World Map | Registry',
  description:
    'Explore a map of all of the user-submitted maps available in Registry.',
});

export default function RegistryWorldMapPage() {
  return (
    <section className="registry-accent px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8 lg:pb-12 lg:pt-10">
      <div className="w-full">
        <PageHeader
          icon={Globe}
          title="World Map"
          description="Explore a map of all of the user-submitted maps available in Registry."
        />

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/55 p-1.5 shadow-sm sm:p-2 lg:p-3">
          <div className="h-[min(78svh,calc(100svh-12.5rem))] min-h-[20rem] w-full overflow-hidden rounded-xl sm:min-h-[24rem]">
            <WorldMap />
          </div>
        </div>
      </div>
    </section>
  );
}
