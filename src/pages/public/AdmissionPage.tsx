import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Home,
  Info,
  Layers,
  Loader2,
  Mail,
  Phone,
  Printer,
  RefreshCw,
  School,
  Search,
  Sparkles,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { api } from "@/lib/api";

type ActiveTab = "apply" | "guidelines" | "track";

interface ClassOption {
  id: string | number;
  name: string;
  grade_id?: string | number;
  grade_level?: string | number;
}

const DEFAULT_CLASSES: ClassOption[] = [
  { id: 0, name: "Class Nursery", grade_id: 0, grade_level: 0 },
  { id: 1, name: "Class Play Group", grade_id: 1, grade_level: 1 },
  { id: 2, name: "Class KG", grade_id: 2, grade_level: 2 },
  { id: 3, name: "Class 1", grade_id: 3, grade_level: 3 },
  { id: 4, name: "Class 2", grade_id: 4, grade_level: 4 },
  { id: 5, name: "Class 3", grade_id: 5, grade_level: 5 },
  { id: 6, name: "Class 4", grade_id: 6, grade_level: 6 },
  { id: 7, name: "Class 5", grade_id: 7, grade_level: 7 },
  { id: 8, name: "Class 6", grade_id: 8, grade_level: 8 },
  { id: 9, name: "Class 7", grade_id: 9, grade_level: 9 },
  { id: 10, name: "Class 8", grade_id: 10, grade_level: 10 },
  { id: 11, name: "Class 9", grade_id: 11, grade_level: 11 },
  { id: 12, name: "Class 10", grade_id: 12, grade_level: 12 },
  { id: 13, name: "Class 11", grade_id: 13, grade_level: 13 },
  { id: 14, name: "Class 12", grade_id: 14, grade_level: 14 },
];

