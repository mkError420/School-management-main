<?php

/**
 * WebsiteContentStaffSync
 * Automatically synchronizes staff and faculty members added/updated in the admin
 * "Staff & Faculty Directory" (/list/staff) or Teachers Directory (/list/teachers)
 * into "Website Content -> শিক্ষক ও কর্মকর্তা পরিচিতি (Faculty & Staff Directory)"
 * stored in site_settings (setting_key = 'website_content').
 */

class WebsiteContentStaffSync {

    /**
     * Map designations to bilingual Bengali & English
     */
    public static function mapDesignation($designation, $type = 'NON_TEACHING') {
        $raw = trim((string)$designation);
        $typeUpper = strtoupper(trim((string)$type));

        $bnToEn = [
            'প্রধান শিক্ষক' => 'Headmaster',
            'সহকারী প্রধান শিক্ষক' => 'Assistant Headmaster',
            'অধ্যক্ষ' => 'Principal',
            'উপাধ্যক্ষ' => 'Vice Principal',
            'সিনিয়র শিক্ষক' => 'Senior Teacher',
            'সহকারী শিক্ষক' => 'Assistant Teacher',
            'জুনিয়র শিক্ষক' => 'Junior Teacher',
            'সহকারী মৌলভী' => 'Assistant Moulvi',
            'শারীরিক শিক্ষা শিক্ষক' => 'Physical Education Teacher',
            'আইসিটি শিক্ষক' => 'ICT Teacher',
            'ধর্ম শিক্ষক' => 'Religious Teacher',
            'হিসাবরক্ষক' => 'Accountant',
            'প্রধান সহকারী ও হিসাবরক্ষক' => 'Head Assistant & Accountant',
            'অফিস সহকারী' => 'Office Assistant',
            'প্রশাসনিক কর্মকর্তা' => 'Administrative Officer',
            'কম্পিউটার অপারেটর' => 'Computer Operator',
            'গ্রন্থাগারিক' => 'Librarian',
            'সহকারী গ্রন্থাগারিক' => 'Assistant Librarian',
            'ল্যাব সহকারী' => 'Lab Assistant',
            'নিরাপত্তা প্রহরী' => 'Security Guard',
            'নিরাপত্তা বিশেষজ্ঞ' => 'Security Specialist',
            'দপ্তরী' => 'Office Bearer',
            'সহায়ক কর্মচারী' => 'Support Staff',
            'পরিচ্ছন্নতাকর্মী' => 'Cleaner / Sweeper',
            'আয়া' => 'Ayah',
            'মালি' => 'Gardener',
            'কর্মচারী' => 'Staff Member'
        ];

        $enToBn = [
            'headmaster' => 'প্রধান শিক্ষক',
            'head master' => 'প্রধান শিক্ষক',
            'head teacher' => 'প্রধান শিক্ষক',
            'principal' => 'অধ্যক্ষ',
            'assistant headmaster' => 'সহকারী প্রধান শিক্ষক',
            'asst. headmaster' => 'সহকারী প্রধান শিক্ষক',
            'asst headmaster' => 'সহকারী প্রধান শিক্ষক',
            'vice principal' => 'উপাধ্যক্ষ',
            'vice-principal' => 'উপাধ্যক্ষ',
            'senior teacher' => 'সিনিয়র শিক্ষক',
            'assistant teacher' => 'সহকারী শিক্ষক',
            'asst. teacher' => 'সহকারী শিক্ষক',
            'junior teacher' => 'জুনিয়র শিক্ষক',
            'teacher' => 'সহকারী শিক্ষক',
            'academic teacher' => 'সহকারী শিক্ষক',
            'ict teacher' => 'আইসিটি শিক্ষক',
            'physical education teacher' => 'শারীরিক শিক্ষা শিক্ষক',
            'religious teacher' => 'ধর্ম শিক্ষক',
            'accountant' => 'হিসাবরক্ষক',
            'head assistant & accountant' => 'প্রধান সহকারী ও হিসাবরক্ষক',
            'office assistant' => 'অফিস সহকারী',
            'administrative officer' => 'প্রশাসনিক কর্মকর্তা',
            'computer operator' => 'কম্পিউটার অপারেটর',
            'librarian' => 'গ্রন্থাগারিক',
            'assistant librarian' => 'সহকারী গ্রন্থাগারিক',
            'lab assistant' => 'ল্যাব সহকারী',
            'security specialist' => 'নিরাপত্তা বিশেষজ্ঞ',
            'certified security specialist' => 'নিরাপত্তা বিশেষজ্ঞ',
            'security guard' => 'নিরাপত্তা প্রহরী',
            'support staff' => 'সহায়ক কর্মচারী',
            'cleaner' => 'পরিচ্ছন্নতাকর্মী',
            'staff member' => 'কর্মচারী',
            'ayah' => 'আয়া',
            'gardener' => 'মালি'
        ];

        if ($raw === '') {
            return $typeUpper === 'TEACHING'
                ? ['bn' => 'সহকারী শিক্ষক', 'en' => 'Assistant Teacher']
                : ($typeUpper === 'ADMINISTRATIVE'
                    ? ['bn' => 'প্রশাসনিক কর্মকর্তা', 'en' => 'Administrative Officer']
                    : ['bn' => 'কর্মচারী', 'en' => 'Staff Member']);
        }

        // Direct match in bnToEn
        if (isset($bnToEn[$raw])) {
            return ['bn' => $raw, 'en' => $bnToEn[$raw]];
        }

        $lower = strtolower($raw);
        if (isset($enToBn[$lower])) {
            return ['bn' => $enToBn[$lower], 'en' => ucwords($raw)];
        }

        // Regex patterns
        if (preg_match('/vice\s*principal/i', $raw)) {
            return ['bn' => 'উপাধ্যক্ষ', 'en' => 'Vice Principal'];
        }
        if (preg_match('/assistant\s*head|asst\.?\s*head/i', $raw)) {
            return ['bn' => 'সহকারী প্রধান শিক্ষক', 'en' => 'Assistant Headmaster'];
        }
        if (preg_match('/principal|headmaster|head\s*teacher/i', $raw)) {
            return ['bn' => 'প্রধান শিক্ষক', 'en' => 'Headmaster / Principal'];
        }
        if (preg_match('/senior\s*teacher/i', $raw)) {
            return ['bn' => 'সিনিয়র শিক্ষক', 'en' => 'Senior Teacher'];
        }
        if (preg_match('/teacher/i', $raw) || $typeUpper === 'TEACHING') {
            return ['bn' => 'সহকারী শিক্ষক', 'en' => !empty($raw) ? $raw : 'Assistant Teacher'];
        }
        if (preg_match('/admin|officer|manager/i', $raw) || $typeUpper === 'ADMINISTRATIVE') {
            return ['bn' => 'প্রশাসনিক কর্মকর্তা', 'en' => !empty($raw) ? $raw : 'Administrative Officer'];
        }

        // Check if raw contains Bengali characters
        if (preg_match('/[\x{0980}-\x{09FF}]/u', $raw)) {
            return ['bn' => $raw, 'en' => $raw];
        }

        return ['bn' => $raw, 'en' => $raw];
    }

