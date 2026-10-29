import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Home,
  Loader2,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Send,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export const ContactPage: React.FC = () => {
  const { websiteContent: content, t, lang, formatDigits, submitContactInquiry } = useSiteSettings();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await submitContactInquiry({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        subject: formData.subject || (lang === "bn" ? "অনলাইন মতামত ও অনুসন্ধান" : "Online Feedback & Inquiry"),
        message: formData.message,
      });
      if (res.success) {
        setSubmitted(true);
        setFormData({
          name: "",
          phone: "",
          email: "",
          subject: "",
          message: "",
        });
        setTimeout(() => setSubmitted(false), 8000);
      } else {
        setSubmitError(res.message || (lang === "bn" ? "বার্তা পাঠাতে সমস্যা হয়েছে।" : "Failed to send message."));
      }
    } catch (err: any) {
      setSubmitError(err?.message || (lang === "bn" ? "সার্ভার সংযোগ সমস্যা।" : "Server connection error."));
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="mt-4 rounded-md bg-emerald-50 border border-emerald-300 p-3.5 text-xs font-bold text-emerald-900 flex items-center gap-2.5 animate-in fade-in">
              <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
              <span>
                {t(
                  "আপনার বার্তাটি সফলভাবে বিদ্যালয় কর্তৃপক্ষের নিকট পাঠানো হয়েছে, অথোরিটি দ্রুত আপনার সাথে যোগাযোগ করবে। ধন্যবাদ!",
                  "Your message has been sent successfully to the school administration, authority will contact you soon. Thank you!"
                )}
              </span>
            </div>
          )}

          {submitError && (
            <div className="mt-4 rounded-md bg-red-50 border border-red-300 p-3.5 text-xs font-bold text-red-900 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="font-semibold text-gray-700">
                {t("আপনার নাম *", "Your Name *")}
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t("পূর্ণ নাম লিখুন", "Enter full name")}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
                />
              </label>

              <label className="font-semibold text-gray-700">
                {t("মোবাইল নম্বর *", "Mobile Number *")}
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder={t("০১৭xxxxxxxx", "017xxxxxxxx")}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
                />
              </label>
            </div>

            <label className="block font-semibold text-gray-700">
              {t("ইমেইল ঠিকানা (ঐচ্ছিক)", "Email Address (Optional)")}
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="example@mail.com"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
              />
            </label>

            <label className="block font-semibold text-gray-700">
              {t("বিষয় *", "Subject *")}
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder={t("বার্তার মূল বিষয় লিখুন", "Enter main subject")}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e]"
              />
            </label>

            <label className="block font-semibold text-gray-700">
              {t("আপনার বিস্তারিত বার্তা *", "Your Detailed Message *")}
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder={t("এখানে আপনার বার্তা লিখুন...", "Write your message here...")}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e] resize-y"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded bg-[#006a4e] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#00503a] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{t("বার্তা পাঠানো হচ্ছে...", "Sending Message...")}</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>{t("বার্তা পাঠান", "Send Message")}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Google Map - Rangpur Bus Terminal */}
      <div className="rounded-lg border border-[#dde5df] bg-white p-4 shadow-xs sm:p-6">
        <h3 className="mb-4 font-bold text-[#005a40] text-base flex items-center gap-2">
          <MapPin size={18} className="text-[#006a4e]" />
          {t("আমাদের অবস্থান — রংপুর বাস টার্মিনাল", "Our Location — Rangpur Bus Terminal")}
        </h3>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <iframe
            title={t("রংপুর বাস টার্মিনাল গুগল ম্যাপ", "Rangpur Bus Terminal Google Map")}
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3598.123!2d89.2321!3d25.7436!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e32de6fdb4275f%3A0x68cf2a543be25a0!2sRangpur%20Central%20Bus%20Terminal!5e0!3m2!1sen!2sbd!4v1698600000000!5m2!1sen!2sbd"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
        </div>
        <p className="mt-3 text-xs text-gray-500 text-center">
          {t(
            "রংপুর কেন্দ্রীয় বাস টার্মিনাল, রংপুর, বাংলাদেশ",
            "Rangpur Central Bus Terminal, Rangpur, Bangladesh"
          )}
        </p>
      </div>
    </div>
  );
};

export default ContactPage;
