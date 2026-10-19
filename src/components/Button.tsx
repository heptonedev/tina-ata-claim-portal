import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "quiet"; busy?: boolean };

export default function Button({ variant = "primary", busy, disabled, className = "", children, ...rest }: Props) {
  const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-[0.95rem] font-semibold transition-colors disabled:cursor-not-allowed";
  const look =
    variant === "primary"
      ? "bg-tina text-white hover:bg-[#1a8bff] disabled:bg-contour disabled:text-muted"
      : "border border-contour-strong text-paper hover:border-muted disabled:text-muted";
  return (
    <button {...rest} disabled={disabled || busy} aria-busy={busy || undefined} className={`${base} ${look} ${className}`}>
      {busy && (
        <svg className="h-4 w-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}
