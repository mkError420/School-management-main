-- Website visitors tracking table for live count statistics
CREATE TABLE IF NOT EXISTS website_visitors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    visit_date DATE NOT NULL,
    visitor_id VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_date_visitor (visit_date, visitor_id),
    INDEX idx_visit_date (visit_date),
    INDEX idx_last_active (last_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Baseline counters in site_settings
INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('visitor_baseline_total', '84120');
INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('visitor_baseline_today', '452');
INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('visitor_baseline_date', CURDATE());

