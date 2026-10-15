export interface SchoolNotice {
  id?: string;
  title: string;
  date: string;
  category: string;
  content?: string;
  fileUrl?: string;
}

export interface SchoolQuickLink {
  label: string;
  url: string;
}

export interface SchoolDownloadItem {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  fileUrl: string;
}

export interface SchoolGalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
}

export interface SchoolCoCurricularItem {
  title: string;
  description: string;
  badge: string;
}

export interface SchoolTeacherMember {
  id: string;
  name: string;
  designation: string;
  subject: string;
  qualification: string;
  phone?: string;
  email?: string;
  photo?: string;
  category: "শিক্ষক" | "কর্মচারী" | "প্রশাসন";
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
  district: string;
  establishedYear: string;
  address: string;
  phone: string;
  email: string;
  officeHours: string;
  facebookUrl: string;
  breakingNews: string;

  // 2. Banner & Hero Section
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage: string;
  admissionBtnText: string;
  admissionBtnUrl: string;

  // 3. About & Vision
  aboutTitle: string;
  aboutText: string;
  historyText: string;
  missionText: string;
  visionText: string;
  campusOverview: string;

  // 4. Principal, Assistant Principal & Managing Committee
  principalName: string;
  principalTitle: string;
  principalQualification: string;
  principalPhoto: string;
  principalPhone: string;
  principalEmail: string;
  principalMessage: string;

  asstPrincipalName: string;
  asstPrincipalTitle: string;
  asstPrincipalPhoto: string;
  asstPrincipalMessage: string;

  smcPresidentName: string;
  smcPresidentTitle: string;
  smcPresidentPhoto: string;
  smcPresidentMessage: string;
  smcMembersCount: string;

  // 5. School Statistics
  studentCount: string;
  teacherCount: string;
  staffCount: string;
  classCount: string;
  passRate: string;
  gpa5Count: string;
  labCount: string;

  // 6. Admission Specifics
  admissionGuidelines: string;
  admissionSeats: string;
  admissionFormUrl: string;

  // 7. Dynamic Lists
  notices: SchoolNotice[];
  quickLinks: SchoolQuickLink[];
  downloads: SchoolDownloadItem[];
  gallery: SchoolGalleryItem[];
  coCurricular: SchoolCoCurricularItem[];
  teachers: SchoolTeacherMember[];

  // 8. Study Corner
  studyCornerTitle: string;
  studyCornerQuote: string;
  studyCornerText: string;
  studyCornerImage: string;
  studyCornerBooks: { title: string; author: string; category: string }[];
  studyCornerResources: { title: string; description: string; icon: string }[];
}

