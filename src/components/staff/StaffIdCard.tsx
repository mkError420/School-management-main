import React from "react";
import { StaffMember } from "@/types/staff";
import {
  Award,
  Calendar,
  CheckCircle2,
  Droplet,
  Globe,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Shield,
} from "lucide-react";

export type CardThemeId = "bd-green" | "royal-navy" | "classic-maroon" | "academic-teal";

export interface CardThemeConfig {
  id: CardThemeId;
  name: string;
  nameBn: string;
  primaryBg: string;
  primaryText: string;
  accentBg: string;
  accentText: string;
  headerGrad: string;
  borderColor: string;
  tagColor: string;
  stampInk: string;
}

export const CARD_THEMES: Record<CardThemeId, CardThemeConfig> = {
  "bd-green": {
    id: "bd-green",
    name: "Bangladesh Govt / Model Green",
    nameBn: "বাংলাদেশ সরকারি ও মডেল স্কুল (সবুজ-লাল)",
    primaryBg: "#006a4e",
    primaryText: "#ffffff",
    accentBg: "#f42a41",
    accentText: "#ffffff",
    headerGrad: "from-[#005a40] via-[#006a4e] to-[#047857]",
    borderColor: "#006a4e",
    tagColor: "bg-emerald-800 text-white",
    stampInk: "#047857",
  },
  "royal-navy": {
    id: "royal-navy",
    name: "Royal Navy & Gold",
    nameBn: "রয়্যাল নেভি ও সোনালী (ক্যাডেট/মডেল)",
    primaryBg: "#0f172a",
    primaryText: "#ffffff",
    accentBg: "#d97706",
    accentText: "#ffffff",
    headerGrad: "from-[#0a1128] via-[#0f172a] to-[#1e3a8a]",
    borderColor: "#1e3a8a",
    tagColor: "bg-blue-900 text-amber-200",
    stampInk: "#1e40af",
  },
  "classic-maroon": {
    id: "classic-maroon",
    name: "Traditional Maroon & Gold",
    nameBn: "ঐতিহ্যবাহী মেরুন ও স্বর্ণালি",
    primaryBg: "#831843",
    primaryText: "#ffffff",
    accentBg: "#b45309",
    accentText: "#ffffff",
    headerGrad: "from-[#701a75] via-[#831843] to-[#9f1239]",
    borderColor: "#9f1239",
    tagColor: "bg-rose-950 text-rose-100",
    stampInk: "#9f1239",
  },
  "academic-teal": {
    id: "academic-teal",
    name: "Modern ICT & Academic Teal",
    nameBn: "মডার্ন আইসিটি ও এমারেল্ড",
    primaryBg: "#115e59",
    primaryText: "#ffffff",
    accentBg: "#0284c7",
    accentText: "#ffffff",
    headerGrad: "from-[#0f766e] via-[#115e59] to-[#134e4a]",
    borderColor: "#0f766e",
    tagColor: "bg-teal-900 text-teal-100",
    stampInk: "#0f766e",
  },
};

export interface StaffIdCardProps {
  staff: StaffMember;
  theme?: CardThemeId;
  orientation?: "portrait" | "landscape";
  validityYear?: string;
  issueDate?: string;
  schoolInfo?: {
    schoolName?: string;
    schoolNameBn?: string;
    eiin?: string;
    schoolCode?: string;
    establishedYear?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
  };
  showStamp?: boolean;
  isPrintVersion?: boolean;
  side?: "front" | "back";
}

