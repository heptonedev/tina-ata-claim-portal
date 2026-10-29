import type { ReactNode } from "react";

export type StepState = "done" | "current" | "upcoming";

type Props = {
  index: number;
  title: string;
  state: StepState;
  children?: ReactNode;
};

// 신청 단계 카드 하나 (Figma Step Card: Todo / Active / Done). 진행 중인 단계만 보라 테두리로 띄운다.
export default function StepCard({ index, title, state, children }: Props) {
  const card =
    state === "current"
      ? "gap-5 border-[1.5px] border-accent bg-step-active"
      : state === "done"
        ? "gap-3 bg-step"
        : "bg-step";
  return (
    <li
      className={`flex flex-col rounded-3xl p-7 max-sm:p-6 ${card}`}
      aria-current={state === "current" ? "step" : undefined}
    >
      <div className="flex items-center gap-4">
        <span
          className={[
            "grid size-10 shrink-0 place-items-center rounded-full text-base leading-none font-semibold",
            state === "done" && "bg-done",
            state === "current" && "border-2 border-accent text-white",
            state === "upcoming" && "border border-white/20 text-white/50",
          ].filter(Boolean).join(" ")}
        >
          {state === "done" ? <img src="/galxe/icon-check.svg" alt="" width={20} height={20} className="size-5" /> : index}
          {state === "done" && <span className="sr-only">Step {index} done</span>}
        </span>
        <h3
          className={`flex-1 text-xl leading-[1.375] font-bold tracking-[-0.24px] max-sm:text-lg ${state === "upcoming" ? "text-white/50" : "text-white"}`}
        >
          {title}
        </h3>
      </div>
      {state !== "upcoming" && children && (
        <div className="flex flex-col items-start gap-3 pl-14 max-sm:pl-0">{children}</div>
      )}
    </li>
  );
}

/** 단계 설명 문단. 진행 중 단계는 본문색, 끝난 단계는 조금 더 밝은 요약색을 쓴다. */
export function StepText({ done, children }: { done?: boolean; children: ReactNode }) {
  return (
    <p className={`w-full text-base leading-[1.625] tracking-[0.09px] max-sm:text-[15px] max-sm:tracking-[0.144px] ${done ? "text-white/75" : "text-white/70"}`}>{children}</p>
  );
}

/** 단계 안 버튼 줄. 위로 12px 더 띄운다 (Figma CTA 영역). */
export function StepActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3 pt-3">{children}</div>;
}
