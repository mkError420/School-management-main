/**
 * Comprehensive Dynamic Synchronization Utility
 * Links Staff Management (/list/staff and /list/teachers)
 * directly with Website Content ("৫. শিক্ষক ও কর্মকর্তা পরিচিতি - Faculty & Staff Directory")
 * and Frontend Public "Teachers" Pages (/teachers, /teachers-list).
 */

import { DEFAULT_WEBSITE_CONTENT } from "@/types/site";
import type { SchoolTeacherMember, SchoolWebsiteContent } from "@/types/site";
import { translateEnToBn, translateBnToEn } from "@/lib/translation";
import { api } from "@/lib/api";

const CONTENT_STORAGE_KEY = "school_site_website_content";

/**
 * Cleanly maps designation to bilingual Bengali & English
 */
export const mapStaffDesignation = (
  rawDesig?: string,
  type?: string
): { bn: string; en: string } => {
  const raw = (rawDesig || "").trim();
  const typeUpper = (type || "").toUpperCase();

  const bnToEn: Record<string, string> = {
    "প্রধান শিক্ষক": "Headmaster",
    "অধ্যক্ষ": "Principal",
    "সহকারী প্রধান শিক্ষক": "Assistant Headmaster",
    "উপাধ্যক্ষ": "Vice Principal",
    "সিনিয়র শিক্ষক": "Senior Teacher",
    "সহকারী শিক্ষক": "Assistant Teacher",
    "জুনিয়র শিক্ষক": "Junior Teacher",
    "আইসিটি শিক্ষক": "ICT Teacher",
    "শারীরিক শিক্ষা শিক্ষক": "Physical Education Teacher",
    "ধর্ম শিক্ষক": "Religious Studies Teacher",
    "প্রধান সহকারী ও হিসাবরক্ষক": "Head Assistant & Accountant",
    "হিসাবরক্ষক": "Accountant",
    "অফিস সহকারী": "Office Assistant",
    "প্রশাসনিক কর্মকর্তা": "Administrative Officer",
    "কম্পিউটার অপারেটর": "Computer Operator",
    "গ্রন্থাগারিক": "Librarian",
    "সহকারী গ্রন্থাগারিক": "Assistant Librarian",
    "ল্যাব সহকারী": "Lab Assistant",
    "নিরাপত্তা বিশেষজ্ঞ": "Security Specialist",
    "নিরাপত্তা প্রহরী": "Security Guard",
    "সহায়ক কর্মচারী": "Support Staff",
    "পরিচ্ছন্নতাকর্মী": "Cleaner / Sweeper",
    "আয়া": "Ayah",
    "মালি": "Gardener",
    "কর্মচারী": "Staff Member",
  };

  const enToBn: Record<string, string> = {
    headmaster: "প্রধান শিক্ষক",
    principal: "অধ্যক্ষ",
    "assistant headmaster": "সহকারী প্রধান শিক্ষক",
    "asst. headmaster": "সহকারী প্রধান শিক্ষক",
    "asst headmaster": "সহকারী প্রধান শিক্ষক",
    "vice principal": "উপাধ্যক্ষ",
    "vice-principal": "উপাধ্যক্ষ",
    "senior teacher": "সিনিয়র শিক্ষক",
    "assistant teacher": "সহকারী শিক্ষক",
    "asst. teacher": "সহকারী শিক্ষক",
    teacher: "সহকারী শিক্ষক",
    "academic teacher": "সহকারী শিক্ষক",
    "junior teacher": "জুনিয়র শিক্ষক",
    "ict teacher": "আইসিটি শিক্ষক",
    "physical education teacher": "শারীরিক শিক্ষা শিক্ষক",
    "religious studies teacher": "ধর্ম শিক্ষক",
    accountant: "হিসাবরক্ষক",
    "head assistant & accountant": "প্রধান সহকারী ও হিসাবরক্ষক",
    "office assistant": "অফিস সহকারী",
    "administrative officer": "প্রশাসনিক কর্মকর্তা",
    "computer operator": "কম্পিউটার অপারেটর",
    librarian: "গ্রন্থাগারিক",
    "assistant librarian": "সহকারী গ্রন্থাগারিক",
    "lab assistant": "ল্যাব সহকারী",
    "security specialist": "নিরাপত্তা বিশেষজ্ঞ",
    "security guard": "নিরাপত্তা প্রহরী",
    "support staff": "সহায়ক কর্মচারী",
    cleaner: "পরিচ্ছন্নতাকর্মী",
    ayah: "আয়া",
    gardener: "মালি",
    "staff member": "কর্মচারী",
  };

  if (!raw) {
    if (typeUpper === "TEACHING") return { bn: "সহকারী শিক্ষক", en: "Assistant Teacher" };
    if (typeUpper === "ADMINISTRATIVE") return { bn: "প্রশাসনিক কর্মকর্তা", en: "Administrative Officer" };
    return { bn: "কর্মচারী", en: "Staff Member" };
  }

  if (bnToEn[raw]) {
    return { bn: raw, en: bnToEn[raw] };
  }

  const lower = raw.toLowerCase();
  if (enToBn[lower]) {
    return { bn: enToBn[lower], en: raw };
  }

  // Regex checks
  if (/vice\s*principal|উপাধ্যক্ষ/i.test(raw)) return { bn: "উপাধ্যক্ষ", en: "Vice Principal" };
  if (/assistant\s*head|asst\.?\s*head|সহকারী\s*প্রধান/i.test(raw)) return { bn: "সহকারী প্রধান শিক্ষক", en: "Assistant Headmaster" };
  if (/principal|headmaster|head\s*teacher|প্রধান\s*শিক্ষক/i.test(raw)) return { bn: "প্রধান শিক্ষক", en: "Headmaster" };
  if (/senior\s*teacher|সিনিয়র\s*শিক্ষক/i.test(raw)) return { bn: "সিনিয়র শিক্ষক", en: "Senior Teacher" };
  if (/teacher|শিক্ষক/i.test(raw) || typeUpper === "TEACHING") {
    const bn = /[\u0980-\u09FF]/.test(raw) ? raw : translateEnToBn(raw) || "সহকারী শিক্ষক";
    const en = /[\u0980-\u09FF]/.test(raw) ? (translateBnToEn(raw) || "Assistant Teacher") : raw;
    return { bn, en };
  }
  if (/admin|officer|manager|প্রশাসন|কর্মকর্তা/i.test(raw) || typeUpper === "ADMINISTRATIVE") {
    const bn = /[\u0980-\u09FF]/.test(raw) ? raw : translateEnToBn(raw) || "প্রশাসনিক কর্মকর্তা";
    const en = /[\u0980-\u09FF]/.test(raw) ? (translateBnToEn(raw) || "Administrative Officer") : raw;
    return { bn, en };
  }

  const bn = /[\u0980-\u09FF]/.test(raw) ? raw : translateEnToBn(raw) || raw;
  const en = /[\u0980-\u09FF]/.test(raw) ? (translateBnToEn(raw) || raw) : raw;
  return { bn, en };
};