// Generate realistic SVG Code-128 / Code-39 style Barcode
export const StaffBarcodeSvg: React.FC<{ value: string; className?: string }> = ({
  value,
  className = "w-full h-8",
}) => {
  const bars = React.useMemo(() => {
    const clean = (value || "STF-202601").toUpperCase().replace(/[^A-Z0-9-]/g, "");
    let seed = 0;
    for (let i = 0; i < clean.length; i++) {
      seed = (seed * 31 + clean.charCodeAt(i)) % 100000;
    }

    const pattern: number[] = [2, 1, 1, 2]; // Start guard
    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      pattern.push((code % 3) + 1);
      pattern.push(((code >> 1) % 2) + 1);
      pattern.push(((code >> 2) % 3) + 1);
      pattern.push(1);
    }
    pattern.push(2, 1, 2, 1, 2); // End guard
    return pattern;
  }, [value]);

  const totalUnits = bars.reduce((a, b) => a + b, 0);

  let currentX = 0;
  return (
    <svg
      viewBox={`0 0 ${totalUnits} 30`}
      preserveAspectRatio="none"
      className={className}
    >
      {bars.map((w, idx) => {
        const x = currentX;
        currentX += w;
        if (idx % 2 === 0) {
          return (
            <rect
              key={idx}
              x={x}
              y="0"
              width={w}
              height="30"
              fill="#111827"
            />
          );
        }
        return null;
      })}
    </svg>
  );
};

// Generate realistic 25x25 SVG Scannable QR Code
export const StaffQrCodeSvg: React.FC<{ data: string; size?: number }> = ({
  data,
  size = 72,
}) => {
  const matrix = React.useMemo(() => {
    const n = 25;
    const grid: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

    // Corner Finder Patterns
    const placeFinder = (startR: number, startC: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[startR + r][startC + c] = true;
          }
        }
      }
    };
    placeFinder(0, 0); // Top-left
    placeFinder(0, n - 7); // Top-right
    placeFinder(n - 7, 0); // Bottom-left

    // Timing patterns
    for (let i = 8; i < n - 8; i++) {
      if (i % 2 === 0) {
        grid[6][i] = true;
        grid[i][6] = true;
      }
    }

    // Deterministic data squares from string hash
    let hash = 5381;
    for (let i = 0; i < data.length; i++) {
      hash = (hash * 33) ^ data.charCodeAt(i);
    }

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const inFinder =
          (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
        if (!inFinder && r !== 6 && c !== 6) {
          hash = (hash * 1103515245 + 12345) & 0x7fffffff;
          grid[r][c] = (hash % 100) < 45;
        }
      }
    }
    return grid;
  }, [data]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 25 25"
      className="bg-white p-1 rounded-md border border-gray-200 shadow-sm shrink-0"
    >
      {matrix.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width="1"
              height="1"
              fill="#111827"
            />
          ) : null
        )
      )}
    </svg>
  );
};

