-- Migration: Update staff_no format to Year + 2-digit serial (e.g. 202601, 202602)
-- Updates any existing legacy staff records to ensure consistency with Teacher Profile IDs

UPDATE staff SET staff_no = CONCAT(YEAR(CURRENT_DATE), '01') WHERE staff_no = 'STF-T0001';
UPDATE staff SET staff_no = CONCAT(YEAR(CURRENT_DATE), '02') WHERE staff_no = 'STF-T0002';
UPDATE staff SET staff_no = CONCAT(YEAR(CURRENT_DATE), '03') WHERE staff_no = 'STF-T0003';
UPDATE staff SET staff_no = CONCAT(YEAR(CURRENT_DATE), '04') WHERE staff_no = 'STF-A0001';
UPDATE staff SET staff_no = CONCAT(YEAR(CURRENT_DATE), '05') WHERE staff_no = 'STF-F0002';
UPDATE staff SET staff_no = CONCAT(YEAR(CURRENT_DATE), '06') WHERE staff_no = 'STF-L0003';
UPDATE staff SET staff_no = CONCAT(YEAR(CURRENT_DATE), '07') WHERE staff_no = 'STF-I0004';
UPDATE staff SET staff_no = CONCAT(YEAR(CURRENT_DATE), '08') WHERE staff_no = 'STF-H0005';

