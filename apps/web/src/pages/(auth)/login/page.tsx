"use client";

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, loginWithGoogle, register } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { Eye, EyeOff, Loader2, Sparkles, Mail, Lock, User as UserIcon } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const session = await login({ username, password });
        saveSession(session);
        if (session.user.role === "CASHIER") {
          navigate("/billing/new");
        } else {
          navigate("/dashboard");
        }
      } else {
        if (!username.includes("@")) {
          setError("Please enter a valid email address for registration.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        const session = await register({
          email: username,
          password,
          name: fullName || undefined,
          role: "ADMIN",
        });
        saveSession(session);
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please verify and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const session = await loginWithGoogle();
      saveSession(session);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f0f4f4] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#087f8c] to-[#0cb0c4] text-white shadow-lg shadow-[#087f8c]/20">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">Bubbleworks POS</h1>
          <p className="mt-1 text-sm text-muted">Cloud Laundry &amp; Dry Cleaning Management</p>
        </div>

        {/* Card Box */}
        <div className="rounded-xl border border-line bg-surface p-7 shadow-xl shadow-black/[0.04]">
          {/* Mode Switcher Tabs */}
          <div className="mb-6 flex rounded-lg bg-[#f4f7f6] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              className={`flex-1 rounded-md py-2 transition-all ${
                mode === "signin"
                  ? "bg-white text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`flex-1 rounded-md py-2 transition-all ${
                mode === "register"
                  ? "bg-white text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="focus-ring h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm transition-colors hover:border-[#087f8c]/40"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                {mode === "signin" ? "Email or Username" : "Email Address"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type={mode === "register" ? "email" : "text"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={mode === "signin" ? "Enter your email or username" : "admin@domain.com"}
                  className="focus-ring h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm transition-colors hover:border-[#087f8c]/40"
                  autoComplete={mode === "signin" ? "username" : "email"}
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Password
                </label>
                {mode === "signin" && (
                  <span className="text-xs text-muted">Min 6 characters</span>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus-ring h-11 w-full rounded-lg border border-line bg-white pl-10 pr-10 text-sm transition-colors hover:border-[#087f8c]/40"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted transition hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-[#fca5a5] bg-[#fff5f5] p-3 text-xs font-medium text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="focus-ring flex h-11 w-full items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-md shadow-brand/25 transition-all hover:bg-[#076f7a] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "signin" ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                <>{mode === "signin" ? "Sign In" : "Create Account &amp; Sign In"}</>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-3 font-medium text-muted">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="focus-ring flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:bg-[#f9fafb] hover:border-gray-300 disabled:opacity-60"
          >
            {googleLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted" />
                <span>Connecting to Google Auth...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted">
          Protected by Firebase Authentication &amp; Google Cloud Platform
        </p>
      </div>
    </main>
  );
}
