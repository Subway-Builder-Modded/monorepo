'use client';

import { Box, Map } from 'lucide-react';
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
        <div className="rounded-xl border border-border bg-card/70 px-5 py-8 text-sm text-muted-foreground">
          No {title.toLowerCase()} available for this timeframe.
        </div>
      )}
    </section>
  );
}
