<?php

class StaffIdGenerator {
    /**
     * Generate Staff ID based on: Year and 2-digit sequential number.
     * Format: Year + 01, then 02, 03... (e.g. 202601, 202602)
     *
     * @param Database $db
     * @param string|int|null $year Year (optional, defaults to current year)
     * @return string
     */
    public static function generate($db, $year = null) {
        $yearStr = !empty($year) ? (string)$year : date('Y');
        // Extract 4-digit year if date string was passed (e.g. "2026-11-03")
        if (preg_match('/^(\d{4})/', trim($yearStr), $matches)) {
            $yearStr = $matches[1];
        } else {
            $yearStr = date('Y');
        }

        $maxSeq = 0;

        try {
            // Find highest sequential number for this year in staff table
            $staffRows = $db->fetchAll(
                "SELECT staff_no FROM staff WHERE staff_no LIKE ?",
                [$yearStr . '%']
            );
            foreach ($staffRows as $row) {
                if (!empty($row['staff_no']) && preg_match('/^' . $yearStr . '(\d+)$/', trim($row['staff_no']), $m)) {
                    $val = intval($m[1]);
                    if ($val > $maxSeq) {
                        $maxSeq = $val;
                    }
                }
            }
        } catch (Exception $e) {
            error_log('Error checking staff table for max staff ID: ' . $e->getMessage());
        }

        try {
            // Also check teachers table to prevent any ID conflicts
            $teacherRows = $db->fetchAll(
                "SELECT id FROM teachers WHERE id LIKE ?",
                [$yearStr . '%']
            );
            foreach ($teacherRows as $row) {
                if (!empty($row['id']) && preg_match('/^' . $yearStr . '(\d+)$/', trim($row['id']), $m)) {
                    $val = intval($m[1]);
                    if ($val > $maxSeq) {
                        $maxSeq = $val;
                    }
                }
            }
        } catch (Exception $e) {
            error_log('Error checking teachers table for max staff ID: ' . $e->getMessage());
        }

        $nextSeq = $maxSeq + 1;
        $candidate = $yearStr . str_pad((string)$nextSeq, 2, '0', STR_PAD_LEFT);

        // Ensure collision safety in both staff and teachers tables
        while (true) {
            $existsInStaff = false;
            $existsInTeachers = false;

            try {
                $existsInStaff = (bool)$db->fetchOne(
                    "SELECT id FROM staff WHERE staff_no = ? OR id = ?",
                    [$candidate, $candidate]
                );
            } catch (Exception $e) {}

            try {
                $existsInTeachers = (bool)$db->fetchOne(
                    "SELECT id FROM teachers WHERE id = ?",
                    [$candidate]
                );
            } catch (Exception $e) {}

            if (!$existsInStaff && !$existsInTeachers) {
                break;
            }

            $nextSeq++;
            $candidate = $yearStr . str_pad((string)$nextSeq, 2, '0', STR_PAD_LEFT);
        }

        return $candidate;
    }
}

