'use client';

import { Box, Map } from 'lucide-react';
import { EmptyState } from '@subway-builder-modded/asset-listings-ui';
import {
  SectionHeader,
  getListingColor,
} from '@/features/registry/components/registry-shared';
import type {
  EnrichedTrendingRow,
  TrendingModeKey,
} from './registry-trending-types';
import { RegistryTrendingCard } from './registry-trending-card';

export function RegistryTrendingTypeSection({
  type,
  rows,
  mode,
}: {
  type: 'map' | 'mod';
  rows: EnrichedTrendingRow[];
  mode: TrendingModeKey;
}) {
  const isMod = type === 'mod';
  const icon = isMod ? Box : Map;
  const title = isMod ? 'Mods' : 'Maps';
  const color = getListingColor(type);

  return (
    <section id={`${type}-trending`} className="scroll-mt-24">
      <SectionHeader icon={icon} title={title} accent={color} />

      {rows.length > 0 ? (
        <div className="space-y-5">
          {rows.map((row, index) => (
            <RegistryTrendingCard
              key={`${row.listing_type}:${row.id}`}
              row={row}
              rank={index + 1}
              mode={mode}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={icon}
          title={`No ${title.toLowerCase()} available`}
          description="No results are available for this timeframe."
          className="rounded-xl border border-border bg-card/70 px-5 py-8"
          iconClassName="mb-2 h-6 w-6"
          titleClassName="text-sm font-semibold"
          descriptionClassName="text-sm"
        />
      )}
    </section>
  );
}
