import Image from 'next/image';
import { Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SubscriptionTier } from '@/config/ui/contribute';

interface SubscriptionTierCardProps {
  tier: SubscriptionTier;
}

export function SubscriptionTierCard({ tier }: SubscriptionTierCardProps) {
  return (
    <Card
      className={cn(
        'relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg',
        tier.highlighted && 'ring-2 ring-primary/50 sm:scale-105',
      )}
    >
      {tier.highlighted && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
      )}

      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {tier.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {tier.description}
            </CardDescription>
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-bold">${tier.price}</span>
          <span className="text-sm text-muted-foreground">{tier.period}</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        {/* Image */}
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border/50 bg-muted/30">
          <Image
            src={`/contribute/${tier.id}.png`}
            alt={`${tier.name} tier`}
            fill
            className="object-cover"
          />
        </div>

        {/* Main Features */}
        <div className="space-y-3 flex-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Included
          </h4>
          <ul className="space-y-2">
            {tier.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-500 flex-shrink-0" />
                <span className="leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
