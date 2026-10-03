-- Migration: Expenses Management
-- Date: 2026-10-03
-- Description: Add expenses table for tracking school expenses

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_no VARCHAR(60) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category ENUM('SALARY', 'UTILITIES', 'MAINTENANCE', 'SUPPLIES', 'TRANSPORT', 'MARKETING', 'EVENTS', 'OTHER') NOT NULL DEFAULT 'SUPPLIES',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'APPROVED', 'PAID', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    payment_method ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'MOBILE_BANKING', 'CHEQUE', 'OTHER') NOT NULL DEFAULT 'CASH',
    vendor VARCHAR(255) NULL,
    expense_date DATE NOT NULL,
    due_date DATE NULL,
    paid_date DATE NULL,
    transaction_ref VARCHAR(100) NULL,
    receipt_url VARCHAR(255) NULL,
    notes TEXT NULL,
    created_by VARCHAR(255) NULL,
    approved_by VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_exp_status (status),
    INDEX idx_exp_category (category),
    INDEX idx_exp_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed sample expenses
INSERT INTO expenses (id, expense_no, title, description, category, amount, status, payment_method, vendor, expense_date, due_date, paid_date, transaction_ref, notes) VALUES
(1, 'EXP-2026-0001', 'Monthly Staff Salaries - January 2026', 'Salaries for all teaching and non-teaching staff', 'SALARY', 25000.00, 'PAID', 'BANK_TRANSFER', 'School Payroll Account', '2025-12-25', NULL, '2025-12-28', 'SAL-JAN-2026-001', 'Monthly payroll processed'),
(2, 'EXP-2026-0002', 'Electricity Bill - December 2025', 'Monthly electricity consumption for school building', 'UTILITIES', 1850.00, 'PAID', 'BANK_TRANSFER', 'National Power Company', '2025-12-20', NULL, '2025-12-22', 'ELEC-DEC-2025-001', 'Regular monthly utility payment'),
(3, 'EXP-2026-0003', 'Office Supplies Purchase', 'Paper, pens, notebooks, and other office supplies', 'SUPPLIES', 450.00, 'APPROVED', 'CASH', 'Office Supplies Co.', '2025-12-28', NULL, NULL, NULL, 'Quarterly office supplies restock'),
(4, 'EXP-2026-0004', 'Building Maintenance - Roof Repair', 'Emergency roof repair after storm damage', 'MAINTENANCE', 3200.00, 'PENDING', 'BANK_TRANSFER', 'City Builders Ltd.', '2026-01-02', '2026-01-15', NULL, NULL, 'Urgent repair work required'),
(5, 'EXP-2026-0005', 'School Bus Fuel - January', 'Monthly fuel for school transportation fleet', 'TRANSPORT', 1200.00, 'PAID', 'CARD', 'Shell Fuel Station', '2025-12-25', NULL, '2025-12-26', 'FUEL-JAN-2026-001', 'Regular fuel for 3 school buses'),
(6, 'EXP-2026-0006', 'Marketing Campaign - Spring Admission', 'Social media ads and printed flyers for new session', 'MARKETING', 890.00, 'APPROVED', 'BANK_TRANSFER', 'Marketing Pro Agency', '2025-12-30', NULL, NULL, NULL, 'Annual admission drive'),
(7, 'EXP-2026-0007', 'Annual Sports Day Event', 'Trophies, medals, refreshments, and equipment rental', 'EVENTS', 1500.00, 'PENDING', 'CASH', 'Various', '2026-01-03', '2026-01-10', NULL, NULL, 'Upcoming sports day event'),
(8, 'EXP-2026-0008', 'Water Bill - December 2025', 'Monthly water and sewage charges', 'UTILITIES', 320.00, 'PAID', 'BANK_TRANSFER', 'City Water Authority', '2025-12-20', NULL, '2025-12-22', 'WATER-DEC-2025-001', 'Regular monthly utility'),
(9, 'EXP-2026-0009', 'Computer Lab Equipment Upgrade', 'New keyboards and mice for computer lab', 'SUPPLIES', 680.00, 'REJECTED', 'CARD', 'Tech Supplies Inc.', '2025-12-29', NULL, NULL, NULL, 'Rejected - Budget exceeded, postpone to next quarter'),
(10, 'EXP-2026-0010', 'Teacher Training Workshop', 'Professional development workshop for faculty', 'OTHER', 750.00, 'APPROVED', 'BANK_TRANSFER', 'Education Training Center', '2026-01-02', NULL, NULL, NULL, 'Mandatory annual training')
ON DUPLICATE KEY UPDATE title=VALUES(title);

SET FOREIGN_KEY_CHECKS = 1;
