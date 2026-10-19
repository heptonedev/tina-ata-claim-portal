import type { ReactNode } from "react";

export type StopState = "done" | "current" | "upcoming";

type Props = {
  index: number;
  title: string;
  state: StopState;
  last?: boolean;
  children?: ReactNode;
};

// 신청 경로의 정류장 하나. 왼쪽 레일(핀 + 다음 정류장까지의 선)과 오른쪽 내용으로 이루어진다.
export default function RouteStop({ index, title, state, last, children }: Props) {
  return (
    <li className="grid grid-cols-[2.25rem_1fr] gap-x-5" aria-current={state === "current" ? "step" : undefined}>
      <div className="relative flex flex-col items-center">
        <span
          key={state}
          className={[
            "relative z-10 grid h-9 w-9 place-items-center rounded-full font-display text-sm font-semibold",
            state === "done" && "bg-tina text-white",
            state === "current" && "stop-arrive border-2 border-tina bg-ink text-paper",
            state === "upcoming" && "border border-contour-strong bg-ink text-muted",
          ].filter(Boolean).join(" ")}
        >
          {state === "done" ? (
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            index
          )}
        </span>
        {!last && (
          <span className="relative mt-1 mb-1 w-0.5 flex-1">
            <span className="absolute inset-0 border-l-2 border-dashed border-contour-strong" />
            {state === "done" && <span className="route-fill absolute inset-0 bg-tina" />}
          </span>
        )}
      </div>
      <div className={last ? "pb-1" : "pb-10"}>
        <h2
          className={[
            "font-display text-xl leading-9 font-semibold tracking-tight",
            state === "upcoming" ? "text-muted" : "text-paper",
          ].join(" ")}
        >
          {title}
        </h2>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </li>
  );
}
