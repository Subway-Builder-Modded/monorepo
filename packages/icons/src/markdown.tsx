/**
 * Markdown brand icon — uses currentColor so it adapts to the surrounding text
 * color. Derived from the Markdown mark specification (daringfireball.net).
 */
export function MarkdownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 3750 3750"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={{ fillRule: "evenodd", clipRule: "evenodd" }}
    >
      <rect
        x="156.25"
        y="850.694"
        width="3437.5"
        height="2048.611"
        fill="none"
        stroke="currentColor"
        strokeWidth="173.61"
      />
      <path
        d="M590.278,2465.278l0,-1180.556l347.222,0l347.222,434.028l347.222,-434.028l347.222,0l0,1180.556l-347.222,0l0,-677.083l-347.222,434.028l-347.222,-434.028l0,677.083l-347.222,0Zm2170.139,0l-520.833,-572.917l347.222,0l0,-607.639l347.222,0l0,607.639l347.222,0l-520.833,572.917Z"
        style={{ fillRule: "nonzero" }}
      />
    </svg>
  );
}