/**
 * Cleanly maps department/subject to bilingual Bengali & English
 */
export const mapStaffSubject = (
  rawSubject?: string,
  department?: string,
  type?: string
): { bn: string; en: string } => {
  const raw = (rawSubject || department || "").trim();
  const typeUpper = (type || "").toUpperCase();

  const dict: Record<string, { bn: string; en: string }> = {
    mathematics: { bn: "গণিত", en: "Mathematics" },
    math: { bn: "গণিত", en: "Mathematics" },
    bangla: { bn: "বাংলা", en: "Bangla" },
    bengali: { bn: "বাংলা", en: "Bangla" },
    english: { bn: "ইংরেজি", en: "English" },
    science: { bn: "সাধারণ বিজ্ঞান", en: "General Science" },
    "general science": { bn: "সাধারণ বিজ্ঞান", en: "General Science" },
    physics: { bn: "পদার্থবিজ্ঞান", en: "Physics" },
    chemistry: { bn: "রসায়ন", en: "Chemistry" },
    biology: { bn: "জীববিজ্ঞান", en: "Biology" },
    "higher math": { bn: "উচ্চতর গণিত", en: "Higher Mathematics" },
    "higher mathematics": { bn: "উচ্চতর গণিত", en: "Higher Mathematics" },
    ict: { bn: "তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)", en: "ICT" },
    "information and communication technology": { bn: "তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)", en: "Information & Communication Technology" },
    "social science": { bn: "সামাজিক বিজ্ঞান", en: "Social Science" },
    history: { bn: "ইতিহাস", en: "History" },
    geography: { bn: "ভূগোল", en: "Geography" },
    economics: { bn: "অর্থনীতি", en: "Economics" },
    accounting: { bn: "হিসাববিজ্ঞান", en: "Accounting" },
    "business studies": { bn: "ব্যবসায় উদ্যোগ", en: "Business Studies" },
    finance: { bn: "অর্থ ও হিসাব", en: "Finance & Accounts" },
    "islamic studies": { bn: "ইসলাম ও নৈতিক শিক্ষা", en: "Islamic Studies" },
    islam: { bn: "ইসলাম ধর্ম", en: "Islamic Studies" },
    hinduism: { bn: "হিন্দু ধর্ম ও নৈতিক শিক্ষা", en: "Hindu Studies" },
    "physical education": { bn: "শারীরিক শিক্ষা ও স্বাস্থ্য", en: "Physical Education & Health" },
    "arts and crafts": { bn: "চারু ও কারুকলা", en: "Arts and Crafts" },
    agriculture: { bn: "কৃষি শিক্ষা", en: "Agriculture Studies" },
    operations: { bn: "সার্বিক কার্যক্রম ও ব্যবস্থাপনা", en: "Operations & Campus Management" },
    administration: { bn: "প্রশাসন ও অফিস ব্যবস্থাপনা", en: "Administration & Office Management" },
    "safety & security": { bn: "নিরাপত্তা ও শৃঙ্খলা", en: "Safety & Security" },
    "academic faculty": { bn: "সাধারণ অ্যাকাডেমিক শিক্ষা", en: "General Academic Faculty" },
  };

  if (!raw) {
    if (typeUpper === "TEACHING") return { bn: "সাধারণ শিক্ষা", en: "General Academic" };
    if (typeUpper === "ADMINISTRATIVE") return { bn: "প্রশাসন ও অফিস ব্যবস্থাপনা", en: "Administration" };
    return { bn: "সার্বিক ক্যাম্পাস সেবা", en: "Campus Operations" };
  }

  const lower = raw.toLowerCase();
  if (dict[lower]) {
    return dict[lower];
  }

  for (const item of Object.values(dict)) {
    if (item.bn === raw) {
      return item;
    }
  }

  if (/[\u0980-\u09FF]/.test(raw)) {
    return { bn: raw, en: translateBnToEn(raw) || raw };
  }

  const bn = translateEnToBn(raw) || raw;
  return { bn, en: raw };
};