    /**
     * Map subject / department
     */
    public static function mapSubject($subjectRaw, $department = '', $type = 'NON_TEACHING') {
        $raw = trim((string)($subjectRaw ?: $department));
        $typeUpper = strtoupper(trim((string)$type));

        if ($raw === '' && $typeUpper === 'TEACHING') {
            $raw = 'General';
        }

        $dict = [
            'mathematics' => ['bn' => 'গণিত', 'en' => 'Mathematics'],
            'math' => ['bn' => 'গণিত', 'en' => 'Mathematics'],
            'bangla' => ['bn' => 'বাংলা', 'en' => 'Bangla'],
            'bengali' => ['bn' => 'বাংলা', 'en' => 'Bangla'],
            'english' => ['bn' => 'ইংরেজি', 'en' => 'English'],
            'science' => ['bn' => 'বিজ্ঞান', 'en' => 'General Science'],
            'general science' => ['bn' => 'সাধারণ বিজ্ঞান', 'en' => 'General Science'],
            'physics' => ['bn' => 'পদার্থবিজ্ঞান', 'en' => 'Physics'],
            'chemistry' => ['bn' => 'রসায়ন', 'en' => 'Chemistry'],
            'biology' => ['bn' => 'জীববিজ্ঞান', 'en' => 'Biology'],
            'higher math' => ['bn' => 'উচ্চতর গণিত', 'en' => 'Higher Mathematics'],
            'higher mathematics' => ['bn' => 'উচ্চতর গণিত', 'en' => 'Higher Mathematics'],
            'ict' => ['bn' => 'তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)', 'en' => 'Information & Communication Technology (ICT)'],
            'social science' => ['bn' => 'সামাজিক বিজ্ঞান', 'en' => 'Social Science'],
            'history' => ['bn' => 'ইতিহাস', 'en' => 'History'],
            'geography' => ['bn' => 'ভূগোল', 'en' => 'Geography'],
            'economics' => ['bn' => 'অর্থনীতি', 'en' => 'Economics'],
            'accounting' => ['bn' => 'হিসাববিজ্ঞান', 'en' => 'Accounting'],
            'business studies' => ['bn' => 'ব্যবসায় উদ্যোগ', 'en' => 'Business Studies'],
            'finance' => ['bn' => 'অর্থ ও হিসাব', 'en' => 'Finance & Accounts'],
            'islamic studies' => ['bn' => 'ইসলাম ও নৈতিক শিক্ষা', 'en' => 'Islamic Studies'],
            'islam' => ['bn' => 'ইসলাম ধর্ম', 'en' => 'Islamic Studies'],
            'hinduism' => ['bn' => 'হিন্দু ধর্ম ও নৈতিক শিক্ষা', 'en' => 'Hindu Studies'],
            'physical education' => ['bn' => 'শারীরিক শিক্ষা ও স্বাস্থ্য', 'en' => 'Physical Education & Health'],
            'arts and crafts' => ['bn' => 'চারু ও কারুকলা', 'en' => 'Arts and Crafts'],
            'agriculture' => ['bn' => 'কৃষি শিক্ষা', 'en' => 'Agriculture Studies'],
            'operations' => ['bn' => 'সার্বিক কার্যক্রম ও ব্যবস্থাপনা', 'en' => 'Operations & Campus Management'],
            'administration' => ['bn' => 'প্রশাসন ও অফিস ব্যবস্থাপনা', 'en' => 'Administration & Office Management'],
            'safety & security' => ['bn' => 'নিরাপত্তা ও শৃঙ্খলা', 'en' => 'Safety & Campus Security'],
            'academic faculty' => ['bn' => 'সাধারণ অ্যাকাডেমিক শিক্ষা', 'en' => 'General Academic Education'],
        ];

        $lower = strtolower($raw);
        if (isset($dict[$lower])) {
            return $dict[$lower];
        }

        foreach ($dict as $item) {
            if ($item['bn'] === $raw) {
                return $item;
            }
        }

        if (preg_match('/[\x{0980}-\x{09FF}]/u', $raw)) {
            return ['bn' => $raw, 'en' => $raw];
        }

        return [
            'bn' => $raw ?: ($typeUpper === 'TEACHING' ? 'সাধারণ শিক্ষা' : 'ক্যাম্পাস প্রশাসন'),
            'en' => $raw ?: ($typeUpper === 'TEACHING' ? 'General Academic' : 'Campus Operations')
        ];
    }

