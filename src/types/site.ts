export interface SchoolNotice {
  id?: string;
  title: string;
  titleEn?: string;
  date: string;
  category: string;
  categoryEn?: string;
  className?: string;
  content?: string;
  contentEn?: string;
  fileUrl?: string;
}

export interface SchoolQuickLink {
  label: string;
  labelEn?: string;
  url: string;
}

export interface SchoolDownloadItem {
  id: string;
  title: string;
  titleEn?: string;
  category: string;
  categoryEn?: string;
  publishDate: string;
  fileUrl: string;
}

export interface SchoolGalleryItem {
  id: string;
  title: string;
  titleEn?: string;
  category: string;
  categoryEn?: string;
  imageUrl: string;
}

export interface SchoolCoCurricularItem {
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  badge: string;
  badgeEn?: string;
}

export interface SchoolTeacherMember {
  id: string;
  name: string;
  nameEn?: string;
  designation: string;
  designationEn?: string;
  subject: string;
  subjectEn?: string;
  qualification: string;
  qualificationEn?: string;
  phone?: string;
  email?: string;
  photo?: string;
  category: "শিক্ষক" | "কর্মচারী" | "প্রশাসন";
}

export interface SchoolTickerItem {
  id: string;
  text: string;
  textEn?: string;
  badge?: string;
  badgeEn?: string;
  link?: string;
  isActive?: boolean;
  priority?: "urgent" | "important" | "normal";
}

export interface SchoolCodeOfConductRule {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  badge?: string;
  badgeEn?: string;
}

export interface SchoolWebsiteContent {
  // 1. Basic Identification & Government Details
  schoolName: string;
  schoolNameBn: string;
  motto: string;
  mottoBn: string;
  eiin: string;
  schoolCode: string;
  boardName: string;
  boardNameEn?: string;
  district: string;
  districtEn?: string;
  establishedYear: string;
  establishedYearEn?: string;
  address: string;
  addressEn?: string;
  phone: string;
  email: string;
  officeHours: string;
  officeHoursEn?: string;
  facebookUrl: string;
  breakingNews: string;
  breakingNewsEn?: string;

  // 2. Banner & Hero Section
  heroTitle: string;
  heroTitleEn?: string;
  heroSubtitle: string;
  heroSubtitleEn?: string;
  heroDescription: string;
  heroDescriptionEn?: string;
  heroImage: string;
  heroImages?: string[];
  heroOverlayOpacity?: "light" | "medium" | "dark";
  heroCarouselSpeed?: number;
  admissionBtnText: string;
  admissionBtnTextEn?: string;
  admissionBtnUrl: string;

  // 3. About & Vision
  aboutTitle: string;
  aboutTitleEn?: string;
  aboutText: string;
  aboutTextEn?: string;
  historyText: string;
  historyTextEn?: string;
  missionText: string;
  missionTextEn?: string;
  visionText: string;
  visionTextEn?: string;
  campusOverview: string;
  campusOverviewEn?: string;

  // 4. Principal, Assistant Principal & Managing Committee
  principalName: string;
  principalNameEn?: string;
  principalTitle: string;
  principalTitleEn?: string;
  principalQualification: string;
  principalQualificationEn?: string;
  principalPhoto: string;
  principalPhone: string;
  principalEmail: string;
  principalMessage: string;
  principalMessageEn?: string;

  asstPrincipalName: string;
  asstPrincipalNameEn?: string;
  asstPrincipalTitle: string;
  asstPrincipalTitleEn?: string;
  asstPrincipalPhoto: string;
  asstPrincipalMessage: string;
  asstPrincipalMessageEn?: string;

  smcPresidentName: string;
  smcPresidentNameEn?: string;
  smcPresidentTitle: string;
  smcPresidentTitleEn?: string;
  smcPresidentPhoto: string;
  smcPresidentMessage: string;
  smcPresidentMessageEn?: string;
  smcMembersCount: string;
  smcMembersCountEn?: string;

  // 5. School Statistics
  studentCount: string;
  studentCountEn?: string;
  teacherCount: string;
  teacherCountEn?: string;
  staffCount: string;
  staffCountEn?: string;
  classCount: string;
  classCountEn?: string;
  passRate: string;
  passRateEn?: string;
  gpa5Count: string;
  gpa5CountEn?: string;
  labCount: string;
  labCountEn?: string;

  // 6. Admission Specifics
  admissionGuidelines: string;
  admissionGuidelinesEn?: string;
  admissionSeats: string;
  admissionSeatsEn?: string;
  admissionFormUrl: string;
  admissionSeatMatrix?: AdmissionSeatCapacityItem[];

  // 7. Dynamic Lists
  notices: SchoolNotice[];
  quickLinks: SchoolQuickLink[];
  downloads: SchoolDownloadItem[];
  gallery: SchoolGalleryItem[];
  coCurricular: SchoolCoCurricularItem[];
  teachers: SchoolTeacherMember[];
  dynamicStaffDirectory?: boolean;
  syncStaffWithDirectory?: boolean;

  // 8. Study Corner
  studyCornerTitle: string;
  studyCornerTitleEn?: string;
  studyCornerSubtitle?: string;
  studyCornerSubtitleEn?: string;
  studyCornerQuote: string;
  studyCornerQuoteEn?: string;
  studyCornerQuoteAuthor?: string;
  studyCornerQuoteAuthorEn?: string;
  studyCornerText: string;
  studyCornerTextEn?: string;
  studyCornerImage: string;
  studyCornerDays?: string;
  studyCornerDaysEn?: string;
  studyCornerHours?: string;
  studyCornerHoursEn?: string;
  studyCornerFee?: string;
  studyCornerFeeEn?: string;
  studyCornerStats?: StudyCornerStat[];
  studyCornerBooks: StudyCornerBook[];
  studyCornerResources: StudyCornerResource[];
  studyCornerLinks?: StudyCornerLink[];
  studyCornerTips?: StudyCornerTip[];

  // 9. Dynamic Ticker Announcements & Controls
  tickerItems?: SchoolTickerItem[];
  tickerSpeed?: "slow" | "normal" | "fast";
  tickerIncludeNotices?: boolean;
  tickerLabel?: string;
  tickerLabelEn?: string;

