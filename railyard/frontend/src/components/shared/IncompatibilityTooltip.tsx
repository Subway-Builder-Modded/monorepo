import {
  constraintLabel,
  describeConstraintRange,
  getFailingConstraints,
  type InstalledConstraint,
} from '@/lib/version-compatibility';

// DisabledReason is one titled reason with an optional detail line.
export type DisabledReason = {
  reason: string;
  detail?: string;
};

// titleCase renders shared lowercase labels (e.g. "game version") in the tooltip's
// reason style without diverging the underlying strings.
function titleCase(label: string) {
  return label.replace(/\b\w/g, (c) => c.toUpperCase());
}

// DisabledReasonTooltipContent is the shared "why is this control unavailable" format:
// an optional bold header, then a "Reason" row and detail line for each reason.
export function DisabledReasonTooltipContent({
  title,
  reasons,
}: {
  title?: string;
  reasons: DisabledReason[];
}) {
  // No reasons (shouldn't happen when the caller gates on one) → just the header,
  // or nothing when headerless.
  if (reasons.length === 0) return title ?? null;

  return (
    <div className="space-y-1.5">
      {title && <p className="font-semibold text-foreground">{title}</p>}
      {reasons.map((r) => (
        <div key={r.reason} className="space-y-0.5">
          <p>
            <span className="text-muted-foreground">Reason:</span>{' '}
            <span className="font-medium text-foreground">{r.reason}</span>
          </p>
          {r.detail && <p className="text-muted-foreground">{r.detail}</p>}
        </div>
      ))}
    </div>
  );
}

// gameRunningReason is the shared game-session lock reason row.
export function gameRunningReason(detail?: string): DisabledReason {
  return { reason: 'Game Running', detail };
}

// IncompatibilityTooltipContent explains why an asset action is unavailable: an optional
// game-session lock reason, then one reason per failing version constraint.
// Omit the header where a nearby "Incompatible" chip already states the status.
export function IncompatibilityTooltipContent({
  title,
  gameVersion,
  constraints,
  lockedReason,
}: {
  title?: string;
  gameVersion: string;
  constraints: InstalledConstraint[];
  // When set, the action is blocked by the running game session; shown as its own reason.
  lockedReason?: string;
}) {
  const reasons: DisabledReason[] = [];
  if (lockedReason) {
    reasons.push(gameRunningReason(lockedReason));
  }
  for (const c of getFailingConstraints(gameVersion, constraints)) {
    reasons.push({
      reason: titleCase(constraintLabel(c.type)),
      detail: `Needs ${describeConstraintRange(c.range)} (you have ${gameVersion})`,
    });
  }
  return <DisabledReasonTooltipContent title={title} reasons={reasons} />;
}