    /**
     * Map category
     */
    public static function mapCategory($type) {
        $t = strtoupper(trim((string)$type));
        if ($t === 'TEACHING') return 'শিক্ষক';
        if ($t === 'ADMINISTRATIVE') return 'প্রশাসন';
        return 'কর্মচারী';
    }

    /**
     * Map qualification
     */
    public static function mapQualification($qualification, $type = 'NON_TEACHING') {
        $qual = trim((string)$qualification);
        $typeUpper = strtoupper(trim((string)$type));

        if ($qual === '') {
            return $typeUpper === 'TEACHING'
                ? ['bn' => 'বি.এড / এম.এড', 'en' => 'B.Ed / M.Ed']
                : ['bn' => 'স্নাতক / ডিপ্লোমা', 'en' => 'Graduate / Diploma'];
        }

        $dict = [
            'b.ed / m.ed' => ['bn' => 'বি.এড / এম.এড', 'en' => 'B.Ed / M.Ed'],
            'b.sc / m.sc' => ['bn' => 'বি.এস.সি / এম.এস.সি', 'en' => 'B.Sc / M.Sc'],
            'b.a / m.a' => ['bn' => 'বি.এ / এম.এ', 'en' => 'B.A / M.A'],
            'b.com / m.com' => ['bn' => 'বি.কম / এম.কম', 'en' => 'B.Com / M.Com'],
            'bba / mba' => ['bn' => 'বিবিএ / এমবিএ', 'en' => 'BBA / MBA'],
            'diploma' => ['bn' => 'ডিপ্লোমা', 'en' => 'Diploma'],
        ];

        $lower = strtolower($qual);
        if (isset($dict[$lower])) {
            return $dict[$lower];
        }

        return ['bn' => $qual, 'en' => $qual];
    }

