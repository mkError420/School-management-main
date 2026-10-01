-- Upgrade an existing installation to support admin email and role access.
-- Safe to import repeatedly; an existing bootstrap account keeps its current password.

SET @has_admin_email = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admins' AND COLUMN_NAME = 'email'
);
SET @admin_email_sql = IF(
    @has_admin_email = 0,
    'ALTER TABLE admins ADD COLUMN email VARCHAR(255) NULL UNIQUE',
    'SELECT 1'
);
PREPARE admin_email_stmt FROM @admin_email_sql;
EXECUTE admin_email_stmt;
DEALLOCATE PREPARE admin_email_stmt;

SET @has_admin_role = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admins' AND COLUMN_NAME = 'role'
);
SET @admin_role_sql = IF(
    @has_admin_role = 0,
    'ALTER TABLE admins ADD COLUMN role ENUM(''admin'', ''super_admin'') NOT NULL DEFAULT ''admin''',
    'SELECT 1'
);
PREPARE admin_role_stmt FROM @admin_role_sql;
EXECUTE admin_role_stmt;
DEALLOCATE PREPARE admin_role_stmt;

INSERT INTO admins (id, username, email, password, role) VALUES
('super-admin-001', 'mk.rabbani.cse', 'mk.rabbani.cse@gmail.com', '$2y$12$f/6vmqM/Gay2PVwQnYJX0.a3ykAHLVtToQ3jpLs4Y9pkpnOmwq5Pm', 'super_admin')
ON DUPLICATE KEY UPDATE
    id = VALUES(id);
