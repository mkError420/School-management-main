/**
 * Helper to clean and restore fee text, titles, and itemized fee breakdown
 * Automatically recovers any question marks (????) caused by legacy database collation
 * and formats fee titles properly for receipts and invoices.
 */

export interface ParsedFeeItem {
  name: string;
  amount: number;
  discount?: number;
  late_fine?: number;
  net?: number;
}

const CATEGORY_MAP: Array<{
  match: RegExp;
  cleanName: string;
  defaultAmount: number;
}> = [
  { match: /coaching/i, cleanName: "Coaching & Special Class Fee (বিশেষ কোচিং ফি)", defaultAmount: 1000 },
  { match: /diary|syllabus/i, cleanName: "Diary, Syllabus & Calendar (ডায়েরি, সিলেবাস ও ক্যালেন্ডার)", defaultAmount: 200 },
  { match: /late\s*payment|late\s*fine|জরিমানা/i, cleanName: "Late Payment Fine (বিলম্ব ফি / জরিমানা)", defaultAmount: 50 },
  { match: /library|reading\s*room|লাইব্রেরি/i, cleanName: "Library & Reading Room (লাইব্রেরি ও রিডিং রুম)", defaultAmount: 150 },
  { match: /religious|milad|puja|ধর্মীয়|মিলাদ/i, cleanName: "Religious & Milad / Puja Fund (ধর্মীয় ও মিলাদ তহবিল)", defaultAmount: 120 },
  { match: /mosque|development|উন্নয়ন|মসজিদ/i, cleanName: "School Development & Mosque (উন্নয়ন ও মসজিদ তহবিল)", defaultAmount: 300 },
  { match: /transport|bus\s*service|পরিবহন/i, cleanName: "Transport / Bus Service Fee (পরিবহন / বাস সার্ভিস ফি)", defaultAmount: 1200 },
  { match: /sports|cultural|scout|ক্রীড়া|সাংস্কৃতিক/i, cleanName: "Sports, Cultural & Scout Fund (ক্রীড়া, সাংস্কৃতিক ও স্কাউট)", defaultAmount: 350 },
  { match: /ict\s*&|ict\s*lab|computer\s*lab|ল্যাব\s*ফি/i, cleanName: "ICT & Computer Lab Fee (আইসিটি ও কম্পিউটার ল্যাব ফি)", defaultAmount: 250 },
  { match: /computer\s*&\s*science/i, cleanName: "Computer & Science Lab Fee (কম্পিউটার ও বিজ্ঞান ল্যাব ফি)", defaultAmount: 250 },
  { match: /science\s*practical|বিজ্ঞানাগার/i, cleanName: "Science Practical Lab Fee (বিজ্ঞানাগার ল্যাব ফি)", defaultAmount: 300 },
  { match: /pre-?test|নির্বাচনী|টেস্ট/i, cleanName: "Pre-Test & Test Exam Fee (প্রাক-নির্বাচনী ও টেস্ট পরীক্ষা ফি)", defaultAmount: 700 },
  { match: /1st\s*term|১ম\s*সাময়িক/i, cleanName: "1st Term Exam Fee (১ম সাময়িক পরীক্ষা ফি)", defaultAmount: 450 },
  { match: /half-?yearly|অর্ধবার্ষিক/i, cleanName: "Half-Yearly Exam Fee (অর্ধবার্ষিক পরীক্ষা ফি)", defaultAmount: 500 },
  { match: /annual|final\s*exam|বার্ষিক\s*পরীক্ষা/i, cleanName: "Annual / Final Exam Fee (বার্ষিক / ফাইনাল পরীক্ষা ফি)", defaultAmount: 600 },
  { match: /admission|ভর্তি\s*ফি/i, cleanName: "Admission Fee (ভর্তি ফি)", defaultAmount: 2500 },
  { match: /session|পুনর্ভর্তি|সেশন\s*ফি/i, cleanName: "Session Charge / Re-Admission (সেশন ফি / পুনর্ভর্তি)", defaultAmount: 2000 },
  { match: /board\s*registration|বোর্ড\s*রেজিস্ট্রেশন/i, cleanName: "Board Registration Fee (বোর্ড রেজিস্ট্রেশন ফি)", defaultAmount: 850 },
  { match: /board\s*form|ফরম\s*পূরণ/i, cleanName: "Board Form Fill-up & Center Fee (বোর্ড ফরম পূরণ ও কেন্দ্র ফি)", defaultAmount: 2200 },
  { match: /id\s*card|lanyard|আইডি\s*কার্ড/i, cleanName: "Digital ID Card & Lanyard (ডিজিটাল আইডি কার্ড ও ফিতা)", defaultAmount: 150 },
  { match: /hostel|dining|হোস্টেল/i, cleanName: "Hostel & Dining Charge (হোস্টেল ও আবাসিক মেস ফি)", defaultAmount: 4500 },
  { match: /certificate|tc\s*fee|ছাড়পত্র/i, cleanName: "Certificate & TC Fee (প্রশংসাপত্র ও ছাড়পত্র ফি)", defaultAmount: 250 },
  { match: /tuition|মাসিক\s*বেতন/i, cleanName: "মাসিক বেতন (Monthly Tuition Fee)", defaultAmount: 800 },
  { match: /academic|একাডেমিক/i, cleanName: "একাডেমিক ফি (Academic Fee)", defaultAmount: 500 },
];

