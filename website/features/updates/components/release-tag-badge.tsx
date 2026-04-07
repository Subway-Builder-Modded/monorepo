import { Badge } from '@/components/ui/badge';
import type { UpdateTag } from '@/config/content/updates';
import { UPDATE_TAG_STYLES } from '@/config/ui/site-content';

type ReleaseTagKind = UpdateTag | 'latest';

interface ReleaseTagBadgeProps {
  kind: ReleaseTagKind;
  size?: 'sm' | 'md';
}

export function ReleaseTagBadge({ kind, size = 'md' }: ReleaseTagBadgeProps) {
  const { label, color } = UPDATE_TAG_STYLES[kind];
  const compact = size === 'sm';

  return (
    <Badge
      className="shrink-0 rounded-full border bg-transparent font-medium tracking-normal"
      style={{
        borderColor: color,
        color,
        height: 'auto',
        padding: compact ? '0.125rem 0.625rem' : '0.2rem 0.75rem',
        fontSize: compact ? '0.875rem' : '0.9375rem',
        lineHeight: compact ? '1.25rem' : '1.375rem',
      }}
    >
      {label}
    </Badge>
  );
}
