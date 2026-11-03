import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { SchoolWebsiteContent } from "@/types/site";

/**
 * Escapes characters for PDF literal strings
 */
function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export type AdmissionPdfVersion = "blank" | "Bangla" | "English" | "All";

export interface SubmittedAdmissionFormData {
  application_no?: string;
  applied_date?: string;
  first_name?: string;
  last_name?: string;
  class_name?: string;
  version?: string;
  date_of_birth?: string;
  gender?: string;
  sex?: string;
  blood_type?: string;
  student_type?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  parent_nid?: string;
  address?: string;
  previous_school?: string;
  notes?: string;
  photo_data_url?: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

/**
 * Builds a valid, self-contained PDF 1.4 binary string for an official A4 School Admission Application Form.
 */
export function buildAdmissionFormPdfString(
  content: Partial<SchoolWebsiteContent>,
  version: AdmissionPdfVersion = "blank"
): string {
  const schoolName = (content.schoolName || "GOVERNMENT MODEL HIGH SCHOOL & COLLEGE").toUpperCase();
  const address = content.address || "Main Campus, Education Zone, Bangladesh";
  const eiin = content.eiin || "108542";
  const code = content.schoolCode || "3421";
  const phone = content.phone || "+880 1712-345678";
  const email = content.email || "admission@school.edu.bd";

  const streamLines: string[] = [];
  const add = (line: string) => streamLines.push(line);

  // Outer decorative double border
  add("0.75 w 0.0 0.35 0.22 RG");
  add("25 25 545.28 791.89 re S");
  add("0.4 w 0.4 0.4 0.4 RG");
  add("28 28 539.28 785.89 re S");

  // Header background accent bar
  add("0.0 0.42 0.27 rg");
  add("28 765 539.28 48.89 re f");

  // Header Text
  add("BT");
  add("/F2 14 Tf 1 1 1 rg");
  add(`35 794 Td (${escapePdfText(schoolName)}) Tj`);
  add("/F1 8.5 Tf 0.95 0.95 0.95 rg");
  add(`0 -13 Td (EIIN: ${escapePdfText(eiin)}  |  School Code: ${escapePdfText(code)}  |  ESTD: 1974  |  Govt. Approved Secondary & Higher Secondary) Tj`);
  add(`0 -11 Td (${escapePdfText(address)}  |  Phone: ${escapePdfText(phone)}  |  Email: ${escapePdfText(email)}) Tj`);
  add("ET");

  // Title Ribbon
  add("0.94 0.97 0.95 rg 0.0 0.42 0.27 RG 0.8 w");
  add("35 730 400 24 re b");
  add("BT /F2 11 Tf 0.0 0.35 0.22 rg 45 738 Td (STUDENT ADMISSION APPLICATION FORM -- ACADEMIC SESSION 2026/2027) Tj ET");

  // Photo Box (Top-Right)
  add("0.8 w 0.3 0.3 0.3 RG 0.98 0.98 0.98 rg");
  add("455 640 105 114 re b");
  add("BT /F1 7.5 Tf 0.4 0.4 0.4 rg");
  add("468 700 Td (AFFIX RECENT) Tj");
  add("0 -10 Td (PASSPORT SIZE) Tj");
  add("0 -10 Td (COLOR PHOTO) Tj");
  add("0 -10 Td ((2 COPIES)) Tj");
  add("ET");

  // Top Metadata Grid
  add("0.5 w 0.7 0.7 0.7 RG");
  add("35 695 405 24 re S");
  add("35 665 405 24 re S");
  add("35 635 405 24 re S");

  add("BT /F2 8.5 Tf 0.1 0.1 0.1 rg");
  add("42 703 Td (Application Form No: ) Tj");
  add("/F1 8.5 Tf 0.3 0.3 0.3 rg 100 0 Td (ADM-2026-___________) Tj");
  add("/F2 8.5 Tf 0.1 0.1 0.1 rg 110 0 Td (Desired Class: ) Tj");
  add("/F1 8.5 Tf 0.3 0.3 0.3 rg 70 0 Td (________________) Tj");
  add("ET");

  add("BT /F2 8.5 Tf 0.1 0.1 0.1 rg");
  add("42 673 Td (Applied Date: ) Tj");
  add("/F1 8.5 Tf 0.3 0.3 0.3 rg 65 0 Td (____/____/2026) Tj");
  add("/F2 8.5 Tf 0.1 0.1 0.1 rg 65 0 Td (Version: ) Tj");
  const bnMark = version === "Bangla" ? "X" : " ";
  const enMark = version === "English" ? "X" : " ";
  add(`/F1 8.5 Tf 0.3 0.3 0.3 rg 50 0 Td ([${bnMark}] Bangla  [${enMark}] English) Tj`);
  add("/F2 8.5 Tf 0.1 0.1 0.1 rg 75 0 Td (Shift: ) Tj");
  add("/F1 8.5 Tf 0.3 0.3 0.3 rg 40 0 Td ([ ] M  [ ] D) Tj");
  add("ET");

  add("BT /F2 8.5 Tf 0.1 0.1 0.1 rg");
  add("42 643 Td (Student Type: ) Tj");
  add("/F1 8.5 Tf 0.3 0.3 0.3 rg 70 0 Td ([ ] Non-Resident   [ ] Resident   [ ] Day Care) Tj");
  add("ET");

  // SECTION 1
  add("0.0 0.38 0.25 rg 35 610 525 18 re f");
  add("BT /F2 9.5 Tf 1 1 1 rg 42 615 Td (1. APPLICANT STUDENT INFORMATION (IN BLOCK LETTERS)) Tj ET");
  add("0.5 w 0.75 0.75 0.75 RG");
  add("35 588 525 20 re S");
  add("35 566 525 20 re S");
  add("35 544 525 20 re S");
  add("35 522 525 20 re S");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 594 Td (Full Name (English): ) Tj");
  add("/F1 8 Tf 105 0 Td (_____________________________________________________________________) Tj ET");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 572 Td (Date of Birth (DOB): ) Tj");
  add("/F1 8 Tf 100 0 Td (DD / MM / YYYY) Tj");
  add("/F2 8 Tf 90 0 Td (Gender: ) Tj");
  add("/F1 8 Tf 40 0 Td ([ ] Male   [ ] Female   [ ] Other) Tj");
  add("/F2 8 Tf 120 0 Td (Blood Group: ) Tj");
  add("/F1 8 Tf 60 0 Td (_____) Tj ET");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 550 Td (Birth Certificate / NID No: ) Tj");
  add("/F1 8 Tf 120 0 Td (____________________________) Tj");
  add("/F2 8 Tf 160 0 Td (Religion: ) Tj");
  add("/F1 8 Tf 50 0 Td (_____________________) Tj ET");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 528 Td (Special Quota (if any): ) Tj");
  add("/F1 8 Tf 110 0 Td ([ ] General   [ ] Freedom Fighter   [ ] Special Needs / Disability   [ ] Catchment Area) Tj ET");

  // SECTION 2
  add("0.0 0.38 0.25 rg 35 496 525 18 re f");
  add("BT /F2 9.5 Tf 1 1 1 rg 42 501 Td (2. PARENTS & LEGAL GUARDIAN INFORMATION) Tj ET");
  add("0.5 w 0.75 0.75 0.75 RG");
  add("35 476 525 18 re S");
  add("35 456 525 18 re S");
  add("35 436 525 18 re S");
  add("35 416 525 18 re S");
  add("35 396 525 18 re S");
  add("35 376 525 18 re S");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 481 Td (Father's Name (Bangla): ) Tj");
  add("/F1 8 Tf 100 0 Td (____________________________________) Tj");
  add("/F2 8 Tf 180 0 Td (Father's NID No: ) Tj");
  add("/F1 8 Tf 80 0 Td (_____________________) Tj ET");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 461 Td (Father's Name (English): ) Tj");
  add("/F1 8 Tf 105 0 Td (___________________________________) Tj");
  add("/F2 8 Tf 175 0 Td (Father's Occupation: ) Tj");
  add("/F1 8 Tf 95 0 Td (__________________) Tj ET");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 441 Td (Mother's Name (Bangla): ) Tj");
  add("/F1 8 Tf 100 0 Td (____________________________________) Tj");
  add("/F2 8 Tf 180 0 Td (Mother's NID No: ) Tj");
  add("/F1 8 Tf 80 0 Td (_____________________) Tj ET");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 421 Td (Mother's Name (English): ) Tj");
  add("/F1 8 Tf 105 0 Td (___________________________________) Tj");
  add("/F2 8 Tf 175 0 Td (Guardian Mobile: ) Tj");
  add("/F1 8 Tf 80 0 Td (+880 1_________________) Tj ET");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 401 Td (Present Address: ) Tj");
  add("/F1 8 Tf 80 0 Td (House/Vill: ______________________, Post: _______________, Upazila/PS: _____________, Dist: ______________) Tj ET");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 381 Td (Permanent Address: ) Tj");
  add("/F1 8 Tf 90 0 Td (House/Vill: ______________________, Post: _______________, Upazila/PS: _____________, Dist: ______________) Tj ET");

  // SECTION 3
  add("0.0 0.38 0.25 rg 35 360 525 18 re f");
  add("BT /F2 9.5 Tf 1 1 1 rg 42 365 Td (3. PREVIOUS ACADEMIC RECORD (IF APPLICABLE)) Tj ET");
  add("0.5 w 0.75 0.75 0.75 RG");
  add("35 338 525 20 re S");
  add("35 316 525 20 re S");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 344 Td (Previous School / Institution: ) Tj");
  add("/F1 8 Tf 125 0 Td (________________________________________________) Tj");
  add("/F2 8 Tf 225 0 Td (Passing Year: ) Tj");
  add("/F1 8 Tf 65 0 Td (20____) Tj ET");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg 40 322 Td (Class Passed: ) Tj");
  add("/F1 8 Tf 65 0 Td (____________) Tj");
  add("/F2 8 Tf 75 0 Td (GPA / Marks: ) Tj");
  add("/F1 8 Tf 65 0 Td (__________) Tj");
  add("/F2 8 Tf 65 0 Td (Transfer Certificate (TC) No: ) Tj");
  add("/F1 8 Tf 120 0 Td (_____________________) Tj ET");

  // SECTION 4
  add("0.0 0.38 0.25 rg 35 290 525 18 re f");
  add("BT /F2 9.5 Tf 1 1 1 rg 42 295 Td (4. DECLARATION BY STUDENT & PARENT / GUARDIAN) Tj ET");
  add("0.5 w 0.75 0.75 0.75 RG");
  add("35 212 525 76 re S");

  add("BT /F1 7.5 Tf 0.2 0.2 0.2 rg");
  add("42 274 Td (I hereby solemnly declare that the particulars furnished above are true and correct to the best of my knowledge and belief.) Tj");
  add("0 -10 Td (If any statement is found false or forged, my admission shall stand cancelled immediately and I shall be liable to disciplinary action.) Tj");
  add("0 -10 Td (I also pledge to abide by the disciplinary regulations, code of conduct, and academic requirements of this institution.) Tj");
  add("ET");

  add("0.6 w 0.4 0.4 0.4 RG");
  add("60 230 150 0.5 re S");
  add("375 230 150 0.5 re S");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg");
  add("75 220 Td (Signature of Student & Date) Tj");
  add("380 220 Td (Signature of Guardian & Date) Tj");
  add("ET");

  // SECTION 5
  add("0.85 0.90 0.88 rg 0.0 0.38 0.25 RG 0.75 w");
  add("35 180 525 18 re b");
  add("BT /F2 9.5 Tf 0.0 0.35 0.22 rg 42 185 Td (5. FOR ADMINISTRATIVE & OFFICE ENROLLMENT DESK USE ONLY) Tj ET");
  add("0.5 w 0.75 0.75 0.75 RG");
  add("35 110 525 68 re S");

  add("BT /F2 8 Tf 0.1 0.1 0.1 rg");
  add("42 162 Td (Document Verification: ) Tj");
  add("/F1 8 Tf 100 0 Td ([ ] Birth Cert Verified   [ ] TC Original Received   [ ] Photo Attached   [ ] NID Verified) Tj");

  add("42 142 Td (Admission Decision: ) Tj");
  add("/F1 8 Tf 90 0 Td ([ ] Approved   [ ] Waitlisted   [ ] Rejected) Tj");
  add("/F2 8 Tf 140 0 Td (Assigned Roll: ) Tj");
  add("/F1 8 Tf 70 0 Td (___________) Tj");
  add("/F2 8 Tf 65 0 Td (Section: ) Tj");
  add("/F1 8 Tf 45 0 Td (______) Tj");
  add("ET");

  add("0.6 w 0.4 0.4 0.4 RG");
  add("60 124 140 0.5 re S");
  add("375 124 150 0.5 re S");

  add("BT /F2 7.5 Tf 0.2 0.2 0.2 rg");
  add("70 114 Td (Verification Officer Signature) Tj");
  add("380 114 Td (Headmaster / Principal Seal & Signature) Tj");
  add("ET");

  add("BT /F1 7.2 Tf 0.45 0.45 0.45 rg");
  add("35 34 Td (* Please submit this filled-in form along with attested birth certificate, previous school TC, 2 photos & parent NIDs to the admission office.) Tj");
  add("0 -8 Td (Generated by School Management System Portal -- Official Document. Free of Cost.) Tj");
  add("ET");

  const streamContent = streamLines.join("\n");
  const enc = new TextEncoder();
  const streamBytes = enc.encode(streamContent);
  const streamLength = streamBytes.length;

  const objects: string[] = [];
  objects[1] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj";
  objects[2] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj";
  objects[3] =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>\nendobj";
  objects[4] = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`;
  objects[5] = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj";
  objects[6] = "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj";

  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  let currentOffset = header.length;
  const offsets: number[] = [0];

  for (let i = 1; i <= 6; i++) {
    offsets[i] = currentOffset;
    currentOffset += enc.encode(objects[i]).length + 1;
  }

  const xrefOffset = currentOffset;
  let xref = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return header + objects.slice(1).join("\n") + "\n" + xref + trailer;
}

export function generateAdmissionFormPdfBlob(
  content: Partial<SchoolWebsiteContent>,
  version: AdmissionPdfVersion = "blank"
): Blob {
  const pdfString = buildAdmissionFormPdfString(content, version);
  const bytes = new TextEncoder().encode(pdfString);
  return new Blob([bytes], { type: "application/pdf" });
}

/**
 * Returns the complete official bilingual Admission Form HTML string.
 */
export function getAdmissionFormHtml(
  content: Partial<SchoolWebsiteContent>,
  logoUrl?: string,
  includePrintBar: boolean = false,
  fullDocument: boolean = true,
  version: AdmissionPdfVersion = "blank",
  autoPrint: boolean = true,
  submitted?: SubmittedAdmissionFormData
): string {
  const schoolNameBn = content.schoolNameBn || "সরকারি মডেল উচ্চ বিদ্যালয় ও কলেজ";
  const schoolNameEn = content.schoolName || "Government Model High School & College";
  const eiin = content.eiin || "108542";
  const code = content.schoolCode || "3421";
  const address = content.address || "Main Campus, Education Zone, Bangladesh";
  const phone = content.phone || "+880 1712-345678";
  const escape = (value?: string) => escapeHtml(value || "");
  const displayValue = (value?: string, placeholder = "") =>
    submitted
      ? `<span class="filled-value">${escape(value) || "—"}</span>`
      : `<span class="dots">${placeholder}</span>`;
  const normalizeGender = (value?: string) => (value ?? "").trim().toUpperCase();
  const genderValue = normalizeGender(submitted?.gender || submitted?.sex);
  const selectedTypes = new Set(
    (submitted?.student_type || "").toLowerCase().split(",").map((item) => item.trim())
  );
  const checkbox = (checked: boolean) =>
    `<span class="checkbox-box">${checked ? "✓" : ""}</span>`;
  const studentPhoto = submitted?.photo_data_url
    ? `<img src="${escape(submitted.photo_data_url)}" alt="Student photo" style="width:100%;height:100%;object-fit:cover;" />`
    : `<span style="font-size: 16px; margin-bottom: 2px;">📷</span>
       <span>শিক্ষার্থীর ২ কপি পাসপোর্ট সাইজ ছবি</span>`;
  const appliedDate = submitted?.applied_date
    ? escape(submitted.applied_date.slice(0, 10))
    : "";

  const styleBlock = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;800&display=swap');
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Noto Sans Bengali', 'Segoe UI', Arial, SolaimanLipi, Kalpurush, sans-serif;
      font-size: 11px;
      color: #111827;
      background: #ffffff;
      line-height: 1.3;
      margin: 0;
      padding: 0;
    }
    .page-container {
      width: 794px;
      height: 1123px;
      min-height: 1123px;
      max-height: 1123px;
      margin: 0 auto;
      border: 2.5px solid #005a40;
      padding: 10px 14px;
      position: relative;
      background: #fff;
      font-family: 'Noto Sans Bengali', 'Segoe UI', Arial, SolaimanLipi, Kalpurush, sans-serif;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .inner-border {
      border: 1px solid #7ea898;
      padding: 8px 12px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #005a40;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .header-logo {
      width: 62px;
      height: 62px;
      object-fit: contain;
    }
    .header-text {
      text-align: center;
      padding: 0 8px;
    }
    .school-title-bn {
      font-size: 18px;
      font-weight: 800;
      color: #005a40;
      line-height: 1.2;
    }
    .school-title-en {
      font-size: 13.5px;
      font-weight: 700;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-meta {
      font-size: 9.5px;
      color: #4b5563;
      margin-top: 2px;
    }
    .photo-cell {
      width: 92px;
      text-align: right;
    }
    .photo-box {
      width: 84px;
      height: 98px;
      border: 1.5px dashed #4b5563;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 8.5px;
      color: #6b7280;
      padding: 3px;
      background: #fafafa;
    }
    .title-banner {
      background: #005a40;
      color: #ffffff;
      text-align: center;
      padding: 3.5px;
      font-size: 11.5px;
      font-weight: bold;
      border-radius: 3px;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      border: 1px solid #d1d5db;
      background: #f9fafb;
      padding: 4px 6px;
      font-size: 10.5px;
      margin-bottom: 6px;
      border-radius: 3px;
    }
    .section-title {
      background: #f0fdf4;
      border-left: 4px solid #005a40;
      border-top: 1px solid #cbe0d3;
      border-right: 1px solid #cbe0d3;
      border-bottom: 1px solid #cbe0d3;
      padding: 3px 6px;
      font-size: 10.5px;
      font-weight: bold;
      color: #005a40;
      margin-top: 5px;
      margin-bottom: 3px;
      text-transform: uppercase;
      text-align: center;
      line-height: 1.25;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 3px;
      font-size: 10px;
    }
    .grid-table td, .grid-table th {
      border: 1px solid #d1d5db;
      padding: 3.5px 5px;
      vertical-align: middle;
    }
    .grid-table td.label-cell {
      background: #f9fafb;
      font-weight: 600;
      width: 22%;
      color: #374151;
    }
    .parent-info-table {
      table-layout: fixed;
      width: 100%;
    }
    .parent-info-table td.label-cell-left {
      width: 18%;
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .parent-info-table td.value-cell-name {
      width: 32%;
    }
    .parent-info-table td.label-cell-right {
      width: 24%;
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .parent-info-table td.value-cell-nid {
      width: 26%;
    }
    .dots {
      border-bottom: 1px dotted #9ca3af;
      display: inline-block;
      width: 100%;
      min-height: 12px;
    }
    .filled-value {
      display: block;
      min-height: 14px;
      padding: 1px 3px;
      color: #111827;
      font-weight: 700;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }
    .checkbox-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 10px;
      height: 10px;
      border: 1px solid #374151;
      margin-right: 4px;
      vertical-align: -1px;
      font-size: 8px;
      line-height: 1;
      font-weight: bold;
      color: #005a40;
    }
    .checkbox-item {
      display: inline-flex;
      align-items: center;
      margin-right: 10px;
    }
    .declaration-box {
      border: 1px solid #d1d5db;
      background: #fafafa;
      padding: 4px 6px;
      font-size: 9px;
      color: #4b5563;
      line-height: 1.35;
      margin-bottom: 5px;
      border-radius: 3px;
    }
    .sig-row {
      display: flex;
      justify-content: space-between;
      margin-top: 18px;
      margin-bottom: 6px;
      padding: 0 14px;
    }
    .sig-box {
      text-align: center;
      width: 175px;
      border-top: 1px solid #374151;
      padding-top: 2px;
      font-size: 9.5px;
      font-weight: 600;
      color: #111827;
    }
    .office-box {
      border: 1.5px solid #005a40;
      border-radius: 4px;
      padding: 5px 6px;
      margin-top: 6px;
      background: #fbfdfc;
    }
    .office-title {
      font-size: 10px;
      font-weight: bold;
      color: #005a40;
      text-transform: uppercase;
      margin-bottom: 3px;
      text-align: center;
    }
    .footer-note {
      font-size: 8px;
      color: #6b7280;
      text-align: center;
      margin-top: 4px;
      border-top: 1px solid #e5e7eb;
      padding-top: 3px;
    }
    .print-bar {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #005a40;
      color: #fff;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: bold;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      cursor: pointer;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    @media print {
      .print-bar { display: none !important; }
      body { margin: 0; padding: 0; }
      .page-container { border: 2px solid #005a40 !important; }
    }
  </style>
  `;

  const bodyContent = `
  ${includePrintBar
      ? `<div class="print-bar" onclick="window.print()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          <span>প্রিন্ট / সেভ PDF (Print Form)</span>
        </div>`
      : ""
    }

  <div class="page-container">
    <div class="inner-border">
      <!-- HEADER -->
      <table class="header-table">
        <tr>
          <td style="width: 70px; vertical-align: middle;">
            ${logoUrl
      ? `<img src="${logoUrl}" class="header-logo" alt="Logo" onerror="this.style.display='none'"/>`
      : `<div style="width:54px;height:54px;border-radius:50%;background:#005a40;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;margin:auto;">🏛️</div>`
    }
          </td>
          <td class="header-text">
            <div style="font-size: 9.5px; color: #4b5563; font-weight: 600;">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত</div>
            <div class="school-title-bn">${schoolNameBn}</div>
            <div class="school-title-en">${schoolNameEn}</div>
            <div class="header-meta">
              ইআইআইএন (EIIN): <b>${eiin}</b> &nbsp;|&nbsp; বিদ্যালয় কোড: <b>${code}</b> &nbsp;|&nbsp; প্রতিষ্ঠিত: ১৯৭৪
              <br/>ঠিকানা: ${address} &nbsp;|&nbsp; হেল্পলাইন: ${phone}
            </div>
          </td>
          <td class="photo-cell">
            <div class="photo-box" style="${submitted?.photo_data_url ? "padding:0;overflow:hidden;" : ""}">
              ${studentPhoto}
            </div>
          </td>
        </tr>
      </table>

      <!-- TITLE -->
      <div class="title-banner">
        ভর্তি আবেদন ফরম — ২০২৬/২০২৭ শিক্ষাবর্ষ &nbsp;|&nbsp; STUDENT ADMISSION APPLICATION FORM
      </div>

      <!-- META ROW -->
      <div class="meta-row">
        <div><b>আবেদন ফরম নং (Form No):</b> &nbsp;${submitted ? escape(submitted.application_no) || "Pending" : "ADM-2026-______________"}</div>
        <div><b>ভর্তিচ্ছু শ্রেণি (Class):</b> &nbsp;${submitted ? escape(submitted.class_name) || "—" : "____________________"}</div>
        <div><b>ভার্সন (Version):</b> &nbsp;<span class="checkbox-item">${checkbox(submitted ? submitted.version?.toLowerCase() === "bangla" : version === "Bangla")}বাংলা</span> &nbsp;<span class="checkbox-item">${checkbox(submitted ? submitted.version?.toLowerCase() === "english" : version === "English")}English</span></div>
        <div><b>তারিখ (Date):</b> &nbsp;${submitted ? appliedDate || "—" : "____/____/২০২৬"}</div>
      </div>

      <!-- SECTION 1 -->
      <div class="section-title">১. শিক্ষার্থীর ব্যক্তিগত বিবরণ (Student Information)</div>
      <table class="grid-table">
        <tr>
          <td class="label-cell">শিক্ষার্থীর নাম (বাংলায়):</td>
          <td colspan="3"><span class="dots"></span></td>
        </tr>
        <tr>
          <td class="label-cell">Full Name (in English):</td>
          <td colspan="3">${displayValue(submitted ? `${submitted.first_name || ""} ${submitted.last_name || ""}`.trim() : undefined, "")}</td>
        </tr>
        <tr>
          <td class="label-cell">জন্ম তারিখ (Date of Birth):</td>
          <td>${submitted ? displayValue(submitted.date_of_birth) : "দিন: ____ মাস: ____ বছর: ________"}</td>
          <td class="label-cell">লিঙ্গ (Gender):</td>
          <td>
            <span class="checkbox-item">${checkbox(submitted ? genderValue === "MALE" : false)}ছাত্র (Male)</span>
            <span class="checkbox-item">${checkbox(submitted ? genderValue === "FEMALE" : false)}ছাত্রী (Female)</span>
          </td>
        </tr>
        <tr>
          <td class="label-cell">ডিজিটাল জন্ম নিবন্ধন নং:</td>
          <td>${displayValue()}</td>
          <td class="label-cell">রক্তের গ্রুপ ও ধর্ম:</td>
          <td>${submitted ? `রক্ত: ${escape(submitted.blood_type) || "—"} &nbsp; ধর্ম: —` : "রক্ত: ________ &nbsp; ধর্ম: ______________"}</td>
        </tr>
        <tr>
          <td class="label-cell">শিক্ষার্থীর ধরন (Student Type):</td>
          <td>
            <span class="checkbox-item">${checkbox(selectedTypes.has("non-resident"))}অনাবাসিক</span>
            <span class="checkbox-item">${checkbox(selectedTypes.has("resident"))}আবাসিক</span>
            <span class="checkbox-item">${checkbox(selectedTypes.has("day care"))}ডে-কেয়ার</span>
          </td>
          <td class="label-cell">বিশেষ কোটা (যদি থাকে):</td>
          <td>
            <span class="checkbox-item"><span class="checkbox-box"></span>সাধারণ</span>
            <span class="checkbox-item"><span class="checkbox-box"></span>মুক্তিযোদ্ধা</span>
            <span class="checkbox-item"><span class="checkbox-box"></span>প্রতিবন্ধী</span>
          </td>
        </tr>
      </table>

      <!-- SECTION 2 -->
      <div class="section-title">২. পিতা, মাতা ও অভিভাবকের বিবরণ (Parent & Guardian Information)</div>
      <table class="grid-table parent-info-table">
        <colgroup>
          <col style="width: 18%;" />
          <col style="width: 32%;" />
          <col style="width: 24%;" />
          <col style="width: 26%;" />
        </colgroup>
        <tr>
          <td class="label-cell label-cell-left">পিতার নাম (বাংলায়):</td>
          <td class="value-cell-name"><span class="dots"></span></td>
          <td class="label-cell label-cell-right">পিতার জাতীয় পরিচয়পত্র (NID):</td>
          <td class="value-cell-nid">${displayValue(submitted?.parent_nid)}</td>
        </tr>
        <tr>
          <td class="label-cell label-cell-left">${submitted ? "Parent / Guardian Name:" : "Father's Name (English):"}</td>
          <td class="value-cell-name">${displayValue(submitted?.parent_name)}</td>
          <td class="label-cell label-cell-right">পিতা/অভিভাবকের পেশা:</td>
          <td class="value-cell-nid"><span class="dots"></span></td>
        </tr>
        <tr>
          <td class="label-cell label-cell-left">মাতার নাম (বাংলায়):</td>
          <td class="value-cell-name"><span class="dots"></span></td>
          <td class="label-cell label-cell-right">মাতার জাতীয় পরিচয়পত্র (NID):</td>
          <td class="value-cell-nid"><span class="dots"></span></td>
        </tr>
        <tr>
          <td class="label-cell label-cell-left">Mother's Name (English):</td>
          <td class="value-cell-name"><span class="dots" style="font-family: monospace;"></span></td>
          <td class="label-cell label-cell-right">অভিভাবকের মোবাইল নং:</td>
          <td class="value-cell-nid">${displayValue(submitted?.parent_phone, "<b>+880 1</b>_____________________")}</td>
        </tr>
        <tr>
          <td class="label-cell label-cell-left">বর্তমান ঠিকানা:</td>
          <td colspan="3">${submitted ? displayValue(submitted.address) : "গ্রাম/মহল্লা: ______________________________, ডাকঘর: _________________, থানা/উপজেলা: _________________, জেলা: _________________"}</td>
        </tr>
        <tr>
          <td class="label-cell label-cell-left">স্থায়ী ঠিকানা:</td>
          <td colspan="3">গ্রাম/মহল্লা: ______________________________, ডাকঘর: _________________, থানা/উপজেলা: _________________, জেলা: _________________</td>
        </tr>
      </table>

      <!-- SECTION 3 -->
      <div class="section-title">৩. পূর্ববর্তী বিদ্যালয়ের বিবরণ (প্রযোজ্য ক্ষেত্রে)</div>
      <table class="grid-table">
        <tr>
          <td class="label-cell">পূর্ববর্তী বিদ্যালয়ের নাম:</td>
          <td colspan="3">${displayValue(submitted?.previous_school)}</td>
        </tr>
        <tr>
          <td class="label-cell">উত্তীর্ণ শ্রেণি ও বছর:</td>
          <td>শ্রেণি: ____________ বছর: ২০____</td>
          <td class="label-cell">প্রাপ্ত জিপিএ ও ছাড়পত্র (TC) নং:</td>
          <td>জিপিএ: ________ TC নং: _____________</td>
        </tr>
      </table>

      <!-- SECTION 4 -->
      <div class="section-title">৪. শিক্ষার্থী ও অভিভাবকের অঙ্গীকারনামা (Declaration)</div>
      <div class="declaration-box">
        আমি অঙ্গীকার করছি যে, অত্র আবেদনপত্রে বর্ণিত যাবতীয় তথ্য সত্য ও নির্ভুল। ভবিষ্যতে কোনো তথ্য ভুল বা অসত্য প্রমাণিত হলে আবেদনপত্র বা ভর্তি বাতিল বলে গণ্য হবে। বিদ্যালয়ের শৃঙ্খলা, পোশাকবিধি ও সকল নিয়মাবলি মেনে চলতে আমি ও আমার সন্তান সম্পূর্ণ বাধ্য থাকব।
        ${submitted?.notes ? `<br/><b>Remarks:</b> ${escape(submitted.notes)}` : ""}
      </div>

      <div class="sig-row">
        <div class="sig-box">শিক্ষার্থীর স্বাক্ষর ও তারিখ</div>
        <div class="sig-box">পিতা / অভিভাবকের স্বাক্ষর ও তারিখ</div>
      </div>

      <!-- SECTION 5 -->
      <div class="office-box">
        <div class="office-title">৫. অফিসের ব্যবহারের জন্য (For Office Use Only)</div>
        <table class="grid-table" style="margin-bottom: 0;">
          <tr>
            <td class="label-cell">নথিপত্র যাচাই:</td>
            <td>
              <span class="checkbox-item"><span class="checkbox-box"></span>জন্মসনদ কপি</span>
              <span class="checkbox-item"><span class="checkbox-box"></span>মূল টিসি</span>
              <span class="checkbox-item"><span class="checkbox-box"></span>২ কপি ছবি</span>
              <span class="checkbox-item"><span class="checkbox-box"></span>অভিভাবক NID</span>
            </td>
            <td class="label-cell">ভর্তি অনুমোদন:</td>
            <td>
              <span class="checkbox-item"><span class="checkbox-box"></span>অনুমোদিত</span>
              <span class="checkbox-item"><span class="checkbox-box"></span>অপেক্ষমাণ</span>
            </td>
          </tr>
          <tr>
            <td class="label-cell">নির্ধারিত শ্রেণি ও শাখা:</td>
            <td>শ্রেণি: ________ শাখা: ________</td>
            <td class="label-cell">শ্রেণি রোল ও ফি রসিদ:</td>
            <td>রোল: __________ রসিদ নং: _________</td>
          </tr>
        </table>
        <div class="sig-row" style="margin-top: 14px; margin-bottom: 2px;">
          <div class="sig-box" style="width: 140px; font-size: 8.5px;">যাচাইকারী কর্মকর্তার স্বাক্ষর</div>
          <div class="sig-box" style="width: 160px; font-size: 8.5px;">অধ্যক্ষ / প্রধান শিক্ষকের স্বাক্ষর ও সিল</div>
        </div>
      </div>

      <div class="footer-note">
        * ফরমটি স্বহস্তে পূরণ করে প্রয়োজনীয় কাগজপত্র সহ নির্ধারিত সময়সীমার মধ্যে প্রশাসনিক দপ্তরে জমা দিন। ফরমটি বিনামূল্যে সরবরাহকৃত।
      </div>
    </div>
  </div>
  `;

  if (!fullDocument) {
    return `${styleBlock}${bodyContent}`;
  }

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>Student Admission Form 2026 - ${schoolNameEn}</title>
  ${styleBlock}
</head>
<body>
  ${bodyContent}
  ${autoPrint ? `<script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>` : ""}
</body>
</html>`;
}

export async function downloadSubmittedAdmissionPdf(
  content: Partial<SchoolWebsiteContent>,
  logoUrl: string | undefined,
  application: SubmittedAdmissionFormData
): Promise<void> {
  const frame = document.createElement("iframe");
  frame.title = "Admission application PDF rendering";
  frame.style.position = "fixed";
  frame.style.left = "-10000px";
  frame.style.top = "0";
  frame.style.width = "794px";
  frame.style.height = "1123px";
  frame.style.border = "0";
  frame.setAttribute("aria-hidden", "true");
  document.body.appendChild(frame);

  try {
    await new Promise<void>((resolve, reject) => {
      frame.onload = () => resolve();
      frame.onerror = () => reject(new Error("Unable to render the application preview."));
      frame.srcdoc = getAdmissionFormHtml(
        content,
        logoUrl,
        false,
        true,
        "All",
        false,
        application
      );
    });

    const frameDocument = frame.contentDocument;
    const target = frameDocument?.querySelector(".page-container") as HTMLElement | null;
    if (!frameDocument || !target) {
      throw new Error("The admission application form could not be rendered.");
    }

    await frameDocument.fonts.ready;
    await Promise.all(
      Array.from(target.querySelectorAll("img")).map(async (image) => {
        if (!image.complete) {
          await new Promise<void>((resolve, reject) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener(
              "error",
              () => reject(new Error("Unable to load an image in the admission form.")),
              { once: true }
            );
          });
        }
        if (!image.naturalWidth) {
          throw new Error("Unable to load an image in the admission form.");
        }
        await image.decode();
      })
    );

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      0,
      0,
      pdf.internal.pageSize.getWidth(),
      pdf.internal.pageSize.getHeight()
    );
    const safeApplicationNo = (application.application_no || "application").replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );
    pdf.save(`Admission_Application_${safeApplicationNo}.pdf`);
  } finally {
    frame.remove();
  }
}

export function openSubmittedAdmissionPrintWindow(
  content: Partial<SchoolWebsiteContent>,
  logoUrl: string | undefined,
  application: SubmittedAdmissionFormData
): void {
  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (!printWindow) {
    alert("Please allow popups to print the submitted Admission Application.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(
    getAdmissionFormHtml(content, logoUrl, false, true, "All", true, application)
  );
  printWindow.document.close();
}

/**
 * Generates an actual .pdf file of the official bilingual admission form and triggers browser download.
 */
export async function downloadAdmissionFormPdf(
  content: Partial<SchoolWebsiteContent>,
  logoUrl?: string,
  version: AdmissionPdfVersion = "blank"
): Promise<void> {
  // 1. If admin uploaded or configured a direct custom PDF file (other than the default placeholder), download that
  const customUrl = content.admissionFormPdfUrl;
  if (
    customUrl &&
    customUrl.trim() &&
    customUrl !== "#" &&
    !customUrl.includes("Admission_Form_2026.pdf") &&
    customUrl.toLowerCase().endsWith(".pdf")
  ) {
    const a = document.createElement("a");
    a.href = customUrl;
    a.download =
      version === "English"
        ? "Admission_Form_2026_English_Version.pdf"
        : version === "Bangla"
        ? "Admission_Form_2026_Bangla_Version.pdf"
        : "Admission_Form_2026.pdf";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 2. Pre-load logo to Base64 to ensure html2canvas can render it without CORS taint
  let safeLogoUrl = logoUrl;
  if (logoUrl && !logoUrl.startsWith("data:")) {
    try {
      const resp = await fetch(logoUrl);
      if (resp.ok) {
        const blob = await resp.blob();
        safeLogoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(logoUrl);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Keep original URL
    }
  }

  // 3. Render the bilingual HTML template into an offscreen element and export via jsPDF
  const container = document.createElement("div");
  container.id = "admission-pdf-download-container";
  container.style.position = "absolute";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "794px"; // Standard A4 width in pixels at 96 DPI (210mm)
  container.style.zIndex = "-99999";
  container.style.pointerEvents = "none";
  container.style.backgroundColor = "#ffffff";
  container.style.margin = "0";
  container.style.padding = "0";

  container.innerHTML = getAdmissionFormHtml(content, safeLogoUrl, false, false, version);
  document.body.appendChild(container);

  try {
    // Wait for web fonts if available
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch { }
    }

    // Wait for logo or any image to finish loading
    const images = Array.from(container.querySelectorAll("img"));
    if (images.length > 0) {
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalHeight !== 0) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      );
    }

    // Small delay to ensure web fonts and styles are fully applied
    await new Promise((resolve) => setTimeout(resolve, 250));

    const targetElement = (container.querySelector(".page-container") as HTMLElement) || container;

    const canvas = await html2canvas(targetElement, {
      scale: 2, // 2x resolution for crisp high-quality text and lines
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Seamlessly fit all content across the full A4 page (210mm x 297mm)
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

    const filename =
      version === "English"
        ? "Admission_Form_2026_English_Version.pdf"
        : version === "Bangla"
        ? "Admission_Form_2026_Bangla_Version.pdf"
        : "Admission_Form_2026.pdf";
    pdf.save(filename);
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Generates an official bilingual print-ready A4 document in an iframe/window
 */
export function openAdmissionFormPrintWindow(
  content: Partial<SchoolWebsiteContent>,
  logoUrl?: string,
  version: AdmissionPdfVersion = "blank"
): void {
  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (!printWindow) {
    alert("Please allow popups to preview and print the Admission Form.");
    return;
  }

  const html = getAdmissionFormHtml(content, logoUrl, true, true, version);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
