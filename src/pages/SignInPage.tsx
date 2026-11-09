import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { resolveLogoUrl, useSiteSettings } from "@/context/SiteSettingsContext";

const demoAccounts = [
  { label: "Admin", username: "admin", password: "admin123", icon: ShieldCheck },
  { label: "Teacher", username: "johndoe", password: "teacher123", icon: GraduationCap },
  { label: "Student", username: "johnconnor", password: "student123", icon: GraduationCap },
  { label: "Parent", username: "sarahconnor", password: "parent123", icon: UsersRound },
];

const SignInPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { siteName, siteLogo, websiteContent: content, refreshSettings } = useSiteSettings();
  const navigate = useNavigate();

  const logoUrl = resolveLogoUrl(siteLogo) || "/images/logo.png";
  const schoolTitle = content.schoolNameBn || content.schoolName || siteName || "School Management System";
  const schoolSubtitle = content.heroSubtitle || content.heroSubtitleEn || "School Management System";

  useEffect(() => {
    // Refresh settings from server when viewing login page
    void refreshSettings();
  }, [refreshSettings]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await login({ username, password });
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message || "Invalid credentials. Please try again.");
    }
  };

  const handleDemoSignIn = async (account: typeof demoAccounts[number]) => {
    if (isLoading) return;
    setUsername(account.username);
    setPassword(account.password);
    setError(null);
    const result = await login({ username: account.username, password: account.password });
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message || `Unable to sign in as the demo ${account.label.toLowerCase()}.`);
    }
  };

  const loginBgUrl = content.loginBgImage?.trim() || "/images/bgimage2.jpg";

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-900">
      <img
        src={loginBgUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.dataset.fallback) {
            target.dataset.fallback = "true";
            target.src = "/images/bgimage2.jpg";
          }
        }}
      />
      <div className="absolute inset-0 bg-slate-950/45" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 px-3 py-6 sm:gap-5 sm:px-6 sm:py-8">
        <main className="login-card w-[88%] max-w-[340px] xs:max-w-[360px] sm:w-full sm:max-w-[470px] rounded-2xl border border-white/50 bg-white/95 p-4.5 xs:p-5 sm:p-8 shadow-2xl backdrop-blur-sm mx-auto">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2.5 sm:mb-5 sm:pb-3">
            <Link
              to="/"
              className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#006a4e] hover:text-[#004d38] transition"
              title="Return to School Website"
            >
              <ArrowLeft size={14} className="transition group-hover:-translate-x-0.5" />
              <span>ওয়েবসাইটে ফিরে যান / Back to Website</span>
            </Link>
          </div>

          <header className="mb-5 sm:mb-7">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <Link
                to="/"
                className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#006a4e] bg-white p-1 shadow-md transition hover:scale-105 sm:h-14 sm:w-14"
                title="Go to Website"
              >
                <img
                  src={logoUrl}
                  alt={schoolTitle}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = "true";
                      target.src = "/images/logo.png";
                    }
                  }}
                  className="h-full w-full object-contain rounded-full"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-gray-900 leading-tight sm:text-xl truncate" title={schoolTitle}>
                  {schoolTitle}
                </h1>
                <p className="mt-0.5 text-[11px] text-gray-600 truncate sm:text-xs">{schoolSubtitle}</p>
              </div>
            </div>
            <p className="mt-3.5 text-xs font-medium text-gray-700 sm:mt-5 sm:text-sm">Sign in to continue to your account.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            <label className="block text-xs font-semibold text-black sm:text-sm">
              Username or Email
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username or email"
                required
                className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black outline-none transition placeholder:text-gray-500 focus:border-[#707E94] focus:ring-2 focus:ring-[#707E94]/20 sm:px-4 sm:py-3 sm:text-sm"
              />
            </label>

            <label className="block text-xs font-semibold text-black sm:text-sm">
              Password
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-xs text-black outline-none transition placeholder:text-gray-500 focus:border-[#707E94] focus:ring-2 focus:ring-[#707E94]/20 sm:px-4 sm:py-3 sm:pr-11 sm:text-sm"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-[#D32F45] sm:py-2.5 sm:text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-[#707E94] py-2.5 text-xs font-bold text-white transition hover:bg-[#5a6679] shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-sm"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          <section className="mt-5 border-t border-gray-200 pt-3.5 sm:mt-6 sm:pt-4" aria-labelledby="demo-accounts-title">
            <h2 id="demo-accounts-title" className="text-xs font-bold text-black sm:text-sm">Demo accounts</h2>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:mt-3 sm:grid-cols-2">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.label}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void handleDemoSignIn(account)}
                    className="group/demo flex min-w-0 items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-2 text-left transition hover:border-[#707E94] hover:bg-[#707E94]/10 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2.5 sm:px-2.5 sm:py-2.5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-700 group-hover/demo:text-[#707E94] sm:h-8 sm:w-8">
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold text-black sm:text-xs">{account.label}</span>
                      <span className="mt-0.5 block truncate font-mono text-[9px] text-gray-600 sm:text-[10px]">{account.username} / {account.password}</span>
                    </span>
                    <ArrowRight size={13} className="shrink-0 text-gray-400 group-hover/demo:text-[#707E94] sm:size-3.5" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>
        </main>

        <p className="text-center text-xs font-medium text-white/90 drop-shadow">
          © {new Date().getFullYear()} <a href="https://codexaa.xo.je/" target="_blank" rel="noreferrer" className="underline underline-offset-2">Developed by CodexaaSolution</a> all right reserved.
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
