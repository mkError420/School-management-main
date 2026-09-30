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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left Side - Login Form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12">
            {/* Logo */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <img src="/images/logo.png" alt="ACADEMIA" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">ACADEMIA</h1>
                  <p className="text-sm text-gray-500">School Management System</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selector */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-3">
                  Login as
                </label>
                <div className="grid grid-cols-4 gap-2 bg-gray-100 rounded-xl p-1.5">
                  {(["admin", "teacher", "student", "parent"] as UserRole[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`py-2.5 px-2 rounded-lg text-xs font-semibold capitalize transition ${
                        role === r
                          ? "bg-white text-blue-600 shadow-md"
                          : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Username or Email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-to-r from-yellow-600 to-gray-600 text-black font-bold py-3.5 rounded-xl hover:from-yellow-700 hover:to-gray-700 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? "Signing in..." : "Login"}
              </button>
            </form>

            {/* Demo Logins */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-500 text-xs text-center mb-4 font-medium">Quick Demo Access</p>
              <div className="grid grid-cols-2 gap-2">
                {(["admin", "teacher", "student", "parent"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => demoLogin(r)}
                    className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl py-2.5 px-3 text-gray-700 text-xs font-medium capitalize transition"
                  >
                    Demo {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Illustration */}
          <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl" />
            
            {/* Illustration */}
            <div className="relative z-10 text-center">
              <div className="mb-6">
                <svg 
                  className="w-64 h-64 mx-auto" 
                  viewBox="0 0 400 400" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Books stack */}
                  <rect x="80" y="280" width="240" height="30" rx="4" fill="#3B82F6" />
                  <rect x="80" y="245" width="220" height="30" rx="4" fill="#EF4444" />
                  <rect x="80" y="210" width="200" height="30" rx="4" fill="#F59E0B" />
                  
                  {/* Person 1 */}
                  <circle cx="150" cy="120" r="25" fill="#1E293B" />
                  <path d="M120 160 Q150 140 180 160 L180 210 L120 210 Z" fill="#3B82F6" />
                  <rect x="130" y="200" width="40" height="60" rx="4" fill="#1E293B" />
                  
                  {/* Person 2 */}
                  <circle cx="250" cy="100" r="25" fill="#F59E0B" />
                  <path d="M220 140 Q250 120 280 140 L280 190 L220 190 Z" fill="#10B981" />
                  <rect x="230" y="180" width="40" height="60" rx="4" fill="#1E293B" />
                  
                  {/* Laptops */}
                  <rect x="110" y="250" width="50" height="35" rx="3" fill="#64748B" />
                  <rect x="240" y="240" width="50" height="35" rx="3" fill="#64748B" />
                  
                  {/* Folder */}
                  <rect x="300" y="300" width="60" height="45" rx="4" fill="#8B5CF6" />
                  <rect x="305" y="295" width="20" height="10" rx="2" fill="#8B5CF6" />
                  
                  {/* Plants */}
                  <circle cx="50" cy="350" r="20" fill="#10B981" opacity="0.6" />
                  <circle cx="350" cy="350" r="25" fill="#10B981" opacity="0.6" />
                  <circle cx="370" cy="320" r="15" fill="#10B981" opacity="0.5" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-3">
                Welcome Back!
              </h2>
              <p className="text-white/80 text-lg">
                Access your dashboard and manage your school activities
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2026 ACADEMIA School Management System
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
