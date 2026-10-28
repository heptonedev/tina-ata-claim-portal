-- 에어드롭 지급 전 다계정(시빌) 분석 쿼리
-- 대상: tina_events.event_claims (갤럭시 galxe_airdrop, 가챠 gacha_airdrop)
-- 모두 조회만 한다. 운영 DB는 세션을 READ ONLY 로 두고 실행한다.
--
-- 쓰는 신호
--   - 같은 접속 IP / 같은 IP + 같은 브라우저(user_agent)
--   - 같은 대역 (IPv4 /24, IPv6 /64)
--   - 같은 대역에서 짧은 간격(10분 이내)으로 이어진 신청
--   - 자동화 도구로 보이는 user_agent
-- 주의
--   - 휴대폰 통신사(CGNAT)·회사·VPN 은 여러 사람이 같은 IP 를 쓴다. IP 하나만으로 부정이라고 판단하지 않는다.
--     점수가 높은 신청을 사람이 보고 판단하는 용도다.
--   - 같은 사람이 갤럭시와 가챠에 한 번씩 신청한 것은 정상이다. 그래서 묶음은 이벤트별로 나눈다.
--   - client_ip·user_agent 는 2026-10-20 컬럼 추가 이후 신청부터 있다. 그 전 신청은 비어 있다.
--   - IP 는 Cloud Run 이 붙인 접속 IP(trust proxy 1)다.
--
-- 같이 볼 것: Galxe 조회별 포인트 불일치 로그 (Cloud Run 로그)
--   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="tina-galxe-api-prod" AND textPayload:"galxe points mismatch"' \
--     --project=sound-jigsaw-459108-s9 --freshness=60d --limit=500 --format='value(timestamp,textPayload)'


-- 0) 전체 현황: 이벤트·상태별 건수, 포인트, IP 기록 여부
SELECT event_name, status,
       COUNT(*) AS claims,
       COALESCE(SUM(points), 0) AS points,
       COUNT(DISTINCT client_ip) AS distinct_ips,
       SUM(client_ip IS NULL) AS no_ip,
       MIN(requested_at) AS first_at,
       MAX(requested_at) AS last_at
FROM event_claims
GROUP BY event_name, status
ORDER BY event_name, status;


-- 1) 데이터 이상: 서버 규칙과 맞지 않는 행 (0건이어야 한다)
SELECT id, event_name, wallet_address, galxe_id, gacha_address, points, token_amount,
       CONCAT_WS(', ',
         IF(event_name = 'gacha_airdrop' AND (gacha_address IS NULL OR gacha_address <> wallet_address), '가챠 지갑과 받는 지갑 다름', NULL),
         IF(event_name = 'galxe_airdrop' AND galxe_id IS NULL, 'galxe_id 없음', NULL),
         IF(points IS NULL OR points = 0, '포인트 없음', NULL),
         IF(points IS NOT NULL AND token_amount <> points, 'token_amount ≠ points', NULL),
         IF(event_name NOT IN ('galxe_airdrop', 'gacha_airdrop'), '알 수 없는 이벤트', NULL)
       ) AS issue
FROM event_claims
HAVING issue <> ''
ORDER BY id;


-- 2) 같은 IP 에서 같은 이벤트에 여러 번 신청
SELECT event_name,
       REPLACE(client_ip, '::ffff:', '') AS ip,
       COUNT(*) AS claims,
       SUM(points) AS points,
       COUNT(DISTINCT user_agent) AS distinct_uas,
       MIN(requested_at) AS first_at,
       MAX(requested_at) AS last_at,
       GROUP_CONCAT(id ORDER BY requested_at) AS claim_ids
FROM event_claims
WHERE client_ip IS NOT NULL
GROUP BY event_name, ip
HAVING claims >= 2
ORDER BY claims DESC, points DESC;


-- 3) 같은 IP + 같은 user_agent 로 같은 이벤트에 여러 번 신청 (2번보다 강한 신호)
SELECT event_name,
       REPLACE(client_ip, '::ffff:', '') AS ip,
       user_agent,
       COUNT(*) AS claims,
       SUM(points) AS points,
       GROUP_CONCAT(id ORDER BY requested_at) AS claim_ids
FROM event_claims
WHERE client_ip IS NOT NULL
GROUP BY event_name, ip, user_agent
HAVING claims >= 2
ORDER BY claims DESC, points DESC;


