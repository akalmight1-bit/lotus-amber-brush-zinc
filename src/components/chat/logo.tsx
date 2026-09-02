export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="14.5" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1" />
      <circle cx="16" cy="16" r="9.5" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" />
      <ellipse
        cx="16"
        cy="16"
        rx="14"
        ry="4.2"
        stroke="currentColor"
        strokeWidth="1.4"
        transform="rotate(-18 16 16)"
      />
      <circle cx="16" cy="16" r="3.2" fill="currentColor" />
    </svg>
  );
}