/**
 * Cleans an individual fee item name, removing corrupted collation marks
 * and restoring proper bilingual titles.
 */
export function cleanSingleFeeItem(raw: string): { name: string; defaultAmount: number } {
  if (!raw) return { name: "একাডেমিক ফি (Academic Fee)", defaultAmount: 500 };

  let text = raw.trim();

  // If this item is Monthly Tuition with specific month(s), e.g. "মাসিক বেতন (নভেম্বর)"
  const monthMatch = text.match(/মাসিক বেতন\s*\(([^)]+)\)/i) || text.match(/Tuition\s*\(([^)]+)\)/i);
  if (monthMatch && !monthMatch[1].includes("?")) {
    return {
      name: `মাসিক বেতন (${monthMatch[1].trim()})`,
      defaultAmount: 800,
    };
  }

  // Look for a known category match
  for (const cat of CATEGORY_MAP) {
    if (cat.match.test(text)) {
      return {
        name: cat.cleanName,
        defaultAmount: cat.defaultAmount,
      };
    }
  }

  // Fallback cleanup: strip any stray question marks, corrupted parens like '( ? )', '( , ? )', '( ?? / )'
  text = text
    .replace(/\s*\(\s*[\?,/\s-]*\s*\)/g, "")
    .replace(/\?+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!text || text.length < 2) {
    return { name: "একাডেমিক ফি (Academic Fee)", defaultAmount: 500 };
  }

  return { name: text, defaultAmount: 500 };
}

/**
 * Cleans a composite fee title and restores corrupted question marks.
 */
export function cleanFeeTitle(title: string | undefined | null): string {
  if (!title) return "একাডেমিক ফি (Academic Fee)";

  const raw = String(title).trim();
  if (!raw) return "একাডেমিক ফি (Academic Fee)";

  // Split composite titles joined by ' + '
  const parts = raw.split(/\s+\+\s+/).map((p) => p.trim()).filter(Boolean);

  if (parts.length > 1) {
    return parts.map((part) => cleanSingleFeeItem(part).name).join(" + ");
  }

  return cleanSingleFeeItem(raw).name;
}

/**
 * Splits a composite fee title (e.g. "মাসিক বেতন + বোর্ড রেজিস্ট্রেশন ফি")
 * into individual clean items with realistic amounts for clear display on the receipt.
 */
export function parseFeeItems(
  title: string | undefined | null,
  totalAmount?: number
): ParsedFeeItem[] {
  const total = Number(totalAmount || 0);
  if (!title) {
    return [{ name: "একাডেমিক ফি (Academic Fee)", amount: total > 0 ? total : 500 }];
  }

  const parts = String(title)
    .split(/\s+\+\s+|\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [{ name: "একাডেমিক ফি (Academic Fee)", amount: total > 0 ? total : 500 }];
  }

  if (parts.length === 1) {
    const cleaned = cleanSingleFeeItem(parts[0]);
    return [{
      name: cleaned.name,
      amount: total > 0 ? total : cleaned.defaultAmount,
    }];
  }

  // Multiple items: resolve each item's clean name and default amount
  const cleanedItems = parts.map((p) => cleanSingleFeeItem(p));
  const sumDefaults = cleanedItems.reduce((acc, it) => acc + it.defaultAmount, 0);

  // If sum of defaults matches total or total is 0, use default amounts
  if (total <= 0 || Math.abs(sumDefaults - total) < 1) {
    return cleanedItems.map((it) => ({
      name: it.name,
      amount: it.defaultAmount,
    }));
  }

  // Otherwise, distribute the total proportionately across the items
  let runningSum = 0;
  return cleanedItems.map((it, idx) => {
    if (idx === cleanedItems.length - 1) {
      // Last item gets remaining cents/difference to prevent rounding error
      const lastAmount = Math.max(0, Math.round((total - runningSum) * 100) / 100);
      return {
        name: it.name,
        amount: lastAmount,
      };
    }
    const itemShare = Math.round(((it.defaultAmount / sumDefaults) * total) * 100) / 100;
    runningSum += itemShare;
    return {
      name: it.name,
      amount: itemShare,
    };
  });
}
