import type { ReactNode } from "react";

// 단계 안에 붙는 안내·오류 문구. 오류는 스크린리더가 바로 읽도록 alert 로 둔다.
export default function Note({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const color =
    tone === "error" ? "border-stop text-[#ffb3be]" : tone === "success" ? "border-accent text-accent-soft" : "border-white/20 text-white/80";
  return (
    <p role={tone === "error" ? "alert" : undefined} className={`w-full border-l pl-3 text-sm leading-[1.6] tracking-[0.2px] ${color}`}>
      {children}
    </p>
  );
}
