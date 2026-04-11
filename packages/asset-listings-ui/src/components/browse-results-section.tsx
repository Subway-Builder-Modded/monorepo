import { SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

import { CardSkeletonGrid } from './card-skeleton-grid';
import { EmptyState } from './empty-state';
import { ResponsiveCardGrid } from './responsive-card-grid';

export interface BrowseResultsSectionProps<TItem> {
  loading: boolean;
  items: TItem[];
  query?: string;
  viewMode: 'list' | 'compact' | 'full';
  skeletonCount: number;
  gridPreset?: 'default' | 'compact';
  renderItem: (item: TItem) => ReactNode;
  pagination?: ReactNode;
}

export function BrowseResultsSection<TItem>({
  loading,
  items,
  query,
  viewMode,
  skeletonCount,
  gridPreset = viewMode === 'compact' ? 'compact' : 'default',
  renderItem,
  pagination,
}: BrowseResultsSectionProps<TItem>) {
  if (loading) {
    return <CardSkeletonGrid count={skeletonCount} preset={gridPreset} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No results found"
        description={
          query ? `No items match "${query}"` : 'No items match the current filters'
        }
      />
    );
  }

  return (
    <>
      {viewMode === 'list' ? (
        <div className="space-y-4">{items.map((item) => renderItem(item))}</div>
      ) : (
        <ResponsiveCardGrid preset={gridPreset}>
          {items.map((item) => renderItem(item))}
        </ResponsiveCardGrid>
      )}
      {pagination}
    </>
  );
}
