export interface ResultsSummaryProps {
  totalResults: number;
  query?: string;
  loading?: boolean;
  className?: string;
}

export function ResultsSummary({
  totalResults,
  query,
  loading = false,
  className,
}: ResultsSummaryProps) {
  return (
    <p className={className ?? 'text-sm text-muted-foreground'}>
      {loading ? (
        <span className="inline-block h-4 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <>
          <span className="font-medium text-foreground">{totalResults}</span>{' '}
          result{totalResults !== 1 ? 's' : ''}
          {query && (
            <span className="ml-1">
              for <span className="italic">"{query}"</span>
            </span>
          )}
        </>
      )}
    </p>
  );
}
