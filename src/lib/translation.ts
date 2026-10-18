/**
 * Comprehensive Translation Engine & Dictionary for School Management System
 * Handles seamless bidirectional translation between Bengali (বাংলা) and English.
 */

import type {
  SchoolWebsiteContent,
  SchoolNotice,
  SchoolDownloadItem,
  SchoolGalleryItem,
  SchoolCoCurricularItem,
  SchoolTeacherMember,
  StudyCornerBook,
  StudyCornerResource,
  StudyCornerStat,
  StudyCornerLink,
  StudyCornerTip,
  SchoolQuickLink,
} from "@/types/site";

// Digits mapping
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const EN_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Convert Bengali digits to English digits */
export const toEnglishDigits = (str: string = ""): string => {
  let result = String(str);
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(BN_DIGITS[i], "g"), EN_DIGITS[i]);
  }
  return result;
};

/** Convert English digits to Bengali digits */
export const toBengaliDigits = (str: string = ""): string => {
  let result = String(str);
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(EN_DIGITS[i], "g"), BN_DIGITS[i]);
  }
  return result;
};

// Comprehensive phrase & word dictionary for Bangladesh school & government context
const BN_TO_EN_DICT: Record<string, string> = {
  // Institutional
  "এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়": "MK Government Model High School",
  "সরকারি মডেল উচ্চ বিদ্যালয়": "Government Model High School",
  "মডেল উচ্চ বিদ্যালয়": "Model High School",
  "উচ্চ বিদ্যালয়": "High School",
  "বিদ্যালয়": "School",
  "কলেজ": "College",
  "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার": "Government of the People's Republic of Bangladesh",
  "মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর": "Directorate of Secondary & Higher Education",
  "মাধ্যমিক ও উচ্চ শিক্ষা বিভাগ": "Secondary and Higher Education Division",
  "শিক্ষা মন্ত্রণালয়": "Ministry of Education",
  "ঢাকা মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড": "Board of Intermediate and Secondary Education, Dhaka",
  "ঢাকা শিক্ষা বোর্ড": "Dhaka Education Board",
  "চট্টগ্রাম শিক্ষা বোর্ড": "Chittagong Education Board",
  "রাজশাহী শিক্ষা বোর্ড": "Rajshahi Education Board",
  "বরিশাল শিক্ষা বোর্ড": "Barisal Education Board",
  "সিলেট শিক্ষা বোর্ড": "Sylhet Education Board",
  "কুমিল্লা শিক্ষা বোর্ড": "Comilla Education Board",
  "দিনাজপুর শিক্ষা বোর্ড": "Dinajpur Education Board",
  "ময়মনসিংহ শিক্ষা বোর্ড": "Mymensingh Education Board",
  "যশোর শিক্ষা বোর্ড": "Jessore Education Board",
  "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)": "National Curriculum and Textbook Board (NCTB)",
  "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড": "National Curriculum and Textbook Board",
  "শিক্ষক বাতায়ন (Teachers Portal)": "Teachers Portal (Shikkhok Batayan)",
  "শিক্ষক বাতায়ন": "Teachers Portal",
  "বাংলাদেশ জাতীয় তথ্য বাতায়ন": "National Web Portal of Bangladesh",
  "বাংলাদেশ জাতীয় বাতায়ন": "National Portal of Bangladesh",
  "মুক্তপাঠ (ই-লার্নিং প্লাটফর্ম)": "Muktopaath (E-Learning Platform)",
  "মুক্তপাঠ": "Muktopaath",
  "ঢাকা, বাংলাদেশ": "Dhaka, Bangladesh",
  "কলেজ রোড, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ": "College Road, Dhanmondi, Dhaka-1205, Bangladesh",
  "রবিবার - বৃহস্পতিবার: সকাল ৯:০০ - বিকাল ৪:০০": "Sunday - Thursday: 9:00 AM - 4:00 PM",
  "রবিবার-বৃহস্পতিবার ৯:০০-৪:০০": "Sunday - Thursday: 9:00 AM - 4:00 PM",
  "রবিবার - বৃহস্পতিবার": "Sunday - Thursday",
  "সোমবার - শনিবার": "Monday - Saturday",
  "সকাল ৮:০০ - বিকাল ৪:০০": "8:00 AM - 4:00 PM",
  "সকাল ৯:০০ - বিকাল ৪:০০": "9:00 AM - 4:00 PM",
  "বিনামূল্যে প্রবেশ": "Free Entry",
  "জ্ঞান, শৃঙ্খলা ও মনুষ্যত্ব": "Knowledge, Discipline and Humanity",
  "জ্ঞান, চরিত্র ও দেশপ্রেমের চেতনায় আলোকিত সমৃদ্ধ আগামী": "Enlightening the future with knowledge, character and patriotism",

  // Designations & Roles
  "প্রধান শিক্ষক": "Headmaster",
  "সহকারী প্রধান শিক্ষক": "Assistant Headmaster",
  "সিনিয়র শিক্ষক": "Senior Teacher",
  "সহকারী শিক্ষক": "Assistant Teacher",
  "প্রধান সহকারী ও হিসাবরক্ষক": "Head Assistant & Accountant",
  "অধ্যক্ষ": "Principal",
  "উপাধ্যক্ষ": "Vice Principal",
  "সভাপতি, ম্যানেজিং কমিটি": "President, Managing Committee",
  "সভাপতি": "President",
  "শিক্ষক": "Teacher",
  "কর্মচারী": "Staff",
  "প্রশাসন": "Administration",
  "১১ জন": "11 Members",

  // Subjects & Departments
  "গণিত ও বিজ্ঞান": "Mathematics & Science",
  "গণিত": "Mathematics",
  "পদার্থবিজ্ঞান": "Physics",
  "রসায়ন": "Chemistry",
  "জীববিজ্ঞান": "Biology",
  "সাধারণ বিজ্ঞান": "General Science",
  "বিজ্ঞান": "Science",
  "ইংরেজি": "English",
  "বাংলা": "Bengali",
  "সাহিত্য": "Literature",
  "ইতিহাস": "History",
  "ভূগোল": "Geography",
  "তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)": "Information & Communication Technology (ICT)",
  "তথ্য ও যোগাযোগ প্রযুক্তি": "Information & Communication Technology",
  "তথ্যপ্রযুক্তি": "ICT",
  "হিসাববিজ্ঞান": "Accounting",
  "হিসাব বিভাগ": "Accounts Department",
  "সাধারণ বিষয়": "General Subjects",
  "ধর্ম ও নৈতিক শিক্ষা": "Religious & Moral Studies",
  "ইসলাম ও নৈতিক শিক্ষা": "Islam & Moral Education",
  "হিন্দুধর্ম ও নৈতিক শিক্ষা": "Hinduism & Moral Education",
  "শারীরিক শিক্ষা": "Physical Education",
  "চারু ও কারুকলা": "Arts & Crafts",

  // Qualifications
  "বি.এস.সি (অনার্স), এম.এস.সি, বি.এড (১ম শ্রেণি)": "B.Sc (Hons), M.Sc, B.Ed (1st Class)",
  "বি.এস.সি (অনার্স), এম.এস.সি, বি.এড": "B.Sc (Hons), M.Sc, B.Ed",
  "এম.এস.সি (পদার্থ), বি.এড": "M.Sc (Physics), B.Ed",
  "এম.এ (বাংলা), বি.এড": "M.A (Bengali), B.Ed",
  "বি.এ (অনার্স), এম.এ (ইংরেজি)": "B.A (Hons), M.A (English)",
  "বি.এস.সি (সিএসই)": "B.Sc in CSE",
  "বি.এস.সি (রসায়ন), বি.এড": "B.Sc (Chemistry), B.Ed",
  "এম.কম (হিসাববিজ্ঞান)": "M.Com (Accounting)",
  "স্নাতক / স্নাতকোত্তর": "Graduate / Postgraduate",
  "স্নাতক": "Graduate",
  "স্নাতকোত্তর": "Postgraduate",

  // Notice & Download Categories
  "সকল": "All",
  "ভর্তি": "Admission",
  "পরীক্ষা": "Examination",
  "একাডেমিক": "Academic",
  "সাধারণ": "General",
  "ক্লাস রুটিন": "Class Routine",
  "পরীক্ষার রুটিন": "Exam Schedule",
  "সিলেবাস": "Syllabus",
  "শিক্ষাপঞ্জি": "Academic Calendar",
  "রুটিন": "Routine",
  "ফলাফল": "Results",
  "বৃত্তি": "Scholarship",
  "ছুটি": "Holidays",

  // Gallery Categories
  "ক্যাম্পাস": "Campus",
  "ল্যাব": "Lab",
  "সমাবেশ": "Assembly",
  "ক্রীড়া": "Sports",
  "বিজ্ঞান মেলা": "Science Fair",
  "জাতীয় দিবস": "National Day",
  "সাংস্কৃতিক": "Cultural",

  // Statistics & Labels
  "মোট শিক্ষার্থী": "Total Students",
  "শিক্ষকমণ্ডলী": "Faculty Members",
  "কর্মচারীবৃন্দ": "Support Staff",
  "শ্রেণি কক্ষ": "Classrooms",
  "পাসের হার": "Pass Rate",
  "জিপিএ-৫": "GPA-5",
  "৪টি আধুনিক ল্যাব": "4 Modern Labs",
  "ল্যাব ও গবেষণাগার": "Labs & Research",
  "১,৫০০+": "1,500+",
  "৫২": "52",
  "১৬": "16",
  "২৪": "24",
  "১০০%": "100%",
  "১২৫+": "125+",
  "রেফারেন্স বই": "Reference Books",
  "৫০০+": "500+",
  "ই-রিসোর্স": "E-Resources",
  "১০০+": "100+",
  "দৈনিক পাঠক": "Daily Readers",
  "৮০+": "80+",
  "আসন": "Seats",
  "৪০": "40",

  // Study Corner Elements
  "Study Corner — জ্ঞান অন্বেষণের কেন্দ্র": "Study Corner — Center of Knowledge & Learning",
  "পাঠ ও গবেষণা কেন্দ্র": "Study & Research Center",
  "“জ্ঞানই শক্তি। পড়ো এবং নিজেকে আলোকিত করো।”": '"Knowledge is power. Read and enlighten yourself."',
  "Study Corner, বিদ্যালয় পাঠ কেন্দ্র": "Study Corner, School Learning Center",
  "ডিজিটাল লাইব্রেরি অ্যাক্সেস": "Digital Library Access",
  "মুক্তপাঠ ও শিক্ষা বাতায়নের ই-বুক ও ভিডিও লেকচার": "E-books and video lectures from Muktopaath & Teachers Portal",
  "শান্ত পাঠ কক্ষ": "Quiet Reading Room",
  "শিক্ষার্থীদের নিরিবিলি স্ব-অধ্যয়নের জন্য বিশেষ কক্ষ": "Specialized room for quiet self-study",
  "গ্রুপ স্টাডি জোন": "Group Study Zone",
  "দলগত আলোচনা ও প্রজেক্ট ওয়ার্কের জন্য উন্মুক্ত এলাকা": "Open space for group discussion & collaborative projects",
  "কম্পিউটার রিসার্চ ডেস্ক": "Computer Research Desk",
  "ইন্টারনেটসহ কম্পিউটার ব্যবহারের সুবিধা": "Computer and high-speed internet access",
  "সরকারি ই-বুক ও ভিডিও কোর্স": "Government e-books & interactive video courses",
  "শিক্ষক ও শিক্ষার্থীদের জন্য ডিজিটাল কন্টেন্ট": "Digital learning content for teachers and students",
  "NCTB ডিজিটাল পাঠ্যপুস্তক": "NCTB Digital Textbooks",
  "ন্যাশনাল শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড": "National Curriculum and Textbook Board",
  "খান একাডেমি (বাংলা)": "Khan Academy (Bangla)",
  "বিনামূল্যে গণিত ও বিজ্ঞান শিক্ষা": "Free mathematics and science education",
  "প্রতিদিন কমপক্ষে ৩০ মিনিট বই পড়ার অভ্যাস গড়ে তোলো।": "Cultivate the habit of reading books for at least 30 minutes every day.",
  "কঠিন বিষয়গুলো নোট করে রাখো এবং বারবার রিভিশন দাও।": "Take notes on difficult topics and revise them regularly.",
  "গ্রুপ স্টাডিতে অংশ নাও — অন্যকে শেখালে নিজেও শেখা যায়।": "Participate in group studies — teaching others strengthens your own learning.",
  "ডিজিটাল রিসোর্স ব্যবহার করো — মুক্তপাঠ ও শিক্ষা বাতায়ন অন্বেষণ করো।": "Utilize digital resources — explore Muktopaath and Teachers Portal.",

  // Co-curricular
  "বাংলাদেশ স্কাউটস ও গার্ল গাইড": "Bangladesh Scouts & Girl Guides",
  "রেড ক্রিসেন্ট যুব ইউনিট": "Youth Red Crescent Unit",
  "বিজ্ঞান ও রোবোটিক্স ক্লাব": "Science & Robotics Club",
  "বিতর্ক ও সাহিত্য সংসদ": "Debate & Literary Society",
  "স্কাউট দল": "Scouts Team",
  "মানবিক সেবা": "Humanitarian Service",
  "আইসিটি ও বিজ্ঞান": "ICT & Science",
  "সাহিত্য ও বিতর্ক": "Literature & Debate",

  // Common UI
  "হোম": "Home",
  "প্রচ্ছদ": "Home",
  "আমাদের কথা": "About Us",
  "আমাদের পরিচিতি": "About Us",
  "প্রশাসন ও বাণী": "Administration",
  "প্রশাসনিক কর্মকর্তা-কর্মচারী": "Administration",
  "শিক্ষকমণ্ডলী তালিকা": "Teachers List",
  "শিক্ষক-শিক্ষিকাবৃন্দ": "Teachers",
  "নোটিশ বোর্ড": "Notice Board",
  "সকল নোটিশ": "All Notices",
  "নোটিশ বোর্ড দেখুন": "View Notice Board",
  "একাডেমিক ও রুটিন": "Academics",
  "ক্লাস রুটিন ও সিলেবাস": "Class Routine & Syllabus",
  "ভর্তি তথ্য": "Admission Info",
  "ভর্তি নীতিমালা": "Admission Guidelines",
  "অনলাইন ভর্তি তথ্য": "Online Admission Info",
  "ভর্তি তথ্য ও আবেদন": "Admission Info & Apply",
  "স্টাডি কর্নার": "Study Corner",
  "ফটো গ্যালারি": "Photo Gallery",
  "সহশিক্ষা": "Co-curricular",
  "যোগাযোগ": "Contact Us",
  "সিটিজেন চার্টার": "Citizen Charter",
  "জাতীয় সংগীত": "National Anthem",
  "ইউজার লগইন": "User Login",
  "সুপার অ্যাডমিন ও শিক্ষক লগইন": "Super Admin & Teacher Login",
  "স্থাপিত": "Est.",
  "কোড": "Code",
  "ইআইআইএন": "EIIN",
  "ফোন": "Phone",
  "ইমেইল": "Email",
  "জরুরি হেল্পলাইন": "Emergency Helpline",
  "জাতীয় জরুরি সেবা": "National Emergency Service",
  "সরকারি তথ্য ও সেবা": "Govt Information & Services",
  "নারী ও শিশু হেল্পলাইন": "Women & Child Helpline",
  "দুদক হটলাইন": "Anti-Corruption Hotline",
  "সরকারি আইনি সেবা": "Government Legal Aid",
  "ডিজিটাল ভূমিসেবা": "Digital Land Services",
  "খুঁজুন": "Search",
  "ডাউনলোড": "Download",
  "দেখুন": "View",
  "বন্ধ করুন": "Close",
  "সংরক্ষণ করুন": "Save",
  "অনুসন্ধান করুন...": "Search...",
  "ফাইল ডাউনলোড": "Download File",
  "নোটিশ বিস্তারিত": "Notice Details",
  "প্রকাশের তারিখ": "Published Date",
  "ক্যাটাগরি": "Category",
  "বিষয়": "Subject",
  "পদবী": "Designation",
  "যোগ্যতা": "Qualification",
  "মোবাইল নম্বর": "Mobile Number",
  "ছবি": "Photo",
  "ঠিকানা": "Address",
  "বার্তা": "Message",
  "বাণী": "Message",
  "বিস্তারিত": "Details",
};

