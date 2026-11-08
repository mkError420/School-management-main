import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  History,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Wallet,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import StudentPromotionModal from "./StudentPromotionModal";
import { PromotionsSummary } from "@/types/promotion";

export const SessionProgressionBanner: React.FC = () => {
  const [summary, setSummary] = useState<PromotionsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadSummary = () => {
    setLoading(true);
    api
      .getPromotionsSummary()
      .then((res) => {
        if (res.success && res.data) {
          setSummary(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const activeSession = summary?.active_session || "2026-2027";
  const totalStudents = summary?.total_students || 0;
  const totalHistory = summary?.total_records || 0;
  const totalPromoted = summary?.total_promoted || 0;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00382B] via-[#005a40] to-[#0A7355] p-5 sm:p-6 text-white shadow-lg border border-emerald-800/40">
        {/* Subtle decorative background circles */}
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none blur-2xl" />
        <div className="absolute right-32 -bottom-10 w-36 h-36 rounded-full bg-emerald-400/10 pointer-events-none blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-[11px] font-bold uppercase tracking-wider border border-white/20">
                <Calendar size={12} className="text-emerald-300" />
                <span>Active Session: {activeSession}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[11px] font-semibold border border-amber-400/30">
                <ShieldCheck size={12} className="text-amber-300" />
                <span>All Past Records &amp; Fees Saved</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <GraduationCap className="text-emerald-300 shrink-0" size={24} />
              <span>Session Progression &amp; Historical Archives (সেশন প্রমোশন ও পুনর্ভর্তি)</span>
            </h2>

            <p className="text-xs text-emerald-100/90 leading-relaxed">
              When students complete an academic session and enroll into the new session or class, all previous performance metrics (exam marks, GPA, attendance logs, paid fee receipts, and billing vouchers) remain permanently archived and available across student profiles, parent dashboards, and admin records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-md shadow-amber-400/20 transition cursor-pointer"
            >
              <GraduationCap size={15} />
              <span>Promote Students / সেশন প্রমোশন</span>
              <ArrowRight size={13} />
            </button>

            <Link
              to="/list/students"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 backdrop-blur-sm transition"
            >
              <Users size={14} />
              <span>All Students</span>
            </Link>
          </div>
        </div>

        {/* Mini KPI row */}
        <div className="mt-4 pt-3.5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Active Session Students</span>
            <span className="text-lg font-black text-white">{totalStudents} Enrolled</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Past Completed Sessions</span>
            <span className="text-lg font-black text-white">{totalHistory} Archived Records</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Promoted Successfully</span>
            <span className="text-lg font-black text-amber-300">{totalPromoted} Students</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Past Payment Status</span>
            <span className="text-lg font-black text-emerald-300 flex items-center gap-1">
              <CheckCircle2 size={15} />
              <span>100% Preserved</span>
            </span>
          </div>
        </div>
      </div>

      {modalOpen && (
        <StudentPromotionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={loadSummary}
        />
      )}
    </>
  );
};

export default SessionProgressionBanner;

