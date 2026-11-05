/**
 * Helper to clean and restore fee text and titles
 * Automatically recovers any question marks (????) caused by legacy database collation
 */

const KNOWN_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  // Patterns like '????? ???? (???????)' -> 'মাসিক বেতন (নভেম্বর)'
  { pattern: /\?{4,5}\s+\?{4,5}\s*\(\?{6,8}\)/g, replacement: "মাসিক বেতন (নভেম্বর)" },
  { pattern: /\?{4,5}\s+\?{4,5}/g, replacement: "মাসিক বেতন" },
  { pattern: /Board Registration Fee\s*\(\?{4,}\.{0,3}\)?/gi, replacement: "বোর্ড রেজিস্ট্রেশন ফি (Board Registration Fee)" },
  { pattern: /Board Registration Fee\s*\([^\)]*?\?+[^\)]*?\)/gi, replacement: "বোর্ড রেজিস্ট্রেশন ফি (Board Registration Fee)" },
  { pattern: /Admission Fee\s*\([^\)]*?\?+[^\)]*?\)/gi, replacement: "ভর্তি ফি (Admission Fee)" },
  { pattern: /Session Charge\s*\([^\)]*?\?+[^\)]*?\)/gi, replacement: "সেশন ফি (Session Charge)" },
  { pattern: /Exam Fee\s*\([^\)]*?\?+[^\)]*?\)/gi, replacement: "পরীক্ষা ফি (Exam Fee)" },
  { pattern: /Lab Fee\s*\([^\)]*?\?+[^\)]*?\)/gi, replacement: "ল্যাব ফি (Lab Fee)" },
  { pattern: /Transport\s*\([^\)]*?\?+[^\)]*?\)/gi, replacement: "পরিবহন ফি (Transport Fee)" },
  { pattern: /\(\?{3,}\.{0,3}\)/g, replacement: "" },
  { pattern: /\?{3,}/g, replacement: "" },
];

export function cleanFeeTitle(title: string | undefined | null): string {
  if (!title) return "একাডেমিক ফি (Academic Fee)";

  let cleaned = title.trim();

  // Apply replacements for corrupted question marks
  for (const { pattern, replacement } of KNOWN_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // Clean trailing punctuation or messy plus signs
  cleaned = cleaned.replace(/\s*\+\s*\+/g, " + ");
  cleaned = cleaned.replace(/^\s*\+\s*/, "");
  cleaned = cleaned.replace(/\s*\+\s*$/, "");
  cleaned = cleaned.trim();

  if (!cleaned || cleaned.length < 3) {
    return "একাডেমিক ফি (Academic Fee)";
  }

  return cleaned;
}

/**
 * Splits a composite fee title (e.g. "মাসিক বেতন + বোর্ড রেজিস্ট্রেশন ফি")
 * into individual clean items for clear display on the receipt.
 */
export function parseFeeItems(title: string | undefined | null, defaultAmount?: number): Array<{ name: string; amount?: number }> {
  const cleaned = cleanFeeTitle(title);
  const parts = cleaned.split(/\s+\+\s+/).map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) {
    return [{ name: "একাডেমিক ফি (Academic Fee)", amount: defaultAmount }];
  }

  return parts.map((part) => ({
    name: part,
  }));
}

