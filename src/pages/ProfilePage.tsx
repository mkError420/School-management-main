import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Image } from "@/components/Image";
import {
  Camera,
  Upload,
  Trash2,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  Users,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Heart,
  Calendar,
  Layers,
  Sparkles,
  X,
} from "lucide-react";

const ProfilePage: React.FC = () => {
  const { user, role, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Profile image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSuccessMsg, setImageSuccessMsg] = useState<string | null>(null);
  const [imageErrorMsg, setImageErrorMsg] = useState<string | null>(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null);
  const [pwErrorMsg, setPwErrorMsg] = useState<string | null>(null);

  // Load detailed profile data
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    if (role === "student") {
      api.getById<any>("students", user.id)
        .then((res) => {
          if (res.success && res.data?.student) {
            setProfileData(res.data.student);
            if (res.data.student.img && res.data.student.img !== user.img) {
              updateUserProfile({ img: res.data.student.img });
            }
          }
        })
        .finally(() => setLoading(false));
    } else if (role === "parent") {
      api.getById<any>("parents", user.id)
        .then((res) => {
          if (res.success && res.data) {
            setProfileData(res.data);
            if (res.data.img && res.data.img !== user.img) {
              updateUserProfile({ img: res.data.img });
            }
          }
        })
        .finally(() => setLoading(false));
    } else if (role === "teacher") {
      api.getById<any>("teachers", user.id)
        .then((res) => {
          if (res.success && res.data) {
            setProfileData(res.data);
            if (res.data.img && res.data.img !== user.img) {
              updateUserProfile({ img: res.data.img });
            }
          }
        })
        .finally(() => setLoading(false));
    } else {
      // admin / super_admin: fetch me
      api.getMe()
        .then((res) => {
          if (res.success && res.data?.user) {
            setProfileData(res.data.user);
            if (res.data.user.img && res.data.user.img !== user.img) {
              updateUserProfile({ img: res.data.user.img });
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user?.id, role]);

  // Handle uploading file from device
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processAndUploadFile = async (file: File) => {
    setImageErrorMsg(null);
    setImageSuccessMsg(null);

    // Validate type
    if (!file.type.startsWith("image/") && !file.name.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
      setImageErrorMsg("অনুগ্রহ করে একটি সঠিক ইমেজ ফাইল (JPG, PNG, WebP, GIF) নির্বাচন করুন।");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageErrorMsg("ইমেজ ফাইলের সাইজ সর্বোচ্চ ৫ MB হতে পারবে।");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("img", file);

      const res = await api.updateProfileImage(formData);

      if (res.success && res.data) {
        const newImg = res.data.img || null;
        updateUserProfile({ img: newImg });
        setProfileData((prev: any) => ({ ...prev, img: newImg }));
        setImageSuccessMsg("প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে! (Profile photo updated)");
      } else {
        setImageErrorMsg(res.message || "ছবি আপলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } catch (err: any) {
      setImageErrorMsg(err.message || "ছবি আপলোড করার সময় একটি ত্রুটি ঘটেছে।");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle setting image via URL
  const handleSaveUrlImage = async () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) {
      setImageErrorMsg("অনুগ্রহ করে একটি সঠিক ইমেজ URL দিন।");
      return;
    }

    setImageErrorMsg(null);
    setImageSuccessMsg(null);
    setUploadingImage(true);

    try {
      const res = await api.updateProfileImage({ img: trimmed });
      if (res.success && res.data) {
        const newImg = res.data.img || trimmed;
        updateUserProfile({ img: newImg });
        setProfileData((prev: any) => ({ ...prev, img: newImg }));
        setImageSuccessMsg("প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!");
        setShowUrlModal(false);
        setCustomUrlInput("");
      } else {
        setImageErrorMsg(res.message || "ইমেজ আপডেট করতে ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setImageErrorMsg(err.message || "ইমেজ আপডেট করতে ব্যর্থ হয়েছে।");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle removing profile photo
  const handleRemovePhoto = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে প্রোফাইল ছবিটি মুছে ফেলতে চান? (Are you sure to remove your profile photo?)")) {
      return;
    }

    setImageErrorMsg(null);
    setImageSuccessMsg(null);
    setUploadingImage(true);

    try {
      const res = await api.updateProfileImage({ action: "remove", remove: true });
      if (res.success) {
        updateUserProfile({ img: null });
        setProfileData((prev: any) => ({ ...prev, img: null }));
        setImageSuccessMsg("প্রোফাইল ছবি মুছে ফেলা হয়েছে এবং ডিফল্ট এভারটার সেট হয়েছে।");
      } else {
        setImageErrorMsg(res.message || "ছবি মুছতে ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setImageErrorMsg(err.message || "ছবি মুছতে ব্যর্থ হয়েছে।");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle drag and drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  // Handle password change
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg(null);
    setPwSuccessMsg(null);

    if (!currentPassword) {
      setPwErrorMsg("বর্তমান পাসওয়ার্ড লিখুন।");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPwErrorMsg("নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErrorMsg("নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।");
      return;
    }

    setPwSubmitting(true);
    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.success) {
        setPwSuccessMsg("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! (Password changed successfully)");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setShowPasswordSection(false), 2500);
      } else {
        setPwErrorMsg(res.message || "পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setPwErrorMsg(err.message || "পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।");
    } finally {
      setPwSubmitting(false);
    }
  };

  const studentType = profileData?.student_type || user?.student_type;
  const currentAvatar = user?.img || profileData?.img || "/avatar.png";
  const hasCustomAvatar = Boolean(user?.img || profileData?.img);

  const getRoleBadgeColor = (r: string) => {
    switch (r) {
      case "super_admin":
        return "bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "admin":
        return "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "teacher":
        return "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "student":
        return "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      case "parent":
        return "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        aria-hidden="true"
      />

      {/* Page Title & Status Alerts */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserIcon className="text-indigo-600 dark:text-indigo-400" size={24} />
            আমার প্রোফাইল ও সেটিংস
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            লগইন প্রোফাইল ছবি পরিবর্তন ও অ্যাকাউন্ট বিবরণী (Profile management & photo change)
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {imageSuccessMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="flex-1 font-medium">{imageSuccessMsg}</span>
          <button
            type="button"
            onClick={() => setImageSuccessMsg(null)}
            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-md transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {imageErrorMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200 shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="flex-1 font-medium">{imageErrorMsg}</span>
          <button
            type="button"
            onClick={() => setImageErrorMsg(null)}
            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-md transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Profile Header Card with Avatar Upload */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border transition-all ${
          isDragOver
            ? "border-indigo-500 ring-4 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20"
            : "border-gray-100 dark:border-gray-700"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar Container with Interactive Overlay */}
          <div className="relative group shrink-0 mx-auto sm:mx-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-indigo-500/30 dark:ring-indigo-400/20 shadow-md bg-gray-100 dark:bg-gray-900 relative">
              <Image
                src={currentAvatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              />

              {/* Uploading Overlay */}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10">
                  <Loader2 size={24} className="animate-spin text-white mb-1" />
                  <span className="text-[10px] font-semibold">আপলোড হচ্ছে...</span>
                </div>
              )}

              {/* Hover Camera Overlay Button */}
              {!uploadingImage && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="ছবি পরিবর্তন করুন (Click to upload photo)"
                  aria-label="ছবি পরিবর্তন করুন"
                  className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                >
                  <Camera size={22} className="mb-1" />
                  <span className="text-[10px] font-bold">ছবি বদলান</span>
                </button>
              )}
            </div>

            {/* Quick Mobile/Corner Camera Action Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              title="নতুন ছবি আপলোড (Upload photo)"
              className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl shadow-md border-2 border-white dark:border-gray-800 transition transform hover:scale-110 disabled:opacity-50"
            >
              <Camera size={14} />
            </button>
          </div>

          {/* User Info & Photo Action Buttons */}
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate">
                {profileData?.name && profileData?.surname
                  ? `${profileData.name} ${profileData.surname}`
                  : profileData?.name || user?.name || user?.username}
              </h2>
              <span
                className={`text-xs px-3 py-1 rounded-full capitalize font-bold border shadow-2xs ${getRoleBadgeColor(
                  role
                )}`}
              >
                {role.replace("_", " ")}
              </span>
              {studentType && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                  <GraduationCap size={12} />
                  {studentType}
                </span>
              )}
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm truncate">
              {profileData?.email || user?.email || `${user?.username}@school.edu.bd`}
            </p>

            {/* Action Buttons for Avatar Management */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-60"
              >
                <Upload size={13} />
                <span>ছবি আপলোড (Upload)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlModal(true)}
                disabled={uploadingImage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg transition disabled:opacity-60"
              >
                <LinkIcon size={13} />
                <span>ইমেজ লিঙ্ক (URL)</span>
              </button>

              {hasCustomAvatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-semibold rounded-lg transition disabled:opacity-60"
                >
                  <Trash2 size={13} />
                  <span>ছবি মুছুন (Remove)</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-0.5">
              JPG, PNG, WebP বা GIF (সর্বোচ্চ ৫ MB)। ছবি টেনে এনে এখানে ছাড়তে পারেন।
            </p>
          </div>
        </div>
      </div>

      {/* URL Input Modal / Panel */}
      {showUrlModal && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LinkIcon size={16} className="text-indigo-600 dark:text-indigo-400" />
              ইমেজ লিঙ্ক দিয়ে প্রোফাইল ছবি সেট করুন (Set Image by URL)
            </h3>
            <button
              type="button"
              onClick={() => setShowUrlModal(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="https://example.com/photo.jpg অথবা /images/avatar.png"
              className="flex-1 px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveUrlImage}
              disabled={uploadingImage || !customUrlInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>সংরক্ষণ করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* Detailed Profile Information Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Layers size={16} className="text-indigo-600 dark:text-indigo-400" />
            অ্যাকাউন্ট ও ব্যক্তিগত তথ্য (Account Details)
          </h2>
          {loading && (
            <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
              <Loader2 size={12} className="animate-spin" />
              তথ্য লোড হচ্ছে...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "ব্যবহারকারীর নাম (Username)", value: user?.username, icon: <UserIcon size={14} className="text-gray-400" /> },
            { label: "ভূমিকা (Role)", value: role.replace("_", " "), icon: <Shield size={14} className="text-gray-400" /> },
            { label: "ইউজার আইডি (User ID)", value: user?.id, icon: <KeyRound size={14} className="text-gray-400" /> },
            { label: "ইমেইল (Email)", value: profileData?.email || user?.email || "—", icon: <Mail size={14} className="text-gray-400" /> },

            // Student fields
            ...(role === "student"
              ? [
                  { label: "স্টুডেন্ট টাইপ (Type)", value: studentType || "Standard", icon: <GraduationCap size={14} className="text-gray-400" /> },
                  { label: "রোল নম্বর (Roll No)", value: profileData?.roll || "—", icon: <Layers size={14} className="text-gray-400" /> },
                  { label: "শ্রেণি (Class)", value: profileData?.class_name || "—", icon: <Layers size={14} className="text-gray-400" /> },
                  { label: "ভার্সন (Version)", value: profileData?.version || "Bangla", icon: <Layers size={14} className="text-gray-400" /> },
                  { label: "রক্তের গ্রুপ (Blood Group)", value: profileData?.blood_type || "—", icon: <Heart size={14} className="text-gray-400" /> },
                  { label: "মোবাইল নম্বর (Phone)", value: profileData?.phone || "—", icon: <Phone size={14} className="text-gray-400" /> },
                  { label: "ঠিকানা (Address)", value: profileData?.address || "—", icon: <MapPin size={14} className="text-gray-400" /> },
                  { label: "শিক্ষাবর্ষ (Session Year)", value: profileData?.session_year || "2026-2027", icon: <Calendar size={14} className="text-gray-400" /> },
                ]
              : []),

            // Teacher fields
            ...(role === "teacher"
              ? [
                  { label: "পদবি (Designation)", value: profileData?.designation || "Assistant Teacher", icon: <GraduationCap size={14} className="text-gray-400" /> },
                  { label: "মোবাইল নম্বর (Phone)", value: profileData?.phone || "—", icon: <Phone size={14} className="text-gray-400" /> },
                  { label: "রক্তের গ্রুপ (Blood Group)", value: profileData?.blood_type || "—", icon: <Heart size={14} className="text-gray-400" /> },
                  { label: "লিঙ্গ (Gender)", value: profileData?.sex || "—", icon: <UserIcon size={14} className="text-gray-400" /> },
                  { label: "ঠিকানা (Address)", value: profileData?.address || "—", icon: <MapPin size={14} className="text-gray-400" /> },
                ]
              : []),

            // Parent fields
            ...(role === "parent"
              ? [
                  { label: "মোবাইল নম্বর (Phone)", value: profileData?.phone || "—", icon: <Phone size={14} className="text-gray-400" /> },
                  { label: "এনআইডি (NID)", value: profileData?.nid || "—", icon: <Shield size={14} className="text-gray-400" /> },
                  { label: "ঠিকানা (Address)", value: profileData?.address || "—", icon: <MapPin size={14} className="text-gray-400" /> },
                ]
              : []),

            // Admin / Super Admin fields
            ...(role === "admin" || role === "super_admin"
              ? [
                  { label: "অ্যাক্সেস লেভেল (Access)", value: role === "super_admin" ? "All Modules (Super Admin)" : "School Administration", icon: <Shield size={14} className="text-gray-400" /> },
                  { label: "ড্যাশবোর্ড সেকশন", value: role === "super_admin" ? "All 24 Modules Available" : `${profileData?.dashboard_sections?.length || 24} Active Modules`, icon: <Layers size={14} className="text-gray-400" /> },
                ]
              : []),
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-3.5 border border-gray-100 dark:border-gray-700/60 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                {icon}
                <span>{label}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Linked Children Section for Parents */}
      {role === "parent" && profileData?.children && profileData.children.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
              সংযুক্ত শিক্ষার্থী / সন্তান (Linked Children)
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              {profileData.children.length} {profileData.children.length === 1 ? "Student" : "Students"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profileData.children.map((child: any) => (
              <div
                key={child.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {child.name} {child.surname}
                  </h3>
                  {child.student_type ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                      {child.student_type}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">Regular</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span>শ্রেণি: <strong className="text-gray-700 dark:text-gray-300">{child.class_name || "—"}</strong></span>
                  <span>রোল: <strong className="text-gray-700 dark:text-gray-300">{child.roll || "—"}</strong></span>
                  <span className="col-span-2">টাইপ: <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{child.student_type || "Standard"}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security & Password Change Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                নিরাপত্তা ও পাসওয়ার্ড পরিবর্তন (Security & Password)
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে নিয়মিত পাসওয়ার্ড আপডেট করুন।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowPasswordSection(!showPasswordSection);
              setPwErrorMsg(null);
              setPwSuccessMsg(null);
            }}
            className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition"
          >
            {showPasswordSection ? "লুকান (Hide)" : "পাসওয়ার্ড পরিবর্তন করুন"}
          </button>
        </div>

        {showPasswordSection && (
          <form onSubmit={handleChangePasswordSubmit} className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3 max-w-lg">
            {pwSuccessMsg && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{pwSuccessMsg}</span>
              </div>
            )}
            {pwErrorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{pwErrorMsg}</span>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                বর্তমান পাসওয়ার্ড (Current Password)
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="আপনার বর্তমান পাসওয়ার্ড লিখুন"
                  required
                  className="w-full px-3.5 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                নতুন পাসওয়ার্ড (New Password - কমপক্ষে ৮ অক্ষর)
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ড লিখুন"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm New Password)
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pwSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pwSubmitting ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
              <span>পাসওয়ার্ড আপডেট করুন</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