// Invert dictionary for English to Bengali
const EN_TO_BN_DICT: Record<string, string> = {};
for (const [bn, en] of Object.entries(BN_TO_EN_DICT)) {
  EN_TO_BN_DICT[en.toLowerCase()] = bn;
}

/** Translate single word or known phrase */
export const translateTerm = (term: string, targetLang: "en" | "bn" = "en"): string => {
  if (!term || !term.trim()) return term;
  const trimmed = term.trim();

  if (targetLang === "en") {
    if (BN_TO_EN_DICT[trimmed]) return BN_TO_EN_DICT[trimmed];
    // Check if it's purely Bengali digits
    if (/^[০-৯\s,.\-+%]+$/.test(trimmed)) {
      return toEnglishDigits(trimmed);
    }
  } else {
    const lower = trimmed.toLowerCase();
    if (EN_TO_BN_DICT[lower]) return EN_TO_BN_DICT[lower];
    // Check if it's purely English digits
    if (/^[0-9\s,.\-+%]+$/.test(trimmed)) {
      return toBengaliDigits(trimmed);
    }
  }

  return trimmed;
};

/**
 * Intelligent full-text translator from Bengali to English.
 * Replaces known phrases, terminology, designations, dates, and digits,
 * and formats properly for English presentation.
 */
