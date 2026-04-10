import { AlertCircle } from 'lucide-react';

export interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
      <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}
