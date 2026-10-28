import { useEffect, useState } from "react";

// setTimeout 이 받을 수 있는 최대 지연(약 24.8일). 이보다 멀면 화면 복귀 때 다시 확인한다.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/** 신청 마감 시각이 지났는지. 화면을 켜 둔 채 마감되거나, 다른 탭에 있다가 돌아와도 바로 바뀐다. */
export function useDeadlinePassed(closesAt: string | null): boolean {
  const deadline = closesAt === null ? Number.NaN : Date.parse(closesAt);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    if (Number.isNaN(deadline)) {
      setPassed(false);
      return;
    }
    const update = () => setPassed(Date.now() > deadline);
    update();
    const remaining = deadline - Date.now();
    const timer = remaining > 0 && remaining < MAX_TIMEOUT_MS ? window.setTimeout(update, remaining + 1000) : undefined;
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, [deadline]);

  return passed;
}
