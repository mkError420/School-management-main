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

  // 4. Principal & Assistant Principal
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

  // 5. School Statistics
  studentCount: string;
  teacherCount: string;
  staffCount: string;
  classCount: string;
  passRate: string;
  gpa5Count: string;
  labCount: string;

  // 6. Dynamic Lists
  notices: SchoolNotice[];
  quickLinks: SchoolQuickLink[];
  downloads: SchoolDownloadItem[];
  gallery: SchoolGalleryItem[];
  coCurricular: SchoolCoCurricularItem[];

  // 7. Mujib Corner
  mujibCornerTitle: string;
  mujibCornerQuote: string;
  mujibCornerText: string;
  mujibCornerImage: string;
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
  admissionBtnUrl: "#admission",

  aboutTitle: "জ্ঞানচর্চা ও শ্রেষ্ঠত্বের গৌরবময় ঐতিহ্য",
  aboutText: "এম. কে. সরকারি মডেল উচ্চ বিদ্যালয় বাংলাদেশের অন্যতম সুপরিচিত সরকারি শিক্ষাপ্রতিষ্ঠান। ১৯৮৫ সালে প্রতিষ্ঠিত এই বিদ্যাপীঠ নিরবচ্ছিন্নভাবে উন্নত মানবিক মূল্যবোধ, আধুনিক বিজ্ঞান ও তথ্যপ্রযুক্তিভিত্তিক শিক্ষা নিশ্চিত করে আসছে। বিদ্যালয়ের মনোরম ক্যাম্পাস, অভিজ্ঞ শিক্ষকমণ্ডলী এবং সুশৃঙ্খল পরিবেশ শিক্ষার্থীদের মেধা বিকাশে অনন্য ভূমিকা পালন করে।",
  historyText: "বিদ্যালয়টি একদল শিক্ষানুরাগী ব্যক্তিত্ব ও সরকারের পৃষ্ঠপোষকতায় যাত্রা শুরু করে আজ জাতীয় পর্যায়ে কৃতিত্বের স্বাক্ষর রেখে চলেছে।",
  missionText: "দক্ষ, নীতিবান, বিজ্ঞানমনস্ক এবং মানবিক গুণসম্পন্ন আগামী প্রজন্মের সুনাগরিক গড়ে তোলা।",
  visionText: "স্মার্ট বাংলাদেশ ও বিশ্বমানের শিক্ষাব্যবস্থার উপযোগী শ্রেষ্ঠ আদর্শ শিক্ষাপ্রতিষ্ঠানে রূপান্তর।",

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

  studentCount: "১,৫০০+",
  teacherCount: "৫২",
  staffCount: "১৬",
  classCount: "২৪",
  passRate: "১০০%",
  gpa5Count: "১২৫+",
  labCount: "৪টি আধুনিক ল্যাব",

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

  mujibCornerTitle: "মুজিব কর্নার ও মুক্তিযুদ্ধ চেতনা",
  mujibCornerQuote: "“সোনার বাংলা গড়তে হলে সোনার মানুষ চাই” — জাতির পিতা বঙ্গবন্ধু শেখ মুজিবুর রহমান",
  mujibCornerText: "জাতির পিতা বঙ্গবন্ধু শেখ মুজিবুর রহমানের জীবনাদর্শ, মুক্তিসংগ্রাম ও মুক্তিযুদ্ধের চেতনা শিক্ষার্থীদের মাঝে ছড়িয়ে দিতে বিদ্যালয়ে স্থাপন করা হয়েছে সমৃদ্ধ 'মুজিব কর্নার'। এখানে রয়েছে মুক্তিযুদ্ধভিত্তিক দুর্লভ গ্রন্থ, আলোকচিত্র ও প্রামাণ্য দলিল।",
  mujibCornerImage: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&q=80&w=600",
};