/**
 * Cleanly maps staff qualification to bilingual Bengali & English
 */
export const mapStaffQualification = (
  rawQual?: string,
  type?: string
): { bn: string; en: string } => {
  const qual = (rawQual || "").trim();
  const typeUpper = (type || "").toUpperCase();

  if (!qual) {
    return typeUpper === "TEACHING"
      ? { bn: "বি.এড / এম.এড", en: "B.Ed / M.Ed" }
      : { bn: "স্নাতক / ডিপ্লোমা", en: "Graduate / Diploma" };
  }

  const bn = /[\u0980-\u09FF]/.test(qual) ? qual : translateEnToBn(qual) || qual;
  const en = /[\u0980-\u09FF]/.test(qual) ? (translateBnToEn(qual) || qual) : qual;
  return { bn, en };
};

/**
 * Cleanly formats bilingual name
 */
export const formatBilingualStaffName = (
  firstName?: string,
  surname?: string
): { bn: string; en: string } => {
  const fName = (firstName || "").trim();
  const sName = (surname || "").trim();
  const fullName = sName ? `${fName} ${sName}`.trim() : fName;

  if (!fullName) {
    return { bn: "শিক্ষক সদস্য", en: "Faculty Member" };
  }

  if (/[\u0980-\u09FF]/.test(fullName)) {
    return {
      bn: fullName,
      en: translateBnToEn(fullName) || fullName,
    };
  }

  // Common Bangladesh Honorifics & Name Prefixes
  let bn = fullName;
  const honorifics: [RegExp, string][] = [
    [/\bMd\.?\b/gi, "মোঃ"],
    [/\bMohammad\b/gi, "মোহাম্মদ"],
    [/\bMuhammad\b/gi, "মুহাম্মদ"],
    [/\bMost\b/gi, "মোসাঃ"],
    [/\bMst\.?\b/gi, "মোসাঃ"],
    [/\bMr\.?\b/gi, "জনাব"],
    [/\bMrs\.?\b/gi, "বেগম"],
    [/\bDr\.?\b/gi, "ড."],
    [/\bProf\.?\b/gi, "অধ্যাপক"],
    [/\bEngr\.?\b/gi, "প্রকৌশলী"],
  ];
  for (const [re, sub] of honorifics) {
    bn = bn.replace(re, sub);
  }

  const translated = translateEnToBn(bn);
  return {
    bn: translated || bn,
    en: fullName,
  };
};