export const DEFAULT_WEBSITE_CONTENT: SchoolWebsiteContent = {
  schoolName: "MK Government High School",
  schoolNameBn: "এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়",
  motto: "Education, Discipline and Humanity",
  mottoBn: "জ্ঞান, শৃঙ্খলা ও মনুষ্যত্ব",
  eiin: "123456",
  schoolCode: "1001",
  boardName: "ঢাকা মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড",
  district: "ঢাকা, বাংলাদেশ",
  establishedYear: "1985",
  address: "কলেজ রোড, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ",
  phone: "+880 2 1234 5678",
  email: "info@mkschool.edu.bd",
  officeHours: "রবিবার - বৃহস্পতিবার: সকাল ৯:০০ - বিকাল ৪:০০",
  facebookUrl: "https://facebook.com",
  breakingNews: "২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি আবেদন চলমান রয়েছে · আগামী ১৫ অক্টোবর বার্ষিক ক্রীড়া প্রতিযোগিতা অনুষ্ঠিত হবে",

  heroTitle: "ঐতিহ্যবাহী এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়ে স্বাগতম",
  heroSubtitle: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত ও পরিচালিত একটি শ্রেষ্ঠ সরকারি বিদ্যাপীঠ",
  heroDescription: "সুশৃঙ্খল শিক্ষাদান, আদর্শ নৈতিক চরিত্র গঠন এবং যুগোপযোগী ডিজিটাল শিক্ষার সমন্বয়ে শিক্ষার্থীদের ভবিষ্যৎ বিনির্মাণে আমরা অঙ্গীকারাবদ্ধ।",
  heroImage: "/images/bgimage.jpg",
  admissionBtnText: "অনলাইন ভর্তি তথ্য",
  admissionBtnUrl: "/admission",

  aboutTitle: "জ্ঞানচর্চা ও শ্রেষ্ঠত্বের গৌরবময় ঐতিহ্য",
  aboutText: "এম. কে. সরকারি মডেল উচ্চ বিদ্যালয় বাংলাদেশের অন্যতম সুপরিচিত সরকারি শিক্ষাপ্রতিষ্ঠান। ১৯৮৫ সালে প্রতিষ্ঠিত এই বিদ্যাপীঠ নিরবচ্ছিন্নভাবে উন্নত মানবিক মূল্যবোধ, আধুনিক বিজ্ঞান ও তথ্যপ্রযুক্তিভিত্তিক শিক্ষা নিশ্চিত করে আসছে। বিদ্যালয়ের মনোরম ক্যাম্পাস, অভিজ্ঞ শিক্ষকমণ্ডলী এবং সুশৃঙ্খল পরিবেশ শিক্ষার্থীদের মেধা বিকাশে অনন্য ভূমিকা পালন করে।",
  historyText: "বিদ্যালয়টি একদল শিক্ষানুরাগী ব্যক্তিত্ব ও সরকারের পৃষ্ঠপোষকতায় ১৯৮৫ সালে যাত্রা শুরু করে। কালের পরিক্রমায় বিদ্যালয়টি আজ ঢাকা বিভাগের অন্যতম শীর্ষস্থানীয় আদর্শ প্রতিষ্ঠানে রূপ লাভ করেছে। এখান থেকে পাস করা অসংখ্য শিক্ষার্থী আজ দেশ-বিদেশে সুনামের সাথে গুরুত্বপূর্ণ দায়িত্ব পালন করছেন।",
  missionText: "দক্ষ, নীতিবান, বিজ্ঞানমনস্ক এবং মানবিক গুণসম্পন্ন আগামী প্রজন্মের সুনাগরিক গড়ে তোলা।",
  visionText: "স্মার্ট বাংলাদেশ ও বিশ্বমানের শিক্ষাব্যবস্থার উপযোগী শ্রেষ্ঠ আদর্শ শিক্ষাপ্রতিষ্ঠানে রূপান্তর।",
  campusOverview: "আমাদের বিদ্যালয়ে রয়েছে প্রশস্ত খেলার মাঠ, আধুনিক বহুতল একাডেমিক ভবন, ৫০০০+ বইয়ের সমৃদ্ধ পাঠাগার, শীতাতপ নিয়ন্ত্রিত ডিজিটাল কম্পিউটার ল্যাব এবং সুসজ্জিত বিজ্ঞান গবেষণাগার।",

  principalName: "মোঃ আবদুর রহমান",
  principalTitle: "প্রধান শিক্ষক",
  principalQualification: "বি.এস.সি (অনার্স), এম.এস.সি, বি.এড (১ম শ্রেণি)",
  principalPhoto: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400",
  principalPhone: "+880 1712 345678",
  principalEmail: "headmaster@mkschool.edu.bd",
  principalMessage: "বিসমিল্লাহির রাহমানির রাহিম। প্রিয় শিক্ষার্থী, শ্রদ্ধেয় অভিভাবক ও শুভানুধ্যায়ীগণ—এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়ের ডিজিটাল বাতায়নে আপনাদের আন্তরিক শুভেচ্ছা জানাই। শিক্ষার আসল উদ্দেশ্য কেবল পুঁথিগত বিদ্যা অর্জন নয়, বরং অন্তরের সুপ্ত প্রতিভাকে বিকশিত করে প্রকৃত দেশপ্রেমিক ও মানবিক মানুষ হয়ে ওঠা। আমাদের শিক্ষকমণ্ডলী প্রতিটি শিক্ষার্থীর যত্নশীল পরিচর্যায় নিবেদিতপ্রাণ। আসুন, সম্মিলিত প্রচেষ্টায় আমরা প্রিয় সন্তানদের জন্য এক সুন্দর ভবিষ্যৎ গড়ে তুলি।",

  asstPrincipalName: "মুহাম্মদ কামরুল হাসান",
  asstPrincipalTitle: "সহকারী প্রধান শিক্ষক",
  asstPrincipalPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
  asstPrincipalMessage: "বিদ্যালয়ের শিক্ষা ও সার্বিক নিয়মানুবর্তিতা রক্ষায় আমরা নিরলস কাজ করছি। ডিজিটাল প্রযুক্তির সঠিক ব্যবহারের মাধ্যমে আমাদের শিক্ষার্থীরা প্রতিনিয়ত এগিয়ে চলেছে।",

  smcPresidentName: "প্রফেসর ড. মুহাম্মদ আশরাফুল আলম",
  smcPresidentTitle: "সভাপতি, ম্যানেজিং কমিটি",
  smcPresidentPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
  smcPresidentMessage: "সরকারের ডিজিটাল শিক্ষা রূপকল্প বাস্তবায়নে এম. কে. সরকারি মডেল উচ্চ বিদ্যালয় সর্বদা অগ্রণী ভূমিকা পালন করে আসছে। অভিভাবক ও শিক্ষকবৃন্দের সম্মিলিত প্রচেষ্টায় এই বিদ্যাপীঠ তার শ্রেষ্ঠত্ব ধরে রেখেছে।",
  smcMembersCount: "১১ জন",

  studentCount: "১,৫০০+",
  teacherCount: "৫২",
  staffCount: "১৬",
  classCount: "২৪",
  passRate: "১০০%",
  gpa5Count: "১২৫+",
  labCount: "৪টি আধুনিক ল্যাব",

  admissionGuidelines: "মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তরের (মাউশি) কেন্দ্রীয় ডিজিটাল লটারির মাধ্যমে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি অনুষ্ঠিত হয়। সরকারি নির্ধারিত সময়ের মধ্যে gsa.teletalk.com.bd ওয়েবসাইটে আবেদন করতে হবে।",
  admissionSeats: "৬ষ্ঠ শ্রেণি: ১২০ আসন · ৭ম শ্রেণি: ৩০ আসন · ৮ম শ্রেণি: ২৫ আসন · ৯ম শ্রেণি: ৬০ আসন",
  admissionFormUrl: "https://gsa.teletalk.com.bd",

  notices: [
    {
      id: "n1",
      title: "২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে সরকারি নিয়মে ভর্তি বিজ্ঞপ্তি",
      date: "2026-10-15",
      category: "ভর্তি",
      content: "মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তরের (মাউশি) নীতিমালা অনুযায়ী ২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণির শিক্ষার্থীদের কেন্দ্রীয় ডিজিটাল লটারির মাধ্যমে ভর্তি আবেদন অনলাইনে শুরু হয়েছে। আগ্রহী অভিভাবক ও শিক্ষার্থীদের নির্ধারিত সময়ের মধ্যে আবেদন সম্পন্ন করার জন্য অনুরোধ করা যাচ্ছে।",
      fileUrl: "#",
    },
    {
      id: "n2",
      title: "বার্ষিক পরীক্ষা ২০২৬ এর বিস্তারিত সময়সূচী ও আসন বিন্যাস প্রকাশ",
      date: "2026-10-12",
      category: "পরীক্ষা",
      content: "সকল শ্রেণির শিক্ষার্থীদের জানানো যাচ্ছে যে, ২০২৬ সালের বার্ষিক পরীক্ষা আগামী ১লা নভেম্বর থেকে অনুষ্ঠিত হবে। বিস্তারিত পরীক্ষার রুটিন ও নির্দেশিকা নিচে ডাউনলোড সেকশনে পাওয়া যাবে।",
      fileUrl: "#",
    },
    {
      id: "n3",
      title: "অভিভাবক সমাবেশ ও ত্রৈমাসিক মূল্যায়ন সংক্রান্ত জরুরি বিজ্ঞপ্তি",
      date: "2026-10-08",
      category: "একাডেমিক",
      content: "শিক্ষার্থীদের প্রথম সাময়িক পরীক্ষার ফলাফল পর্যালোচনা এবং শিক্ষণ অগ্রগতি নিয়ে আগামী ২০ অক্টোবর বিদ্যালয় মিলনায়তনে অভিভাবক সমাবেশ অনুষ্ঠিত হবে। সকল অভিভাবকের উপস্থিতি কাম্য।",
      fileUrl: "#",
    },
    {
      id: "n4",
      title: "জাতীয় দিবস উদযাপন ও রচনা প্রতিযোগিতা সংক্রান্ত নোটিশ",
      date: "2026-10-05",
      category: "সাধারণ",
      content: "আসন্ন জাতীয় দিবস উপলক্ষে বিদ্যালয় প্রাঙ্গণে কবিতা আবৃত্তি, চিত্রাঙ্কন এবং রচনা প্রতিযোগিতার আয়োজন করা হয়েছে। আগ্রহী শিক্ষার্থীদের নিজ নিজ শ্রেণি শিক্ষকের নিকট নাম লিপিবদ্ধ করার নির্দেশ দেওয়া হলো।",
      fileUrl: "#",
    },
  ],

  quickLinks: [
    { label: "মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর (মাউশি)", url: "https://dshe.gov.bd" },
    { label: "শিক্ষা মন্ত্রণালয় (মাধ্যমিক ও উচ্চ শিক্ষা বিভাগ)", url: "https://moedu.gov.bd" },
    { label: "ঢাকা শিক্ষা বোর্ড (ফলাফল ও সেবা)", url: "https://dhakaeducationboard.gov.bd" },
    { label: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)", url: "https://nctb.gov.bd" },
    { label: "শিক্ষক বাতায়ন (Teachers Portal)", url: "https://teachers.gov.bd" },
    { label: "বাংলাদেশ জাতীয় তথ্য বাতায়ন", url: "https://bangladesh.gov.bd" },
  ],

  downloads: [
    {
      id: "d1",
      title: "২০২৬ শিক্ষাবর্ষের সকল শ্রেণির ক্লাস রুটিন (Class Routine)",
      category: "ক্লাস রুটিন",
      publishDate: "2026-10-10",
      fileUrl: "#",
    },
    {
      id: "d2",
      title: "বার্ষিক পরীক্ষা ২০২৬ সময়সূচী (Exam Schedule PDF)",
      category: "পরীক্ষার রুটিন",
      publishDate: "2026-10-12",
      fileUrl: "#",
    },
    {
      id: "d3",
      title: "এনসিটিবি কর্তৃক নির্ধারিত পাঠ্যপুস্তক ও সিলেবাস ২০২৬",
      category: "সিলেবাস",
      publishDate: "2026-09-20",
      fileUrl: "#",
    },
    {
      id: "d4",
      title: "বিদ্যালয়ের বার্ষিক ছুটির তালিকা ও শিক্ষাপঞ্জি",
      category: "শিক্ষাপঞ্জি",
      publishDate: "2026-01-05",
      fileUrl: "#",
    },
  ],

  gallery: [
    {
      id: "g1",
      title: "বিদ্যালয়ের মূল একাডেমিক ভবন ও সবুজ প্রাঙ্গণ",
      category: "ক্যাম্পাস",
      imageUrl: "/images/bgimage.jpg",
    },
    {
      id: "g2",
      title: "ডিজিটাল কম্পিউটার ল্যাব ও শিক্ষার্থীদের ব্যবহারিক ক্লাস",
      category: "ল্যাব",
      imageUrl: "/images/bgimage2.jpg",
    },
    {
      id: "g3",
      title: "বিদ্যালয়ের প্রাত্যহিক সমাবেশ ও জাতীয় সংগীত পাঠ",
      category: "সমাবেশ",
      imageUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "g4",
      title: "বার্ষিক ক্রীড়া প্রতিযোগিতা ও পুরস্কার বিতরণী অনুষ্ঠান",
      category: "ক্রীড়া",
      imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "g5",
      title: "বিজ্ঞান মেলা ও শিক্ষার্থীদের উদ্ভাবনী প্রকল্প প্রদর্শন",
      category: "বিজ্ঞান মেলা",
      imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: "g6",
      title: "শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবসে প্রভাতফেরি",
      category: "জাতীয় দিবস",
      imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800",
    },
  ],

  coCurricular: [
    {
      title: "বাংলাদেশ স্কাউটস ও গার্ল গাইড",
      description: "শৃঙ্খলা, সেবা ও দেশপ্রেমের চেতনায় স্কাউট দল নিয়মিত জাতীয় ও স্থানীয় সমাবেশ ও সেবামূলক কাজে অংশগ্রহণ করে।",
      badge: "স্কাউট দল",
    },
    {
      title: "রেড ক্রিসেন্ট যুব ইউনিট",
      description: "প্রাথমিক চিকিৎসা, রক্তদান সচেতনতা এবং দুর্যোগ মোকাবেলায় আমাদের যুব রেড ক্রিসেন্ট স্বেচ্ছাসেবকরা তৎপর।",
      badge: "মানবিক সেবা",
    },
    {
      title: "বিজ্ঞান ও রোবোটিক্স ক্লাব",
      description: "নিয়মিত বিজ্ঞান অলিম্পিয়াড, গণিত ক্যাম্প এবং রোবোটিক্স ও কোডিং কর্মশালার মাধ্যমে আধুনিক চিন্তার বিকাশ।",
      badge: "আইসিটি ও বিজ্ঞান",
    },
    {
      title: "বিতর্ক ও সাহিত্য সংসদ",
      description: "যুক্তিনির্ভর চিন্তাধারা ও বাগ্মীতা চর্চার লক্ষ্যে জাতীয় পর্যায়ের বিতর্ক প্রতিযোগিতায় আমাদের দল কৃতিত্ব প্রদর্শন করে আসছে।",
      badge: "সাহিত্য ও বিতর্ক",
    },
  ],

  teachers: [
    {
      id: "t1",
      name: "মোঃ আবদুর রহমান",
      designation: "প্রধান শিক্ষক",
      subject: "গণিত ও বিজ্ঞান",
      qualification: "বি.এস.সি (অনার্স), এম.এস.সি, বি.এড",
      phone: "+880 1712 345678",
      email: "headmaster@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400",
      category: "প্রশাসন",
    },
    {
      id: "t2",
      name: "মুহাম্মদ কামরুল হাসান",
      designation: "সহকারী প্রধান শিক্ষক",
      subject: "পদার্থবিজ্ঞান",
      qualification: "এম.এস.সি (পদার্থ), বি.এড",
      phone: "+880 1812 345679",
      email: "kamrul@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
      category: "প্রশাসন",
    },
    {
      id: "t3",
      name: "মোসাম্মৎ আয়েশা সিদ্দিকা",
      designation: "সিনিয়র শিক্ষক",
      subject: "বাংলা",
      qualification: "এম.এ (বাংলা), বি.এড",
      phone: "+880 1912 345680",
      email: "ayesha@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      category: "শিক্ষক",
    },
    {
      id: "t4",
      name: "এস. এম. তানভীর আহমেদ",
      designation: "সহকারী শিক্ষক",
      subject: "ইংরেজি",
      qualification: "বি.এ (অনার্স), এম.এ (ইংরেজি)",
      phone: "+880 1612 345681",
      email: "tanvir@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
      category: "শিক্ষক",
    },
    {
      id: "t5",
      name: "নাসরিন সুলতানা",
      designation: "সহকারী শিক্ষক",
      subject: "তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)",
      qualification: "বি.এস.সি (সিএসই)",
      phone: "+880 1512 345682",
      email: "nasrin@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
      category: "শিক্ষক",
    },
    {
      id: "t6",
      name: "মোঃ জহিরুল ইসলাম",
      designation: "সহকারী শিক্ষক",
      subject: "সাধারণ বিজ্ঞান",
      qualification: "বি.এস.সি (রসায়ন), বি.এড",
      phone: "+880 1712 345683",
      email: "zahir@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
      category: "শিক্ষক",
    },
    {
      id: "t7",
      name: "মোঃ রফিকুল হাসান",
      designation: "প্রধান সহকারী ও হিসাবরক্ষক",
      subject: "হিসাব বিভাগ",
      qualification: "এম.কম (হিসাববিজ্ঞান)",
      phone: "+880 1812 345684",
      email: "accountant@mkschool.edu.bd",
      photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400",
      category: "কর্মচারী",
    },
  ],

  studyCornerTitle: "Study Corner — জ্ঞান অন্বেষণের কেন্দ্র",
  studyCornerQuote: "“জ্ঞানই শক্তি। পড়ো এবং নিজেকে আলোকিত করো।” — জ্ঞানান্বেষী শিক্ষার্থীর প্রেরণা",
  studyCornerText: "বিদ্যালয়ের Study Corner হলো শিক্ষার্থীদের জন্য একটি বিশেষ পাঠ ও গবেষণা কেন্দ্র যেখানে রয়েছে সমৃদ্ধ পাঠাগার, ডিজিটাল রিসোর্স, বিজ্ঞান ও গণিতের রেফারেন্স বই, এবং শান্ত পরিবেশে স্ব-অধ্যয়নের সুযোগ। এখানে শিক্ষার্থীরা পাঠ্যক্রমের বাইরেও নানা বিষয়ে জ্ঞান আহরণ করতে পারে।",
  studyCornerImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600",
  studyCornerBooks: [
    { title: "Algebra & Higher Mathematics", author: "S.L. Loney", category: "গণিত" },
    { title: "General Science Encyclopedia", author: "Various Authors", category: "বিজ্ঞান" },
    { title: "বাংলা সাহিত্য সমগ্র", author: "রবীন্দ্রনাথ ঠাকুর", category: "সাহিত্য" },
    { title: "English Grammar & Composition", author: "Wren & Martin", category: "ইংরেজি" },
    { title: "বাংলাদেশের ইতিহাস ও সংস্কৃতি", author: "ড. মুহম্মদ কুদরাত-এ-খুদা", category: "ইতিহাস" },
    { title: "Physics for Class 9-10", author: "NCTB", category: "পদার্থবিজ্ঞান" },
    { title: "Chemistry Practical Guide", author: "Prof. Md. Abdur Rahim", category: "রসায়ন" },
    { title: "Computer Science & ICT", author: "Digital Bangladesh Series", category: "তথ্যপ্রযুক্তি" },
  ],
  studyCornerResources: [
    { title: "ডিজিটাল লাইব্রেরি অ্যাক্সেস", description: "মুক্তপাঠ ও শিক্ষা বাতায়নের ই-বুক ও ভিডিও লেকচার", icon: "BookOpen" },
    { title: "শান্ত পাঠ কক্ষ", description: "শিক্ষার্থীদের নিরিবিলি স্ব-অধ্যয়নের জন্য বিশেষ কক্ষ", icon: "BookMarked" },
    { title: "গ্রুপ স্টাডি জোন", description: "দলগত আলোচনা ও প্রজেক্ট ওয়ার্কের জন্য উন্মুক্ত এলাকা", icon: "Users" },
    { title: "কম্পিউটার রিসার্চ ডেস্ক", description: "ইন্টারনেটসহ কম্পিউটার ব্যবহারের সুবিধা", icon: "Monitor" },
  ],
};