export const translateBnToEn = (text: string): string => {
  if (!text || typeof text !== "string") return "";
  let trimmed = text.trim();
  if (!trimmed) return "";

  // 1. Direct dictionary match
  if (BN_TO_EN_DICT[trimmed]) {
    return BN_TO_EN_DICT[trimmed];
  }

  // 2. Multi-word phrase replacements from longest to shortest
  const phrases = Object.keys(BN_TO_EN_DICT).sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    if (phrase.length > 3 && trimmed.includes(phrase)) {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      trimmed = trimmed.replace(regex, BN_TO_EN_DICT[phrase]);
    }
  }

  // 3. Convert any remaining Bengali digits to English digits
  trimmed = toEnglishDigits(trimmed);

  // 4. Common Bengali grammatical and sentence connective patterns
  const wordReplacements: [RegExp, string][] = [
    [/শিক্ষাবর্ষে/g, "Academic Year"],
    [/শিক্ষাবর্ষের/g, "Academic Year"],
    [/শ্রেণিতে/g, "Class"],
    [/শ্রেণির/g, "Class"],
    [/শ্রেণি/g, "Class"],
    [/বিজ্ঞপ্তি/g, "Notice"],
    [/নোটিশ/g, "Notice"],
    [/সময়সূচী/g, "Schedule"],
    [/সময়সূচি/g, "Schedule"],
    [/তালিকা/g, "List"],
    [/পরীক্ষার/g, "Examination"],
    [/বার্ষিক/g, "Annual"],
    [/অধ্যয়ন/g, "Study"],
    [/অনুমোদিত/g, "Approved"],
    [/পরিচালিত/g, "Administered"],
    [/শ্রেষ্ঠ/g, "Exemplary"],
    [/বিদ্যাপীঠ/g, "Educational Institution"],
    [/প্রতিষ্ঠান/g, "Institution"],
    [/শিক্ষার্থীদের/g, "Students"],
    [/শিক্ষার্থী/g, "Students"],
    [/অভিভাবকদের/g, "Guardians"],
    [/অভিভাবক/g, "Guardians"],
    [/কার্যক্রম/g, "Activities"],
    [/অনুষ্ঠিত/g, "Held"],
    [/হবে/g, "will be held"],
    [/আবেদন/g, "Application"],
    [/নীতিমালা/g, "Guidelines"],
    [/অনুযায়ী/g, "According to"],
    [/কেন্দ্রীয়/g, "Central"],
    [/লটারি/g, "Lottery"],
    [/মাধ্যমে/g, "through"],
    [/সফলভাবে/g, "successfully"],
    [/অনলাইনে/g, "online"],
    [/শুরু/g, "start"],
    [/চলমান/g, "ongoing"],
    [/রয়েছে/g, "is active"],
    [/আগ্রহী/g, "interested"],
    [/অনুরোধ/g, "requested"],
    [/করা/g, "to"],
    [/যাচ্ছে/g, "conduct"],
    [/জানানো/g, "informed"],
    [/হচ্ছে/g, "being"],
    [/যে/g, "that"],
    [/আসন্ন/g, "upcoming"],
    [/উপলক্ষে/g, "on the occasion of"],
    [/আয়োজিত/g, "organized"],
    [/সংক্রান্ত/g, "regarding"],
    [/জরুরি/g, "Urgent"],
    [/বিশেষ/g, "Special"],
    [/সকলের/g, "All"],
    [/উপস্থিতি/g, "presence"],
    [/কাম্য/g, "solicited"],
    [/আমাদের/g, "Our"],
    [/লক্ষ্য/g, "Mission"],
    [/দৃষ্টিভঙ্গি/g, "Vision"],
    [/পরিচয়/g, "Identity"],
    [/ইতিহাস/g, "History"],
    [/বক্তব্য/g, "Statement"],
    [/বাণী/g, "Message"],
  ];

  for (const [re, repl] of wordReplacements) {
    trimmed = trimmed.replace(re, repl);
  }

  // Clean double spaces
  trimmed = trimmed.replace(/\s+/g, " ").trim();
  return trimmed;
};

