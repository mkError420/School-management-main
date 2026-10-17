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
  const { websiteContent: content, t, lang, formatDigits } = useSiteSettings();
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
          <span>{t("হোম", "Home")}</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">{t("যোগাযোগ ও অনুসন্ধান", "Contact & Inquiries")}</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
          {t("আমাদের সাথে যোগাযোগ", "Contact Us")}
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          {t("যোগাযোগ ও মতামত বক্স", "Contact & Feedback Box")}
        </h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          {t(
            "বিদ্যালয়ের সাথে যেকোনো তথ্য অনুসন্ধান, ভর্তি বা অভিযোগ সংক্রান্ত বিষয়ে যোগাযোগ করুন",
            "Get in touch with the school administration for any information, admissions, or grievances"
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Contact Info Cards */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs space-y-4 text-xs sm:text-sm">
            <h3 className="font-bold text-[#005a40] text-base border-b pb-3">
              {t("বিদ্যালয় কার্যালয়", "School Office")}
            </h3>

            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-[#006a4e]" />
              <div>
                <p className="font-bold text-gray-900">{t("ঠিকানা:", "Address:")}</p>
                <p className="text-gray-600">
                  {t(content.address, content.addressEn) || t("কলেজ রোড, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ", "College Road, Dhanmondi, Dhaka-1205, Bangladesh")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} className="shrink-0 text-[#006a4e]" />
              <div>
                <p className="font-bold text-gray-900">{t("ফোন নম্বর:", "Phone Number:")}</p>
                <a href={`tel:${content.phone?.replace(/[^\d+]/g, "")}`} className="text-gray-600 hover:text-[#006a4e]">
                  {formatDigits(content.phone)}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="shrink-0 text-[#006a4e]" />
              <div>
                <p className="font-bold text-gray-900">{t("ইমেইল:", "Email:")}</p>
                <a href={`mailto:${content.email}`} className="text-gray-600 hover:text-[#006a4e]">
                  {content.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock size={18} className="shrink-0 text-[#006a4e]" />
              <div>
                <p className="font-bold text-gray-900">{t("অফিস সময়সূচী:", "Office Hours:")}</p>
                <p className="text-gray-600">{t(content.officeHours, content.officeHoursEn)}</p>
              </div>
            </div>
          </div>

          {/* Emergency Hotlines */}
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-5 shadow-xs text-xs space-y-2">
            <h4 className="font-bold text-red-950 flex items-center gap-2 text-sm">
              <PhoneCall size={16} className="text-red-700" />
              <span>{t("জাতীয় জরুরি সেবা নম্বরসমূহ", "National Emergency Hotlines")}</span>
            </h4>
            <p className="text-gray-700">{t("৯৯৯ (পুলিশ, অ্যাম্বুলেন্স, ফায়ার)", "999 (Police, Ambulance, Fire)")}</p>
            <p className="text-gray-700">{t("৩৩৩ (সরকারি তথ্য ও জাতীয় সেবা)", "333 (Govt Information & Citizen Services)")}</p>
            <p className="text-gray-700">{t("১০৯ (নারী ও শিশু নির্যাতন প্রতিরোধ)", "109 (Women & Children Helpline)")}</p>
          </div>
        </div>

        {/* Feedback / Grievance Form */}
        <div className="rounded-lg border border-[#dde5df] bg-white p-6 shadow-xs lg:col-span-7 sm:p-8">
          <h3 className="font-bold text-[#005a40] text-base border-b pb-3">
            {t("অনলাইন মতামত ও প্রশ্ন ফরম", "Online Feedback & Inquiry Form")}
          </h3>
          <p className="mt-2 text-xs text-gray-600">
            {t("বিদ্যালয় কর্তৃপক্ষের নিকট আপনার যেকোনো প্রশ্ন, পরামর্শ বা মতামত পাঠাতে পারেন।", "You can submit any question, suggestion, or feedback to the school authorities.")}
          </p>

          {submitted && (
            <div className="mt-4 rounded-md bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-900 flex items-center gap-2">
              <ShieldCheck size={16} />
              <span>
                {t(
                  "আপনার বার্তাটি সফলভাবে বিদ্যালয় কর্তৃপক্ষের নিকট পাঠানো হয়েছে। ধন্যবাদ!",
                  "Your message has been sent successfully to the school administration. Thank you!"
                )}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="font-semibold text-gray-700">
                {t("আপনার নাম *", "Your Name *")}
                <input
                  type="text"
                  required
                  placeholder={t("পূর্ণ নাম লিখুন", "Enter full name")}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
                />
              </label>

              <label className="font-semibold text-gray-700">
                {t("মোবাইল নম্বর *", "Mobile Number *")}
                <input
                  type="text"
                  required
                  placeholder={t("০১৭xxxxxxxx", "017xxxxxxxx")}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
                />
              </label>
            </div>

            <label className="block font-semibold text-gray-700">
              {t("ইমেইল ঠিকানা (ঐচ্ছিক)", "Email Address (Optional)")}
              <input
                type="email"
                placeholder="example@mail.com"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
              />
            </label>

            <label className="block font-semibold text-gray-700">
              {t("বিষয় *", "Subject *")}
              <input
                type="text"
                required
                placeholder={t("বার্তার মূল বিষয় লিখুন", "Enter main subject")}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
              />
            </label>

            <label className="block font-semibold text-gray-700">
              {t("আপনার বিস্তারিত বার্তা *", "Your Detailed Message *")}
              <textarea
                rows={4}
                required
                placeholder={t("এখানে আপনার বার্তা লিখুন...", "Write your message here...")}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e] resize-y"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded bg-[#006a4e] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#00503a]"
            >
              <Send size={14} />
              <span>{t("বার্তা পাঠান", "Send Message")}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
