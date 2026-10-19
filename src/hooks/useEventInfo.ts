import { useEffect, useState } from "react";
import { getEventInfo, type EventInfo } from "@/lib/api";

/** 로그인 전에 보여줄 캠페인 목록과 신청 마감 시각. */
export function useEventInfo(): EventInfo {
  const [info, setInfo] = useState<EventInfo>({ campaigns: [], closesAt: null });
  useEffect(() => {
    getEventInfo().then(setInfo);
  }, []);
  return info;
}