    /**
     * Transliterate / Format bilingual names
     */
    public static function formatBilingualName($name, $surname = '') {
        $firstName = trim((string)$name);
        $surName = trim((string)$surname);
        $fullName = trim($surName !== '' ? "$firstName $surName" : $firstName);

        if ($fullName === '') {
            return ['bn' => 'শিক্ষক সদস্য', 'en' => 'Faculty Member'];
        }

        // If already contains Bengali script
        if (preg_match('/[\x{0980}-\x{09FF}]/u', $fullName)) {
            return ['bn' => $fullName, 'en' => $fullName];
        }

        // Common Honorifics / Name Prefixes in Bangladesh
        $bn = $fullName;
        $replacements = [
            '/\bMd\.?\b/i' => 'মোঃ',
            '/\bMohammad\b/i' => 'মোহাম্মদ',
            '/\bMuhammad\b/i' => 'মুহাম্মদ',
            '/\bMost\b/i' => 'মোসাঃ',
            '/\bMst\.?\b/i' => 'মোসাঃ',
            '/\bMr\.?\b/i' => 'জনাব',
            '/\bMrs\.?\b/i' => 'বেগম',
            '/\bDr\.?\b/i' => 'ড.',
            '/\bProf\.?\b/i' => 'অধ্যাপক',
            '/\bEngr\.?\b/i' => 'প্রকৌশলী',
        ];
        foreach ($replacements as $pattern => $sub) {
            $bn = preg_replace($pattern, $sub, $bn);
        }

        return [
            'bn' => $bn,
            'en' => $fullName
        ];
    }

