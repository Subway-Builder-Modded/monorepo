'use client';

import type { CSSProperties } from 'react';
import { Download, Package, Users } from 'lucide-react';
import {
  Stat,
  StatDescription,
  StatIndicator,
  StatLabel,
  StatValue,
} from '@/components/ui/stat';
import type { RegistryAnalyticsData } from '@/types/registry-analytics';

const ICON_STYLE: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
  backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
  color: 'var(--primary)',
};

export function RegistrySummaryStats({
  data,
}: {
  data: RegistryAnalyticsData;
}) {
  return (
    <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Stat>
        <StatIndicator variant="icon" style={ICON_STYLE}>
          <Download />
        </StatIndicator>
        <StatLabel>Total Downloads</StatLabel>
        <StatValue>{data.totalDownloads.toLocaleString()}</StatValue>
        <StatDescription>across all registry listings</StatDescription>
      </Stat>

      <Stat>
        <StatIndicator variant="icon" style={ICON_STYLE}>
          <Package />
        </StatIndicator>
        <StatLabel>Listings</StatLabel>
        <StatValue>{data.totalListings}</StatValue>
        <StatDescription>
          {data.mapCount} maps · {data.modCount} mods
        </StatDescription>
      </Stat>

      <Stat>
        <StatIndicator variant="icon" style={ICON_STYLE}>
          <Users />
        </StatIndicator>
        <StatLabel>Authors</StatLabel>
        <StatValue>{data.totalAuthors}</StatValue>
        <StatDescription>content authors</StatDescription>
      </Stat>
    </div>
  );
}