/**
 * Maps raw staff record from database or form to SchoolTeacherMember
 */
export const mapStaffMemberToTeacher = (
  s: any,
  idx: number = 0
): SchoolTeacherMember => {
  const isTeaching = s.type === "TEACHING" || /teacher|শিক্ষক/i.test(s.designation || "");
  const isAdmin = s.type === "ADMINISTRATIVE" || /admin|officer|manager|প্রশাসন/i.test(s.designation || "");
  const category: "শিক্ষক" | "প্রশাসন" | "কর্মচারী" = isTeaching
    ? "শিক্ষক"
    : isAdmin
      ? "প্রশাসন"
      : "কর্মচারী";

  const rawSubjects =
    s.subjects_list ||
    (Array.isArray(s.subjects)
      ? s.subjects.map((sub: any) => (typeof sub === "string" ? sub : sub?.name || "")).filter(Boolean).join(", ")
      : s.subjects) ||
    s.department ||
    "";

  const name = formatBilingualStaffName(s.name, s.surname);
  const designation = mapStaffDesignation(s.designation, s.type);
  const subject = mapStaffSubject(rawSubjects, s.department, s.type);
  const qualification = mapStaffQualification(s.qualification, s.type);

  const identifier = s.staff_no || s.id || `stf_${Date.now()}_${idx + 1}`;
  const targetId = String(identifier).startsWith("stf_") ? String(identifier) : `stf_${identifier}`;

  return {
    id: targetId,
    name: name.bn,
    nameEn: name.en,
    designation: designation.bn,
    designationEn: designation.en,
    subject: subject.bn,
    subjectEn: subject.en,
    qualification: qualification.bn,
    qualificationEn: qualification.en,
    phone: s.phone || "",
    email: s.email || "",
    photo: s.img || s.photo || "/images/avatar.png",
    category,
    message: s.notes || s.message || "",
    messageEn: s.notes || s.messageEn || "",
  };
};

/**
 * Check if teachers array only contains initial static placeholder demo items (t1 to t7)
 */
export const isPlaceholderDemoTeachers = (teachers?: SchoolTeacherMember[]): boolean => {
  if (!teachers || teachers.length === 0) return true;
  return teachers.length <= 7 && teachers.every((t) => /^t[1-7]$/.test(t.id));
};

/**
 * Merge an array of staff with existing website teachers
 */
export const mergeStaffWithWebsiteTeachers = (
  existingTeachers: SchoolTeacherMember[] = [],
  staffList: any[] = []
): SchoolTeacherMember[] => {
  if (!Array.isArray(staffList) || staffList.length === 0) {
    return existingTeachers;
  }

  const mappedStaff = staffList.map((s, idx) => mapStaffMemberToTeacher(s, idx));

  // If website teachers has only static demo placeholders (t1..t7) and we have real staff,
  // replace the demo placeholders with the real staff members!
  if (isPlaceholderDemoTeachers(existingTeachers)) {
    return mappedStaff;
  }

  // Build lookup keys for existing teachers
  const existingSet = new Set<string>();
  existingTeachers.forEach((t) => {
    if (t.id) {
      existingSet.add(t.id);
      existingSet.add(t.id.replace(/^stf_/, ""));
      existingSet.add(`stf_${t.id}`);
    }
    if (t.email) {
      existingSet.add(t.email.toLowerCase().trim());
    }
  });

  // Find missing members
  const missing = mappedStaff.filter((m) => {
    const idKey = m.id;
    const rawId = m.id.replace(/^stf_/, "");
    const emailKey = m.email ? m.email.toLowerCase().trim() : "";

    return (
      !existingSet.has(idKey) &&
      !existingSet.has(rawId) &&
      (!emailKey || !existingSet.has(emailKey))
    );
  });

  if (missing.length === 0) {
    return existingTeachers;
  }

  // Prepend newly added staff members to the front of the list
  return [...missing, ...existingTeachers];
};