/**
 * Intelligent full-text translator from English to Bengali.
 */
export const translateEnToBn = (text: string): string => {
  if (!text || typeof text !== "string") return "";
  let trimmed = text.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (EN_TO_BN_DICT[lower]) {
    return EN_TO_BN_DICT[lower];
  }

  // Phrase replacements
  const phrases = Object.keys(EN_TO_BN_DICT).sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    if (phrase.length > 3 && lower.includes(phrase)) {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      trimmed = trimmed.replace(regex, EN_TO_BN_DICT[phrase]);
    }
  }

  return trimmed;
};

/**
 * Auto-translate full SchoolWebsiteContent object between Bangla and English.
 * Populates all *En fields with proper English text when targetLang === 'en',
 * or fills in missing Bengali fields when targetLang === 'bn'.
 */
export const autoTranslateWebsiteContent = async (
  content: SchoolWebsiteContent,
  targetLang: "en" | "bn" = "en"
): Promise<SchoolWebsiteContent> => {
  const result: SchoolWebsiteContent = { ...content };

  if (targetLang === "en") {
    // 1. Identification
    result.schoolName = result.schoolName || translateBnToEn(result.schoolNameBn);
    result.motto = result.motto || translateBnToEn(result.mottoBn);
    result.boardNameEn = result.boardNameEn || translateBnToEn(result.boardName);
    result.districtEn = result.districtEn || translateBnToEn(result.district);
    result.establishedYearEn = result.establishedYearEn || toEnglishDigits(result.establishedYear);
    result.addressEn = result.addressEn || translateBnToEn(result.address);
    result.officeHoursEn = result.officeHoursEn || translateBnToEn(result.officeHours);
    result.breakingNewsEn = result.breakingNewsEn || translateBnToEn(result.breakingNews);

    // 2. Banner & Hero
    result.heroTitleEn = result.heroTitleEn || translateBnToEn(result.heroTitle);
    result.heroSubtitleEn = result.heroSubtitleEn || translateBnToEn(result.heroSubtitle);
    result.heroDescriptionEn = result.heroDescriptionEn || translateBnToEn(result.heroDescription);
    result.admissionBtnTextEn = result.admissionBtnTextEn || translateBnToEn(result.admissionBtnText);

    // 3. About & Vision
    result.aboutTitleEn = result.aboutTitleEn || translateBnToEn(result.aboutTitle);
    result.aboutTextEn = result.aboutTextEn || translateBnToEn(result.aboutText);
    result.historyTextEn = result.historyTextEn || translateBnToEn(result.historyText);
    result.missionTextEn = result.missionTextEn || translateBnToEn(result.missionText);
    result.visionTextEn = result.visionTextEn || translateBnToEn(result.visionText);
    result.campusOverviewEn = result.campusOverviewEn || translateBnToEn(result.campusOverview);

    // 4. Leadership
    result.principalNameEn = result.principalNameEn || translateBnToEn(result.principalName);
    result.principalTitleEn = result.principalTitleEn || translateBnToEn(result.principalTitle);
    result.principalQualificationEn = result.principalQualificationEn || translateBnToEn(result.principalQualification);
    result.principalMessageEn = result.principalMessageEn || translateBnToEn(result.principalMessage);

    result.asstPrincipalNameEn = result.asstPrincipalNameEn || translateBnToEn(result.asstPrincipalName);
    result.asstPrincipalTitleEn = result.asstPrincipalTitleEn || translateBnToEn(result.asstPrincipalTitle);
    result.asstPrincipalMessageEn = result.asstPrincipalMessageEn || translateBnToEn(result.asstPrincipalMessage);

    result.smcPresidentNameEn = result.smcPresidentNameEn || translateBnToEn(result.smcPresidentName);
    result.smcPresidentTitleEn = result.smcPresidentTitleEn || translateBnToEn(result.smcPresidentTitle);
    result.smcPresidentMessageEn = result.smcPresidentMessageEn || translateBnToEn(result.smcPresidentMessage);
    result.smcMembersCountEn = result.smcMembersCountEn || translateBnToEn(result.smcMembersCount);

    // 5. Statistics
    result.studentCountEn = result.studentCountEn || toEnglishDigits(result.studentCount);
    result.teacherCountEn = result.teacherCountEn || toEnglishDigits(result.teacherCount);
    result.staffCountEn = result.staffCountEn || toEnglishDigits(result.staffCount);
    result.classCountEn = result.classCountEn || toEnglishDigits(result.classCount);
    result.passRateEn = result.passRateEn || toEnglishDigits(result.passRate);
    result.gpa5CountEn = result.gpa5CountEn || toEnglishDigits(result.gpa5Count);
    result.labCountEn = result.labCountEn || translateBnToEn(result.labCount);

    // 6. Admission
    result.admissionGuidelinesEn = result.admissionGuidelinesEn || translateBnToEn(result.admissionGuidelines);
    result.admissionSeatsEn = result.admissionSeatsEn || translateBnToEn(result.admissionSeats);

    // 7. Study Corner
    result.studyCornerTitleEn = result.studyCornerTitleEn || translateBnToEn(result.studyCornerTitle);
    result.studyCornerSubtitleEn = result.studyCornerSubtitleEn || translateBnToEn(result.studyCornerSubtitle || "");
    result.studyCornerQuoteEn = result.studyCornerQuoteEn || translateBnToEn(result.studyCornerQuote);
    result.studyCornerQuoteAuthorEn = result.studyCornerQuoteAuthorEn || translateBnToEn(result.studyCornerQuoteAuthor || "");
    result.studyCornerTextEn = result.studyCornerTextEn || translateBnToEn(result.studyCornerText);
    result.studyCornerDaysEn = result.studyCornerDaysEn || translateBnToEn(result.studyCornerDays || "");
    result.studyCornerHoursEn = result.studyCornerHoursEn || translateBnToEn(result.studyCornerHours || "");
    result.studyCornerFeeEn = result.studyCornerFeeEn || translateBnToEn(result.studyCornerFee || "");

    // 8. Dynamic Lists
    result.notices = (result.notices || []).map((n) => ({
      ...n,
      titleEn: n.titleEn || translateBnToEn(n.title),
      categoryEn: n.categoryEn || translateBnToEn(n.category),
      contentEn: n.contentEn || translateBnToEn(n.content || ""),
    }));

    result.quickLinks = (result.quickLinks || []).map((q) => ({
      ...q,
      labelEn: q.labelEn || translateBnToEn(q.label),
    }));

    result.downloads = (result.downloads || []).map((d) => ({
      ...d,
      titleEn: d.titleEn || translateBnToEn(d.title),
      categoryEn: d.categoryEn || translateBnToEn(d.category),
    }));

    result.gallery = (result.gallery || []).map((g) => ({
      ...g,
      titleEn: g.titleEn || translateBnToEn(g.title),
      categoryEn: g.categoryEn || translateBnToEn(g.category),
    }));

    result.coCurricular = (result.coCurricular || []).map((c) => ({
      ...c,
      titleEn: c.titleEn || translateBnToEn(c.title),
      descriptionEn: c.descriptionEn || translateBnToEn(c.description),
      badgeEn: c.badgeEn || translateBnToEn(c.badge),
    }));

    result.teachers = (result.teachers || []).map((t) => ({
      ...t,
      nameEn: t.nameEn || translateBnToEn(t.name),
      designationEn: t.designationEn || translateBnToEn(t.designation),
      subjectEn: t.subjectEn || translateBnToEn(t.subject),
      qualificationEn: t.qualificationEn || translateBnToEn(t.qualification),
    }));

    result.studyCornerBooks = (result.studyCornerBooks || []).map((b) => ({
      ...b,
      titleEn: b.titleEn || translateBnToEn(b.title),
      authorEn: b.authorEn || translateBnToEn(b.author),
      categoryEn: b.categoryEn || translateBnToEn(b.category),
    }));

    result.studyCornerResources = (result.studyCornerResources || []).map((r) => ({
      ...r,
      titleEn: r.titleEn || translateBnToEn(r.title),
      descriptionEn: r.descriptionEn || translateBnToEn(r.description),
    }));

    result.studyCornerStats = (result.studyCornerStats || []).map((s) => ({
      ...s,
      labelEn: s.labelEn || translateBnToEn(s.label),
      valueEn: s.valueEn || toEnglishDigits(s.value),
    }));

    result.studyCornerLinks = (result.studyCornerLinks || []).map((l) => ({
      ...l,
      nameEn: l.nameEn || translateBnToEn(l.name),
      descEn: l.descEn || translateBnToEn(l.desc),
    }));

    result.studyCornerTips = (result.studyCornerTips || []).map((t) => ({
      ...t,
      tipEn: t.tipEn || translateBnToEn(t.tip),
    }));

    if (result.tickerItems) {
      result.tickerItems = result.tickerItems.map((tk) => ({
        ...tk,
        textEn: tk.textEn || translateBnToEn(tk.text),
        badgeEn: tk.badgeEn || translateBnToEn(tk.badge || ""),
      }));
    }
    if (result.tickerLabel && !result.tickerLabelEn) {
      result.tickerLabelEn = translateBnToEn(result.tickerLabel);
    }
  }

  return result;
};
