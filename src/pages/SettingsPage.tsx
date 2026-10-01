import React, { useState } from "react";
import { Check, KeyRound, LogOut, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

const SettingsPage: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const inputClass = "w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100";

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-700">Workspace / Preferences</p>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Account, security, and appearance.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Signed in as {role}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-md border border-gray-200 bg-white p-5 md:p-6" aria-labelledby="appearance-title">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                <Sun size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 id="appearance-title" className="font-semibold text-gray-900">Appearance</h2>
                <p className="mt-1 text-sm text-gray-500">Choose the display theme for this browser.</p>
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
                  className={`flex items-center justify-between rounded-md border p-4 text-left transition ${theme === value ? "border-sky-700 bg-sky-50 ring-1 ring-sky-700" : "border-gray-200 hover:border-gray-400"}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={19} className={theme === value ? "text-sky-700" : "text-gray-500"} aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold text-gray-800">{label}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
                    </span>
                  </span>
                  {theme === value && <Check size={17} className="text-sky-700" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5 md:p-6" aria-labelledby="security-title">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <ShieldCheck size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 id="security-title" className="font-semibold text-gray-900">Password</h2>
                <p className="mt-1 text-sm text-gray-500">Update the password for your {role} account.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
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
                <label className="block text-sm font-medium text-gray-700">
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
                <label className="block text-sm font-medium text-gray-700">
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
                <p role="status" className={`rounded-md border px-3 py-2 text-sm ${passwordFeedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                  {passwordFeedback.message}
                </p>
              )}
              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  type="submit"
                  disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <KeyRound size={16} aria-hidden="true" />
                  {savingPassword ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-md border border-gray-200 bg-white p-5" aria-labelledby="account-title">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <UserRound size={19} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id="account-title" className="font-semibold text-gray-900">Account</h2>
                <p className="truncate text-xs text-gray-500">{user?.name || user?.username}</p>
              </div>
            </div>
            <dl className="divide-y divide-gray-100 text-sm">
              <div className="flex justify-between gap-3 py-3">
                <dt className="text-gray-500">Username</dt>
                <dd className="truncate font-medium text-gray-800">{user?.username || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3 py-3">
                <dt className="text-gray-500">Email</dt>
                <dd className="truncate font-medium text-gray-800">{user?.email || "Not set"}</dd>
              </div>
              <div className="flex justify-between gap-3 py-3">
                <dt className="text-gray-500">Role</dt>
                <dd className="font-medium capitalize text-gray-800">{role}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5" aria-labelledby="session-title">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h2 id="session-title" className="font-semibold text-gray-900">Current session</h2>
            </div>
            <p className="text-sm text-gray-500">Your account session is active in this browser.</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
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