  // 10. Student Code of Conduct & Dress Code
  codeOfConductTitle?: string;
  codeOfConductTitleEn?: string;
  codeOfConductSubtitle?: string;
  codeOfConductSubtitleEn?: string;
  codeOfConductRules?: SchoolCodeOfConductRule[];
}

export interface AdmissionSeatCapacityItem {
  id: string;
  classBn: string;
  classEn: string;
  sectionsBn: string;
  sectionsEn: string;
  seats: string;
  suffixBn?: string;
  suffixEn?: string;
  processBn: string;
  processEn: string;
}

export const DEFAULT_ADMISSION_SEAT_MATRIX: AdmissionSeatCapacityItem[] = [
  {
    id: "seat_nursery",
    classBn: "নার্সারি",
    classEn: "Class Nursery",
    sectionsBn: "ক ও খ শাখা",
    sectionsEn: "Sections A & B",
    seats: "50",
    suffixBn: "জন",
    suffixEn: "Seats",
    processBn: "সরাসরি আবেদন ও মৌখিক সাক্ষাৎকার",
    processEn: "Direct Application & Oral Interview",
  },
  {
    id: "seat_play",
    classBn: "প্লে গ্রুপ",
    classEn: "Class Play Group",
    sectionsBn: "ক ও খ শাখা",
    sectionsEn: "Sections A & B",
    seats: "50",
    suffixBn: "জন",
    suffixEn: "Seats",
    processBn: "সরাসরি আবেদন ও সাক্ষাৎকার",
    processEn: "Direct Application & Interview",
  },
  {
    id: "seat_kg",
    classBn: "কেজি",
    classEn: "Class KG",
    sectionsBn: "ক ও খ শাখা",
    sectionsEn: "Sections A & B",
    seats: "60",
    suffixBn: "জন",
    suffixEn: "Seats",
    processBn: "সরাসরি আবেদন ও মেধা যাচাই",
    processEn: "Direct Application & Assessment",
  },
  {
    id: "seat_1",
    classBn: "১ম শ্রেণি",
    classEn: "Class 1",
    sectionsBn: "ক ও খ শাখা",
    sectionsEn: "Sections A & B",
    seats: "80",
    suffixBn: "জন",
    suffixEn: "Seats",
    processBn: "অনলাইন আবেদন ও লটারি",
    processEn: "Online Application & Lottery",
  },
  {
    id: "seat_2",
    classBn: "২য় শ্রেণি",
    classEn: "Class 2",
    sectionsBn: "ক ও খ শাখা",
    sectionsEn: "Sections A & B",
    seats: "40",
    suffixBn: "জন (আসন সাপেক্ষে)",
    suffixEn: "Seats (Vacancy basis)",
    processBn: "আসন শূন্য থাকা সাপেক্ষে ও ভর্তি পরীক্ষা",
    processEn: "Subject to Vacancy & Admission Test",
  },
  {
    id: "seat_3",
    classBn: "৩য় শ্রেণি",
    classEn: "Class 3",
    sectionsBn: "ক ও খ শাখা",
    sectionsEn: "Sections A & B",
    seats: "40",
    suffixBn: "জন (আসন সাপেক্ষে)",
    suffixEn: "Seats (Vacancy basis)",
    processBn: "আসন শূন্য থাকা সাপেক্ষে ও ভর্তি পরীক্ষা",
    processEn: "Subject to Vacancy & Admission Test",
  },
  {
    id: "seat_4",
    classBn: "৪র্থ শ্রেণি",
    classEn: "Class 4",
    sectionsBn: "ক ও খ শাখা",
    sectionsEn: "Sections A & B",
    seats: "35",
    suffixBn: "জন (আসন সাপেক্ষে)",
    suffixEn: "Seats (Vacancy basis)",
    processBn: "আসন শূন্য থাকা সাপেক্ষে ও ভর্তি পরীক্ষা",
    processEn: "Subject to Vacancy & Admission Test",
  },
  {
    id: "seat_5",
    classBn: "৫ম শ্রেণি",
    classEn: "Class 5",
    sectionsBn: "ক ও খ শাখা",
    sectionsEn: "Sections A & B",
    seats: "35",
    suffixBn: "জন (আসন সাপেক্ষে)",
    suffixEn: "Seats (Vacancy basis)",
    processBn: "আসন শূন্য থাকা সাপেক্ষে ও মূল্যায়ন পরীক্ষা",
    processEn: "Subject to Vacancy & Assessment Test",
  },
  {
    id: "seat_6",
    classBn: "৬ষ্ঠ শ্রেণি",
    classEn: "Class 6",
    sectionsBn: "ক, খ ও গ শাখা",
    sectionsEn: "Sections A, B & C",
    seats: "120",
    suffixBn: "জন",
    suffixEn: "Seats",
    processBn: "অনলাইন আবেদন ও সরকারি লটারি",
    processEn: "Online Application & Govt Lottery",
  },
  {
    id: "seat_7",
    classBn: "৭ম শ্রেণি",
    classEn: "Class 7",
    sectionsBn: "ক ও খ শাখা",
    sectionsEn: "Sections A & B",
    seats: "30",
    suffixBn: "জন (আসন সাপেক্ষে)",
    suffixEn: "Seats (Vacancy basis)",
    processBn: "আসন শূন্য থাকা সাপেক্ষে",
    processEn: "Subject to Vacancy",
  },
  {
    id: "seat_8",
    classBn: "৮ম শ্রেণি",
    classEn: "Class 8",
    sectionsBn: "ক ও খ শাখা",
    sectionsEn: "Sections A & B",
    seats: "25",
    suffixBn: "জন (আসন সাপেক্ষে)",
    suffixEn: "Seats (Vacancy basis)",
    processBn: "আসন শূন্য থাকা সাপেক্ষে",
    processEn: "Subject to Vacancy",
  },
  {
    id: "seat_9",
    classBn: "৯ম শ্রেণি",
    classEn: "Class 9",
    sectionsBn: "বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা",
    sectionsEn: "Science, Humanities & Business",
    seats: "90",
    suffixBn: "জন",
    suffixEn: "Seats",
    processBn: "অনলাইন আবেদন ও মেধা তালিকা",
    processEn: "Online Application & Merit List",
  },
  {
    id: "seat_10",
    classBn: "১০ম শ্রেণি",
    classEn: "Class 10",
    sectionsBn: "বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা",
    sectionsEn: "Science, Humanities & Business",
    seats: "20",
    suffixBn: "জন (টিসি সাপেক্ষে)",
    suffixEn: "Seats (TC basis)",
    processBn: "বোর্ড ছাড়পত্র ও আসন শূন্য সাপেক্ষে",
    processEn: "Subject to Board Clearance & Vacancy",
  },
  {
    id: "seat_11",
    classBn: "একাদশ শ্রেণি (Class 11)",
    classEn: "Class 11 (HSC)",
    sectionsBn: "বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা",
    sectionsEn: "Science, Humanities & Business",
    seats: "150",
    suffixBn: "জন",
    suffixEn: "Seats",
    processBn: "কেন্দ্রীয় একাদশ ভর্তি সিস্টেম (XI Class Admission) ও অনলাইন মেধা",
    processEn: "Central XI Class Admission System & Online Merit",
  },
  {
    id: "seat_12",
    classBn: "দ্বাদশ শ্রেণি (Class 12)",
    classEn: "Class 12 (HSC)",
    sectionsBn: "বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা",
    sectionsEn: "Science, Humanities & Business",
    seats: "20",
    suffixBn: "জন (টিসি সাপেক্ষে)",
    suffixEn: "Seats (TC basis)",
    processBn: "শিক্ষা বোর্ড টিসি সাপেক্ষে ভর্তি",
    processEn: "Subject to Education Board TC & Approval",
  },
];

