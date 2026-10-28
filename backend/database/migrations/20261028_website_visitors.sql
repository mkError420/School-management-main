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

-- View to directly calculate "Today's Visitors", "Total Visitors", and "Online Visitors" from website_visitors table
CREATE OR REPLACE VIEW view_visitor_statistics AS
SELECT 
    (SELECT COUNT(*) FROM website_visitors WHERE visit_date = CURDATE()) AS today_visitors,
    (SELECT COUNT(*) FROM website_visitors) AS total_visitors,
    (SELECT COUNT(DISTINCT visitor_id) FROM website_visitors WHERE last_active >= NOW() - INTERVAL 15 MINUTE) AS online_visitors;