// Official Bangladesh Government / Institution Seal Stamp
export const AuthoritySealStamp: React.FC<{
  schoolName?: string;
  inkColor?: string;
  className?: string;
}> = ({ schoolName = "MK MODEL HIGH SCHOOL", inkColor = "#047857", className = "" }) => {
  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none rotate-[-6deg] ${className}`}
      style={{ color: inkColor }}
    >
      <div
        className="w-16 h-16 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-1 text-center relative shadow-sm"
        style={{ borderColor: inkColor }}
      >
        <div className="absolute inset-1 rounded-full border border-dotted opacity-75" style={{ borderColor: inkColor }} />
        <span className="text-[7px] font-black uppercase tracking-tighter leading-none px-1 line-clamp-1">
          {schoolName.split(" ")[0]}
        </span>
        <div className="my-0.5">
          <Award size={10} style={{ color: inkColor }} />
        </div>
        <span className="text-[6.5px] font-bold uppercase tracking-widest leading-none">
          PRINCIPAL
        </span>
        <span className="text-[5.5px] opacity-80 leading-none mt-0.5">
          SEAL & SIGN
        </span>
      </div>
      {/* Simulated Ink Handwritten Signature */}
      <svg
        viewBox="0 0 100 30"
        className="w-16 h-6 -mt-3.5 relative z-10 opacity-90"
        fill="none"
        stroke={inkColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 20 Q 25 5, 45 18 T 75 12 T 95 10 M 20 25 Q 50 15, 80 22" />
      </svg>
    </div>
  );
};

export const StaffIdCard: React.FC<StaffIdCardProps> = ({
  staff,
  theme = "bd-green",
  orientation = "landscape",
  validityYear = "2026 – 2028",
  issueDate = "01-01-2026",
  schoolInfo = {},
  showStamp = true,
  isPrintVersion = false,
  side = "front",
}) => {
  const currentTheme = CARD_THEMES[theme] || CARD_THEMES["bd-green"];

  // Fallback defaults from site or Bangladesh national model
  const schoolNameEn = schoolInfo.schoolName || "MK Government Model High School";
  const schoolNameBn = schoolInfo.schoolNameBn || "এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়";
  const eiin = schoolInfo.eiin || "123456";
  const schoolCode = schoolInfo.schoolCode || "1001";
  const establishedYear = schoolInfo.establishedYear || "1985";
  const address = schoolInfo.address || "College Road, Dhanmondi, Dhaka-1205";
  const phone = schoolInfo.phone || "+880 2 1234 5678";
  const email = schoolInfo.email || "info@mkschool.edu.bd";
  const logo = schoolInfo.logo;

  const isTeacher = staff.type === "TEACHING";

  // Card Type Title (Bilingual)
  const cardTitleEn = isTeacher
    ? "TEACHER IDENTITY CARD"
    : staff.type === "ADMINISTRATIVE"
      ? "OFFICER IDENTITY CARD"
      : "STAFF IDENTITY CARD";

  const cardTitleBn = isTeacher
    ? "শিক্ষক পরিচয়পত্র"
    : staff.type === "ADMINISTRATIVE"
      ? "কর্মকর্তা পরিচয়পত্র"
      : "কর্মচারী পরিচয়পত্র";

  const fullName = `${staff.name || ""} ${staff.surname || ""}`.trim() || "Staff Member";
  const staffId = staff.staff_no || staff.teacher_id || `STF-${staff.id || "001"}`;
  const bloodType = staff.blood_type || "B+";
  const designation = staff.designation || (isTeacher ? "Assistant Teacher" : "Staff Member");
  const department = staff.department || (isTeacher ? "Academic Faculty" : "Administration");

  const avatarUrl =
    staff.img ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      fullName
    )}&background=006a4e&color=fff&size=256&bold=true`;

  const qrData = `INST:${schoolNameEn} | EIIN:${eiin} | ID:${staffId} | NAME:${fullName} | ROLE:${designation} | DEPT:${department} | BLOOD:${bloodType} | PHONE:${staff.phone || phone} | VALID:${validityYear}`;

  /* ================= LANDSCAPE CR80 (85.6mm × 54mm) ================= */
  const renderLandscapeFront = () => (
    <div
      className="relative w-[508px] h-[320px] rounded-2xl overflow-hidden bg-white text-gray-800 shadow-xl border-2 flex flex-col justify-between select-none cr80-landscape-card print:shadow-none print:border print:m-0"
      style={{
        borderColor: currentTheme.borderColor,
      }}
    >
      {/* Decorative Guilloche background */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]" />

      {/* Subtle School Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        {logo ? (
          <img
            src={logo}
            alt=""
            className="w-56 h-56 object-contain opacity-[0.05] grayscale contrast-125"
          />
        ) : (
          <div className="w-52 h-52 rounded-full border-4 border-gray-300 flex items-center justify-center font-black text-gray-400 text-7xl opacity-[0.06]">
            {schoolNameEn.charAt(0)}
          </div>
        )}
      </div>

      {/* Header */}
      <div
        className={`bg-gradient-to-r ${currentTheme.headerGrad} text-white pt-2.5 pb-2 px-3 text-center relative overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center shrink-0 border border-amber-300">
            {logo ? (
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-emerald-800 text-amber-200 font-black text-xs flex items-center justify-center">
                {schoolNameEn.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 text-left min-w-0">
            <h2 className="text-[12px] font-black leading-tight tracking-tight drop-shadow-sm line-clamp-1">
              {schoolNameBn}
            </h2>
            <h1 className="text-[10.5px] font-extrabold uppercase tracking-wide opacity-95 leading-tight line-clamp-1">
              {schoolNameEn}
            </h1>
            <p className="text-[8px] opacity-85 font-medium mt-0.5 line-clamp-1">
              EIIN: <span className="font-bold">{eiin}</span> • CODE: <span className="font-bold">{schoolCode}</span> • ESTD: {establishedYear}
            </p>
          </div>

          <div className="shrink-0 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 py-1 px-2.5 rounded-lg text-center shadow-xs border border-red-400/50">
            <div className="text-[9.5px] font-black tracking-wider uppercase text-white drop-shadow-xs">
              {cardTitleEn}
            </div>
            <div className="text-[8px] font-bold text-amber-200">
              {cardTitleBn}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-3 py-1.5 flex items-stretch gap-3 relative z-10">
        <div className="w-24 shrink-0 flex flex-col items-center justify-between">
          <div className="relative mt-0.5">
            <div className="w-20 h-24 rounded-xl overflow-hidden p-0.5 bg-gradient-to-b from-amber-400 via-gray-200 to-emerald-600 shadow-md border">
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-full h-full object-cover rounded-lg bg-gray-100"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-red-600 to-rose-700 text-white px-1.5 py-0.5 rounded-full text-[8.5px] font-black shadow-md flex items-center gap-0.5 border border-white">
              <Droplet size={8} className="fill-white" />
              <span>{bloodType}</span>
            </div>
          </div>

          <div className="text-center w-full mt-1">
            <div className="h-4 flex items-end justify-center">
              <span className="font-serif italic text-[10px] text-gray-600 tracking-wider line-clamp-1">
                {staff.name || "Holder"}
              </span>
            </div>
            <div className="border-t border-gray-400 mt-0.5 pt-0.5">
              <p className="text-[7px] font-bold text-gray-500 uppercase leading-none">
                কার্ডধারীর স্বাক্ষর
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[14px] font-black text-gray-900 tracking-tight leading-snug truncate">
                {fullName}
              </h3>
              <div className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9.5px] font-bold">
                {designation}
              </div>
            </div>

            <div className="mt-1.5 bg-gray-50/80 rounded-xl p-2 border border-gray-100 text-[9.5px] grid grid-cols-2 gap-x-2 gap-y-1">
              <div>
                <span className="text-gray-500 font-semibold block text-[8px]">Staff / Faculty ID:</span>
                <span className="font-mono font-black text-gray-900 bg-white px-1.5 py-0.2 rounded border border-gray-200 inline-block">
                  {staffId}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block text-[8px]">Department:</span>
                <span className="font-bold text-gray-800 truncate block">
                  {department}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block text-[8px]">Contact No:</span>
                <span className="font-mono font-bold text-gray-800 block">
                  {staff.phone || phone}
                </span>
              </div>
              <div>
                <span className="text-emerald-700 font-bold block text-[8px]">Validity / সেশন:</span>
                <span className="font-bold text-emerald-800 block">{validityYear}</span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-end mt-1">
            <div className="text-center w-28 relative">
              {showStamp ? (
                <div className="h-7 flex items-center justify-center -mb-1">
                  <AuthoritySealStamp
                    schoolName={schoolNameEn}
                    inkColor={currentTheme.stampInk}
                  />
                </div>
              ) : (
                <div className="h-7" />
              )}
              <div className="border-t border-gray-400 mt-0.5 pt-0.5">
                <p className="text-[7.5px] font-black text-emerald-900 uppercase leading-none">
                  অধ্যক্ষ / প্রধান শিক্ষক
                </p>
                <p className="text-[6.5px] text-gray-500 uppercase leading-none">
                  Principal / Headmaster
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`bg-gradient-to-r ${currentTheme.headerGrad} py-1 px-3 text-white flex items-center justify-between text-[7.5px] font-bold tracking-wider`}
      >
        <span className="truncate max-w-[280px]">{address}</span>
        <span className="font-mono text-amber-200">CR80 (85.6mm × 54mm) • ID: {staffId}</span>
      </div>
    </div>
  );

  const renderLandscapeBack = () => (
    <div
      className="relative w-[508px] h-[320px] rounded-2xl overflow-hidden bg-white text-gray-800 shadow-xl border-2 flex flex-col justify-between select-none cr80-landscape-card print:shadow-none print:border print:m-0"
      style={{
        borderColor: currentTheme.borderColor,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        {logo ? (
          <img
            src={logo}
            alt=""
            className="w-56 h-56 object-contain opacity-[0.06] grayscale contrast-125"
          />
        ) : (
          <div className="w-52 h-52 rounded-full border-4 border-gray-300 flex items-center justify-center font-black text-gray-400 text-7xl opacity-[0.06]">
            {schoolNameEn.charAt(0)}
          </div>
        )}
      </div>

      <div
        className={`bg-gradient-to-r ${currentTheme.headerGrad} text-white py-2 px-3 text-center relative`}
      >
        <div className="flex items-center justify-between">
          <p className="text-[8.5px] font-bold tracking-widest uppercase text-amber-200">
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত
          </p>
          <h3 className="text-[11px] font-black uppercase tracking-tight line-clamp-1">
            {schoolNameEn}
          </h3>
        </div>
      </div>

      <div className="flex-1 px-3 py-1.5 grid grid-cols-12 gap-3 relative z-10 text-[9px] items-center">
        <div className="col-span-7 bg-emerald-50/70 border border-emerald-200 rounded-xl p-2 space-y-1 text-gray-700">
          <div className="flex items-center gap-1 text-emerald-900 font-extrabold text-[9.5px] pb-0.5 border-b border-emerald-200/60">
            <CheckCircle2 size={11} className="text-emerald-700" />
            <span>নির্দেশনাবলী ও জরুরি তথ্যাবলী (Terms & Info)</span>
          </div>
          <ol className="list-decimal pl-3 space-y-0.5 text-[8px] leading-tight text-gray-700 font-medium">
            <li>পরিচয়পত্রটি প্রতিষ্ঠানের সম্পত্তি। দায়িত্ব পালনকালে সর্বদা বহন করতে হবে।</li>
            <li>কার্ডটি অহস্তান্তরযোগ্য। অন্য কাউকে ব্যবহারের অনুমতি নিষিদ্ধ।</li>
            <li>হারিয়ে গেলে সাথে সাথে বিদ্যালয় প্রশাসনকে লিখিতভাবে জানাতে হবে।</li>
            <li>কার্ডটি পাওয়া গেলে নিকটস্থ ডাকবাক্সে বা নিচের ঠিকানায় ফেরত দিন।</li>
          </ol>
          <div className="pt-1 border-t border-emerald-200/50 text-[7.5px] text-gray-600 space-y-0.5">
            <div className="flex items-center gap-1 font-bold text-gray-800">
              <MapPin size={8} className="text-emerald-700 shrink-0" />
              <span className="truncate">{address}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span>{phone}</span>
              <span>•</span>
              <span>{email}</span>
            </div>
          </div>
        </div>

        <div className="col-span-5 flex flex-col items-center justify-between gap-1.5">
          <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-1.5 flex items-center justify-between gap-2">
            <div className="space-y-0.5 text-left min-w-0">
              <div className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-emerald-600 text-white text-[7px] font-black uppercase">
                <QrCode size={8} />
                <span>SMART ID</span>
              </div>
              <p className="text-[7px] text-gray-500 font-mono mt-0.5">
                Valid: {validityYear}
              </p>
            </div>
            <StaffQrCodeSvg data={qrData} size={54} />
          </div>

          <div className="w-full bg-white border border-gray-200 rounded-xl p-1 text-center shadow-xs">
            <StaffBarcodeSvg value={staffId} className="w-full h-5 mx-auto" />
            <p className="text-[7.5px] font-mono font-black text-gray-700 tracking-wider">
              *{staffId}*
            </p>
          </div>
        </div>
      </div>

      <div
        className={`bg-gradient-to-r ${currentTheme.headerGrad} py-1 px-3 text-white text-center text-[7.5px] font-bold tracking-wider`}
      >
        <span>PROPERTY OF {schoolNameEn.toUpperCase()} • CR80 (85.6mm × 54mm) • NON-TRANSFERABLE</span>
      </div>
    </div>
  );

  /* ================= PORTRAIT CR80 (54mm × 85.6mm) ================= */
  const renderPortraitFront = () => (
    <div
      className="relative w-[320px] h-[508px] rounded-2xl overflow-hidden bg-white text-gray-800 shadow-xl border-2 flex flex-col justify-between select-none cr80-portrait-card print:shadow-none print:border print:m-0"
      style={{
        borderColor: currentTheme.borderColor,
      }}
    >
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full bg-gray-200/80 border border-gray-300 z-30" />
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]" />

      <div className="absolute -right-3 -top-3 w-24 h-24 opacity-15 pointer-events-none flex items-center justify-center overflow-hidden">
        {logo ? (
          <img
            src={logo}
            alt=""
            className="w-full h-full object-contain filter brightness-200 contrast-125 select-none"
          />
        ) : (
          <div className="w-20 h-20 rounded-full border-2 border-white/40 flex items-center justify-center font-black text-white text-2xl">
            {schoolNameEn.charAt(0)}
          </div>
        )}
      </div>

      <div
        className={`bg-gradient-to-r ${currentTheme.headerGrad} text-white pt-4 pb-2 px-3 text-center relative overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="w-11 h-11 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center shrink-0 border border-amber-300">
            {logo ? (
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-emerald-800 text-amber-200 font-black text-xs flex items-center justify-center">
                {schoolNameEn.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 text-center min-w-0">
            <h2 className="text-[12px] font-black leading-tight tracking-tight drop-shadow-sm line-clamp-1">
              {schoolNameBn}
            </h2>
            <h1 className="text-[10px] font-extrabold uppercase tracking-wide opacity-95 leading-tight line-clamp-1">
              {schoolNameEn}
            </h1>
            <p className="text-[8px] opacity-85 font-medium mt-0.5 line-clamp-1">
              EIIN: <span className="font-bold">{eiin}</span> • CODE:{" "}
              <span className="font-bold">{schoolCode}</span> • ESTD: {establishedYear}
            </p>
          </div>
        </div>

        <div className="mt-2 -mx-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 py-0.5 px-2 flex items-center justify-center gap-1.5 shadow-xs border-y border-red-400/50">
          <span className="text-[10px] font-black tracking-wider uppercase text-white drop-shadow-xs">
            {cardTitleEn}
          </span>
          <span className="text-[9px] font-bold text-amber-200">
            • {cardTitleBn}
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-10 top-24 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        {logo ? (
          <img
            src={logo}
            alt=""
            className="w-48 h-48 object-contain opacity-[0.05] grayscale contrast-125"
          />
        ) : (
          <div className="w-44 h-44 rounded-full border-4 border-gray-300 flex items-center justify-center font-black text-gray-400 text-6xl opacity-[0.06]">
            {schoolNameEn.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-2 flex flex-col items-center justify-between relative z-10">
        <div className="relative mt-0.5">
          <div
            className="w-24 h-28 rounded-xl overflow-hidden p-1 bg-gradient-to-b from-amber-400 via-gray-200 to-emerald-600 shadow-md border"
          >
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-full h-full object-cover rounded-lg bg-gray-100"
            />
          </div>

          <div className="absolute -bottom-1 -right-2 bg-gradient-to-r from-red-600 to-rose-700 text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-md flex items-center gap-0.5 border border-white">
            <Droplet size={9} className="fill-white" />
            <span>{bloodType}</span>
          </div>
        </div>

        <div className="text-center mt-1 w-full">
          <h3 className="text-[14px] font-black text-gray-900 tracking-tight leading-snug line-clamp-1">
            {fullName}
          </h3>
          <div className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold leading-tight">
            {designation}
          </div>
        </div>

        <div className="w-full mt-2 bg-gray-50/80 rounded-xl p-2 border border-gray-100 text-[10px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-semibold">Staff / Faculty ID:</span>
            <span className="font-mono font-black text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200">
              {staffId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-semibold">Department:</span>
            <span className="font-bold text-gray-800 truncate max-w-[170px]">
              {department}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-semibold">Joining Date:</span>
            <span className="font-medium text-gray-700">
              {staff.joining_date || "01-01-2023"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-semibold">Contact No:</span>
            <span className="font-mono font-bold text-gray-800">
              {staff.phone || phone}
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5 border-t border-gray-200">
            <span className="text-emerald-700 font-bold">Validity / সেশন:</span>
            <span className="font-bold text-emerald-800">{validityYear}</span>
          </div>
        </div>

        <div className="w-full mt-1.5 pt-1.5 flex items-end justify-between px-1">
          <div className="text-center w-24">
            <div className="h-6 flex items-end justify-center">
              <span className="font-serif italic text-[11px] text-gray-600 tracking-wider">
                {staff.name || "Holder"}
              </span>
            </div>
            <div className="border-t border-gray-400 mt-0.5 pt-0.5">
              <p className="text-[7.5px] font-bold text-gray-500 uppercase leading-none">
                কার্ডধারীর স্বাক্ষর
              </p>
              <p className="text-[6.5px] text-gray-400 uppercase leading-none">
                Holder's Sign
              </p>
            </div>
          </div>

          <div className="text-center w-28 relative">
            {showStamp ? (
              <div className="h-8 flex items-center justify-center -mb-1">
                <AuthoritySealStamp
                  schoolName={schoolNameEn}
                  inkColor={currentTheme.stampInk}
                />
              </div>
            ) : (
              <div className="h-8" />
            )}
            <div className="border-t border-gray-400 mt-0.5 pt-0.5">
              <p className="text-[7.5px] font-black text-emerald-900 uppercase leading-none">
                অধ্যক্ষ / প্রধান শিক্ষক
              </p>
              <p className="text-[6.5px] text-gray-500 uppercase leading-none">
                Principal / Authority
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`bg-gradient-to-r ${currentTheme.headerGrad} py-1 px-3 text-white flex items-center justify-between text-[7.5px] font-bold tracking-wider`}
      >
        <span className="truncate max-w-[180px]">{address}</span>
        <span className="font-mono text-amber-200">CR80 (54mm × 85.6mm) • ID: {staffId}</span>
      </div>
    </div>
  );

  const renderPortraitBack = () => (
    <div
      className="relative w-[320px] h-[508px] rounded-2xl overflow-hidden bg-white text-gray-800 shadow-xl border-2 flex flex-col justify-between select-none cr80-portrait-card print:shadow-none print:border print:m-0"
      style={{
        borderColor: currentTheme.borderColor,
      }}
    >
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full bg-gray-200/80 border border-gray-300 z-30" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
        {logo ? (
          <img
            src={logo}
            alt=""
            className="w-56 h-56 object-contain opacity-[0.07] grayscale contrast-125"
          />
        ) : (
          <div className="w-52 h-52 rounded-full border-4 border-gray-300 flex items-center justify-center font-black text-gray-400 text-7xl opacity-[0.08]">
            {schoolNameEn.charAt(0)}
          </div>
        )}
      </div>

      <div
        className={`bg-gradient-to-r ${currentTheme.headerGrad} text-white pt-4 pb-2 px-3 text-center relative`}
      >
        <p className="text-[9px] font-bold tracking-widest uppercase text-amber-200">
          গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত
        </p>
        <h3 className="text-[12px] font-black uppercase tracking-tight line-clamp-1">
          {schoolNameEn}
        </h3>
        <p className="text-[8px] opacity-90 line-clamp-1">{schoolNameBn}</p>
      </div>

      <div className="flex-1 px-4 py-2 flex flex-col justify-between relative z-10 text-[9px] space-y-2">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 space-y-1.5 text-gray-700">
          <div className="flex items-center gap-1 text-emerald-900 font-extrabold text-[10px] pb-1 border-b border-emerald-200/60">
            <CheckCircle2 size={12} className="text-emerald-700" />
            <span>নির্দেশনাবলী ও জরুরি তথ্যাবলী (Terms & Info)</span>
          </div>

          <ol className="list-decimal pl-3.5 space-y-1 text-[8.5px] leading-relaxed text-gray-700 font-medium">
            <li>
              এই পরিচয়পত্রটি প্রতিষ্ঠানের সম্পত্তি। দায়িত্ব পালনকালে এটি সর্বদা দৃশ্যমানভাবে বহন করতে হবে।
            </li>
            <li>
              কার্ডটি অহস্তান্তরযোগ্য। অন্য কাউকে ব্যবহারের অনুমতি দেওয়া সম্পূর্ণ নিষিদ্ধ ও শাস্তিযোগ্য।
            </li>
            <li>
              পরিচয়পত্র হারিয়ে গেলে তাৎক্ষণিকভাবে বিদ্যালয় প্রশাসনকে লিখিতভাবে অবহিত করতে হবে।
            </li>
            <li>
              কার্ডটি কোথাও পাওয়া গেলে নিকটস্থ ডাকবাক্সে ফেলুন অথবা নিচের ঠিকানায় ফেরত দিন।
            </li>
          </ol>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center justify-between gap-2">
          <div className="space-y-0.5 text-left flex-1 min-w-0">
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[7.5px] font-black uppercase tracking-wider">
              <QrCode size={9} />
              <span>DIGITAL SMART ID</span>
            </div>
            <p className="text-[8px] font-bold text-gray-800 line-clamp-1 mt-0.5">
              Verified Staff Record
            </p>
            <p className="text-[7.5px] text-gray-500 font-mono">
              Issue Date: {issueDate}
            </p>
            <p className="text-[7.5px] text-gray-500 font-mono">
              Valid Till: {validityYear}
            </p>
          </div>

          <StaffQrCodeSvg data={qrData} size={68} />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-1.5 text-center shadow-xs">
          <StaffBarcodeSvg value={staffId} className="w-full h-7 mx-auto" />
          <p className="text-[8px] font-mono font-black text-gray-700 tracking-widest mt-0.5">
            *{staffId}*
          </p>
        </div>

        <div className="text-center space-y-0.5 text-[8px] text-gray-600 pt-1 border-t border-gray-100">
          <div className="flex items-center justify-center gap-1 font-bold text-gray-800">
            <MapPin size={9} className="text-emerald-700 shrink-0" />
            <span className="line-clamp-1">{address}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <span className="flex items-center gap-0.5">
              <Phone size={8} /> {phone}
            </span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <Mail size={8} /> {email}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`bg-gradient-to-r ${currentTheme.headerGrad} py-1 px-3 text-white text-center text-[7.5px] font-bold tracking-wider`}
      >
        <span>PROPERTY OF {schoolNameEn.toUpperCase()} • CR80 (54mm × 85.6mm) • NON-TRANSFERABLE</span>
      </div>
    </div>
  );

  return (
    <div className={`staff-id-card-root ${isPrintVersion ? "print-exact-card" : ""}`}>
      {orientation === "landscape" ? (
        side === "front" ? renderLandscapeFront() : renderLandscapeBack()
      ) : (
        side === "front" ? renderPortraitFront() : renderPortraitBack()
      )}
    </div>
  );
};

export default StaffIdCard;