-- 4) 같은 대역(IPv4 /24, IPv6 /64)에서 같은 이벤트에 3번 이상 신청
WITH b AS (
  SELECT id, event_name, points, requested_at, ip,
         CASE WHEN LENGTH(INET6_ATON(ip)) = 4 THEN CONCAT(SUBSTRING_INDEX(ip, '.', 3), '.0/24')
              ELSE CONCAT(LOWER(HEX(SUBSTR(INET6_ATON(ip), 1, 8))), '/64') END AS subnet
  FROM (SELECT id, event_name, points, requested_at, REPLACE(client_ip, '::ffff:', '') AS ip FROM event_claims) t
  WHERE ip IS NOT NULL
)
SELECT event_name, subnet,
       COUNT(*) AS claims,
       COUNT(DISTINCT ip) AS distinct_ips,
       SUM(points) AS points,
       MIN(requested_at) AS first_at,
       MAX(requested_at) AS last_at,
       GROUP_CONCAT(id ORDER BY requested_at) AS claim_ids
FROM b
WHERE subnet IS NOT NULL
GROUP BY event_name, subnet
HAVING claims >= 3
ORDER BY claims DESC, points DESC;


-- 5) 같은 대역에서 10분 이내 간격으로 이어진 신청 (연속 신청 묶음)
WITH b AS (
  SELECT id, event_name, points, requested_at, ip, user_agent,
         CASE WHEN LENGTH(INET6_ATON(ip)) = 4 THEN CONCAT(SUBSTRING_INDEX(ip, '.', 3), '.0/24')
              ELSE CONCAT(LOWER(HEX(SUBSTR(INET6_ATON(ip), 1, 8))), '/64') END AS subnet
  FROM (SELECT id, event_name, points, requested_at, user_agent, REPLACE(client_ip, '::ffff:', '') AS ip FROM event_claims) t
  WHERE ip IS NOT NULL
), g AS (
  SELECT b.*,
         TIMESTAMPDIFF(SECOND, LAG(requested_at) OVER w, requested_at) AS gap_prev_sec,
         TIMESTAMPDIFF(SECOND, requested_at, LEAD(requested_at) OVER w) AS gap_next_sec
  FROM b
  WINDOW w AS (PARTITION BY event_name, subnet ORDER BY requested_at, id)
)
SELECT event_name, subnet, id, requested_at, ip, points, gap_prev_sec, gap_next_sec, user_agent
FROM g
WHERE gap_prev_sec <= 600 OR gap_next_sec <= 600
ORDER BY event_name, subnet, requested_at, id;


-- 6) 자동화 도구로 보이거나 비어 있는 user_agent (IP 기록이 있는 신청만)
SELECT id, event_name, REPLACE(client_ip, '::ffff:', '') AS ip, points, requested_at, user_agent
FROM event_claims
WHERE client_ip IS NOT NULL
  AND (user_agent IS NULL
       OR REGEXP_LIKE(user_agent, 'headless|bot|crawl|spider|curl|wget|python|axios|node-fetch|undici|go-http|java/|okhttp|postman|insomnia|puppeteer|playwright|selenium|phantomjs', 'i'))
ORDER BY requested_at;