const CLASS_SEAT_CAPACITY = [
  {
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

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const AdmissionPage: React.FC = () => {
  const { websiteContent: content, siteLogo, t, lang, formatDigits } = useSiteSettings();

  const [activeTab, setActiveTab] = useState<ActiveTab>("apply");
  const [classesList, setClassesList] = useState<ClassOption[]>(DEFAULT_CLASSES);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(true);

  // Dynamic Class-wise Available Seats from Website Content
  const seatCapacityList = useMemo(() => {
    if (content.admissionSeatMatrix && content.admissionSeatMatrix.length > 0) {
      return content.admissionSeatMatrix;
    }
    return CLASS_SEAT_CAPACITY;
  }, [content.admissionSeatMatrix]);

  // Form State
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    class_id: "",
    grade_id: "",
    date_of_birth: "",
    sex: "MALE" as "MALE" | "FEMALE",
    student_type: "",
    blood_type: "A+",
    email: "",
    phone: "",
    address: "",
    previous_school: "",
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    parent_nid: "",
    notes: "",
  });

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedAdmission, setSubmittedAdmission] = useState<any | null>(null);
  const [copiedAppNo, setCopiedAppNo] = useState<boolean>(false);

  // Bengali / Bangla Unicode range: U+0980 - U+09FF
  const BANGLA_REGEX = /[\u0980-\u09FF]/;

  const handleEnglishChange = (field: keyof typeof formData, value: string) => {
    if (BANGLA_REGEX.test(value)) {
      setFormError(
        lang === "en"
          ? "Bangla text is not accepted in this form. Please type in English only."
          : "এই ফর্মে বাংলা বর্ণ গ্রহণযোগ্য নয়। অনুগ্রহ করে শুধুমাত্র ইংরেজিতে লিখুন (English only)।"
      );
      const cleanValue = value.replace(/[\u0980-\u09FF]/g, "");
      setFormData((prev) => ({ ...prev, [field]: cleanValue }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle student type checkbox (Resident, Non-Resident, Day Care)
  const handleStudentTypeToggle = (type: "Resident" | "Non-Resident" | "Day Care") => {
    const current = formData.student_type
      ? formData.student_type.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    let next: string[];
    if (current.some((t) => t.toLowerCase() === type.toLowerCase())) {
      next = current.filter((t) => t.toLowerCase() !== type.toLowerCase());
    } else {
      next = current.filter((t) => {
        const lower = t.toLowerCase();
        if (type === "Resident" && lower === "non-resident") return false;
        if (type === "Non-Resident" && lower === "resident") return false;
        return true;
      });
      next.push(type);
    }
    setFormData((prev) => ({ ...prev, student_type: next.join(", ") }));
  };

  // Tracking State
  const [trackQuery, setTrackQuery] = useState<string>("");
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // Load classes from API on mount
  useEffect(() => {
    let active = true;
    const fetchClasses = async () => {
      try {
        const res = await api.getAll("classes", { limit: 100 });
        if (active && res.success && Array.isArray(res.data?.classes) && res.data.classes.length > 0) {
          setClassesList(res.data.classes);
        }
      } catch {
        // Fallback to default classes
      } finally {
        if (active) setLoadingClasses(false);
      }
    };
    void fetchClasses();
    return () => {
      active = false;
    };
  }, []);

  const requiredDocuments = [
    {
      bn: "অনলাইনে আবেদনের সময় ব্যাবহার কৃত ফোন নম্বর",
      en: "Phone number used during online application",
    },
    {
      bn: "অনলাইন ভেরিফাইড ডিজিটাল জন্ম নিবন্ধন সনদের সত্যায়িত কপি",
      en: "Attested copy of online-verified digital birth registration certificate",
    },
    {
      bn: "পূর্ববর্তী বিদ্যালয়ের প্রশংসাপত্র/ছাড়পত্র (টিসি) এর মূল কপি",
      en: "Original Transfer Certificate (TC) and testimonial from previous school",
    },
    {
      bn: "শিক্ষার্থীর সদ্য তোলা ২ কপি পাসপোর্ট সাইজ রঙিন ছবি",
      en: "2 copies of recent passport-size colored photographs of the student",
    },
    {
      bn: "পিতা ও মাতার জাতীয় পরিচয়পত্রের (NID) ফটোকপি",
      en: "Photocopies of National Identity Cards (NID) of both parents",
    },
    {
      bn: "বিশেষ কোটা (মুক্তিযোদ্ধা, প্রতিবন্ধী, ক্যাচমেন্ট) সনদপত্র (প্রযোজ্য ক্ষেত্রে)",
      en: "Certificates supporting special quota (freedom fighter, disability, catchment) where applicable",
    },
  ];

  // Handle Photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError(
        lang === "en"
          ? "Please choose a valid JPG, PNG, or WebP photo."
          : "অনুগ্রহ করে JPG, PNG অথবা WebP ফরম্যাটের ছবি নির্বাচন করুন।"
      );
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError(
        lang === "en"
          ? "Photo size must be no larger than 5 MB."
          : "ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট (5 MB) হতে পারবে।"
      );
      e.target.value = "";
      return;
    }

    setFormError(null);
    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Submit Admission Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Reject any Bangla characters in any field
    const textFieldsToCheck = [
      { name: lang === "en" ? "First Name" : "প্রথম নাম", value: formData.first_name },
      { name: lang === "en" ? "Last Name" : "শেষ নাম", value: formData.last_name },
      { name: lang === "en" ? "Student Email" : "ইমেইল", value: formData.email },
      { name: lang === "en" ? "Student Phone" : "ফোন নম্বর", value: formData.phone },
      { name: lang === "en" ? "Present Address" : "বর্তমান ঠিকানা", value: formData.address },
      { name: lang === "en" ? "Previous School" : "পূর্ববর্তী বিদ্যালয়", value: formData.previous_school },
      { name: lang === "en" ? "Parent Name" : "অভিভাবকের নাম", value: formData.parent_name },
      { name: lang === "en" ? "Parent Phone" : "অভিভাবকের মোবাইল", value: formData.parent_phone },
      { name: lang === "en" ? "Parent NID" : "অভিভাবকের এনআইডি", value: formData.parent_nid },
      { name: lang === "en" ? "Parent Email" : "অভিভাবকের ইমেইল", value: formData.parent_email },
      { name: lang === "en" ? "Remarks / Notes" : "মন্তব্য", value: formData.notes },
    ];

    const banglaField = textFieldsToCheck.find((f) => BANGLA_REGEX.test(f.value));
    if (banglaField) {
      setFormError(
        lang === "en"
          ? `Bangla text is not allowed in ${banglaField.name}. Please enter in English only.`
          : `${banglaField.name}-এ বাংলা গ্রহণযোগ্য নয়। অনুগ্রহ করে শুধুমাত্র ইংরেজিতে লিখুন (English only)।`
      );
      return;
    }

    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setFormError(
        lang === "en"
          ? "First name and last name are required."
          : "শিক্ষার্থীর প্রথম নাম ও শেষ নাম পূরণ করা আবশ্যক।"
      );
      return;
    }

    if (!formData.class_id) {
      setFormError(
        lang === "en"
          ? "Please select the desired class for admission."
          : "অনুগ্রহ করে যে শ্রেণিতে ভর্তি হতে ইচ্ছুক তা নির্বাচন করুন।"
      );
      return;
    }

    // Student photo is mandatory
    if (!selectedPhoto) {
      setFormError(
        lang === "en"
          ? "Student photo is mandatory. Please upload a student photo."
          : "শিক্ষার্থীর পাসপোর্ট সাইজ ছবি আপলোড করা আবশ্যক।"
      );
      return;
    }

    if (!formData.parent_name.trim() || !formData.parent_phone.trim()) {
      setFormError(
        lang === "en"
          ? "Parent/Guardian name and phone number are required."
          : "অভিভাবকের নাম এবং মোবাইল নম্বর প্রদান করা আবশ্যক।"
      );
      return;
    }

    if (!formData.parent_nid.trim()) {
      setFormError(
        lang === "en"
          ? "Parent's NID number is mandatory."
          : "অভিভাবকের জাতীয় পরিচয়পত্র (NID) নম্বর প্রদান করা আবশ্যক।"
      );
      return;
    }

    if (!formData.address.trim()) {
      setFormError(
        lang === "en"
          ? "Present address is required."
          : "শিক্ষার্থীর বর্তমান ঠিকানা প্রদান করা আবশ্যক।"
      );
      return;
    }

    setSubmitting(true);

    try {
      const selectedClass = classesList.find((c) => String(c.id) === String(formData.class_id));
      const gradeId = formData.grade_id || (selectedClass ? selectedClass.grade_id : 1);

      const payload: Record<string, any> = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        class_id: formData.class_id,
        grade_id: gradeId || 1,
        date_of_birth: formData.date_of_birth || null,
        sex: formData.sex,
        gender: formData.sex,
        blood_type: formData.blood_type,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim(),
        student_type: formData.student_type.trim() || null,
        previous_school: formData.previous_school.trim() || null,
        parent_name: formData.parent_name.trim(),
        parent_phone: formData.parent_phone.trim(),
        parent_email: formData.parent_email.trim() || null,
        parent_nid: formData.parent_nid.trim(),
        notes: formData.notes.trim() || "Submitted online via Public Website Admission Form",
        status: "PENDING",
      };

      let res;
      if (selectedPhoto) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) fd.append(k, String(v));
        });
        fd.append("img", selectedPhoto, selectedPhoto.name);
        res = await api.submitAdmissionApplication(fd);
      } else {
        res = await api.submitAdmissionApplication(payload);
      }

      if (res.success && res.data) {
        const created = res.data;
        // Attach class name if missing from backend response
        if (!created.class_name && selectedClass) {
          created.class_name = selectedClass.name;
        }
        setSubmittedAdmission(created);
        // Reset form
        setFormData({
          first_name: "",
          last_name: "",
          class_id: "",
          grade_id: "",
          date_of_birth: "",
          sex: "MALE",
          student_type: "",
          blood_type: "A+",
          email: "",
          phone: "",
          address: "",
          previous_school: "",
          parent_name: "",
          parent_phone: "",
          parent_email: "",
          parent_nid: "",
          notes: "",
        });
        setSelectedPhoto(null);
        setPhotoPreview(null);

        // Notify other windows/tabs (e.g. dashboard) to refresh admissions list
        try {
          window.dispatchEvent(new CustomEvent("school-admissions-updated"));
        } catch { }
      } else {
        setFormError(
          res.message ||
          (lang === "en"
            ? "Failed to submit admission application. Please try again."
            : "আবেদনপত্র জমা দিতে ব্যর্থ হয়েছে। অনুগ্রহ করে তথ্য যাচাই করে পুনরায় চেষ্টা করুন।")
        );
      }
    } catch (err: any) {
      setFormError(
        (err?.message || "Network error") +
        (lang === "en"
          ? ". Please check your connection and try again."
          : "। সার্ভারের সাথে যোগাযোগ করা যায়নি, পুনরায় চেষ্টা করুন।")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Copy Application No
  const handleCopyAppNo = (appNo: string) => {
    navigator.clipboard.writeText(appNo);
    setCopiedAppNo(true);
    setTimeout(() => setCopiedAppNo(false), 2500);
  };

  // Handle Track Application Status
  const handleTrackApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    setTrackingLoading(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const res = await api.trackAdmission(trackQuery.trim());
      if (res.success && res.data?.admission) {
        setTrackResult(res.data.admission);
      } else {
        setTrackError(
          res.message ||
          (lang === "en"
            ? "No application found matching this Application Number or Mobile Number."
            : "প্রদত্ত আবেদন নম্বর বা মোবাইল নম্বরের সাথে মিল রেখে কোনো আবেদনপত্র খুঁজে পাওয়া যায়নি।")
        );
      }
    } catch {
      setTrackError(
        lang === "en"
          ? "Unable to connect to admissions service. Please try again."
          : "সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।"
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  // Print Slip
  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>{t("হোম", "Home")}</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">{t("ভর্তি তথ্য ও আবেদন", "Admission & Online Application")}</span>
      </nav>

      {/* Page Banner */}
      <div className="rounded-xl border border-[#cbe0d3] bg-gradient-to-r from-[#004d38] via-[#005a40] to-[#006a4e] p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eab308] px-3 py-1 text-xs font-bold text-gray-950 shadow-xs">
              <span>{t("ভর্তি সেশন ২০২৬", "Admission Session 2026/27")}</span>
            </span>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl tracking-tight">
              {t("শিক্ষার্থী অনলাইন ভর্তি আবেদন পোর্টাল", "Online Student Admission & Application Portal")}
            </h1>
            <p className="mt-1.5 text-xs text-emerald-100 sm:text-sm max-w-2xl leading-relaxed">
              {t(
                "বিদ্যালয়ের নার্সারি থেকে ১২শ শ্রেণিতে নতুন ভর্তির জন্য সরাসরি অনলাইনে আবেদন ফরম পূরণ করুন অথবা জমাকৃত আবেদনের বর্তমান অবস্থা যাচাই করুন।",
                "Apply online directly for admission from Nursery to Class 12 or track your existing application status in real-time."
              )}
            </p>
          </div>

          <div className="hidden md:flex flex-col items-end gap-1.5 text-right text-xs text-emerald-100">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <School size={16} />
              <span>{t(content.schoolNameBn, content.schoolName)}</span>
            </span>
            <span>EIIN: {content.eiin} · Code: {content.schoolCode}</span>
          </div>
        </div>
      </div>

      {/* Main Tab Buttons */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("apply");
            setSubmittedAdmission(null);
          }}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition shadow-xs ${activeTab === "apply"
            ? "bg-[#006a4e] text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-[#006a4e]"
            }`}
        >
          <UserPlus size={15} />
          <span>{t("অনলাইন ভর্তি আবেদন ফরম", "Online Admission Form")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("guidelines")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition shadow-xs ${activeTab === "guidelines"
            ? "bg-[#006a4e] text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-[#006a4e]"
            }`}
        >
          <FileText size={15} />
          <span>{t("ভর্তি নীতিমালা ও শূন্য আসন", "Guidelines & Seat Matrix")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("track")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition shadow-xs ${activeTab === "track"
            ? "bg-[#006a4e] text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-[#006a4e]"
            }`}
        >
          <Search size={15} />
          <span>{t("আবেদনের অবস্থা যাচাই", "Track Application Status")}</span>
        </button>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* Left Column (Main Content) */}
        <div className="space-y-6 lg:col-span-8">
          {/* ─────── TAB 1: ONLINE ADMISSION FORM ─────── */}
          {activeTab === "apply" && (
            <div>
              {/* SUCCESS CONFIRMATION SLIP */}
              {submittedAdmission ? (
                <div
                  ref={printRef}
                  className="rounded-xl border border-emerald-300 bg-white p-6 md:p-8 shadow-md space-y-6 print:m-0 print:border-none print:shadow-none"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-[#006a4e]">
                        <CheckCircle2 size={28} />
                      </div>
                      <div>
                        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          {t("আবেদন সফলভাবে গৃহীত হয়েছে", "Application Submitted Successfully")}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900 mt-1">
                          {t("শিক্ষার্থী ভর্তি আবেদন নিশ্চিতকরণ স্লিপ", "Student Admission Confirmation Slip")}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {t("বিদ্যালয়ের প্রশাসনিক ড্যাশবোর্ডে আবেদনপত্রটি পর্যালোচনার জন্য জমা হয়েছে।", "Application forwarded to the admin enrollment desk for review.")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 print:hidden">
                      <button
                        type="button"
                        onClick={handlePrintSlip}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-2xs"
                      >
                        <Printer size={14} />
                        <span>{t("প্রিন্ট স্লিপ", "Print Slip")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSubmittedAdmission(null)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#00503a] shadow-xs"
                      >
                        <UserPlus size={14} />
                        <span>{t("নতুন আবেদন", "New Application")}</span>
                      </button>
                    </div>
                  </div>

                  {/* Tracking Number Card */}
                  <div className="rounded-xl border border-emerald-200 bg-[#f4f9f6] p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {t("আবেদন ট্র্যাকিং নম্বর (Application ID):", "Application Tracking Number:")}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-black text-[#006a4e] font-mono tracking-wider">
                          {submittedAdmission.application_no || "ADM-2026-XXXX"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAppNo(submittedAdmission.application_no)}
                          title="নম্বর কপি করুন"
                          className="rounded p-1.5 text-gray-500 hover:bg-emerald-100 hover:text-[#006a4e] transition print:hidden"
                        >
                          {copiedAppNo ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                        {copiedAppNo && (
                          <span className="text-[11px] font-bold text-emerald-600">কপি হয়েছে!</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                        <Clock size={12} />
                        <span>{t("স্ট্যাটাস: অপেক্ষমাণ (Pending)", "Status: Pending Review")}</span>
                      </span>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {t("তারিখ:", "Date:")} {submittedAdmission.applied_date || new Date().toISOString().slice(0, 10)}
                      </p>
                    </div>
                  </div>

                  {/* Summary Details Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs border border-gray-100 rounded-lg p-4 bg-[#fcfdfd]">
                    <div>
                      <span className="text-gray-500 font-medium">{t("শিক্ষার্থীর পূর্ণ নাম:", "Student Full Name:")}</span>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">
                        {submittedAdmission.first_name} {submittedAdmission.last_name}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">{t("ভর্তিচ্ছু শ্রেণি:", "Class Applied:")}</span>
                      <p className="text-sm font-bold text-[#006a4e] mt-0.5">
                        {submittedAdmission.class_name || `Class ${submittedAdmission.class_id}`}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">{t("লিঙ্গ ও জন্ম তারিখ:", "Gender & Date of Birth:")}</span>
                      <p className="font-semibold text-gray-800 mt-0.5">
                        {submittedAdmission.gender === "FEMALE" ? t("ছাত্রী (Female)", "Female") : t("ছাত্র (Male)", "Male")},{" "}
                        {submittedAdmission.date_of_birth || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">{t("রক্তের গ্রুপ:", "Blood Group:")}</span>
                      <p className="font-semibold text-gray-800 mt-0.5">
                        {submittedAdmission.blood_type || "A+"}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">{t("পিতা / অভিভাবকের নাম:", "Parent / Guardian Name:")}</span>
                      <p className="font-semibold text-gray-800 mt-0.5">
                        {submittedAdmission.parent_name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">{t("অভিভাবকের এনআইডি:", "Parent NID Number:")}</span>
                      <p className="font-semibold text-gray-800 mt-0.5 font-mono">
                        {submittedAdmission.parent_nid || formData.parent_nid || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">{t("অভিভাবকের মোবাইল:", "Guardian Phone:")}</span>
                      <p className="font-semibold text-gray-800 mt-0.5 font-mono">
                        {submittedAdmission.parent_phone || submittedAdmission.phone || "N/A"}
                      </p>
                    </div>

                    {submittedAdmission.student_type && (
                      <div>
                        <span className="text-gray-500 font-medium">{t("শিক্ষার্থীর ধরন:", "Student Type:")}</span>
                        <p className="font-semibold text-emerald-800 mt-0.5">
                          {submittedAdmission.student_type}
                        </p>
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <span className="text-gray-500 font-medium">{t("বর্তমান ঠিকানা:", "Address:")}</span>
                      <p className="text-gray-800 mt-0.5 leading-relaxed">
                        {submittedAdmission.address || "N/A"}
                      </p>
                    </div>

                    {submittedAdmission.previous_school && (
                      <div className="sm:col-span-2">
                        <span className="text-gray-500 font-medium">{t("পূর্ববর্তী বিদ্যালয়:", "Previous School:")}</span>
                        <p className="text-gray-800 mt-0.5">{submittedAdmission.previous_school}</p>
                      </div>
                    )}
                  </div>

                  {/* Next Steps Box */}
                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-blue-950">
                      <Info size={14} className="text-blue-600" />
                      <span>{t("পরবর্তী নির্দেশনাবলী:", "Next Steps for the Applicant:")}</span>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>{t("এই আবেদন স্লিপটি প্রিন্ট অথবা সংরক্ষণ করে রাখুন।", "Print or save this confirmation slip for future correspondence.")}</li>
                      <li>{t("বিদ্যালয় কর্তৃপক্ষ আবেদন যাচাই ও মূল্যায়ন শেষে এসএমএস ও পোর্টালের মাধ্যমে সিদ্ধান্ত জানাবে।", "School administrators will review the submission and notify via SMS and portal.")}</li>
                      <li>{t("উপরে থাকা 'আবেদনের অবস্থা যাচাই' ট্যাবে আবেদন নম্বর দিয়ে যেকোনো সময় অগ্রগতি জানতে পারেন।", "You can check your status anytime using the 'Track Application Status' tab.")}</li>
                    </ul>
                  </div>
                </div>
              ) : (
                /* THE APPLICATION FORM */
                <section className="rounded-xl border border-[#dde5df] bg-white p-6 md:p-8 shadow-xs">
                  <div className="border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-lg font-bold text-[#005a40] flex flex-wrap items-center gap-2">
                      <UserPlus size={20} />
                      <span>{t("অনলাইন শিক্ষার্থী ভর্তি আবেদনপত্র", "Student Online Admission Application Form")}</span>
                      <span className="text-red-700 bg-red-100 border border-red-300 font-bold text-xs px-2.5 py-0.5 rounded-md">
                        {t("শুধুমাত্র ইংরেজিতে পূরণ করুন — বাংলা বর্ণ গ্রহণযোগ্য নয়", "English Only — Bangla not accepted")}
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {t(
                        "বিদ্যালয়ে ভর্তির জন্য নিচের তথ্যাদি সতর্কতার সাথে শুধুমাত্র ইংরেজিতে পূরণ করুন। বাংলা অক্ষর গ্রহণযোগ্য নয়। লাল তারকা (*) চিহ্নিত ফিল্ডগুলো আবশ্যক।",
                        "Please fill out all fields in English only. Bangla text will not be accepted. Fields marked with an asterisk (*) are mandatory."
                      )}
                    </p>
                  </div>

                  {formError && (
                    <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800">
                      <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitApplication} className="space-y-6">
                    {/* SECTION A: STUDENT DETAILS */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-emerald-100 pb-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#006a4e] text-white text-[10px] font-bold">
                          ১
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#006a4e]">
                          {t("শিক্ষার্থীর ব্যক্তিগত বিবরণ (Student Details)", "Student Personal Information")}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* First Name */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span>{t("প্রথম নাম (First Name in English) *", "First Name (in English) *")}</span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Tanvir (in English)"
                            value={formData.first_name}
                            onChange={(e) => handleEnglishChange("first_name", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20"
                          />
                        </label>

                        {/* Last Name */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span>{t("শেষ নাম / পদবি (Last Name in English) *", "Last Name (in English) *")}</span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ahmed (in English)"
                            value={formData.last_name}
                            onChange={(e) => handleEnglishChange("last_name", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20"
                          />
                        </label>

                        {/* Desired Class */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span>{t("ভর্তিচ্ছু শ্রেণি (Desired Class) *", "Desired Class *")}</span>
                          <select
                            required
                            value={formData.class_id}
                            onChange={(e) => {
                              const selId = e.target.value;
                              const matched = classesList.find((c) => String(c.id) === selId);
                              setFormData({
                                ...formData,
                                class_id: selId,
                                grade_id: matched?.grade_id ? String(matched.grade_id) : "",
                              });
                            }}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e]"
                          >
                            <option value="">{t("-- শ্রেণি নির্বাচন করুন --", "-- Select Class --")}</option>
                            {classesList.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        {/* Gender / Sex */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span>{t("লিঙ্গ (Gender) *", "Gender *")}</span>
                          <select
                            required
                            value={formData.sex}
                            onChange={(e) => setFormData({ ...formData, sex: e.target.value as "MALE" | "FEMALE" })}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e]"
                          >
                            <option value="MALE">{t("ছাত্র (Male)", "Male")}</option>
                            <option value="FEMALE">{t("ছাত্রী (Female)", "Female")}</option>
                          </select>
                        </label>

                        {/* Date of Birth */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-gray-400" />
                            <span>{t("জন্ম তারিখ (Date of Birth) *", "Date of Birth *")}</span>
                          </span>
                          <input
                            type="date"
                            required
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20"
                          />
                        </label>

                        {/* Blood Group */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span>{t("রক্তের গ্রুপ (Blood Group)", "Blood Group")}</span>
                          <select
                            value={formData.blood_type}
                            onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e]"
                          >
                            {BLOOD_GROUPS.map((bg) => (
                              <option key={bg} value={bg}>
                                {bg}
                              </option>
                            ))}
                          </select>
                        </label>

                        {/* Student Email */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span className="flex items-center gap-1">
                            <Mail size={13} className="text-gray-400" />
                            <span>{t("শিক্ষার্থীর ইমেইল (ঐচ্ছিক)", "Student Email (Optional)")}</span>
                          </span>
                          <input
                            type="email"
                            placeholder="student@example.com"
                            value={formData.email}
                            onChange={(e) => handleEnglishChange("email", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20"
                          />
                        </label>

                        {/* Student Phone */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span className="flex items-center gap-1">
                            <Phone size={13} className="text-gray-400" />
                            <span>{t("শিক্ষার্থীর ফোন (ঐচ্ছিক)", "Student Phone (Optional)")}</span>
                          </span>
                          <input
                            type="tel"
                            placeholder="+880 1..."
                            value={formData.phone}
                            onChange={(e) => handleEnglishChange("phone", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20 font-mono"
                          />
                        </label>

                        {/* Student Type Checkbox System */}
                        <div className="flex flex-col gap-2 sm:col-span-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700">
                              {t("শিক্ষার্থীর ধরন (Student Type):", "Student Type:")}
                            </span>
                            {formData.student_type ? (
                              <span className="text-xs font-medium text-emerald-700">
                                {t("নির্বাচিত: ", "Selected: ")}
                                <span className="font-semibold">{formData.student_type}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400">
                                {t("প্রযোজ্য অপশন টিক দিন", "Select student type (Resident, Non-Resident, Day Care)")}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { id: "Resident", labelBn: "আবাসিক (Resident)", labelEn: "Resident", descBn: "হোস্টেল / বোর্ডিং", descEn: "Boarding / Hostel" },
                              { id: "Non-Resident", labelBn: "অনাবাসিক (Non-Resident)", labelEn: "Non-Resident", descBn: "ডে-স্কুল শিক্ষার্থী", descEn: "Day Scholar" },
                              { id: "Day Care", labelBn: "ডে কেয়ার (Day Care)", labelEn: "Day Care", descBn: "ডে-কেয়ার সুবিধা", descEn: "Day Care Facility" },
                            ].map((item) => {
                              const isChecked = formData.student_type
                                ? formData.student_type.split(",").map((s) => s.trim().toLowerCase()).includes(item.id.toLowerCase())
                                : false;

                              return (
                                <label
                                  key={item.id}
                                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition select-none ${
                                    isChecked
                                      ? "border-[#006a4e] bg-[#006a4e]/5 shadow-xs ring-1 ring-[#006a4e]/20"
                                      : "border-gray-200 bg-white hover:border-gray-300"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    name="student_type"
                                    value={item.id}
                                    checked={isChecked}
                                    onChange={() => handleStudentTypeToggle(item.id as "Resident" | "Non-Resident" | "Day Care")}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#006a4e] focus:ring-[#006a4e]/30 cursor-pointer accent-[#006a4e]"
                                  />
                                  <div className="flex flex-col">
                                    <span className={`text-xs font-semibold ${
                                      isChecked ? "text-gray-900 font-bold" : "text-gray-700"
                                    }`}>
                                      {t(item.labelBn, item.labelEn)}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {t(item.descBn, item.descEn)}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Present Address */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700 sm:col-span-2">
                          <span>{t("বর্তমান ঠিকানা (Present Address in English) *", "Present Address (in English) *")}</span>
                          <textarea
                            required
                            rows={2}
                            placeholder={t("Village/Road, Post Office, Thana, District (in English)...", "Village/Road, Post Office, Thana, District (in English)...")}
                            value={formData.address}
                            onChange={(e) => handleEnglishChange("address", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20 resize-none"
                          />
                        </label>

                        {/* Previous School */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700 sm:col-span-2">
                          <span>{t("পূর্ববর্তী বিদ্যালয়ের নাম (Previous School in English)", "Previous School Attended (in English)")}</span>
                          <input
                            type="text"
                            placeholder={t("Previous school name (in English)...", "Previous school name (in English)...")}
                            value={formData.previous_school}
                            onChange={(e) => handleEnglishChange("previous_school", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20"
                          />
                        </label>

                        {/* Photo Upload */}
                        <div className="flex flex-col gap-2 text-xs font-semibold text-gray-700 sm:col-span-2">
                          <div className="flex items-center justify-between">
                            <span>{t("শিক্ষার্থীর পাসপোর্ট সাইজ ছবি *", "Student Photo (Passport Size) *")}</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${selectedPhoto
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-600"
                              }`}>
                              {selectedPhoto ? t("ছবি নির্বাচিত", "Photo selected") : t("বাধ্যতামূলক *", "Mandatory *")}
                            </span>
                          </div>
                          <div className={`flex flex-wrap items-center gap-4 rounded-xl border border-dashed p-3 transition ${selectedPhoto
                            ? "border-emerald-300 bg-emerald-50/40"
                            : "border-red-300 bg-red-50/20"
                            }`}>
                            {photoPreview ? (
                              <img
                                src={photoPreview}
                                alt="Student Preview"
                                className="h-20 w-20 rounded-xl border border-gray-200 object-cover shadow-sm ring-2 ring-emerald-500/40"
                              />
                            ) : (
                              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-xl bg-white border border-dashed border-red-300 text-red-500 text-[10px] font-bold text-center p-1">
                                {t("ছবি আবশ্যক *", "Photo Required *")}
                              </div>
                            )}

                            <div className="flex-1 min-w-[200px]">
                              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#006a4e] hover:bg-emerald-100 transition shadow-2xs">
                                <Upload size={13} />
                                <span>{photoPreview ? t("ছবি পরিবর্তন করুন *", "Change Photo *") : t("ছবি আপলোড করুন *", "Upload Photo *")}</span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="sr-only"
                                  onChange={handlePhotoChange}
                                />
                              </label>
                              <p className="mt-1 text-[11px] text-gray-500 font-normal">
                                {t("JPG, PNG বা WebP · সর্বোচ্চ ৫ মেগাবাইট · ", "JPG, PNG, or WebP · Max 5 MB · ")}
                                <strong className="text-red-600 font-semibold">{t("বাধ্যতামূলক", "Mandatory")}</strong>
                              </p>
                              {selectedPhoto && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPhoto(null);
                                    setPhotoPreview(null);
                                  }}
                                  className="text-[11px] text-red-600 hover:underline mt-1 font-normal block"
                                >
                                  {t("ছবি বাতিল করুন", "Remove photo")}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION B: GUARDIAN DETAILS */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 border-b border-emerald-100 pb-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#006a4e] text-white text-[10px] font-bold">
                          ২
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#006a4e]">
                          {t("পিতা / মাতা / অভিভাবকের বিবরণ (Guardian Information)", "Parent & Guardian Information")}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Parent Name */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span>{t("পিতা / অভিভাবকের পূর্ণ নাম (Parent Name in English) *", "Parent / Guardian Full Name (in English) *")}</span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rafiqul Islam (in English)"
                            value={formData.parent_name}
                            onChange={(e) => handleEnglishChange("parent_name", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20"
                          />
                        </label>

                        {/* Parent Phone */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span>{t("অভিভাবকের সক্রিয় মোবাইল নম্বর *", "Guardian Active Phone Number *")}</span>
                          <input
                            type="tel"
                            required
                            placeholder="+880 1..."
                            value={formData.parent_phone}
                            onChange={(e) => handleEnglishChange("parent_phone", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20 font-mono"
                          />
                        </label>

                        {/* Parent NID */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span>{t("অভিভাবকের জাতীয় পরিচয়পত্র (NID) নম্বর *", "Parents NID number *")}</span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 19851234567890..."
                            value={formData.parent_nid}
                            onChange={(e) => handleEnglishChange("parent_nid", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20 font-mono"
                          />
                        </label>

                        {/* Parent Email */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
                          <span className="flex items-center gap-1">
                            <Mail size={13} className="text-gray-400" />
                            <span>{t("অভিভাবকের ইমেইল (ঐচ্ছিক)", "Guardian Email (Optional)")}</span>
                          </span>
                          <input
                            type="email"
                            placeholder="guardian@example.com"
                            value={formData.parent_email}
                            onChange={(e) => handleEnglishChange("parent_email", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20"
                          />
                        </label>

                        {/* Additional Remarks / Quota */}
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700 sm:col-span-2">
                          <span>{t("বিশেষ কোটা বা মন্তব্য (ঐচ্ছিক - ইংরেজিতে)", "Special Quota or Remarks (Optional - in English)")}</span>
                          <input
                            type="text"
                            placeholder={t("e.g. Quota or special requests (in English)...", "e.g. Quota or special requests (in English)...")}
                            value={formData.notes}
                            onChange={(e) => handleEnglishChange("notes", e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2.5 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20"
                          />
                        </label>
                      </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[11px] text-gray-500 max-w-md">
                        {t(
                          "জমা দেওয়ার পর একটি ট্র্যাকিং নম্বর সহ নিশ্চিতকরণ স্লিপ তৈরি হবে, যা দিয়ে আপনি পরবর্তীতে আবেদনের অবস্থা জানতে পারবেন।",
                          "Upon submission, an official tracking confirmation slip will be generated for your records."
                        )}
                      </p>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#006a4e] px-8 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#00503a] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>{t("আবেদনপত্র জমা হচ্ছে...", "Submitting Application...")}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            <span>{t("আবেদনপত্র অনলাইনে জমা দিন", "Submit Admission Application")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </section>
              )}
            </div>
          )}

          {/* ─────── TAB 2: GUIDELINES & SEATS ─────── */}
          {activeTab === "guidelines" && (
            <div className="space-y-6">
              {/* Guidelines */}
              <section className="rounded-xl border border-[#dde5df] bg-white p-6 shadow-xs">
                <h3 className="text-base font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
                  <FileCheck size={18} />
                  <span>{t("ভর্তি সংক্রান্ত সাধারণ নীতিমালা", "General Admission Guidelines")}</span>
                </h3>

                <div className="mt-4 space-y-4 text-xs leading-relaxed text-gray-700">
                  <p>{t(content.admissionGuidelines, content.admissionGuidelinesEn)}</p>

                  <div className="rounded-lg border border-emerald-200 bg-[#f4f9f6] p-4 text-xs space-y-2">
                    <p className="font-bold text-[#006a4e]">
                      {t("গুরুত্বপূর্ণ সময়সূচী ও নিয়মাবলি:", "Important Timeline & Rules:")}
                    </p>
                    <ul className="list-inside list-disc space-y-1.5 text-gray-700">
                      <li>{t("অনলাইন আবেদন গ্রহণ: নির্ধারিত সরকারি ও বিদ্যালয়ের সময়সীমার মধ্যে।", "Application Period: Within government and school stipulated schedule.")}</li>
                      <li>{t("কাগজপত্র যাচাই: নির্বাচিত শিক্ষার্থীদের মূল জন্মসনদ ও সনদ যাচাই বাধ্যতামূলক।", "Verification: Original birth certificates and documents are strictly verified.")}</li>
                      <li>{t("ভর্তি সম্পন্নকরণ: আসন সংখ্যা পূরণ সাপেক্ষে দ্রুততম সময়ে ভর্তি নিশ্চিত করা হবে।", "Enrollment: Finalized upon administrative verification of eligibility.")}</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Seat Capacity Matrix */}
              <section className="rounded-xl border border-[#dde5df] bg-white p-6 shadow-xs">
                <h3 className="text-base font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
                  <Users size={18} />
                  <span>{t("শ্রেণিভিত্তিক আসন বিন্যাস", "Class-wise Available Seats")}</span>
                </h3>

                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-3">{t(content.admissionSeats, content.admissionSeatsEn)}</p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-[#006a4e] text-white">
                          <th className="border p-2.5">{t("শ্রেণি", "Class")}</th>
                          <th className="border p-2.5">{t("শাখা", "Sections")}</th>
                          <th className="border p-2.5">{t("মোট আসন", "Total Seats")}</th>
                          <th className="border p-2.5">{t("ভর্তির প্রক্রিয়া", "Admission Process")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {seatCapacityList.map((item, idx) => (
                          <tr key={(item as any).id || idx} className="hover:bg-emerald-50/40 transition-colors odd:bg-white even:bg-[#fafcfa]">
                            <td className="border p-2.5 font-bold text-gray-900">{t(item.classBn, item.classEn)}</td>
                            <td className="border p-2.5 text-gray-700">{t(item.sectionsBn, item.sectionsEn)}</td>
                            <td className="border p-2.5 font-bold text-[#006a4e] whitespace-nowrap">
                              {formatDigits(item.seats)} {t(item.suffixBn || "জন", item.suffixEn || "Seats")}
                            </td>
                            <td className="border p-2.5 text-gray-700">{t(item.processBn, item.processEn)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Required Documents Checklist */}
              <section className="rounded-xl border border-[#dde5df] bg-white p-6 shadow-xs">
                <h3 className="text-base font-bold text-[#005a40] border-b pb-3 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <span>{t("ভর্তির সময় প্রয়োজনীয় নথিপত্র", "Required Documents for Admission")}</span>
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  {requiredDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-lg border border-gray-100 bg-[#fbfdfc] p-3">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#006a4e]" />
                      <span className="text-gray-800 leading-relaxed">{t(doc.bn, doc.en)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ─────── TAB 3: TRACK APPLICATION STATUS ─────── */}
          {activeTab === "track" && (
            <div className="space-y-6">
              <section className="rounded-xl border border-[#dde5df] bg-white p-6 shadow-xs">
                <div className="border-b border-gray-100 pb-3 mb-5">
                  <h3 className="text-base font-bold text-[#005a40] flex items-center gap-2">
                    <Search size={18} />
                    <span>{t("ভর্তি আবেদনের বর্তমান অবস্থা অনুসন্ধান", "Track Admission Application Status")}</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t(
                      "আপনার আবেদন নম্বর (যেমন: ADM-2026-XXXX) অথবা আবেদনে ব্যবহৃত অভিভাবকের মোবাইল নম্বর দিয়ে সার্চ করুন।",
                      "Enter your Application Number (e.g. ADM-2026-XXXX) or registered mobile number."
                    )}
                  </p>
                </div>

                <form onSubmit={handleTrackApplication} className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder={t("আবেদন নম্বর বা মোবাইল নম্বর দিন...", "Enter Application No or Mobile...")}
                      value={trackQuery}
                      onChange={(e) => setTrackQuery(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={trackingLoading || !trackQuery.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#006a4e] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#00503a] disabled:opacity-50"
                  >
                    {trackingLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                    <span>{t("অনুসন্ধান করুন", "Search Status")}</span>
                  </button>
                </form>

                {trackError && (
                  <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                    <span>{trackError}</span>
                  </div>
                )}

                {trackResult && (
                  <div className="mt-6 rounded-xl border border-emerald-200 bg-[#fbfdfc] p-5 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          {t("আবেদন নম্বর", "Application No")}
                        </span>
                        <h4 className="text-lg font-bold text-[#006a4e] font-mono">
                          {trackResult.application_no}
                        </h4>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {trackResult.status === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                            <CheckCircle2 size={13} />
                            <span>{t("অনুমোদিত (Approved)", "Approved")}</span>
                          </span>
                        ) : trackResult.status === "WAITLISTED" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-300">
                            <Sparkles size={13} />
                            <span>{t("অপেক্ষাতালিকা (Waitlisted)", "Waitlisted")}</span>
                          </span>
                        ) : trackResult.status === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 border border-red-300">
                            <X size={13} />
                            <span>{t("বাতিল (Rejected)", "Rejected")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                            <Clock size={13} />
                            <span>{t("অপেক্ষমাণ (Pending Review)", "Pending Review")}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                      <div>
                        <span className="text-gray-500 font-medium">{t("শিক্ষার্থীর নাম:", "Student Name:")}</span>
                        <p className="font-bold text-gray-900 mt-0.5">
                          {trackResult.first_name} {trackResult.last_name}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500 font-medium">{t("শ্রেণি:", "Class:")}</span>
                        <p className="font-bold text-[#006a4e] mt-0.5">
                          {trackResult.class_name || `Class ${trackResult.class_id}`}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500 font-medium">{t("অভিভাবক ও এনআইডি:", "Guardian & NID:")}</span>
                        <p className="font-semibold text-gray-800 mt-0.5">
                          {trackResult.parent_name || "N/A"}
                          {trackResult.parent_nid ? ` (NID: ${trackResult.parent_nid})` : ""}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500 font-medium">{t("আবেদনের তারিখ:", "Applied Date:")}</span>
                        <p className="font-semibold text-gray-800 mt-0.5">{trackResult.applied_date || "N/A"}</p>
                      </div>

                      {trackResult.student_type && (
                        <div>
                          <span className="text-gray-500 font-medium">{t("শিক্ষার্থীর ধরন:", "Student Type:")}</span>
                          <p className="font-semibold text-emerald-800 mt-0.5">{trackResult.student_type}</p>
                        </div>
                      )}

                      {trackResult.status === "APPROVED" && trackResult.enrolled_roll && (
                        <div className="sm:col-span-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 font-semibold">
                          {t("অভিনন্দন! শিক্ষার্থীকে শ্রেণিকক্ষে তালিকাভুক্ত করা হয়েছে। নির্ধারিত রোল নম্বর:", "Congratulations! Student is enrolled. Assigned Roll No:")}{" "}
                          <span className="font-bold text-base text-[#006a4e]">{trackResult.enrolled_roll}</span>
                        </div>
                      )}

                      {trackResult.notes && (
                        <div className="sm:col-span-2 rounded-lg bg-gray-50 border border-gray-200 p-3 text-gray-700">
                          <span className="font-bold text-gray-800 block mb-1">
                            {t("কর্তৃপক্ষের মন্তব্য (Remarks):", "Authority Remarks:")}
                          </span>
                          <p>{trackResult.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Quick Apply Card */}
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-[#f4f9f6] to-white p-5 shadow-xs">
            <h4 className="font-bold text-[#006a4e] border-b border-emerald-100 pb-2.5 text-sm flex items-center gap-1.5">
              <UserCheck size={16} />
              <span>{t("ভর্তি সংক্রান্ত তথ্যাবলি", "Admission Information")}</span>
            </h4>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              {t(
                "বিদ্যালয়ের প্রতিটি শ্রেণিতে মেধার ভিত্তিতে ও সরকারি নীতিমালা অনুযায়ী ভর্তি নিশ্চিত করা হয়। অনলাইনে ফরম পূরণের পর প্রশাসনিক দপ্তর থেকে মূল সনদ যাচাই করা হবে।",
                "Admissions are granted strictly per merit and regulatory policies. Selected candidates will be notified for document verification."
              )}
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-white border border-gray-100 font-medium">
                <span className="text-gray-600">{t("ভর্তি ফরম ফি:", "Admission Form Fee:")}</span>
                <span className="font-bold text-[#006a4e]">{t("বিনামূল্যে (Free)", "Free")}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white border border-gray-100 font-medium">
                <span className="text-gray-600">{t("সেশন:", "Academic Session:")}</span>
                <span className="font-bold text-gray-900">2026/27</span>
              </div>
            </div>
          </div>

          {/* Helpdesk */}
          <div className="rounded-xl border border-[#cbe0d3] bg-white p-5 shadow-xs">
            <h4 className="font-bold text-[#006a4e] border-b pb-2.5 text-sm flex items-center gap-1.5">
              <Phone size={15} />
              <span>{t("ভর্তি হেল্পডেস্ক", "Admission Helpdesk")}</span>
            </h4>
            <p className="mt-2 text-xs text-gray-600">
              {t(
                "ভর্তি সংক্রান্ত যেকোনো প্রশ্ন বা সহায়তার জন্য বিদ্যালয়ের ভর্তি শাখায় যোগাযোগ করুন:",
                "For any queries regarding application or admissions, reach out to our desk:"
              )}
            </p>
            <div className="mt-3.5 space-y-2 text-xs font-semibold text-gray-800">
              <p className="flex items-center gap-2">
                <Phone size={13} className="text-[#006a4e]" />
                <span>{t("ফোন:", "Phone:")} {formatDigits(content.phone)}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={13} className="text-[#006a4e]" />
                <span className="truncate">{t("ইমেইল:", "Email:")} {content.email}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock size={13} className="text-[#006a4e]" />
                <span>{t("অফিস সময়:", "Hours:")} {t(content.officeHours, content.officeHoursEn)}</span>
              </p>
            </div>
          </div>

          {/* Direct Dashboard Link (for Admins) */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-xs text-gray-600">
            <span className="font-bold text-gray-800 block mb-1">
              {t("প্রশাসনিক ড্যাশবোর্ড লিঙ্ক", "Admin Dashboard Portal")}
            </span>
            <p className="text-[11px] text-gray-500 mb-2">
              {t("শিক্ষক ও অ্যাডমিনগণ ভর্তি আবেদনসমূহ পর্যালোচনা করতে সরাসরি ড্যাশবোর্ডে প্রবেশ করতে পারেন।", "Staff and admins can review and process all applications in the dashboard.")}
            </p>
            <Link
              to="/admissions"
              className="inline-flex items-center gap-1 font-bold text-[#006a4e] hover:underline"
            >
              <span>{t("ড্যাশবোর্ড ভর্তি শাখায় যান →", "Go to Admissions Dashboard →")}</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdmissionPage;
