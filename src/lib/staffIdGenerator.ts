import type { StaffMember } from "@/types/staff";

/**
 * Generate Staff ID based on Year and 2-digit sequential number:
 * Format: Year + 01, then 02, 03... (e.g. 202601, 202602)
 */
export function generateNextStaffId(
  existingStaff: StaffMember[],
  yearInput?: string | number | null
): string {
  const currentYearStr = String(new Date().getFullYear());
  let yearPrefix = currentYearStr;

  if (yearInput) {
    const raw = String(yearInput).trim();
    const match = raw.match(/^(\d{4})/);
    if (match) {
      yearPrefix = match[1];
    }
  }

  let maxSeq = 0;
  const regex = new RegExp(`^${yearPrefix}(\\d+)$`);

  for (const member of existingStaff) {
    if (member.staff_no) {
      const match = String(member.staff_no).trim().match(regex);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!Number.isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    if (member.teacher_id) {
      const match = String(member.teacher_id).trim().match(regex);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!Number.isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `${yearPrefix}${String(nextSeq).padStart(2, "0")}`;
}