-- 7) 신청별 의심 점수 (검토 목록). 점수가 높은 것부터 사람이 확인한다
--    +2 같은 IP 로 같은 이벤트 2건 이상
--    +2 같은 IP + 같은 user_agent 2건 이상
--    +1 같은 대역 3건 이상
--    +1 같은 대역에서 10분 이내 연속 신청
--    +3 자동화 도구로 보이거나 비어 있는 user_agent
--    +1 IP 기록 없음 (2026-10-20 이전 신청)
WITH b AS (
  SELECT c.*,
         CASE WHEN ip IS NULL THEN NULL
              WHEN LENGTH(INET6_ATON(ip)) = 4 THEN CONCAT(SUBSTRING_INDEX(ip, '.', 3), '.0/24')
              ELSE CONCAT(LOWER(HEX(SUBSTR(INET6_ATON(ip), 1, 8))), '/64') END AS subnet
  FROM (SELECT id, event_name, wallet_address, galxe_id, gacha_address, points, status, requested_at, user_agent,
               REPLACE(client_ip, '::ffff:', '') AS ip
        FROM event_claims) c
), f AS (
  SELECT b.*,
         IF(ip IS NULL, 0, COUNT(*) OVER (PARTITION BY event_name, ip)) AS same_ip,
         IF(ip IS NULL, 0, COUNT(*) OVER (PARTITION BY event_name, ip, user_agent)) AS same_ip_ua,
         IF(subnet IS NULL, 0, COUNT(*) OVER (PARTITION BY event_name, subnet)) AS same_subnet,
         IF(subnet IS NULL, NULL, LEAST(
           COALESCE(TIMESTAMPDIFF(SECOND, LAG(requested_at) OVER w, requested_at), 999999999),
           COALESCE(TIMESTAMPDIFF(SECOND, requested_at, LEAD(requested_at) OVER w), 999999999))) AS nearest_gap_sec
  FROM b
  WINDOW w AS (PARTITION BY event_name, subnet ORDER BY requested_at, id)
), s AS (
  SELECT f.*,
         IF(same_ip >= 2, 2, 0)
         + IF(same_ip_ua >= 2, 2, 0)
         + IF(same_subnet >= 3, 1, 0)
         + IF(nearest_gap_sec <= 600, 1, 0)
         + IF(ip IS NOT NULL AND (user_agent IS NULL
               OR REGEXP_LIKE(user_agent, 'headless|bot|crawl|spider|curl|wget|python|axios|node-fetch|undici|go-http|java/|okhttp|postman|insomnia|puppeteer|playwright|selenium|phantomjs', 'i')), 3, 0)
         + IF(ip IS NULL, 1, 0) AS score
  FROM f
)
SELECT score, id, event_name, COALESCE(galxe_id, gacha_address) AS account, wallet_address, points, status,
       requested_at, ip, subnet, same_ip, same_ip_ua, same_subnet, nearest_gap_sec, user_agent
FROM s
WHERE score >= 2
ORDER BY score DESC, event_name, subnet, requested_at;


-- 8) 점수 구간별 건수·포인트 (검토 대상이 지급량에서 차지하는 비중)
WITH b AS (
  SELECT c.*,
         CASE WHEN ip IS NULL THEN NULL
              WHEN LENGTH(INET6_ATON(ip)) = 4 THEN CONCAT(SUBSTRING_INDEX(ip, '.', 3), '.0/24')
              ELSE CONCAT(LOWER(HEX(SUBSTR(INET6_ATON(ip), 1, 8))), '/64') END AS subnet
  FROM (SELECT id, event_name, points, requested_at, user_agent, REPLACE(client_ip, '::ffff:', '') AS ip FROM event_claims) c
), f AS (
  SELECT b.*,
         IF(ip IS NULL, 0, COUNT(*) OVER (PARTITION BY event_name, ip)) AS same_ip,
         IF(ip IS NULL, 0, COUNT(*) OVER (PARTITION BY event_name, ip, user_agent)) AS same_ip_ua,
         IF(subnet IS NULL, 0, COUNT(*) OVER (PARTITION BY event_name, subnet)) AS same_subnet,
         IF(subnet IS NULL, NULL, LEAST(
           COALESCE(TIMESTAMPDIFF(SECOND, LAG(requested_at) OVER w, requested_at), 999999999),
           COALESCE(TIMESTAMPDIFF(SECOND, requested_at, LEAD(requested_at) OVER w), 999999999))) AS nearest_gap_sec
  FROM b
  WINDOW w AS (PARTITION BY event_name, subnet ORDER BY requested_at, id)
), s AS (
  SELECT event_name, points,
         IF(same_ip >= 2, 2, 0)
         + IF(same_ip_ua >= 2, 2, 0)
         + IF(same_subnet >= 3, 1, 0)
         + IF(nearest_gap_sec <= 600, 1, 0)
         + IF(ip IS NOT NULL AND (user_agent IS NULL
               OR REGEXP_LIKE(user_agent, 'headless|bot|crawl|spider|curl|wget|python|axios|node-fetch|undici|go-http|java/|okhttp|postman|insomnia|puppeteer|playwright|selenium|phantomjs', 'i')), 3, 0)
         + IF(ip IS NULL, 1, 0) AS score
  FROM f
)
SELECT event_name,
       CASE WHEN score >= 4 THEN '4+ 우선 검토' WHEN score >= 2 THEN '2~3 검토' ELSE '0~1 정상 추정' END AS band,
       COUNT(*) AS claims,
       SUM(points) AS points
FROM s
GROUP BY event_name, band
ORDER BY event_name, band;