    /**
     * Auto Sync a Staff or Teacher member into website_content['teachers']
     * 
     * @param Database $db
     * @param string $staffIdOrNo
     * @return bool
     */
    public static function syncStaffMember($db, $staffIdOrNo) {
        if (!$db || empty($staffIdOrNo)) {
            return false;
        }

        try {
            $db->query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
        } catch (Exception $e) {}

        try {
            // 1. Fetch full staff record
            $staff = $db->fetchOne("
                SELECT 
                    s.id, s.staff_no, s.teacher_id, s.name, s.surname, s.email, s.phone,
                    s.type, s.designation, s.department, s.gender, s.qualification, s.img, s.status,
                    GROUP_CONCAT(DISTINCT sub.name SEPARATOR ', ') as subjects_list
                FROM staff s
                LEFT JOIN teachers t ON (s.teacher_id = t.id OR s.id = t.id)
                LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
                LEFT JOIN subjects sub ON ts.subject_id = sub.id
                WHERE s.id = ? OR s.staff_no = ? OR s.teacher_id = ?
                GROUP BY s.id
            ", [$staffIdOrNo, $staffIdOrNo, $staffIdOrNo]);

            // If not found in staff, check if in teachers table
            if (!$staff) {
                $teacher = $db->fetchOne("SELECT * FROM teachers WHERE id = ?", [$staffIdOrNo]);
                if ($teacher) {
                    $subjects = $db->fetchAll(
                        "SELECT sub.name FROM subjects sub 
                         INNER JOIN teacher_subjects ts ON sub.id = ts.subject_id 
                         WHERE ts.teacher_id = ?",
                        [$teacher['id']]
                    );
                    $subList = implode(', ', array_column($subjects ?: [], 'name'));

                    $staff = [
                        'id' => 'stf_' . $teacher['id'],
                        'staff_no' => $teacher['id'],
                        'teacher_id' => $teacher['id'],
                        'name' => $teacher['name'],
                        'surname' => $teacher['surname'],
                        'email' => $teacher['email'],
                        'phone' => $teacher['phone'],
                        'type' => 'TEACHING',
                        'designation' => 'Assistant Teacher',
                        'department' => 'Academic Faculty',
                        'gender' => ($teacher['sex'] ?? 'MALE') === 'FEMALE' ? 'FEMALE' : 'MALE',
                        'qualification' => 'B.Ed / M.Ed',
                        'img' => $teacher['img'],
                        'status' => 'ACTIVE',
                        'subjects_list' => $subList
                    ];
                }
            }

            if (!$staff) {
                return false;
            }

            // 2. Map into SchoolTeacherMember format
            $names = self::formatBilingualName($staff['name'], $staff['surname']);
            $desig = self::mapDesignation($staff['designation'], $staff['type']);
            $subj = self::mapSubject($staff['subjects_list'], $staff['department'], $staff['type']);
            $qual = self::mapQualification($staff['qualification'], $staff['type']);
            $cat = self::mapCategory($staff['type']);

            $targetId = 'stf_' . (!empty($staff['staff_no']) ? $staff['staff_no'] : $staff['id']);

            $teacherMember = [
                'id' => $targetId,
                'name' => $names['bn'],
                'nameEn' => $names['en'],
                'designation' => $desig['bn'],
                'designationEn' => $desig['en'],
                'subject' => $subj['bn'],
                'subjectEn' => $subj['en'],
                'qualification' => $qual['bn'],
                'qualificationEn' => $qual['en'],
                'phone' => !empty($staff['phone']) ? $staff['phone'] : '',
                'email' => !empty($staff['email']) ? $staff['email'] : '',
                'photo' => !empty($staff['img']) ? $staff['img'] : '/images/avatar.png',
                'category' => $cat
            ];

            // 3. Load website_content from site_settings
            $row = $db->fetchOne("SELECT setting_value FROM site_settings WHERE setting_key = 'website_content'");
            $websiteContent = [];
            if (!empty($row['setting_value'])) {
                $decoded = json_decode($row['setting_value'], true);
                if (is_array($decoded)) {
                    $websiteContent = $decoded;
                }
            }

            if (!isset($websiteContent['teachers']) || !is_array($websiteContent['teachers'])) {
                $websiteContent['teachers'] = [];
            }

            // 4. Locate existing member in teachers array
            $foundIndex = -1;
            $staffIdStr = (string)$staff['id'];
            $staffNoStr = (string)($staff['staff_no'] ?? '');
            $teacherIdStr = (string)($staff['teacher_id'] ?? '');

            foreach ($websiteContent['teachers'] as $idx => $t) {
                $tId = (string)($t['id'] ?? '');
                if (
                    $tId === $targetId ||
                    $tId === $staffIdStr ||
                    $tId === 'stf_' . $staffIdStr ||
                    ($staffNoStr !== '' && ($tId === $staffNoStr || $tId === 'stf_' . $staffNoStr)) ||
                    ($teacherIdStr !== '' && ($tId === $teacherIdStr || $tId === 'stf_' . $teacherIdStr)) ||
                    (!empty($staff['email']) && strtolower(trim((string)($t['email'] ?? ''))) === strtolower(trim($staff['email'])))
                ) {
                    $foundIndex = $idx;
                    break;
                }
            }

            if ($foundIndex >= 0) {
                // Update existing record, preserving any custom quotes/messages or manual Bengali overrides
                $existing = $websiteContent['teachers'][$foundIndex];
                if (!empty($existing['message'])) $teacherMember['message'] = $existing['message'];
                if (!empty($existing['messageEn'])) $teacherMember['messageEn'] = $existing['messageEn'];
                if (!empty($existing['name']) && preg_match('/[\x{0980}-\x{09FF}]/u', $existing['name']) && !preg_match('/[\x{0980}-\x{09FF}]/u', $teacherMember['name'])) {
                    $teacherMember['name'] = $existing['name'];
                }
                $websiteContent['teachers'][$foundIndex] = array_merge($existing, $teacherMember);
            } else {
                // Add new staff member
                $websiteContent['teachers'][] = $teacherMember;
            }

            // 5. Persist back to site_settings
            $encoded = json_encode($websiteContent, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $db->query(
                "INSERT INTO site_settings (setting_key, setting_value)
                 VALUES ('website_content', ?)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
                [$encoded]
            );

            return true;

        } catch (Exception $e) {
            error_log('WebsiteContentStaffSync::syncStaffMember failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Remove a Staff or Teacher member from website_content['teachers']
     * 
     * @param Database $db
     * @param string $staffIdOrNo
     * @return bool
     */
    public static function removeStaffMember($db, $staffIdOrNo) {
        if (!$db || empty($staffIdOrNo)) {
            return false;
        }

        try {
            $row = $db->fetchOne("SELECT setting_value FROM site_settings WHERE setting_key = 'website_content'");
            if (empty($row['setting_value'])) {
                return false;
            }
            $websiteContent = json_decode($row['setting_value'], true);
            if (!is_array($websiteContent) || empty($websiteContent['teachers'])) {
                return false;
            }

            $idStr = (string)$staffIdOrNo;
            $prefixedId = 'stf_' . $idStr;
            $unprefixedId = preg_replace('/^stf_/', '', $idStr);

            $websiteContent['teachers'] = array_values(array_filter($websiteContent['teachers'], function($t) use ($idStr, $prefixedId, $unprefixedId) {
                $tId = (string)($t['id'] ?? '');
                return ($tId !== $idStr && $tId !== $prefixedId && $tId !== $unprefixedId && $tId !== 'stf_' . $unprefixedId);
            }));

            $encoded = json_encode($websiteContent, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $db->query(
                "INSERT INTO site_settings (setting_key, setting_value)
                 VALUES ('website_content', ?)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
                [$encoded]
            );

            return true;
        } catch (Exception $e) {
            error_log('WebsiteContentStaffSync::removeStaffMember failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Bulk Sync all active staff from the Staff Directory into website_content['teachers']
     * 
     * @param Database $db
     * @return int Count of synced members
     */
    public static function syncAllFromStaffDirectory($db) {
        if (!$db) return 0;

        try {
            $rows = $db->fetchAll("SELECT id, staff_no FROM staff WHERE status = 'ACTIVE' ORDER BY type ASC, name ASC");
            $synced = 0;
            foreach ($rows as $r) {
                $identifier = !empty($r['staff_no']) ? $r['staff_no'] : $r['id'];
                if (self::syncStaffMember($db, $identifier)) {
                    $synced++;
                }
            }
            return $synced;
        } catch (Exception $e) {
            error_log('WebsiteContentStaffSync::syncAllFromStaffDirectory failed: ' . $e->getMessage());
            return 0;
        }
    }
}

