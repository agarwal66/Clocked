import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const DEMO_EMAIL = "demo@clocked.in";
const DEMO_PASSWORD = "clocked123";

const recentActivity = [
  { dot: "red", text: "New red flag dropped on your handle", time: "2 hours ago" },
  { dot: "gray", text: "@mehak.designs you're watching was searched 12 times", time: "5 hours ago" },
  { dot: "green", text: "New green flag on a handle you're watching", time: "1 day ago" },
  { dot: "gray", text: "Someone replied to a flag you posted", time: "2 days ago" },
];

const weeklyStats = [
  { value: "847", label: "red flags dropped", tone: "text-red-600" },
  { value: "1.2k", label: "green flags dropped", tone: "text-emerald-600" },
  { value: "3.4k", label: "handles searched", tone: "text-zinc-950" },
  { value: "94", label: "new members", tone: "text-zinc-950" },
];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

async function api(url, options = {}) {
  const apiUrl = url.startsWith('http') ? url : `http://localhost:5004${url}`;
  
  try {
    const res = await fetch(apiUrl, {
      headers: { 
        "Content-Type": "application/json"
      },
      credentials: "include",
      ...options,
    });
    
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();
    
    if (!res.ok) {
      throw new Error(typeof data === "object" && data?.message ? data.message : "Request failed");
    }
    
    return data;
  } catch (error) {
    console.error('❌ Login API Error:', error.message);
    throw error;
  }
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialMode = query.get("mode") || "login";
  const token = query.get("token") || "";
  const searchedParam = Number(query.get("searched") || 3);
  const searchedCount = Number.isFinite(searchedParam) && searchedParam > 0 ? searchedParam : 3;
  const handleParam = query.get("handle") || "yourhandle";
  const reasonParam = query.get("reason") || "";
  const resetSuccess = query.get("reset") === "success";

  const [mode, setMode] = useState(
    ["login", "forgot", "forgot-sent", "reset", "reset-success", "reset-expired"].includes(initialMode)
      ? initialMode
      : "login"
  );

  const [loginEmail, setLoginEmail] = useState(query.get("email") || "");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginTouched, setLoginTouched] = useState({ email: false, password: false });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [forgotEmail, setForgotEmail] = useState(query.get("email") || "");
  const [forgotTouched, setForgotTouched] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSentEmail, setForgotSentEmail] = useState("");

  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetTouched, setResetTouched] = useState({ password: false, confirmPassword: false });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetTokenChecked, setResetTokenChecked] = useState(false);

  useEffect(() => {
    if (mode !== "reset") return;

    let cancelled = false;

    async function validateToken() {
      try {
        const response = await api("/auth/validate-reset-token", {
          method: "POST",
          body: JSON.stringify({ token: token }),
        });
        
        if (cancelled) return;
        
        console.log('✅ Reset token validated successfully');
        setResetTokenChecked(true);
      } catch (error) {
        if (cancelled) return;
        
        console.error('❌ Reset token validation failed:', error.message);
        setMode("reset-expired");
        setResetTokenChecked(true);
      }
    }

    validateToken();

    return () => {
      cancelled = true;
    };
  }, [mode, token]);

  useEffect(() => {
    if (resetSuccess && mode === "login") {
      setLoginError("");
    }
  }, [resetSuccess, mode]);

  const loginEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim());
  const forgotEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim());

  const resetChecks = {
    length: resetPassword.length >= 8,
    upper: /[A-Z]/.test(resetPassword),
    number: /[0-9]/.test(resetPassword),
    special: /[^A-Za-z0-9]/.test(resetPassword),
  };

  const resetPasswordValid = Object.values(resetChecks).every(Boolean);
  const resetPasswordsMatch = resetPassword === resetConfirmPassword && resetConfirmPassword.length > 0;
  const resetReady = resetPasswordValid && resetPasswordsMatch;

  const strength = useMemo(() => {
    let score = 0;
    if (resetPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(resetPassword)) score += 1;
    if (/[0-9]/.test(resetPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(resetPassword)) score += 1;
    if (resetPassword.length >= 12) score += 1;

    const levels = [
      { label: "Too short", width: "20%", bar: "bg-red-600", text: "text-red-600" },
      { label: "Weak", width: "40%", bar: "bg-red-600", text: "text-red-600" },
      { label: "Fair", width: "60%", bar: "bg-amber-500", text: "text-amber-600" },
      { label: "Good", width: "80%", bar: "bg-emerald-600", text: "text-emerald-600" },
      { label: "Strong", width: "100%", bar: "bg-emerald-600", text: "text-emerald-600" },
    ];

    return resetPassword.length ? levels[Math.min(score, 4)] : null;
  }, [resetPassword]);

  const teaserReason = useMemo(() => {
    const reasonMap = {
      date: "👀 going on a date",
      shaadi: "💍 shaadi",
      fwb: "🔥 friends with benefits",
      buying: "🛍️ buying from them",
      work: "💼 work collab",
      curious: "🤝 just curious",
    };
    return reasonMap[reasonParam] || reasonParam;
  }, [reasonParam]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginTouched({ email: true, password: true });
    setLoginError("");

    if (!loginEmailValid || !loginPassword) return;

    setLoginLoading(true);
    try {
      const response = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
          remember_me: rememberMe
        }),
      });

      // Store token and user info
      if (response.token) {
        localStorage.setItem('clocked_token', response.token);
        localStorage.setItem('clocked_user', JSON.stringify(response.user));
        
        // Redirect based on user role or to discover
        if (response.user?.role === 'admin') {
          navigate("/admin");
        } else {
          navigate("/discover");
        }
        return;
      }

      setLoginError("Incorrect email or password. Please try again.");
    } catch (e) {
      setLoginError(e.message || "Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleForgotSubmit(event) {
    event.preventDefault();
    setForgotTouched(true);
    if (!forgotEmailValid) return;

    setForgotLoading(true);
    try {
      const response = await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      
      setForgotSentEmail(forgotEmail.trim());
      setMode("forgot-sent");
    } catch (e) {
      setLoginError(e.message || "Failed to send reset link. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetSubmit(event) {
    event.preventDefault();
    setResetTouched({ password: true, confirmPassword: true });
    if (!resetReady) return;

    setResetLoading(true);
    try {
      const response = await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ 
          token: token,
          password: resetPassword 
        }),
      });
      
      setMode("reset-success");
    } catch (e) {
      setLoginError(e.message || "Failed to reset password. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  function goToLogin() {
    setMode("login");
    setLoginError("");
  }

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-950 flex flex-col">
      <header className="h-14 border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-zinc-950">
            <span className="flex items-center gap-1">
              <span className="block h-4 w-2.5 bg-red-600 [clip-path:polygon(0_0,100%_15%,100%_85%,0_100%)]" />
              <span className="block h-4 w-2.5 bg-emerald-600 [clip-path:polygon(0_0,100%_15%,100%_85%,0_100%)]" />
            </span>
            Clocked
          </Link>
          {mode === "login" || mode === "forgot" || mode === "forgot-sent" ? (
            <span className="text-sm text-zinc-500">
              New here?{" "}
              <Link to="/signup" className="font-medium text-zinc-950 hover:underline">
                Create an account →
              </Link>
            </span>
          ) : (
            <Link to="/signup" className="text-sm font-medium text-zinc-950 hover:underline">
              Create an account →
            </Link>
          )}
        </div>
      </header>

      {/* Error Message */}
      {loginError && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4">
          <div className="max-w-[400px]">
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-red-600">❌</span>
                <span className="text-sm text-red-700">{loginError}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-14 lg:px-8 lg:py-14">
        <main className="w-full max-w-[400px] flex-shrink-0">
          {(mode === "login" || mode === "forgot" || mode === "forgot-sent") && (
            <>
              {mode === "login" && (
                <section>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Welcome back</div>
                  <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-zinc-950">Log back in.</h1>
                  <p className="mb-8 text-sm leading-6 text-zinc-600">
                    Your receipts are waiting. So are the people who searched your handle.
                  </p>

                  {resetSuccess && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                      <span className="text-base">✅</span>
                      <div className="text-sm leading-6 text-zinc-950">
                        <strong className="block font-semibold">Password updated.</strong>
                        Log in with your new password.
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="mb-4 rounded-2xl border border-stone-200 bg-white p-6">
                    <Field label="Email address">
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(event) => {
                          setLoginEmail(event.target.value);
                          setLoginError("");
                        }}
                        onBlur={() => setLoginTouched((current) => ({ ...current, email: true }))}
                        placeholder="you@example.com"
                        className={inputClass(!!(loginTouched.email && !loginEmailValid))}
                      />
                      {loginTouched.email && !loginEmailValid && (
                        <p className="mt-1 text-xs text-red-600">Please enter a valid email address.</p>
                      )}
                    </Field>

                    <Field label="Password" noMargin>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(event) => {
                            setLoginPassword(event.target.value);
                            setLoginError("");
                          }}
                          onBlur={() => setLoginTouched((current) => ({ ...current, password: true }))}
                          placeholder="your password"
                          className={inputClass(!!(loginTouched.password && !loginPassword))}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 hover:text-zinc-950"
                        >
                          {showLoginPassword ? "hide" : "show"}
                        </button>
                      </div>
                      {loginTouched.password && !loginPassword && (
                        <p className="mt-1 text-xs text-red-600">Please enter your password.</p>
                      )}
                    </Field>

                    <div className="mb-5 mt-4 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-xs text-zinc-600">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(event) => setRememberMe(event.target.checked)}
                          className="h-4 w-4 accent-zinc-950"
                        />
                        Remember me
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail);
                          setMode("forgot");
                        }}
                        className="text-xs font-medium text-zinc-950 hover:opacity-70"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-base font-extrabold tracking-tight text-white transition hover:bg-zinc-800"
                    >
                      {loginLoading ? "Logging in..." : "Log in →"}
                    </button>
                  </form>

                  <p className="text-center text-xs leading-5 text-zinc-400">
                    Don't have an account? <Link to="/signup" className="text-zinc-600 underline">Sign up free</Link> ·{" "}
                    <Link to="/privacy" className="text-zinc-600 underline">Privacy Policy</Link>
                  </p>

                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-stone-200" />
                    <span className="text-xs text-zinc-400">Try the demo</span>
                    <div className="h-px flex-1 bg-stone-200" />
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-100 p-4 text-sm leading-7 text-zinc-600">
                    <strong className="mb-1 block font-semibold text-zinc-950">Demo credentials</strong>
                    Email: <code className="rounded border border-stone-200 bg-white px-2 py-0.5 text-xs text-zinc-950">demo@clocked.in</code>
                    <br />
                    Password: <code className="rounded border border-stone-200 bg-white px-2 py-0.5 text-xs text-zinc-950">clocked123</code>
                    <span className="mt-1 block text-xs text-zinc-400">Log in with these to explore the dashboard.</span>
                  </div>
                </section>
              )}

              {mode === "forgot" && (
                <section>
                  <button type="button" onClick={goToLogin} className="mb-6 text-sm text-zinc-500 hover:text-zinc-950">
                    ← Back to login
                  </button>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Password reset</div>
                  <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-zinc-950">Forgot your password?</h1>
                  <p className="mb-8 text-sm leading-6 text-zinc-600">
                    Enter your email and we'll send a reset link. Check your spam folder if it doesn't arrive.
                  </p>

                  <form onSubmit={handleForgotSubmit}>
                    <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-6">
                      <Field label="Email address" noMargin>
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(event) => setForgotEmail(event.target.value)}
                          onBlur={() => setForgotTouched(true)}
                          placeholder="you@example.com"
                          className={inputClass(!!(forgotTouched && !forgotEmailValid))}
                        />
                        {forgotTouched && !forgotEmailValid && (
                          <p className="mt-1 text-xs text-red-600">Please enter a valid email address.</p>
                        )}
                      </Field>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-base font-extrabold tracking-tight text-white transition hover:bg-zinc-800"
                    >
                      {forgotLoading ? "Sending reset link..." : "Send reset link →"}
                    </button>
                  </form>

                  <p className="mt-3 text-center text-xs leading-5 text-zinc-400">
                    Remember your password?{" "}
                    <button type="button" onClick={goToLogin} className="text-zinc-600 underline">
                      Log in
                    </button>
                  </p>
                </section>
              )}

              {mode === "forgot-sent" && (
                <section>
                  <button type="button" onClick={goToLogin} className="mb-6 text-sm text-zinc-500 hover:text-zinc-950">
                    ← Back to login
                  </button>
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                    <span className="text-base">✅</span>
                    <div className="text-sm leading-6 text-zinc-950">
                      <strong className="block font-semibold">Reset link sent!</strong>
                      Check your inbox at <span className="font-medium">{forgotSentEmail}</span>. Link expires in 30 minutes.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-white p-6">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Check your email</div>
                    <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-zinc-950">We sent the reset link.</h1>
                    <p className="mb-6 text-sm leading-6 text-zinc-600">
                      Open the email, click the link, and you'll be able to set a new password on the same auth page.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium text-zinc-600 transition hover:bg-stone-100"
                      >
                        Use another email
                      </button>
                      <button
                        type="button"
                        onClick={goToLogin}
                        className="rounded-xl bg-zinc-950 px-4 py-3 text-base font-extrabold tracking-tight text-white transition hover:bg-zinc-800"
                      >
                        Back to login →
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {(mode === "reset" || mode === "reset-success" || mode === "reset-expired") && (
            <section>
              {mode === "reset" && (
                <div className="rounded-2xl border border-stone-200 bg-white p-8">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-100 text-2xl mx-auto">
                    🔑
                  </div>
                  <h1 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-zinc-950">Set new password</h1>
                  <p className="mb-6 text-center text-sm leading-6 text-zinc-600">
                    Choose something strong. You won't be able to reuse your last password.
                  </p>

                  {!resetTokenChecked ? (
                    <div className="py-8 text-center text-sm text-zinc-500">Validating reset link...</div>
                  ) : (
                    <form onSubmit={handleResetSubmit}>
                      <Field label="New password">
                        <div className="relative">
                          <input
                            type={showResetPassword ? "text" : "password"}
                            value={resetPassword}
                            onChange={(event) => setResetPassword(event.target.value)}
                            onBlur={() => setResetTouched((current) => ({ ...current, password: true }))}
                            placeholder="new password"
                            className={inputClass(!!(resetTouched.password && !resetPasswordValid), false, resetPasswordValid)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowResetPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 hover:text-zinc-950"
                          >
                            {showResetPassword ? "hide" : "show"}
                          </button>
                        </div>

                        <div className="mt-2 h-1 overflow-hidden rounded bg-stone-200">
                          <div className={cx("h-full rounded transition-all", strength?.bar)} style={{ width: strength?.width || "0%" }} />
                        </div>
                        <div className={cx("mt-1 text-[11px] font-medium", strength?.text || "text-zinc-400")}>{strength?.label || ""}</div>

                        <div className="mt-3 space-y-1">
                          <Requirement met={resetChecks.length} text="At least 8 characters" />
                          <Requirement met={resetChecks.upper} text="One uppercase letter" />
                          <Requirement met={resetChecks.number} text="One number" />
                          <Requirement met={resetChecks.special} text="One special character" />
                        </div>
                      </Field>

                      <Field label="Confirm new password" noMargin>
                        <div className="relative">
                          <input
                            type={showResetConfirmPassword ? "text" : "password"}
                            value={resetConfirmPassword}
                            onChange={(event) => setResetConfirmPassword(event.target.value)}
                            onBlur={() => setResetTouched((current) => ({ ...current, confirmPassword: true }))}
                            placeholder="confirm password"
                            className={inputClass(
                              !!(resetTouched.confirmPassword && !resetPasswordsMatch),
                              false,
                              resetPasswordsMatch
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowResetConfirmPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 hover:text-zinc-950"
                          >
                            {showResetConfirmPassword ? "hide" : "show"}
                          </button>
                        </div>
                        {resetTouched.confirmPassword && !resetPasswordsMatch && (
                          <p className="mt-1 text-xs text-red-600">Passwords don't match.</p>
                        )}
                      </Field>

                      <button
                        type="submit"
                        disabled={!resetReady || resetLoading}
                        className={cx(
                          "mt-5 w-full rounded-xl px-4 py-3 text-base font-extrabold tracking-tight text-white transition",
                          resetReady && !resetLoading ? "bg-zinc-950 hover:bg-zinc-800" : "cursor-not-allowed bg-zinc-950/50"
                        )}
                      >
                        {resetLoading ? "Updating password..." : "Set new password →"}
                      </button>
                      <p className="mt-3 text-center text-xs leading-5 text-zinc-400">
                        This link expires in 30 minutes. <button type="button" onClick={goToLogin} className="text-zinc-600 underline">Back to login</button>
                      </p>
                    </form>
                  )}
                </div>
              )}

              {mode === "reset-success" && (
                <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-50 text-2xl">✅</div>
                  <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-zinc-950">Password updated.</h1>
                  <p className="mb-6 text-sm leading-6 text-zinc-600">
                    Your password has been changed successfully. Log in with your new password.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/auth?mode=login&reset=success")}
                    className="rounded-xl bg-zinc-950 px-6 py-3 text-base font-extrabold tracking-tight text-white transition hover:bg-zinc-800"
                  >
                    Log in →
                  </button>
                </div>
              )}

              {mode === "reset-expired" && (
                <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-300 bg-red-50 text-2xl">⏰</div>
                  <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-zinc-950">Link expired.</h1>
                  <p className="mb-4 text-sm leading-6 text-zinc-600">
                    This reset link has expired. Request a new one from the login page.
                  </p>
                  <div className="mb-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                    Reset links expire after 30 minutes for security. You'll need to request a new one.
                  </div>
                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => navigate("/auth?mode=forgot")}
                      className="rounded-xl bg-zinc-950 px-5 py-3 text-base font-extrabold tracking-tight text-white transition hover:bg-zinc-800"
                    >
                      Request new link →
                    </button>
                    <Link
                      to="/"
                      className="rounded-xl border border-stone-300 px-5 py-3 text-sm font-medium text-zinc-600 transition hover:bg-stone-100"
                    >
                      Home
                    </Link>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>

        <aside className="flex-1 max-w-[340px] space-y-4 pt-2">
          <div className="rounded-2xl border border-red-300 bg-red-50 p-5">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-red-600">👀 People searched you</div>
            <div className="mb-1 text-5xl font-extrabold leading-none tracking-tight text-zinc-950">{searchedCount}</div>
            <div className="mb-3 text-xs text-zinc-500">
              {searchedCount === 1 ? `person searched @${handleParam} this week` : `people searched @${handleParam} this week`}
            </div>
            <div className="text-sm leading-6 text-zinc-600">
              {teaserReason
                ? `Someone searched @${handleParam} — reason: ${teaserReason}. Log in to see the full picture and respond if you want.` 
                : `Log in to see why they searched @${handleParam} — going on a date, shaadi, just curious — and respond if you want.`}
            </div>
          </div>

          <InfoCard title="🔔 Recent activity">
            <div className="space-y-0">
              {recentActivity.map((item, index) => (
                <div
                  key={`${item.text}-${index}`}
                  className={cx("flex items-start gap-3 py-2", index < recentActivity.length - 1 && "border-b border-stone-100")}
                >
                  <span
                    className={cx(
                      "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
                      item.dot === "red" && "bg-red-600",
                      item.dot === "green" && "bg-emerald-600",
                      item.dot === "gray" && "bg-stone-300"
                    )}
                  />
                  <div>
                    <div className="text-sm leading-6 text-zinc-600">{item.text}</div>
                    <div className="text-[11px] text-zinc-400">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="📊 This week on Clocked">
            <div className="grid grid-cols-2 gap-2">
              {weeklyStats.map((item) => (
                <div key={item.label} className="rounded-xl bg-stone-100 p-4 text-center">
                  <div className={cx("mb-1 text-2xl font-extrabold leading-none tracking-tight", item.tone)}>{item.value}</div>
                  <div className="text-[11px] text-zinc-400">{item.label}</div>
                </div>
              ))}
            </div>
          </InfoCard>

          <div className="rounded-2xl bg-zinc-950 p-5 text-white">
            <div className="mb-1 text-base font-bold">🚩 New here?</div>
            <p className="mb-4 text-sm leading-6 text-white/50">
              Join the community. Search handles. Drop flags. See receipts. All free, anonymous by default.
            </p>
            <Link
              to="/signup"
              className="block rounded-xl bg-white px-4 py-3 text-center text-sm font-extrabold text-zinc-950 transition hover:opacity-90"
            >
              Create free account →
            </Link>
          </div>
        </aside>
      </div>

      <footer className="border-t border-stone-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-zinc-400">© 2025 Clocked. Community-powered receipts.</span>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/terms" className="text-xs text-zinc-400 hover:text-zinc-950">Terms</Link>
            <Link to="/privacy" className="text-xs text-zinc-400 hover:text-zinc-950">Privacy</Link>
            <Link to="/guidelines" className="text-xs text-zinc-400 hover:text-zinc-950">Guidelines</Link>
            <Link to="/grievance" className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-600 hover:text-white">
              🛡️ Report / Takedown
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children, noMargin = false }) {
  return (
    <div className={cx(!noMargin && "mb-4")}>
      <label className="mb-1 block text-xs font-medium text-zinc-600">{label}</label>
      {children}
    </div>
  );
}

function Requirement({ met, text }) {
  return (
    <div className={cx("flex items-center gap-2 text-xs transition", met ? "text-emerald-600" : "text-zinc-400")}>
      <span className={cx("h-1.5 w-1.5 rounded-full", met ? "bg-emerald-600" : "bg-stone-300")} />
      {text}
    </div>
  );
}

function inputClass(hasError = false, withLeftPadding = false, isSuccess = false) {
  return cx(
    "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:ring-4 focus:ring-zinc-950/5",
    withLeftPadding && "pl-7",
    isSuccess ? "border-emerald-600" : hasError ? "border-red-600 focus:border-red-600" : "border-stone-300 focus:border-zinc-950"
  );
}