export interface StudyCornerBook {
  title: string;
  titleEn?: string;
  author: string;
  authorEn?: string;
  category: string;
  categoryEn?: string;
  pdfUrl?: string;
  coverImage?: string;
  description?: string;
  descriptionEn?: string;
  fileSize?: string;
  classGrade?: string;
}

export interface StudyCornerResource {
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  icon: string;
}

export interface StudyCornerStat {
  label: string;
  labelEn?: string;
  value: string;
  valueEn?: string;
}

export interface StudyCornerLink {
  name: string;
  nameEn?: string;
  url: string;
  desc: string;
  descEn?: string;
}

export interface StudyCornerTip {
  tip: string;
  tipEn?: string;
}

export const DEFAULT_WEBSITE_CONTENT: SchoolWebsiteContent = {
  schoolName: "MK Government High School",
  schoolNameBn: "এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়",
  motto: "Education, Discipline and Humanity",
  mottoBn: "জ্ঞান, শৃঙ্খলা ও মনুষ্যত্ব",
  eiin: "123456",
  schoolCode: "1001",
  boardName: "ঢাকা মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড",
  boardNameEn: "Board of Intermediate and Secondary Education, Dhaka",
  district: "ঢাকা, বাংলাদেশ",
  districtEn: "Dhaka, Bangladesh",
  establishedYear: "1985",
  establishedYearEn: "1985",
  address: "কলেজ রোড, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ",
  addressEn: "College Road, Dhanmondi, Dhaka-1205, Bangladesh",
  phone: "+880 2 1234 5678",
  email: "info@mkschool.edu.bd",
  officeHours: "রবিবার - বৃহস্পতিবার: সকাল ৯:০০ - বিকাল ৪:০০",
  officeHoursEn: "Sunday - Thursday: 9:00 AM - 4:00 PM",
  facebookUrl: "https://facebook.com",
  breakingNews: "২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি আবেদন চলমান রয়েছে · আগামী ১৫ অক্টোবর বার্ষিক ক্রীড়া প্রতিযোগিতা অনুষ্ঠিত হবে",
  breakingNewsEn: "Admission applications for Classes 6 to 9 for Academic Year 2026 are ongoing · Annual Sports Competition will be held on October 15",

  heroTitle: "ঐতিহ্যবাহী এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়ে স্বাগতম",
  heroTitleEn: "Welcome to MK Government Model High School",
  heroSubtitle: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত ও পরিচালিত একটি শ্রেষ্ঠ সরকারি বিদ্যাপীঠ",
  heroSubtitleEn: "A Premier Government Model Institution Approved & Administered by the Government of Bangladesh",
  heroDescription: "সুশৃঙ্খল শিক্ষাদান, আদর্শ নৈতিক চরিত্র গঠন এবং যুগোপযোগী ডিজিটাল শিক্ষার সমন্বয়ে শিক্ষার্থীদের ভবিষ্যৎ বিনির্মাণে আমরা অঙ্গীকারাবদ্ধ।",
  heroDescriptionEn: "Committed to shaping students' future through disciplined teaching, moral character building, and state-of-the-art digital education.",
  heroImage: "/images/bgimage.jpg",
  heroImages: [
    "/images/bgimage.jpg",
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1400",
  ],
  heroOverlayOpacity: "light",
  heroCarouselSpeed: 5000,
  admissionBtnText: "অনলাইন ভর্তি তথ্য",
  admissionBtnTextEn: "Online Admission Info",
  admissionBtnUrl: "/admission",

  aboutTitle: "জ্ঞানচর্চা ও শ্রেষ্ঠত্বের গৌরবময় ঐতিহ্য",
  aboutTitleEn: "A Glorious Heritage of Learning and Academic Excellence",
  aboutText: "এম. কে. সরকারি মডেল উচ্চ বিদ্যালয় বাংলাদেশের অন্যতম সুপরিচিত সরকারি শিক্ষাপ্রতিষ্ঠান। ১৯৮৫ সালে প্রতিষ্ঠিত এই বিদ্যাপীঠ নিরবচ্ছিন্নভাবে উন্নত মানবিক মূল্যবোধ, আধুনিক বিজ্ঞান ও তথ্যপ্রযুক্তিভিত্তিক শিক্ষা নিশ্চিত করে আসছে। বিদ্যালয়ের মনোরম ক্যাম্পাস, অভিজ্ঞ শিক্ষকমণ্ডলী এবং সুশৃঙ্খল পরিবেশ শিক্ষার্থীদের মেধা বিকাশে অনন্য ভূমিকা পালন করে।",
  aboutTextEn: "MK Government Model High School is one of Bangladesh's most distinguished government educational institutions. Founded in 1985, the school has consistently nurtured high moral values, modern science, and ICT-driven learning. Its lush campus, accomplished educators, and disciplined atmosphere provide an optimal environment for intellectual growth.",
  historyText: "বিদ্যালয়টি একদল শিক্ষানুরাগী ব্যক্তিত্ব ও সরকারের পৃষ্ঠপোষকতায় ১৯৮৫ সালে যাত্রা শুরু করে। কালের পরিক্রমায় বিদ্যালয়টি আজ ঢাকা বিভাগের অন্যতম শীর্ষস্থানীয় আদর্শ প্রতিষ্ঠানে রূপ লাভ করেছে। এখান থেকে পাস করা অসংখ্য শিক্ষার্থী আজ দেশ-বিদেশে সুনামের সাথে গুরুত্বপূর্ণ দায়িত্ব পালন করছেন।",
  historyTextEn: "The school embarked on its journey in 1985 through the dedicated patronage of local educationists and the Government of Bangladesh. Over the decades, it has evolved into a premier benchmark institution in Dhaka Division, with alumni excelling in vital leadership roles worldwide.",
  missionText: "দক্ষ, নীতিবান, বিজ্ঞানমনস্ক এবং মানবিক গুণসম্পন্ন আগামী প্রজন্মের সুনাগরিক গড়ে তোলা।",
  missionTextEn: "To nurture skilled, ethical, science-minded, and compassionate citizens for future generations.",
  visionText: "স্মার্ট বাংলাদেশ ও বিশ্বমানের শিক্ষাব্যবস্থার উপযোগী শ্রেষ্ঠ আদর্শ শিক্ষাপ্রতিষ্ঠানে রূপান্তর।",
  visionTextEn: "To become a benchmark institution offering world-class modern education aligned with Smart Bangladesh.",
  campusOverview: "আমাদের বিদ্যালয়ে রয়েছে প্রশস্ত খেলার মাঠ, আধুনিক বহুতল একাডেমিক ভবন, ৫০০০+ বইয়ের সমৃদ্ধ পাঠাগার, শীতাতপ নিয়ন্ত্রিত ডিজিটাল কম্পিউটার ল্যাব এবং সুসজ্জিত বিজ্ঞান গবেষণাগার।",
  campusOverviewEn: "Our campus boasts a vast sports playground, modern multi-storey academic buildings, a library housing 5000+ volumes, air-conditioned digital computer labs, and fully equipped science laboratories.",

  principalName: "মোঃ আবদুর রহমান",
  principalNameEn: "Md. Abdur Rahman",
  principalTitle: "প্রধান শিক্ষক",
  principalTitleEn: "Headmaster",
  principalQualification: "বি.এস.সি (অনার্স), এম.এস.সি, বি.এড (১ম শ্রেণি)",
  principalQualificationEn: "B.Sc (Hons), M.Sc, B.Ed (1st Class)",
  principalPhoto: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400",
  principalPhone: "+880 1712 345678",
  principalEmail: "headmaster@mkschool.edu.bd",
  principalMessage: "বিসমিল্লাহির রাহমানির রাহিম। প্রিয় শিক্ষার্থী, শ্রদ্ধেয় অভিভাবক ও শুভানুধ্যায়ীগণ—এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়ের ডিজিটাল বাতায়নে আপনাদের আন্তরিক শুভেচ্ছা জানাই। শিক্ষার আসল উদ্দেশ্য কেবল পুঁথিগত বিদ্যা অর্জন নয়, বরং অন্তরের সুপ্ত প্রতিভাকে বিকশিত করে প্রকৃত দেশপ্রেমিক ও মানবিক মানুষ হয়ে ওঠা। আমাদের শিক্ষকমণ্ডলী প্রতিটি শিক্ষার্থীর যত্নশীল পরিচর্যায় নিবেদিতপ্রাণ। আসুন, সম্মিলিত প্রচেষ্টায় আমরা প্রিয় সন্তানদের জন্য এক সুন্দর ভবিষ্যৎ গড়ে তুলি।",
  principalMessageEn: "In the name of Allah, Most Gracious, Most Merciful. Dear students, respected guardians, and well-wishers—welcome to the official digital portal of MK Government Model High School. True education goes beyond textbooks; it is about awakening inner talents and molding patriotic, humane citizens. Our devoted teachers are dedicated to mentoring each student with care. Together, let us build a prosperous future for our children.",

  asstPrincipalName: "মুহাম্মদ কামরুল হাসান",
  asstPrincipalNameEn: "Muhammad Kamrul Hasan",
  asstPrincipalTitle: "সহকারী প্রধান শিক্ষক",
  asstPrincipalTitleEn: "Assistant Headmaster",
  asstPrincipalPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
  asstPrincipalMessage: "বিদ্যালয়ের শিক্ষা ও সার্বিক নিয়মানুবর্তিতা রক্ষায় আমরা নিরলস কাজ করছি। ডিজিটাল প্রযুক্তির সঠিক ব্যবহারের মাধ্যমে আমাদের শিক্ষার্থীরা প্রতিনিয়ত এগিয়ে চলেছে।",
  asstPrincipalMessageEn: "We work tirelessly to uphold academic excellence and discipline. Through the constructive use of digital technology, our students continue to stride forward.",

  smcPresidentName: "প্রফেসর ড. মুহাম্মদ আশরাফুল আলম",
  smcPresidentNameEn: "Prof. Dr. Muhammad Ashraful Alam",
  smcPresidentTitle: "সভাপতি, ম্যানেজিং কমিটি",
  smcPresidentTitleEn: "President, Managing Committee",
  smcPresidentPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
  smcPresidentMessage: "সরকারের ডিজিটাল শিক্ষা রূপকল্প বাস্তবায়নে এম. কে. সরকারি মডেল উচ্চ বিদ্যালয় সর্বদা অগ্রণী ভূমিকা পালন করে আসছে। অভিভাবক ও শিক্ষকবৃন্দের সম্মিলিত প্রচেষ্টায় এই বিদ্যাপীঠ তার শ্রেষ্ঠত্ব ধরে রেখেছে।",
  smcPresidentMessageEn: "MK Government Model High School continually leads the way in realizing the government's digital education vision. Through the synergy of parents and educators, this school retains its standard of excellence.",
  smcMembersCount: "১১ জন",
  smcMembersCountEn: "11 Members",

  studentCount: "১,৫০০+",
  studentCountEn: "1,500+",
  teacherCount: "৫২",
  teacherCountEn: "52",
  staffCount: "১৬",
  staffCountEn: "16",
  classCount: "২৪",
  classCountEn: "24",
  passRate: "১০০%",
  passRateEn: "100%",
  gpa5Count: "১২৫+",
  gpa5CountEn: "125+",
  labCount: "৪টি আধুনিক ল্যাব",
  labCountEn: "4 Modern Labs",

  admissionGuidelines: "মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তরের (মাউশি) কেন্দ্রীয় ডিজিটাল লটারির মাধ্যমে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি অনুষ্ঠিত হয়। সরকারি নির্ধারিত সময়ের মধ্যে gsa.teletalk.com.bd ওয়েবসাইটে আবেদন করতে হবে।",
  admissionGuidelinesEn: "Admissions to Classes 6 through 9 are conducted centrally through the DSHE Digital Lottery system. Applications must be completed online via gsa.teletalk.com.bd within the government scheduled window.",
  admissionSeats: "৬ষ্ঠ শ্রেণি: ১২০ আসন · ৭ম শ্রেণি: ৩০ আসন · ৮ম শ্রেণি: ২৫ আসন · ৯ম শ্রেণি: ৬০ আসন",
  admissionSeatsEn: "Class 6: 120 seats · Class 7: 30 seats · Class 8: 25 seats · Class 9: 60 seats",
  admissionFormUrl: "https://gsa.teletalk.com.bd",
  admissionSeatMatrix: DEFAULT_ADMISSION_SEAT_MATRIX,

  notices: [],

  quickLinks: [
    { label: "মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর (মাউশি)", labelEn: "Directorate of Secondary & Higher Education (DSHE)", url: "https://dshe.gov.bd" },
    { label: "শিক্ষা মন্ত্রণালয় (মাধ্যমিক ও উচ্চ শিক্ষা বিভাগ)", labelEn: "Ministry of Education (SHED)", url: "https://moedu.gov.bd" },
    { label: "ঢাকা শিক্ষা বোর্ড (ফলাফল ও সেবা)", labelEn: "Dhaka Education Board (Results & Services)", url: "https://dhakaeducationboard.gov.bd" },
    { label: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)", labelEn: "National Curriculum & Textbook Board (NCTB)", url: "https://nctb.gov.bd" },
    { label: "শিক্ষক বাতায়ন (Teachers Portal)", labelEn: "Teachers Portal (Shikkhok Batayan)", url: "https://teachers.gov.bd" },
    { label: "বাংলাদেশ জাতীয় তথ্য বাতায়ন", labelEn: "National Web Portal of Bangladesh", url: "https://bangladesh.gov.bd" },
  ],

  downloads: [
    {
      id: "d1",
      title: "২০২৬ শিক্ষাবর্ষের সকল শ্রেণির ক্লাস রুটিন (Class Routine)",
      titleEn: "All Classes Academic Routine 2026 (Class Routine PDF)",
      category: "ক্লাস রুটিন",
      categoryEn: "Class Routine",
      publishDate: "2026-10-10",
      fileUrl: "#",
    },
    {
      id: "d2",
      title: "বার্ষিক পরীক্ষা ২০২৬ সময়সূচী (Exam Schedule PDF)",
      titleEn: "Annual Examination 2026 Schedule (Exam Schedule PDF)",
      category: "পরীক্ষার রুটিন",
      categoryEn: "Exam Schedule",
      publishDate: "2026-10-12",
      fileUrl: "#",
    },
    {
      id: "d3",
      title: "এনসিটিবি কর্তৃক নির্ধারিত পাঠ্যপুস্তক ও সিলেবাস ২০২৬",
      titleEn: "NCTB Prescribed Textbooks & Syllabus 2026",
      category: "সিলেবাস",
      categoryEn: "Syllabus",
      publishDate: "2026-09-20",
      fileUrl: "#",
    },
    {
      id: "d4",
      title: "বিদ্যালয়ের বার্ষিক ছুটির তালিকা ও শিক্ষাপঞ্জি",
      titleEn: "Annual School Holiday Calendar & Academic Schedule",
      category: "শিক্ষাপঞ্জি",
      categoryEn: "Academic Calendar",
      publishDate: "2026-01-05",
      fileUrl: "#",
    },
  ],

  gallery: [
    {
      id: "g1",
      title: "বিদ্যালয়ের মূল একাডেমিক ভবন ও সবুজ প্রাঙ্গণ",
      titleEn: "Main Academic Building & Lush Campus Courtyard",
      category: "ক্যাম্পাস",
      categoryEn: "Campus",
      imageUrl: "/images/bgimage.jpg",
    },
    {
      id: "g2",
      title: "ডিজিটাল কম্পিউটার ল্যাব ও শিক্ষার্থীদের ব্যবহারিক ক্লাস",
      titleEn: "Digital Computer Laboratory & Practical ICT Session",
      category: "ল্যাব",
      categoryEn: "Lab",
      imageUrl: "/images/bgimage2.jpg",
    },
    {
      id: "g3",
      title: "বিদ্যালয়ের প্রাত্যহিক সমাবেশ ও জাতীয় সংগীত পাঠ",
      titleEn: "Daily Morning Assembly & Singing of the National Anthem",
      category: "সমাবেশ",
      categoryEn: "Assembly",
      imageUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "g4",
      title: "বার্ষিক ক্রীড়া প্রতিযোগিতা ও পুরস্কার বিতরণী অনুষ্ঠান",
      titleEn: "Annual Athletic Meet & Prize Giving Ceremony",
      category: "ক্রীড়া",
      categoryEn: "Sports",
      imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "g5",
      title: "বিজ্ঞান মেলা ও শিক্ষার্থীদের উদ্ভাবনী প্রকল্প প্রদর্শন",
      titleEn: "Science Fair & Student Innovation Projects Exhibition",
      category: "বিজ্ঞান মেলা",
      categoryEn: "Science Fair",
      imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "g6",
      title: "শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবসে প্রভাতফেরি",
      titleEn: "Shaheed Day & International Mother Language Day Morning Procession",
      category: "জাতীয় দিবস",
      categoryEn: "National Day",
      imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800",
    },
  ],

  coCurricular: [
    {
      title: "বাংলাদেশ স্কাউটস ও গার্ল গাইড",
      titleEn: "Bangladesh Scouts & Girl Guides",
      description: "শৃঙ্খলা, সেবা ও দেশপ্রেমের চেতনায় স্কাউট দল নিয়মিত জাতীয় ও স্থানীয় সমাবেশ ও সেবামূলক কাজে অংশগ্রহণ করে।",
      descriptionEn: "Guided by discipline, service, and patriotism, our scout troops actively take part in national and community welfare programs.",
      badge: "স্কাউট দল",
      badgeEn: "Scout Troops",
    },
    {
      title: "রেড ক্রিসেন্ট যুব ইউনিট",
      titleEn: "Youth Red Crescent Unit",
      description: "প্রাথমিক চিকিৎসা, রক্তদান সচেতনতা এবং দুর্যোগ মোকাবেলায় আমাদের যুব রেড ক্রিসেন্ট স্বেচ্ছাসেবকরা তৎপর।",
      descriptionEn: "Our dedicated Red Crescent youth volunteers lead first-aid training, blood donation awareness, and disaster response readiness.",
      badge: "মানবিক সেবা",
      badgeEn: "Humanitarian Service",
    },
    {
      title: "বিজ্ঞান ও রোবোটিক্স ক্লাব",
      titleEn: "Science & Robotics Club",
      description: "নিয়মিত বিজ্ঞান অলিম্পিয়াড, গণিত ক্যাম্প এবং রোবোটিক্স ও কোডিং কর্মশালার মাধ্যমে আধুনিক চিন্তার বিকাশ।",
      descriptionEn: "Nurturing innovation through science olympiads, mathematics camps, robotics exhibitions, and introductory coding bootcamps.",
      badge: "আইসিটি ও বিজ্ঞান",
      badgeEn: "ICT & Science",
    },
    {
      title: "বিতর্ক ও সাহিত্য সংসদ",
      titleEn: "Debate & Literary Society",
      description: "যুক্তিনির্ভর চিন্তাধারা ও বাগ্মীতা চর্চার লক্ষ্যে জাতীয় পর্যায়ের বিতর্ক প্রতিযোগিতায় আমাদের দল কৃতিত্ব প্রদর্শন করে আসছে।",
      descriptionEn: "Fostering analytical discourse and eloquent oratory, our debate teams achieve stellar distinctions in national tournaments.",
      badge: "সাহিত্য ও বিতর্ক",
      badgeEn: "Literary & Debate",
    },
  ],

  teachers: [
    {
      id: "t1",
      name: "মোঃ আবদুর রহমান",
      nameEn: "Md. Abdur Rahman",
      designation: "প্রধান শিক্ষক",
      designationEn: "Headmaster",
      subject: "গণিত ও বিজ্ঞান",
      subjectEn: "Mathematics & Science",
      qualification: "বি.এস.সি (অনার্স), এম.এস.সি, বি.এড",
      qualificationEn: "B.Sc (Hons), M.Sc, B.Ed",
      phone: "+880 1712 345678",
      email: "headmaster@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400",
      category: "প্রশাসন",
    },
    {
      id: "t2",
      name: "মুহাম্মদ কামরুল হাসান",
      nameEn: "Muhammad Kamrul Hasan",
      designation: "সহকারী প্রধান শিক্ষক",
      designationEn: "Assistant Headmaster",
      subject: "পদার্থবিজ্ঞান",
      subjectEn: "Physics",
      qualification: "এম.এস.সি (পদার্থ), বি.এড",
      qualificationEn: "M.Sc (Physics), B.Ed",
      phone: "+880 1812 345679",
      email: "kamrul@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
      category: "প্রশাসন",
    },
    {
      id: "t3",
      name: "মোসাম্মৎ আয়েশা সিদ্দিকা",
      nameEn: "Mosammat Ayesha Siddika",
      designation: "সিনিয়র শিক্ষক",
      designationEn: "Senior Teacher",
      subject: "বাংলা",
      subjectEn: "Bengali",
      qualification: "এম.এ (বাংলা), বি.এড",
      qualificationEn: "M.A (Bengali), B.Ed",
      phone: "+880 1912 345680",
      email: "ayesha@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      category: "শিক্ষক",
    },
    {
      id: "t4",
      name: "এস. এম. তানভীর আহমেদ",
      nameEn: "S. M. Tanvir Ahmed",
      designation: "সহকারী শিক্ষক",
      designationEn: "Assistant Teacher",
      subject: "ইংরেজি",
      subjectEn: "English",
      qualification: "বি.এ (অনার্স), এম.এ (ইংরেজি)",
      qualificationEn: "B.A (Hons), M.A (English)",
      phone: "+880 1612 345681",
      email: "tanvir@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
      category: "শিক্ষক",
    },
    {
      id: "t5",
      name: "নাসরিন সুলতানা",
      nameEn: "Nasrin Sultana",
      designation: "সহকারী শিক্ষক",
      designationEn: "Assistant Teacher",
      subject: "তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)",
      subjectEn: "Information & Communication Technology (ICT)",
      qualification: "বি.এস.সি (সিএসই)",
      qualificationEn: "B.Sc in CSE",
      phone: "+880 1512 345682",
      email: "nasrin@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      category: "শিক্ষক",
    },
    {
      id: "t6",
      name: "মোঃ জহিরুল ইসলাম",
      nameEn: "Md. Zahirul Islam",
      designation: "সহকারী শিক্ষক",
      designationEn: "Assistant Teacher",
      subject: "সাধারণ বিজ্ঞান",
      subjectEn: "General Science",
      qualification: "বি.এস.সি (রসায়ন), বি.এড",
      qualificationEn: "B.Sc (Chemistry), B.Ed",
      phone: "+880 1712 345683",
      email: "zahir@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
      category: "শিক্ষক",
    },
    {
      id: "t7",
      name: "মোঃ রফিকুল হাসান",
      nameEn: "Md. Rafiqul Hasan",
      designation: "প্রধান সহকারী ও হিসাবরক্ষক",
      designationEn: "Head Assistant & Accountant",
      subject: "হিসাব বিভাগ",
      subjectEn: "Accounts Department",
      qualification: "এম.কম (হিসাববিজ্ঞান)",
      qualificationEn: "M.Com (Accounting)",
      phone: "+880 1812 345684",
      email: "accountant@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400",
      category: "কর্মচারী",
    },
  ],
  dynamicStaffDirectory: true,

  studyCornerTitle: "Study Corner — জ্ঞান অন্বেষণের কেন্দ্র",
  studyCornerTitleEn: "Study Corner — Center of Knowledge & Learning",
  studyCornerSubtitle: "শিক্ষার্থীদের সমৃদ্ধ মানসিক বিকাশ ও জ্ঞান আহরণের জন্য বিদ্যালয়ের বিশেষ পাঠ ও গবেষণা কেন্দ্র",
  studyCornerSubtitleEn: "A dedicated study and research pavilion for student intellectual and personal enrichment",
  studyCornerQuote: "“জ্ঞানই শক্তি। পড়ো এবং নিজেকে আলোকিত করো।”",
  studyCornerQuoteEn: '"Knowledge is power. Read and enlighten yourself."',
  studyCornerQuoteAuthor: "Study Corner, বিদ্যালয় পাঠ কেন্দ্র",
  studyCornerQuoteAuthorEn: "Study Corner, School Learning Center",
  studyCornerText: "বিদ্যালয়ের Study Corner হলো শিক্ষার্থীদের জন্য একটি বিশেষ পাঠ ও গবেষণা কেন্দ্র যেখানে রয়েছে সমৃদ্ধ পাঠাগার, ডিজিটাল রিসোর্স, বিজ্ঞান ও গণিতের রেফারেন্স বই, এবং শান্ত পরিবেশে স্ব-অধ্যয়নের সুযোগ। এখানে শিক্ষার্থীরা পাঠ্যক্রমের বাইরেও নানা বিষয়ে জ্ঞান আহরণ করতে পারে।",
  studyCornerTextEn: "The School Study Corner is a state-of-the-art research and reading pavilion equipped with an extensive library, digital learning resources, mathematics & science reference volumes, and quiet self-study environments.",
  studyCornerImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600",
  studyCornerDays: "সোমবার - শনিবার",
  studyCornerDaysEn: "Monday - Saturday",
  studyCornerHours: "সকাল ৮:০০ - বিকাল ৪:০০",
  studyCornerHoursEn: "8:00 AM - 4:00 PM",
  studyCornerFee: "বিনামূল্যে প্রবেশ",
  studyCornerFeeEn: "Free Admission",
  studyCornerStats: [
    { label: "রেফারেন্স বই", labelEn: "Reference Books", value: "৫০০+", valueEn: "500+" },
    { label: "ই-রিসোর্স", labelEn: "E-Resources", value: "১০০+", valueEn: "100+" },
    { label: "দৈনিক পাঠক", labelEn: "Daily Readers", value: "৮০+", valueEn: "80+" },
    { label: "আসন", labelEn: "Seats", value: "৪০", valueEn: "40" },
  ],
  studyCornerBooks: [
    { title: "Algebra & Higher Mathematics", titleEn: "Algebra & Higher Mathematics", author: "S.L. Loney", authorEn: "S.L. Loney", category: "গণিত", categoryEn: "Mathematics" },
    { title: "General Science Encyclopedia", titleEn: "General Science Encyclopedia", author: "Various Authors", authorEn: "Various Authors", category: "বিজ্ঞান", categoryEn: "Science" },
    { title: "বাংলা সাহিত্য সমগ্র", titleEn: "Collected Bengali Literature", author: "রবীন্দ্রনাথ ঠাকুর", authorEn: "Rabindranath Tagore", category: "সাহিত্য", categoryEn: "Literature" },
    { title: "English Grammar & Composition", titleEn: "English Grammar & Composition", author: "Wren & Martin", authorEn: "Wren & Martin", category: "ইংরেজি", categoryEn: "English" },
    { title: "বাংলাদেশের ইতিহাস ও সংস্কৃতি", titleEn: "History & Culture of Bangladesh", author: "ড. মুহম্মদ কুদরাত-এ-খুদা", authorEn: "Dr. Muhammad Qudrat-i-Khuda", category: "ইতিহাস", categoryEn: "History" },
    { title: "Physics for Class 9-10", titleEn: "Physics for Class 9-10", author: "NCTB", authorEn: "NCTB", category: "পদার্থবিজ্ঞান", categoryEn: "Physics" },
    { title: "Chemistry Practical Guide", titleEn: "Chemistry Practical Guide", author: "Prof. Md. Abdur Rahim", authorEn: "Prof. Md. Abdur Rahim", category: "রসায়ন", categoryEn: "Chemistry" },
    { title: "Computer Science & ICT", titleEn: "Computer Science & ICT", author: "Digital Bangladesh Series", authorEn: "Digital Bangladesh Series", category: "তথ্যপ্রযুক্তি", categoryEn: "ICT" },
  ],
  studyCornerResources: [
    { title: "ডিজিটাল লাইব্রেরি অ্যাক্সেস", titleEn: "Digital Library Access", description: "মুক্তপাঠ ও শিক্ষা বাতায়নের ই-বুক ও ভিডিও লেকচার", descriptionEn: "Access to government e-books & video lectures via Muktopaath & Teachers Portal", icon: "BookOpen" },
    { title: "শান্ত পাঠ কক্ষ", titleEn: "Quiet Reading Room", description: "শিক্ষার্থীদের নিরিবিলি স্ব-অধ্যয়নের জন্য বিশেষ কক্ষ", descriptionEn: "Specialized silent zone for uninterrupted self-study", icon: "BookMarked" },
    { title: "গ্রুপ স্টাডি জোন", titleEn: "Group Study Zone", description: "দলগত আলোচনা ও প্রজেক্ট ওয়ার্কের জন্য উন্মুক্ত এলাকা", descriptionEn: "Collaborative area for group discussions and team projects", icon: "Users" },
    { title: "কম্পিউটার রিসার্চ ডেস্ক", titleEn: "Computer Research Desk", description: "ইন্টারনেটসহ কম্পিউটার ব্যবহারের সুবিধা", descriptionEn: "Modern computers with high-speed internet access", icon: "Monitor" },
  ],
  studyCornerLinks: [
    { name: "মুক্তপাঠ (ই-লার্নিং প্লাটফর্ম)", nameEn: "Muktopaath (E-Learning Platform)", url: "https://muktopaath.gov.bd", desc: "সরকারি ই-বুক ও ভিডিও কোর্স", descEn: "Official government e-books & video courses" },
    { name: "শিক্ষা বাতায়ন (Teachers Portal)", nameEn: "Teachers Portal (Shikkhok Batayan)", url: "https://teachers.gov.bd", desc: "শিক্ষক ও শিক্ষার্থীদের জন্য ডিজিটাল কন্টেন্ট", descEn: "Digital learning content for teachers and students" },
    { name: "NCTB ডিজিটাল পাঠ্যপুস্তক", nameEn: "NCTB Digital Textbooks", url: "https://nctb.gov.bd", desc: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড", descEn: "National Curriculum & Textbook Board Portal" },
    { name: "Khan Academy (বাংলা)", nameEn: "Khan Academy (Bangla)", url: "https://bn.khanacademy.org", desc: "বিনামূল্যে গণিত ও বিজ্ঞান শিক্ষা", descEn: "Free mathematics & science education" },
  ],
  studyCornerTips: [
    { tip: "প্রতিদিন কমপক্ষে ৩০ মিনিট বই পড়ার অভ্যাস গড়ে তোলো।", tipEn: "Cultivate the habit of reading books for at least 30 minutes every day." },
    { tip: "কঠিন বিষয়গুলো নোট করে রাখো এবং বারবার রিভিশন দাও।", tipEn: "Keep notes on challenging topics and revise them periodically." },
    { tip: "গ্রুপ স্টাডিতে অংশ নাও — অন্যকে শেখালে নিজেও শেখা যায়।", tipEn: "Participate in group study — teaching peers deepens your own comprehension." },
    { tip: "ডিজিটাল রিসোর্স ব্যবহার করো — মুক্তপাঠ ও শিক্ষা বাতায়ন অন্বেষণ করো।", tipEn: "Make the best use of digital tools — explore Muktopaath and Teachers Portal." },
  ],

  // Dynamic Ticker Announcements
  tickerItems: [
    {
      id: "tk_1",
      text: "২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ডিজিটাল লটারির মাধ্যমে ভর্তি আবেদন চলমান রয়েছে",
      textEn: "Admission applications for Classes 6 to 9 for Academic Year 2026 are ongoing",
      badge: "ভর্তি",
      badgeEn: "Admission",
      link: "/admission",
      isActive: true,
      priority: "urgent",
    },
    {
      id: "tk_2",
      text: "বার্ষিক পরীক্ষা ২০২৬ এর বিস্তারিত সময়সূচী ও আসন বিন্যাস প্রকাশ করা হয়েছে",
      textEn: "Annual Examination 2026 Detailed Routine and Seating Arrangement Published",
      badge: "পরীক্ষা",
      badgeEn: "Exam",
      link: "/academics",
      isActive: true,
      priority: "important",
    },
    {
      id: "tk_3",
      text: "আগামী ১৫ অক্টোবর বিদ্যালয়ের বার্ষিক ক্রীড়া প্রতিযোগিতা ও সাংস্কৃতিক উৎসব অনুষ্ঠিত হবে",
      textEn: "Annual Sports Competition & Cultural Festival will be held on October 15",
      badge: "অনুষ্ঠান",
      badgeEn: "Event",
      link: "/notices",
      isActive: true,
      priority: "normal",
    },
  ],
  tickerSpeed: "normal",
  tickerIncludeNotices: true,
  tickerLabel: "জরুরি নোটিশ:",
  tickerLabelEn: "Urgent Notice:",

  // 10. Student Code of Conduct & Dress Code
  codeOfConductTitle: "শিক্ষার্থীদের আচরণবিধি ও পোশাক নীতিমালা",
  codeOfConductTitleEn: "Student Code of Conduct & Dress Code",
  codeOfConductSubtitle: "বিদ্যালয়ের সুশৃঙ্খল ও আদর্শ শিক্ষণ পরিবেশ নিশ্চিত করতে শিক্ষার্থীদের জন্য আচরণবিধি ও পোশাক সংক্রান্ত নির্দেশিকা",
  codeOfConductSubtitleEn: "Guidelines on student conduct and dress code to ensure a disciplined and optimal learning environment",
  codeOfConductRules: [
    {
      id: "conduct_1",
      title: "১. ইউনিফর্ম ও ড্রেসকোড:",
      titleEn: "1. Uniform & Dress Code:",
      description: "সাদা শার্ট, নেভি ব্লু প্যান্ট/সালোয়ার, নির্ধারিত বিদ্যালয় মনোগ্রাম সম্বলিত ব্যাজ ও কালো জুতা পরিধান বাধ্যতামূলক।",
      descriptionEn: "White shirt, navy blue pants/salwar, school monogram badge, and black shoes are mandatory.",
      badge: "পোশাক নীতিমালা",
      badgeEn: "Dress Code",
    },
    {
      id: "conduct_2",
      title: "২. ক্লাসে উপস্থিতি:",
      titleEn: "2. Attendance Policy:",
      description: "সকল শিক্ষার্থীকে সকাল ৮:৫০ মিনিটের মধ্যে ক্যাম্পাসে উপস্থিত হতে হবে। ন্যূনতম ৮০% উপস্থিতি বাধ্যতামূলক।",
      descriptionEn: "All students must arrive at the campus by 8:50 AM. A minimum of 80% attendance is compulsory.",
      badge: "উপস্থিতি",
      badgeEn: "Attendance",
    },
    {
      id: "conduct_3",
      title: "৩. মোবাইল ফোন নিষেধাজ্ঞা:",
      titleEn: "3. Mobile Phone Policy:",
      description: "শ্রেণিকক্ষে শিক্ষার্থীদের স্মার্টফোন বা কোনো ইলেকট্রনিক গ্যাজেট আনা সম্পূর্ণ নিষিদ্ধ।",
      descriptionEn: "Bringing smartphones or electronic gadgets into classrooms is strictly prohibited.",
      badge: "শৃঙ্খলা বিধি",
      badgeEn: "Discipline",
    },
  ],
};
