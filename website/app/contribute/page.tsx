import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { SubscriptionTierCard } from '@/features/contribute/subscription-tier-card';
import {
  CONTRIBUTE_PAGE_CONTENT,
  SUBSCRIPTION_TIERS,
} from '@/config/ui/contribute';
import { buildEmbedMetadata } from '@/config/site/metadata';

export const metadata: Metadata = buildEmbedMetadata({
  title: 'Contribute',
  description:
    'Help us build the future of Subway Builder. Your support keeps development active and opens exclusive features for our community.',
});

const KOFI_URL = 'https://ko-fi.com/subwaybuildermodded';

export default function ContributePage() {
  return (
    <main className="relative min-h-screen text-foreground">
      <section className="relative px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
        <div className="mx-auto w-full max-w-screen-xl">
          <PageHeader
            icon={CONTRIBUTE_PAGE_CONTENT.icon}
            title={CONTRIBUTE_PAGE_CONTENT.title}
            description={CONTRIBUTE_PAGE_CONTENT.description}
          />

          <div className="mx-auto flex max-w-5xl flex-col gap-12">
            {/* Introduction Text */}
            <div className="rounded-lg border border-border/50 bg-card/50 p-6 text-center sm:p-8">
              <p className="text-base leading-relaxed text-foreground/90">
                Subway Builder Modded is a passion project that continues to
                evolve thanks to our community. By becoming a supporter,
                you&apos;ll not only help fund ongoing development, but
                you&apos;ll also gain earlier access to cutting-edge features,
                help shape a thriving community, and have your voice heard in
                shaping the future of the platform.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                All tiers are fully optional—our services will always be free to
                use. Your support simply helps us prioritize development and
                fund server costs.
              </p>
            </div>

            {/* Subscription Tiers */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SUBSCRIPTION_TIERS.map((tier) => (
                <SubscriptionTierCard key={tier.id} tier={tier} />
              ))}
            </div>

            {/* CTA Section */}
            <div className="flex flex-col items-center justify-center gap-4 border-t border-border/50 pt-12">
              <div className="text-center">
                <h2 className="text-lg font-semibold">Ready to support us?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Visit our Ko-fi page to choose your tier and get started
                </p>
              </div>
              <Link
                href={KOFI_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Support on Ko-fi
                <ExternalLink className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