/**
 * Synchronize a staff member directly into Website Content stored in localStorage
 * and broadcast throughout the application so:
 * 1. "Website content" at "৫. শিক্ষক ও কর্মকর্তা পরিচিতি (Faculty & Staff Directory)" immediately reflects it.
 * 2. Frontend "Teachers" page (/teachers, /teachers-list) immediately reflects it.
 * 3. Persists to backend database site_settings API.
 */
export const syncStaffMemberToWebsite = (
  staffMember: any,
  action: "create" | "update" | "delete" = "create"
): SchoolWebsiteContent => {
  let content: SchoolWebsiteContent = DEFAULT_WEBSITE_CONTENT;

  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        content = { ...DEFAULT_WEBSITE_CONTENT, ...parsed };
      }
    }
  } catch {}

  const currentTeachers = Array.isArray(content.teachers) ? [...content.teachers] : [];
  const staffIdStr = String(staffMember.id || staffMember.staff_no || "");
  const targetId = staffIdStr.startsWith("stf_") ? staffIdStr : `stf_${staffIdStr}`;
  const rawId = staffIdStr.replace(/^stf_/, "");
  const emailLower = staffMember.email ? String(staffMember.email).toLowerCase().trim() : "";

  let nextTeachers: SchoolTeacherMember[] = [];

  if (action === "delete") {
    nextTeachers = currentTeachers.filter((t) => {
      const tId = String(t.id || "");
      const tEmail = t.email ? String(t.email).toLowerCase().trim() : "";
      return tId !== targetId && tId !== rawId && tId !== `stf_${rawId}` && (!emailLower || tEmail !== emailLower);
    });
  } else {
    const newMember = mapStaffMemberToTeacher(staffMember);

    // If existing list only contains placeholder items (t1..t7), replace with real staff
    if (isPlaceholderDemoTeachers(currentTeachers)) {
      nextTeachers = [newMember];
    } else {
      const foundIdx = currentTeachers.findIndex((t) => {
        const tId = String(t.id || "");
        const tEmail = t.email ? String(t.email).toLowerCase().trim() : "";
        return (
          tId === targetId ||
          tId === rawId ||
          tId === `stf_${rawId}` ||
          (emailLower && tEmail === emailLower)
        );
      });

      if (foundIdx >= 0) {
        // Update existing entry, preserving custom message/photo if present
        const existing = currentTeachers[foundIdx];
        const merged: SchoolTeacherMember = {
          ...existing,
          ...newMember,
          message: existing.message || newMember.message,
          messageEn: existing.messageEn || newMember.messageEn,
          photo: newMember.photo !== "/images/avatar.png" ? newMember.photo : (existing.photo || newMember.photo),
        };
        nextTeachers = [...currentTeachers];
        nextTeachers[foundIdx] = merged;
      } else {
        // Prepend new staff member to the front so they appear prominently
        nextTeachers = [newMember, ...currentTeachers];
      }
    }
  }

  const updatedContent: SchoolWebsiteContent = {
    ...content,
    teachers: nextTeachers,
    dynamicStaffDirectory: true,
  };

  // 1. Save to local storage
  try {
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(updatedContent));
  } catch {}

  // 2. Dispatch live events across tabs and components
  try {
    window.dispatchEvent(
      new CustomEvent("school-site-settings-updated", {
        detail: { website_content: updatedContent },
      })
    );
    window.dispatchEvent(
      new CustomEvent("school-staff-updated", {
        detail: { staff: staffMember, action, teacher: mapStaffMemberToTeacher(staffMember) },
      })
    );
  } catch {}

  // 3. Persist to MySQL Backend API in background
  try {
    api.updateWebsiteContent(updatedContent).catch(() => {});
  } catch {}

  return updatedContent;
};

