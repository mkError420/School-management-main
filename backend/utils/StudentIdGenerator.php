<?php

class StudentIdGenerator {
    /**
     * Generate student ID based on: Current Year, Class, Roll
     * Continuous format without separators: YearClassRoll (e.g. 20261A01)
     *
     * @param Database $db
     * @param int|string|null $classId Class ID or Class Name
     * @param string|int|null $roll Roll number (optional, auto-generated if empty)
     * @param string|int|null $year Year (optional, defaults to current year)
     * @return array ['id' => string, 'roll' => string]
     */
    public static function generate($db, $classId, $roll = null, $year = null) {
        // 1. Current Year (e.g. 2026)
        $yearStr = !empty($year) ? (string)$year : date('Y');

        // 2. Class code (e.g. 1A, 2B, 10)
        $classCode = '';
        if (!empty($classId)) {
            // Check if class exists in database by id
            $classRow = $db->fetchOne("SELECT name FROM classes WHERE id = ?", [$classId]);
            $className = $classRow ? $classRow['name'] : (string)$classId;

            // Strip common prefixes like "Class" or "Grade" and trim
            $cleanName = preg_replace('/^(class|grade)\s*/i', '', trim($className));
            // Keep alphanumeric characters only, converted to uppercase
            $classCode = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $cleanName));
        }

        if (empty($classCode)) {
            $classCode = '1A'; // safe fallback
        }

        // 3. Roll number
        $rollStr = (string)($roll ?? '');
        $rollStr = trim($rollStr);

        if ($rollStr === '') {
            // Auto-calculate next roll in this class
            $maxRoll = null;
            if (!empty($classId)) {
                $row = $db->fetchOne("SELECT MAX(CAST(roll AS UNSIGNED)) AS max_roll FROM students WHERE class_id = ?", [$classId]);
                $maxRoll = $row['max_roll'] ?? null;
            }
            $nextRollNum = (!empty($maxRoll) && is_numeric($maxRoll)) ? (intval($maxRoll) + 1) : 1;
            $rollStr = str_pad((string)$nextRollNum, 2, '0', STR_PAD_LEFT);
        } else {
            // Format provided roll: if numeric, pad to at least 2 digits
            if (is_numeric($rollStr)) {
                $rollStr = str_pad($rollStr, 2, '0', STR_PAD_LEFT);
            } else {
                $rollStr = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $rollStr));
            }
        }

        // 4. Combine into YearClassRoll (e.g. 20261A01)
        $baseId = $yearStr . $classCode . $rollStr;
        $finalId = $baseId;

        // 5. Ensure uniqueness in students table
        $counter = 1;
        while ($db->fetchOne("SELECT id FROM students WHERE id = ?", [$finalId])) {
            if (is_numeric($rollStr)) {
                $nextRollNum = intval($rollStr) + $counter;
                $rollStrCandidate = str_pad((string)$nextRollNum, 2, '0', STR_PAD_LEFT);
                $candidate = $yearStr . $classCode . $rollStrCandidate;
                if (!$db->fetchOne("SELECT id FROM students WHERE id = ?", [$candidate])) {
                    $finalId = $candidate;
                    $rollStr = $rollStrCandidate;
                    break;
                }
            } else {
                $candidate = $baseId . '-' . $counter;
                if (!$db->fetchOne("SELECT id FROM students WHERE id = ?", [$candidate])) {
                    $finalId = $candidate;
                    break;
                }
            }
            $counter++;
        }

        return [
            'id'   => $finalId,
            'roll' => $rollStr
        ];
    }
}
