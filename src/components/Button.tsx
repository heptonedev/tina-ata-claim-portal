import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary"; busy?: boolean };

// Figma Button: Primary(파란 채움) / Secondary(보라 테두리). 비활성·진행 중은 60% 투명도, 진행 중엔 스피너.
export default function Button({ variant = "primary", busy, disabled, className = "", children, ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3 text-xl leading-[1.2] font-bold tracking-[-0.24px] text-white whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60";
  const look =
    variant === "primary"
      ? "bg-primary enabled:hover:bg-primary-hover"
      : "border border-accent bg-accent/12 enabled:hover:bg-accent/22";
  return (
    <button {...rest} disabled={disabled || busy} aria-busy={busy || undefined} className={`${base} ${look} ${className}`}>
      {busy && <img src="/galxe/icon-spinner.svg" alt="" width={20} height={20} className="size-5 animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  );
}
