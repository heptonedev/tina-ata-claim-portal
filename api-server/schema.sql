CREATE DATABASE IF NOT EXISTS tina_events DEFAULT CHARSET=utf8mb4;

USE tina_events;

CREATE TABLE IF NOT EXISTS event_claims (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_name     VARCHAR(100)   NOT NULL DEFAULT 'galxe_airdrop',
  wallet_address VARCHAR(64)    NOT NULL,
  galxe_id       VARCHAR(100)   NULL,
  galxe_user_data JSON          NULL,
  token_amount   DECIMAL(20, 8) NOT NULL DEFAULT 0,
  status         ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  requested_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at   DATETIME       NULL,
  tx_signature   VARCHAR(128)   NULL,
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_wallet (event_name, wallet_address),
  INDEX idx_status (status),
  INDEX idx_event_name (event_name),
  INDEX idx_galxe_id (galxe_id),
  INDEX idx_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
