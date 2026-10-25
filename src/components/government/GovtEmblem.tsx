import React from "react";

export const BdGovEmblem: React.FC<{ className?: string; size?: number }> = ({ className = "h-12 w-12", size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Government of Bangladesh Emblem"
    >
      {/* Outer Circle Green */}
      <circle cx="50" cy="50" r="48" fill="#006A4E" stroke="#DA291C" strokeWidth="2.5" />
      {/* Inner Circle Red */}
      <circle cx="50" cy="50" r="41" fill="#DA291C" />
      {/* Gold Rim */}
      <circle cx="50" cy="50" r="38" fill="#006A4E" stroke="#F4C430" strokeWidth="1.5" />

      {/* Central Water Lily (Shapla) */}
      <path
        d="M50 25 C45 35, 42 45, 50 56 C58 45, 55 35, 50 25 Z"
        fill="#FFFFFF"
      />
      <path
        d="M50 35 C42 42, 33 46, 30 54 C38 56, 45 52, 50 56 Z"
        fill="#FFFFFF"
      />
      <path
        d="M50 35 C58 42, 67 46, 70 54 C62 56, 55 52, 50 56 Z"
        fill="#FFFFFF"
      />
      <path
        d="M50 43 C37 46, 26 55, 23 62 C34 62, 42 56, 50 56 Z"
        fill="#FFFFFF"
      />
      <path
        d="M50 43 C63 46, 74 55, 77 62 C66 62, 58 56, 50 56 Z"
        fill="#FFFFFF"
      />

      {/* Water Waves beneath Shapla */}
      <path
        d="M26 67 Q38 63 50 67 T74 67"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M30 72 Q40 68 50 72 T70 72"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* 4 Stars at Top (representing fundamental national principles) */}
      <polygon points="50,13 52,18 57,18 53,21 55,26 50,23 45,26 47,21 43,18 48,18" fill="#F4C430" />
      <polygon points="38,15 39.5,19 44,19 40.5,21.5 42,25.5 38,23 34,25.5 35.5,21.5 32,19 36.5,19" fill="#F4C430" />
      <polygon points="62,15 63.5,19 68,19 64.5,21.5 66,25.5 62,23 58,25.5 59.5,21.5 56,19 60.5,19" fill="#F4C430" />

      {/* Sheaf of Paddy surrounding base */}
      <path
        d="M20 52 C18 68, 30 82, 50 84 C70 82, 82 68, 80 52"
        stroke="#F4C430"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Jute Leaves at bottom tip */}
      <circle cx="50" cy="84" r="3" fill="#F4C430" />
    </svg>
  );
};

export const SmartBdBadge: React.FC<{ className?: string }> = ({ className = "h-10" }) => {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-50/80 px-3 py-1 text-xs text-emerald-900 shadow-xs ${className}`}>
      <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
      <span className="font-semibold text-[11px] tracking-wide">সবার আগে বাংলাদেশ · ডিজিটাল শিক্ষায় গড়বো দেশ</span>
    </div>
  );
};
