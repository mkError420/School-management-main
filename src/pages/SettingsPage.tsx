import React, { useEffect, useRef, useState } from "react";
import { Building2, Check, DollarSign, Image as ImageIcon, KeyRound, LogOut, Moon, RotateCcw, ShieldCheck, Sun, Upload, UserRound, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { CURRENCY_OPTIONS, useSiteSettings } from "@/context/SiteSettingsContext";
import { api } from "@/lib/api";

const SettingsPage: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { siteName, saveSiteName, siteLogo, saveSiteLogo, resetSiteLogo, currencySymbol, saveCurrencySymbol } = useSiteSettings();
  const [siteNameDraft, setSiteNameDraft] = useState(siteName);
  const [savingSiteName, setSavingSiteName] = useState(false);
  const [siteNameFeedback, setSiteNameFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Logo management
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const [resettingLogo, setResettingLogo] = useState(false);
  const [logoFeedback, setLogoFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currencyFeedback, setCurrencyFeedback] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setSiteNameDraft(siteName);
  }, [siteName]);

  const handleSiteNameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSiteNameFeedback(null);
    const trimmedName = siteNameDraft.trim();
    if (!trimmedName || trimmedName.length > 80) {
      setSiteNameFeedback({ type: "error", message: "Enter a site name between 1 and 80 characters." });
      return;
    }

    setSavingSiteName(true);
    try {
      const response = await saveSiteName(trimmedName);
      setSiteNameFeedback(response.success
        ? { type: "success", message: "Site name updated across the login page and dashboard." }
        : { type: "error", message: response.message || "Unable to update the site name." });
    } catch {
      setSiteNameFeedback({ type: "error", message: "Unable to reach the server. Try again." });
    } finally {
      setSavingSiteName(false);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLogoFeedback({ type: "error", message: "Logo file must be 5 MB or smaller." });
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!validTypes.includes(file.type) && !["jpg", "jpeg", "png", "webp", "svg"].includes(ext || "")) {
      setLogoFeedback({ type: "error", message: "Please choose a PNG, JPG, WebP, or SVG image." });
      return;
    }

    setSelectedLogoFile(file);
    setLogoFeedback(null);

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLogoFile) return;

    setSavingLogo(true);
    setLogoFeedback(null);
    try {
      const response = await saveSiteLogo(selectedLogoFile);
      if (response.success) {
        setSelectedLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setLogoFeedback({
          type: "success",
          message: response.message || "Site logo updated across the login page and dashboard.",
        });
      } else {
        setLogoFeedback({ type: "error", message: response.message || "Unable to update site logo." });
      }
    } catch {
      setLogoFeedback({ type: "error", message: "Unable to reach the server. Try again." });
    } finally {
      setSavingLogo(false);
    }
  };

  const handleResetLogo = async () => {
    setResettingLogo(true);
    setLogoFeedback(null);
    try {
      const response = await resetSiteLogo();
      if (response.success) {
        setSelectedLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setLogoFeedback({ type: "success", message: "Site logo reset to default." });
      } else {
        setLogoFeedback({ type: "error", message: response.message || "Unable to reset site logo." });
      }
    } catch {
      setLogoFeedback({ type: "error", message: "Unable to reach the server. Try again." });
    } finally {
      setResettingLogo(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "The new passwords do not match." });
      return;
    }

    setSavingPassword(true);
    try {
      const response = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (!response.success) {
        setPasswordFeedback({ type: "error", message: response.message || "Unable to update password." });
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFeedback({ type: "success", message: "Password updated successfully." });
    } catch {
      setPasswordFeedback({ type: "error", message: "Unable to reach the server. Try again." });
    } finally {
      setSavingPassword(false);
    }
  };

  const inputClass = "w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-black dark:text-white outline-none transition focus:border-[#707E94] focus:ring-2 focus:ring-[#707E94]/20";

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-gray-200 dark:border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#707E94] dark:text-[#a4b3c7]">Workspace / Preferences</p>
          <h1 className="text-2xl font-bold text-black dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Account, security, and appearance.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Signed in as {role}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {role === "super_admin" && <section className="rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6" aria-labelledby="site-name-title">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#707E94]/10 text-[#707E94] dark:text-[#a4b3c7]">
                <Building2 size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 id="site-name-title" className="font-bold text-black dark:text-white">Site name</h2>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Shown on the login page and at the top of the dashboard sidebar.</p>
              </div>
            </div>
            <form onSubmit={handleSiteNameSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-semibold text-black dark:text-white">
                Display name
                <input type="text" required maxLength={80} value={siteNameDraft} onChange={(event) => setSiteNameDraft(event.target.value)} className={`${inputClass} mt-1.5`} />
              </label>
              <button type="submit" disabled={savingSiteName || !siteNameDraft.trim() || siteNameDraft.trim() === siteName} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#707E94] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#5a6679] disabled:cursor-not-allowed disabled:opacity-50">
                <Check size={16} aria-hidden="true" />
                {savingSiteName ? "Saving..." : "Save name"}
              </button>
            </form>
            {siteNameFeedback && <p role="status" className={`mt-3 rounded-md border px-3 py-2 text-sm ${siteNameFeedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{siteNameFeedback.message}</p>}
          </section>}

          {/* Site Logo – super_admin only */}
          {role === "super_admin" && (
            <section className="rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6" aria-labelledby="site-logo-title">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#707E94]/10 text-[#707E94] dark:text-[#a4b3c7]">
                  <ImageIcon size={18} aria-hidden="true" />
                </div>
                <div>
                  <h2 id="site-logo-title" className="font-bold text-black dark:text-white">Site logo</h2>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    Shown on the login screen, sidebar header, and mobile navigation drawer.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {/* Logo Preview */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 p-2 shadow-xs overflow-hidden">
                    <img
                      src={logoPreview || siteLogo}
                      alt="Site logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {logoPreview ? "New preview" : "Current logo"}
                  </span>
                </div>

                {/* Upload & Action Area */}
                <div className="flex-1 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="site-logo-upload-input"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex cursor-pointer items-center justify-center gap-3 rounded-md border-2 border-dashed border-gray-300 dark:border-slate-700 p-4 text-center transition hover:border-[#707E94] hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  >
                    <Upload size={18} className="text-[#707E94] dark:text-[#a4b3c7] transition group-hover:scale-110" />
                    <div className="text-left text-xs">
                      <p className="font-semibold text-black dark:text-white">
                        {selectedLogoFile ? selectedLogoFile.name : "Click to select a new logo image"}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        PNG, JPG, WebP, or SVG (max 5 MB)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={savingLogo || !selectedLogoFile}
                      onClick={handleLogoUpload}
                      className="inline-flex items-center gap-2 rounded-md bg-[#707E94] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#5a6679] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Check size={16} aria-hidden="true" />
                      {savingLogo ? "Uploading..." : "Save logo"}
                    </button>

                    {selectedLogoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLogoFile(null);
                          setLogoPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                      >
                        <X size={15} />
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={resettingLogo || savingLogo}
                      onClick={handleResetLogo}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 transition hover:border-gray-400 hover:text-black dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      title="Reset site logo to default"
                    >
                      <RotateCcw size={13} aria-hidden="true" />
                      {resettingLogo ? "Resetting..." : "Reset to default"}
                    </button>
                  </div>
                </div>
              </div>

              {logoFeedback && (
                <p
                  role="status"
                  className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                    logoFeedback.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                  }`}
                >
                  {logoFeedback.message}
                </p>
              )}
            </section>
          )}

          {/* Currency Symbol – super_admin only */}
          {role === "super_admin" && <section className="rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6" aria-labelledby="currency-title">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#707E94]/10 text-[#707E94] dark:text-[#a4b3c7]">
                <DollarSign size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 id="currency-title" className="font-bold text-black dark:text-white">Currency Symbol</h2>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Choose the currency symbol displayed across the Fees section.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CURRENCY_OPTIONS.map(({ symbol, label }) => {
                const isActive = currencySymbol === symbol;
                return (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => {
                      saveCurrencySymbol(symbol);
                      setCurrencyFeedback(`Currency updated to ${label}`);
                      setTimeout(() => setCurrencyFeedback(null), 3000);
                    }}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "border-[#707E94] bg-[#707E94]/10 dark:bg-[#707E94]/20 ring-1 ring-[#707E94] font-bold text-[#707E94] dark:text-white"
                        : "border-gray-200 dark:border-slate-700 text-black dark:text-white hover:border-gray-400"
                    }`}
                  >
                    <span className="text-base w-6 text-center">{symbol}</span>
                    <span className="truncate text-xs">{label.replace(` (${symbol})`, "")}</span>
                    {isActive && <Check size={14} className="ml-auto text-[#707E94] dark:text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
            {currencyFeedback && (
              <p role="status" className="mt-3 rounded-md border border-[#707E94]/30 bg-primary-50 dark:bg-[#707E94]/20 px-3 py-2 text-sm text-[#707E94] dark:text-white">
                ✓ {currencyFeedback}
              </p>
            )}
          </section>}

          <section className="rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6" aria-labelledby="appearance-title">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#707E94]/10 text-[#707E94] dark:text-[#a4b3c7]">
                <Sun size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 id="appearance-title" className="font-bold text-black dark:text-white">Appearance</h2>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Choose the display theme for this browser.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Color theme">
              {([
                { value: "light", label: "Light", description: "Bright workspace", icon: Sun },
                { value: "dark", label: "Dark", description: "Low-light workspace", icon: Moon },
              ] as const).map(({ value, label, description, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                  className={`flex items-center justify-between rounded-md border p-4 text-left transition ${theme === value ? "border-[#707E94] bg-[#707E94]/10 dark:bg-[#707E94]/20 ring-1 ring-[#707E94]" : "border-gray-200 dark:border-slate-700 hover:border-gray-400"}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={19} className={theme === value ? "text-[#707E94] dark:text-[#a4b3c7]" : "text-gray-500"} aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-bold text-black dark:text-white">{label}</span>
                      <span className="mt-0.5 block text-xs text-gray-700 dark:text-gray-300">{description}</span>
                    </span>
                  </span>
                  {theme === value && <Check size={17} className="text-[#707E94] dark:text-[#a4b3c7]" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6" aria-labelledby="security-title">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#707E94]/10 text-[#707E94] dark:text-[#a4b3c7]">
                <ShieldCheck size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 id="security-title" className="font-bold text-black dark:text-white">Password</h2>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Update the password for your {role} account.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <label className="block text-sm font-semibold text-black dark:text-white">
                Current password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-black dark:text-white">
                  New password
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className={`${inputClass} mt-1.5`}
                  />
                </label>
                <label className="block text-sm font-semibold text-black dark:text-white">
                  Confirm new password
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={`${inputClass} mt-1.5`}
                  />
                </label>
              </div>
              {passwordFeedback && (
                <p role="status" className={`rounded-md border px-3 py-2 text-sm ${passwordFeedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[#D32F45]/30 bg-[#D32F45]/10 text-[#D32F45]"}`}>
                  {passwordFeedback.message}
                </p>
              )}
              <div className="flex justify-end border-t border-gray-100 dark:border-slate-800 pt-4">
                <button
                  type="submit"
                  disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="inline-flex items-center gap-2 rounded-md bg-[#707E94] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#5a6679] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <KeyRound size={16} aria-hidden="true" />
                  {savingPassword ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5" aria-labelledby="account-title">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#707E94]/10 text-[#707E94] dark:text-[#a4b3c7]">
                <UserRound size={19} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id="account-title" className="font-semibold text-black dark:text-white">Account</h2>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.name || user?.username}</p>
              </div>
            </div>
            <dl className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              <div className="flex justify-between gap-3 py-3">
                <dt className="text-gray-500 dark:text-gray-400">Username</dt>
                <dd className="truncate font-medium text-black dark:text-white">{user?.username || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3 py-3">
                <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="truncate font-medium text-black dark:text-white">{user?.email || "Not set"}</dd>
              </div>
              <div className="flex justify-between gap-3 py-3">
                <dt className="text-gray-500 dark:text-gray-400">Role</dt>
                <dd className="font-medium capitalize text-black dark:text-white">{role}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5" aria-labelledby="session-title">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#707E94]" />
              <h2 id="session-title" className="font-semibold text-black dark:text-white">Current session</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Your account session is active in this browser.</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm font-semibold text-black dark:text-white transition hover:border-[#D32F45] hover:bg-[#D32F45]/10 hover:text-[#D32F45]"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default SettingsPage;
