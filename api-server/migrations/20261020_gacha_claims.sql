-- 가챠 이벤트 에어드롭 신청을 같은 테이블에서 받는다 (event_name = 'gacha_airdrop')
-- 적용 대상: tina_events.event_claims (dev, prod 각각)
-- - gacha_address: 신청 자격을 확인한 가챠 지갑. 가챠 지갑당 1회 (event_name, gacha_address) UNIQUE
-- - points: 신청 시점에 확인한 포인트 (Galxe 는 두 캠페인 합계, 가챠는 Lucky Points). token_amount = points × 1 TINA
-- 컬럼 추가만 하므로 기존 행과 옛 코드에는 영향이 없다.

USE tina_events;

ALTER TABLE event_claims
  ADD COLUMN gacha_address VARCHAR(64) NULL AFTER galxe_id,
  ADD COLUMN points INT UNSIGNED NULL AFTER gacha_address,
  ADD UNIQUE KEY uq_event_gacha (event_name, gacha_address);
