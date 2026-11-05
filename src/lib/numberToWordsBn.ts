// Helper to convert numbers to Bengali & English words for School & College Receipts

const onesBn = ["", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোল", "সতেরো", "আঠারো", "উনিশ"];
const tensBn = ["", "", "বিশ", "ত্রিশ", "চল্লিশ", "পঞ্চাশ", "ষাট", "সত্তর", "আশি", "নব্বই"];

const onesEn = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tensEn = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function convertUnderThousandBn(n: number): string {
  let s = "";
  if (n >= 100) {
    const h = Math.floor(n / 100);
    s += (h === 1 ? "একশত " : `${onesBn[h]} শত `);
    n %= 100;
  }
  if (n > 0) {
    if (n < 20) {
      s += onesBn[n] + " ";
    } else {
      const t = Math.floor(n / 10);
      const r = n % 10;
      s += tensBn[t] + (r > 0 ? " " + onesBn[r] : "") + " ";
    }
  }
  return s.trim();
}

function convertUnderThousandEn(n: number): string {
  let s = "";
  if (n >= 100) {
    s += `${onesEn[Math.floor(n / 100)]} Hundred `;
    n %= 100;
  }
  if (n > 0) {
    if (n < 20) {
      s += onesEn[n] + " ";
    } else {
      s += tensEn[Math.floor(n / 10)] + (n % 10 > 0 ? "-" + onesEn[n % 10] : "") + " ";
    }
  }
  return s.trim();
}

export function numberToBengaliWords(num: number): string {
  const n = Math.floor(Math.abs(num));
  if (n === 0) return "শূন্য টাকা মাত্র";

  let crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  let lakh = Math.floor(rem / 100000);
  rem %= 100000;
  let thousand = Math.floor(rem / 1000);
  rem %= 1000;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${convertUnderThousandBn(crore)} কোটি`);
  if (lakh > 0) parts.push(`${convertUnderThousandBn(lakh)} লাখ`);
  if (thousand > 0) parts.push(`${convertUnderThousandBn(thousand)} হাজার`);
  if (rem > 0) parts.push(convertUnderThousandBn(rem));

  return parts.join(" ").trim() + " টাকা মাত্র";
}

export function numberToEnglishWords(num: number): string {
  const n = Math.floor(Math.abs(num));
  if (n === 0) return "Zero Taka Only";

  let crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  let lakh = Math.floor(rem / 100000);
  rem %= 100000;
  let thousand = Math.floor(rem / 1000);
  rem %= 1000;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${convertUnderThousandEn(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertUnderThousandEn(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertUnderThousandEn(thousand)} Thousand`);
  if (rem > 0) parts.push(convertUnderThousandEn(rem));

  return "Taka " + parts.join(" ").trim() + " Only";
}

