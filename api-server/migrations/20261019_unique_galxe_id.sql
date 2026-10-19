-- Galxe 계정당 1회 신청 제한 (event_name, galxe_id) UNIQUE
-- 적용 대상: tina_events.event_claims (dev, prod 각각)
-- galxe_id 가 NULL 인 예전 신청 건은 UNIQUE 제약에 걸리지 않는다 (MySQL은 NULL 끼리 중복으로 보지 않음).

USE tina_events;

-- 1) 적용 전 확인: 결과가 있으면 같은 Galxe 계정의 중복 신청이 이미 있다는 뜻이다.
--    이 경우 인덱스 생성이 실패하므로, 어느 건을 남길지 먼저 정리해야 한다.
SELECT event_name, galxe_id, COUNT(*) AS cnt, GROUP_CONCAT(id ORDER BY id) AS claim_ids
FROM event_claims
WHERE galxe_id IS NOT NULL
GROUP BY event_name, galxe_id
HAVING cnt > 1;

-- 2) 적용
ALTER TABLE event_claims
  DROP INDEX idx_galxe_id,
  ADD UNIQUE KEY uq_event_galxe (event_name, galxe_id);
