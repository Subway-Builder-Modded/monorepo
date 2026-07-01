import {
  constraintLabel,
  describeConstraintRange,
  getFailingConstraints,
  type InstalledConstraint,
} from '@/lib/version-compatibility';

// IncompatibilityTooltipContent explains why an asset is incompatible: an optional
// bold header, then a "Reason" row and requirement line for each failing constraint.
// Omit the header where a nearby "Incompatible" chip already states the status.
export function IncompatibilityTooltipContent({
  title,
  gameVersion,
  constraints,
}: {
  title?: string;
  gameVersion: string;
  constraints: InstalledConstraint[];
}) {
  const failing = getFailingConstraints(gameVersion, constraints);
  // Nothing failing (shouldn't happen when the caller gates on incompatibility) →
  // just the header, or nothing when headerless.
  if (failing.length === 0) return title ?? null;

  return (
    <div className="space-y-1.5">
      {title && <p className="font-semibold text-foreground">{title}</p>}
      {failing.map((c) => (
        <div key={c.type} className="space-y-0.5">
          <p>
            <span className="text-muted-foreground">Reason:</span>{' '}
            {/* capitalize renders the shared "Game version" label as "Game Version" without diverging the string. */}
            <span className="font-medium capitalize text-foreground">
              {constraintLabel(c.type)}
            </span>
          </p>
          <p className="text-muted-foreground">
            Needs {describeConstraintRange(c.range)} (you have {gameVersion})
          </p>
        </div>
      ))}
    </div>
  );
}
