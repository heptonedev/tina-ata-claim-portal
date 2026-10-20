-- 신청 시 접속 IP·User-Agent 기록 (지급 전 다계정(시빌) 분석용)
-- 적용 대상: tina_events.event_claims (dev, prod 각각). 새 서버 코드가 이 컬럼에 값을 넣으므로 배포 전에 적용한다.

USE tina_events;

ALTER TABLE event_claims
  ADD COLUMN client_ip VARCHAR(45) NULL AFTER tx_signature,
  ADD COLUMN user_agent VARCHAR(255) NULL AFTER client_ip,
  ADD INDEX idx_client_ip (client_ip);
