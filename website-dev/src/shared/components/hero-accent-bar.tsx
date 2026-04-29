import type { CSSProperties } from "react";

type AccentSegment = {
  light: string;
  dark: string;
};

type HeroAccentBarProps = {
  segments: AccentSegment[];
  height?: string;
  className?: string;
};

/**
 * A full-width horizontal color bar for placement at the bottom of a hero section.
 * Divides available width equally among segments, each with independent light/dark colors.
 */
export function HeroAccentBar({ segments, height = "h-1", className }: HeroAccentBarProps) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 flex ${height}${className ? ` ${className}` : ""}`}
      aria-hidden={true}
    >
      {segments.map((seg, i) => (
        <div
          key={i}
          className="flex-1"
          style={
            {
              "--bar-light": seg.light,
              "--bar-dark": seg.dark,
            } as CSSProperties
          }
        >
          <div
            className="hidden size-full dark:block"
            style={{ backgroundColor: "var(--bar-dark)" }}
          />
          <div
            className="size-full dark:hidden"
            style={{ backgroundColor: "var(--bar-light)" }}
          />
        </div>
      ))}
    </div>
  );
}
