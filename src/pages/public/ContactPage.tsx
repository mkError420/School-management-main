import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Home,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export const ContactPage: React.FC = () => {
  const { websiteContent: content } = useSiteSettings();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>হোম</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">যোগাযোগ ও অনুসন্ধান</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          আমাদের সাথে যোগাযোগ
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">যোগাযোগ ও মতামত বক্স</h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          বিদ্যালয়ের সাথে যেকোনো তথ্য অনুসন্ধান, ভর্তি বা অভিযোগ সংক্রান্ত বিষয়ে যোগাযোগ করুন
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Contact Info Cards */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs space-y-4 text-xs sm:text-sm">
            <h3 className="font-bold text-[#005a40] text-base border-b pb-3">বিদ্যালয় কার্যালয়</h3>

            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-[#006a4e]" />
              <div>
                <p className="font-bold text-gray-900">ঠিকানা:</p>
                <p className="text-gray-600">{content.address || "কলেজ রোড, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} className="shrink-0 text-[#006a4e]" />
              <div>
                <p className="font-bold text-gray-900">ফোন নম্বর:</p>
                <a href={`tel:${content.phone?.replace(/[^\d+]/g, "")}`} className="text-gray-600 hover:text-[#006a4e]">
                  {content.phone}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="shrink-0 text-[#006a4e]" />
              <div>
                <p className="font-bold text-gray-900">ইমেইল:</p>
                <a href={`mailto:${content.email}`} className="text-gray-600 hover:text-[#006a4e]">
                  {content.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock size={18} className="shrink-0 text-[#006a4e]" />
              <div>
                <p className="font-bold text-gray-900">অফিস সময়সূচী:</p>
                <p className="text-gray-600">{content.officeHours}</p>
              </div>
            </div>
          </div>

          {/* Emergency Hotlines */}
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-5 shadow-xs text-xs space-y-2">
            <h4 className="font-bold text-red-950 flex items-center gap-2 text-sm">
              <PhoneCall size={16} className="text-red-700" />
              <span>জাতীয় জরুরি সেবা নম্বরসমূহ</span>
            </h4>
            <p className="text-gray-700">৯৯৯ (পুলিশ, অ্যাম্বুলেন্স, ফায়ার)</p>
            <p className="text-gray-700">৩৩৩ (সরকারি তথ্য ও জাতীয় সেবা)</p>
            <p className="text-gray-700">১০৯ (নারী ও শিশু নির্যাতন প্রতিরোধ)</p>
          </div>
        </div>

        {/* Feedback / Grievance Form */}
        <div className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs lg:col-span-7 sm:p-8">
          <h3 className="font-bold text-[#005a40] text-base border-b pb-3">অনলাইন মতামত ও প্রশ্ন ফরম</h3>
          <p className="mt-2 text-xs text-gray-600">বিদ্যালয় কর্তৃপক্ষের নিকট আপনার যেকোনো প্রশ্ন, পরামর্শ বা মতামত পাঠাতে পারেন।</p>

          {submitted && (
            <div className="mt-4 rounded-md bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-900 flex items-center gap-2">
              <ShieldCheck size={16} />
              <span>আপনার বার্তাটি সফলভাবে বিদ্যালয় কর্তৃপক্ষের নিকট পাঠানো হয়েছে। ধন্যবাদ!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="font-semibold text-gray-700">
                আপনার নাম *
                <input
                  type="text"
                  required
                  placeholder="পূর্ণ নাম লিখুন"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
                />
              </label>

              <label className="font-semibold text-gray-700">
                মোবাইল নম্বর *
                <input
                  type="text"
                  required
                  placeholder="০১৭xxxxxxxx"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
                />
              </label>
            </div>

            <label className="block font-semibold text-gray-700">
              ইমেইল ঠিকানা (ঐচ্ছিক)
              <input
                type="email"
                placeholder="example@mail.com"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
              />
            </label>

            <label className="block font-semibold text-gray-700">
              বিষয় *
              <input
                type="text"
                required
                placeholder="বার্তার মূল বিষয় লিখুন"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
              />
            </label>

            <label className="block font-semibold text-gray-700">
              আপনার বিস্তারিত বার্তা *
              <textarea
                rows={4}
                required
                placeholder="এখানে আপনার বার্তা লিখুন..."
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e] resize-y"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded bg-[#006a4e] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#00503a]"
            >
              <Send size={14} />
              <span>বার্তা পাঠান</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
