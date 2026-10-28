import { useEffect, useState } from "react";

// setTimeout 이 받을 수 있는 최대 지연(약 24.8일). 더 멀면 나눠서 다시 예약한다.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * 신청 마감 시각이 지났는지. 화면을 켜 둔 채 마감되거나, 다른 탭에 있다가 돌아와도 바로 바뀐다.
 * 타이머가 깨어날 때마다 다시 확인하고 아직 전이면 다시 예약한다(마감까지 오래 남았거나 시계가 바뀐 경우).
 * 기준은 사용자 기기 시계다. 실제 마감은 서버가 막는다.
 */
export function useDeadlinePassed(closesAt: string | null): boolean {
  const deadline = closesAt === null ? Number.NaN : Date.parse(closesAt);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    if (Number.isNaN(deadline)) {
      setPassed(false);
      return;
    }
    let timer: number | undefined;
    const check = () => {
      window.clearTimeout(timer);
      const remaining = deadline - Date.now();
      setPassed(remaining < 0);
      if (remaining >= 0) timer = window.setTimeout(check, Math.min(remaining + 1000, MAX_TIMEOUT_MS));
    };
    check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [deadline]);

  return passed;
}
