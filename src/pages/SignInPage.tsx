import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";

const SignInPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await login({ username, password, role });
    if (result.success) {
      navigate("/");
    } else {
      setError(result.message || "Invalid credentials. Please try again.");
    }
  };

  const demoLogin = async (demoRole: UserRole) => {
    setError(null);
    const creds: Record<UserRole, { username: string; password: string }> = {
      admin:   { username: "admin",   password: "admin123" },
      teacher: { username: "johndoe", password: "admin123" },
      student: { username: "johnconnor", password: "admin123" },
      parent:  { username: "sarahconnor", password: "admin123" },
    };
    const res = await login({ ...creds[demoRole], role: demoRole });
    if (res.success) navigate("/");
    else setError(res.message || "Demo login failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-sky-600 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <img src="/logo.png" alt="MK School" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white">MK School</h1>
            <p className="text-white/60 text-sm mt-1">School Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
                Login as
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-black/20 rounded-xl p-1">
                {(["admin", "teacher", "student", "parent"] as UserRole[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold capitalize transition ${
                      role === r
                        ? "bg-white text-purple-800 shadow-md"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/50 focus:bg-white/15 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-white/50 focus:bg-white/15 transition"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-purple-800 font-bold py-3 rounded-xl hover:bg-white/90 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo Logins */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs text-center mb-3 font-medium">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              {(["admin", "teacher", "student", "parent"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => demoLogin(r)}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl py-2 px-3 text-white/80 text-xs font-medium capitalize transition"
                >
                  Demo {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © 2026 MK School Management System
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
