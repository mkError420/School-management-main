import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const demoAccounts = [
  { label: "Admin", username: "admin", password: "admin123", icon: ShieldCheck },
  { label: "Teacher", username: "johndoe", password: "teacher123", icon: GraduationCap },
  { label: "Student", username: "johnconnor", password: "student123", icon: GraduationCap },
  { label: "Parent", username: "sarahconnor", password: "parent123", icon: UsersRound },
];

const SignInPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { siteName } = useSiteSettings();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await login({ username, password });
    if (result.success) {
      navigate("/");
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
      navigate("/");
    } else {
      setError(result.message || `Unable to sign in as the demo ${account.label.toLowerCase()}.`);
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-900">
      <img src="/images/bgimage2.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-slate-950/45" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-5 px-4 py-8 sm:px-6">
        <main className="w-full max-w-[470px] rounded-lg border border-white/50 bg-white/95 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <header className="mb-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-800">
                <img src="/images/logo.png" alt={siteName} className="h-7 w-7 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{siteName}</h1>
                <p className="text-xs text-gray-500">School Management System</p>
              </div>
            </div>
            <p className="mt-6 text-sm font-medium text-gray-600">Sign in to continue to your account.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Username or Email
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username or email"
                required
                className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-sky-800 py-3 text-sm font-bold text-white transition hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          <section className="mt-6 border-t border-gray-200 pt-4" aria-labelledby="demo-accounts-title">
            <h2 id="demo-accounts-title" className="text-sm font-semibold text-gray-800">Demo accounts</h2>
            <p className="mt-1 text-xs text-gray-500">Requires sample accounts from <code>seed.sql</code>.</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.label}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void handleDemoSignIn(account)}
                    className="group/demo flex min-w-0 items-center gap-2.5 rounded-md border border-gray-200 bg-white px-2.5 py-2.5 text-left transition hover:border-sky-500 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover/demo:text-sky-700">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-gray-800">{account.label}</span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] text-gray-500">{account.username} / {account.password}</span>
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-gray-400 group-hover/demo:text-sky-700" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>
        </main>

        <p className="text-center text-xs font-medium text-white/90 drop-shadow">
          © 2026 ACADEMIA School Management System
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
