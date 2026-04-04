import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const TAKEN_USERNAMES = [
  "rohan",
  "priya",
  "admin",
  "clocked",
  "aarav",
  "mehak",
  "neel",
  "samarth",
  "user",
  "test",
  "raj",
  "ananya",
];

const disclaimerItems = [
  {
    id: 1,
    title: "I am 18 years or older",
    body: "I confirm I am of legal adult age. This platform is not for minors.",
  },
  {
    id: 2,
    title: "All flags I post are based on genuine personal experience",
    body: "I will only flag people I have actually interacted with directly.",
  },
  {
    id: 3,
    title: "I take full legal responsibility for every flag I post",
    body: "Posting false or malicious content makes me solely legally liable — not Clocked.",
  },
  {
    id: 4,
    title: "I will not use this platform to harass or stalk anyone",
    body: "Coordinated harassment and mass flagging will result in permanent removal.",
  },
  {
    id: 5,
    title: "I understand all flags are opinion-based, not verified facts",
    body: "Flags represent individual experiences — not legal judgements.",
  },
  {
    id: 6,
    title: "I agree to the Terms of Service and Privacy Policy",
    body: "I have read Clocked's Terms, Privacy Policy, and Community Guidelines.",
  },
];

const communityStats = [
  { value: "12.8k", label: "handles searched", tone: "text-zinc-950" },
  { value: "4.2k", label: "red flags dropped", tone: "text-red-600" },
  { value: "8.9k", label: "green flags dropped", tone: "text-emerald-600" },
  { value: "94", label: "joined today", tone: "text-zinc-950" },
];

const testimonials = [
  {
    quote:
      "Checked his handle before the second date. Found 3 red flags from different girls. Saved myself weeks of drama.",
    name: "Nisha R.",
    city: "Mumbai · Dating",
    avatar: "N",
    avatarClass: "bg-red-600",
    tag: "🚩 Red flag",
    tagClass: "bg-red-50 text-red-600",
  },
  {
    quote:
      "Bought from a seller and she was amazing. Left her a green flag so others know she's legit. This should've existed years ago.",
    name: "Arjun M.",
    city: "Delhi · Seller",
    avatar: "A",
    avatarClass: "bg-emerald-600",
    tag: "🟢 Green flag",
    tagClass: "bg-emerald-50 text-emerald-600",
  },
  {
    quote:
      "Shared my Flag Me card on stories. Got 31 green flags and 2 red ones. The red ones were my exes, obviously.",
    name: "Shreya K.",
    city: "Bangalore · Creator",
    avatar: "S",
    avatarClass: "bg-violet-600",
    tag: "🟢 Flag Me",
    tagClass: "bg-emerald-50 text-emerald-600",
  },
];

const whyJoinItems = [
  {
    icon: "🔍",
    title: "Search before you invest",
    text: "See community flags before a first date, shaadi meeting, or business deal.",
  },
  {
    icon: "🎭",
    title: "Post anonymously",
    text: "Your identity is protected by default. Nobody sees who flagged whom.",
  },
  {
    icon: "⚖️",
    title: "Always fair",
    text: "Every flagged person can post their own perspective. Two sides, always.",
  },
  {
    icon: "🔔",
    title: "Get notified",
    text: "Someone searched your handle? You'll know — and you can respond.",
  },
];

const reasonsToClock = [
  {
    icon: "💔",
    title: "Got ghosted",
    text: "Disappeared after weeks of talking. Left on read, no closure, nothing.",
  },
  {
    icon: "🚨",
    title: "Spotted a red flag",
    text: "Love bombing, fake profiles, catfishing — warn others before they find out the hard way.",
  },
  {
    icon: "🟢",
    title: "Someone was genuinely great",
    text: "Good people deserve receipts too. Green flags matter just as much.",
  },
  {
    icon: "🛍️",
    title: "Bad seller or buyer",
    text: "Scammed, misled, terrible experience — the community deserves to know.",
  },
];

type IdentityChoice = "anon" | "named";
type UsernameStatus = "idle" | "checking" | "available" | "taken";

const stepLabels = ["Account", "Identity", "Agree", "Notify"];

function classNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

function getPasswordStrength(password) {
  if (!password) {
    return null;
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const levels = [
    { width: "15%", label: "Too weak", bar: "bg-red-600", text: "text-red-600" },
    { width: "30%", label: "Weak", bar: "bg-red-600", text: "text-red-600" },
    { width: "55%", label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
    { width: "78%", label: "Good", bar: "bg-blue-500", text: "text-blue-600" },
    { width: "100%", label: "Strong 💪", bar: "bg-emerald-600", text: "text-emerald-600" },
  ];

  return levels[Math.min(score, 4)];
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
    console.error('❌ Signup API Error:', error.message);
    throw error;
  }
}

export default function SignupPage() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [identityChoice, setIdentityChoice] = useState("anon");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [disclaimers, setDisclaimers] = useState([true, false, false, false, false, false]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pushState, setPushState] = useState("idle");
  const [error, setError] = useState("");

  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordStrength = getPasswordStrength(password);
  const passwordIsValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const usernameIsValid = normalizedUsername.length >= 3 && usernameStatus === "available";
  const stepOneReady = usernameIsValid && emailIsValid && passwordIsValid && passwordsMatch;
  const disclaimersAcceptedCount = disclaimers.filter(Boolean).length;
  const disclaimersComplete = disclaimersAcceptedCount === disclaimerItems.length;

  useEffect(() => {
    if (normalizedUsername.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");

    const timer = window.setTimeout(() => {
      if (TAKEN_USERNAMES.includes(normalizedUsername)) {
        setUsernameStatus("taken");
      } else {
        setUsernameStatus("available");
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [normalizedUsername]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const usernameStatusText = useMemo(() => {
    if (usernameStatus === "checking") return `Checking @${normalizedUsername}...`;
    if (usernameStatus === "available") return `@${normalizedUsername} is available!`;
    if (usernameStatus === "taken") return `@${normalizedUsername} is already taken`;
    return "";
  }, [normalizedUsername, usernameStatus]);

  const usernameStatusClass =
    usernameStatus === "available"
      ? "text-emerald-600"
      : usernameStatus === "taken"
        ? "text-red-600"
        : "text-zinc-400";

  const usernameDotClass =
    usernameStatus === "available"
      ? "bg-emerald-600"
      : usernameStatus === "taken"
        ? "bg-red-600"
        : "bg-zinc-400 animate-pulse";

  const usernameError = usernameTouched && !usernameIsValid;
  const emailError = emailTouched && !emailIsValid;
  const passwordError = passwordTouched && !passwordIsValid;
  const confirmPasswordError = confirmPasswordTouched && !passwordsMatch;

  function handleStepOneContinue() {
    setUsernameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    if (!stepOneReady) return;
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleToggleDisclaimer(index) {
    setDisclaimers((current) => current.map((item, idx) => (idx === index ? !item : item)));
  }

  async function handleCreateAccount() {
    if (!disclaimersComplete) return;

    setSubmitLoading(true);
    setError("");

    try {
      const response = await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username: normalizedUsername,
          email: email.trim(),
          password: password,
          instagram_handle: instagramHandle.trim() || null,
          default_identity: identityChoice,
          disclaimers_accepted: disclaimers
        }),
      });

      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleAskPushPermission() {
    if (!("Notification" in window)) {
      setPushState("denied");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      setPushState("granted");
      return;
    }

    if (permission === "denied") {
      setPushState("denied");
      return;
    }

    navigate("/discover");
  }

  function handleFinish() {
    navigate("/discover");
  }

  const progressWidth = `${(disclaimersAcceptedCount / disclaimerItems.length) * 100}%`;

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-950">
      <nav className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-zinc-950">
            <span className="flex items-center gap-1">
              <span className="block h-4 w-2.5 bg-red-600 [clip-path:polygon(0_0,100%_15%,100%_85%,0_100%)]" />
              <span className="block h-4 w-2.5 bg-emerald-600 [clip-path:polygon(0_0,100%_15%,100%_85%,0_100%)]" />
            </span>
            Clocked
          </Link>
          <span className="text-sm text-zinc-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-zinc-950 hover:underline">
              Log in →
            </Link>
          </span>
        </div>
      </nav>

      {/* Error Message */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-red-600">❌</span>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[1fr_420px_1fr] lg:px-8 lg:py-12">
        <aside className="order-3 lg:order-1">
          <InfoCard title="📊 Community so far">
            <div className="grid grid-cols-2 gap-2">
              {communityStats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-stone-200 bg-stone-100 px-3 py-4 text-center">
                  <div className={classNames("mb-1 text-2xl font-extrabold leading-none tracking-tight", stat.tone)}>{stat.value}</div>
                  <div className="text-xs leading-4 text-zinc-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="💬 What people are saying">
            <div className="space-y-2">
              {testimonials.map((item) => (
                <div key={item.quote} className="rounded-xl border border-stone-200 bg-stone-100 p-4">
                  <p className="mb-3 text-sm italic leading-6 text-zinc-600">"{item.quote}"</p>
                  <div className="flex items-center gap-2">
                    <div className={classNames("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white", item.avatarClass)}>
                      {item.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-950">{item.name}</div>
                      <div className="text-[11px] text-zinc-500">{item.city}</div>
                    </div>
                    <span className={classNames("ml-auto rounded-full px-2 py-1 text-[11px] font-semibold", item.tagClass)}>{item.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>

          <div className="rounded-2xl bg-zinc-950 p-5 text-center text-white">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">After you sign up</div>
            <div className="mb-4 rounded-xl bg-stone-50 p-4 text-zinc-950">
              <div className="mb-2 text-sm font-extrabold">@yourhandle</div>
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[conic-gradient(#16a34a_0%_72%,#dc2626_72%_100%)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-50 text-xs font-extrabold">72%</div>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs font-semibold">
                <span className="text-red-600">🚩 4 red</span>
                <span className="text-emerald-600">🟢 11 green</span>
              </div>
            </div>
            <p className="text-sm leading-6 text-white/50">
              <span className="mb-1 block text-sm font-semibold text-white">Generate your Vibe Card</span>
              Share to stories. Let the community flag you. See how people really see you.
            </p>
          </div>
        </aside>

        <main className="order-1 lg:order-2">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Create account</div>
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-zinc-950">Join the community.</h1>
          <p className="mb-8 text-sm leading-6 text-zinc-600">Drop flags. See receipts. Know the vibe before you invest.</p>

          <StepBar currentStep={currentStep} />

          {currentStep === 1 && (
            <section>
              <Card title="Account details" icon="✉️">
                <Field label="Choose a username">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-zinc-400">@</span>
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      onBlur={() => setUsernameTouched(true)}
                      type="text"
                      placeholder="yourname"
                      className={inputClassName(usernameError, true)}
                    />
                  </div>

                  {usernameStatus !== "idle" && (
                    <div className={classNames("mt-2 flex items-center gap-2 text-xs font-medium", usernameStatusClass)}>
                      <span className={classNames("h-2 w-2 rounded-full", usernameDotClass)} />
                      <span>{usernameStatusText}</span>
                    </div>
                  )}

                  {usernameError && (
                    <p className="mt-1 text-xs text-red-600">Pick a username — at least 3 characters and available.</p>
                  )}
                  <p className="mt-1 text-xs text-zinc-400">✦ Shown only when you choose to post publicly.</p>
                </Field>

                <Field label="Email address">
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    type="email"
                    placeholder="you@example.com"
                    className={inputClassName(emailError)}
                  />
                  {emailError && <p className="mt-1 text-xs text-red-600">Please enter a valid email address.</p>}
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onBlur={() => setPasswordTouched(true)}
                      type={showPassword ? "text" : "password"}
                      placeholder="minimum 8 characters"
                      className={inputClassName(passwordError)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 transition hover:text-zinc-950"
                    >
                      {showPassword ? "hide" : "show"}
                    </button>
                  </div>
                  {passwordStrength && (
                    <div className="mt-2">
                      <div className="mb-1 h-1 overflow-hidden rounded bg-stone-200">
                        <div className={classNames("h-full rounded", passwordStrength.bar)} style={{ width: passwordStrength.width }} />
                      </div>
                      <div className={classNames("text-[11px] font-semibold", passwordStrength.text)}>{passwordStrength.label}</div>
                    </div>
                  )}
                  {passwordError && <p className="mt-1 text-xs text-red-600">Must be at least 8 characters.</p>}
                </Field>

                <Field label="Confirm password">
                  <div className="relative">
                    <input
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      onBlur={() => setConfirmPasswordTouched(true)}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="repeat your password"
                      className={inputClassName(confirmPasswordError)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 transition hover:text-zinc-950"
                    >
                      {showConfirmPassword ? "hide" : "show"}
                    </button>
                  </div>
                  {confirmPasswordError && <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>}
                </Field>

                <Field label={<span>Instagram handle <span className="font-normal text-zinc-400">(optional)</span></span>} noMargin>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-zinc-400">@</span>
                    <input
                      value={instagramHandle}
                      onChange={(event) => setInstagramHandle(event.target.value)}
                      type="text"
                      placeholder="instagram_handle"
                      className={inputClassName(false, true)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">ℹ️ Linking Instagram increases your credibility score.</p>
                </Field>
              </Card>

              <button
                type="button"
                onClick={handleStepOneContinue}
                className={classNames(
                  "w-full rounded-xl px-4 py-3 text-base font-extrabold tracking-tight transition",
                  stepOneReady ? "bg-zinc-950 text-white hover:bg-zinc-800" : "cursor-not-allowed bg-zinc-950/35 text-white"
                )}
              >
                Continue →
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-zinc-400">
                Your email is never shown publicly. <Link to="/privacy" className="text-zinc-600 underline">Privacy Policy</Link>
              </p>
            </section>
          )}

          {currentStep === 2 && (
            <section>
              <Card title="How do you want to post?" icon="🎭">
                <p className="mb-4 text-sm leading-6 text-zinc-600">This is your default. You can change it on every individual flag you drop.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setIdentityChoice("anon")}
                    className={classNames(
                      "relative rounded-xl border p-4 text-center transition",
                      identityChoice === "anon"
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-stone-300 bg-stone-100 text-zinc-950 hover:border-zinc-400"
                    )}
                  >
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-950 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                      Default
                    </span>
                    <div className="mb-2 text-2xl">🎭</div>
                    <div className="mb-1 text-sm font-extrabold">Anonymous</div>
                    <div className={classNames("text-xs leading-5", identityChoice === "anon" ? "text-white/60" : "text-zinc-500")}>
                      Your @handle never shows on flags
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIdentityChoice("named")}
                    className={classNames(
                      "rounded-xl border p-4 text-center transition",
                      identityChoice === "named"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-stone-300 bg-stone-100 text-zinc-950 hover:border-zinc-400"
                    )}
                  >
                    <div className="mb-2 text-2xl">✋</div>
                    <div className="mb-1 text-sm font-extrabold">With my handle</div>
                    <div className={classNames("text-xs leading-5", identityChoice === "named" ? "text-emerald-700/80" : "text-zinc-500")}>
                      Your @handle shows on flags you post
                    </div>
                  </button>
                </div>
              </Card>

              <div className="mb-4 rounded-2xl border border-stone-200 bg-stone-100 p-5">
                <p className="text-sm leading-6 text-zinc-600">
                  <span className="mb-1 block font-semibold text-zinc-950">🔒 You can always change per flag</span>
                  Even if you pick Anonymous as default, you can post with your handle on any specific flag — and vice versa.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-xl border border-stone-300 bg-stone-100 px-5 py-3 text-sm font-extrabold text-zinc-950 transition hover:bg-stone-200"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 rounded-xl bg-zinc-950 px-4 py-3 text-base font-extrabold tracking-tight text-white transition hover:bg-zinc-800"
                >
                  Continue to disclaimers →
                </button>
              </div>
            </section>
          )}

          {currentStep === 3 && (
            <section>
              <Card title="Read this carefully before joining" icon="⚖️">
                <p className="mb-5 text-sm leading-6 text-zinc-600">Tick every box individually. All 6 required to create your account.</p>
                <div className="space-y-2">
                  {disclaimerItems.map((item, index) => {
                    const checked = disclaimers[index];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleDisclaimer(index)}
                        className={classNames(
                          "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                          checked
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-stone-200 bg-stone-100 hover:border-stone-300 hover:bg-stone-200"
                        )}
                      >
                        <span className={classNames("mt-1 w-4 text-center text-[11px] font-extrabold", checked ? "text-emerald-600" : "text-zinc-400")}>
                          {String(item.id).padStart(2, "0")}
                        </span>
                        <span
                          className={classNames(
                            "mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border text-xs font-bold",
                            checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-300 bg-white text-transparent"
                          )}
                        >
                          ✓
                        </span>
                        <span className="flex-1">
                          <span className={classNames("mb-1 block text-sm font-semibold", checked ? "text-emerald-700" : "text-zinc-950")}>{item.title}</span>
                          <span className={classNames("block text-sm leading-6", checked ? "text-zinc-950" : "text-zinc-600")}>{item.body}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <div className="h-1 flex-1 overflow-hidden rounded bg-stone-200">
                    <div className="h-full rounded bg-emerald-600 transition-all" style={{ width: progressWidth }} />
                  </div>
                  <span className="min-w-[44px] text-right text-xs text-zinc-400">{disclaimersAcceptedCount} / 6</span>
                </div>
              </Card>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="rounded-xl border border-stone-300 bg-stone-100 px-5 py-3 text-sm font-extrabold text-zinc-950 transition hover:bg-stone-200"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={!disclaimersComplete || submitLoading}
                  className={classNames(
                    "flex-1 rounded-xl px-4 py-3 text-base font-extrabold tracking-tight text-white transition",
                    disclaimersComplete && !submitLoading ? "bg-zinc-950 hover:bg-zinc-800" : "cursor-not-allowed bg-zinc-950/35"
                  )}
                >
                  {submitLoading ? "Creating account..." : "Create my account →"}
                </button>
              </div>
              <p className="mt-3 text-center text-xs leading-5 text-zinc-400">
                By joining you take full legal responsibility for your content. <Link to="/grievance" className="text-zinc-600 underline">Takedown requests</Link>
              </p>
            </section>
          )}

          {currentStep === 4 && (
            <section>
              <Card title="Stay in the loop." icon="🔔">
                <div className="pb-5 text-center">
                  <div className="mb-3 text-5xl">🔔</div>
                  <div className="mb-2 text-xl font-extrabold tracking-tight text-zinc-950">Stay in the loop.</div>
                  <p className="mx-auto max-w-sm text-sm leading-6 text-zinc-600">
                    Get instant push notifications when someone searches your handle, drops a flag on you, or your watched handles get new receipts.
                  </p>
                </div>

                <div className="mb-6 space-y-2">
                  {[
                    ["👀", "Someone searched you", "know instantly, with reason"],
                    ["🚩", "New flag on your handle", "red or green, right away"],
                    ["👁", "Watched handle activity", "new flags on handles you follow"],
                    ["⚡", "Challenge mode live counter", "real-time during your 48h window"],
                  ].map(([icon, title, text]) => (
                    <div key={title} className="flex items-center gap-3 rounded-xl bg-stone-100 px-4 py-3 text-sm text-zinc-950">
                      <span className="text-base">{icon}</span>
                      <div>
                        <span className="font-semibold">{title}</span> — {text}
                      </div>
                    </div>
                  ))}
                </div>

                {pushState === "idle" && (
                  <>
                    <button
                      type="button"
                      onClick={handleAskPushPermission}
                      className="mb-2 w-full rounded-xl bg-zinc-950 px-4 py-3 text-base font-extrabold tracking-tight text-white transition hover:bg-zinc-800"
                    >
                      🔔 Enable push notifications
                    </button>
                    <button
                      type="button"
                      onClick={handleFinish}
                      className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium text-zinc-600 transition hover:bg-stone-100"
                    >
                      Skip for now — I'll enable later
                    </button>
                    <p className="mt-3 text-center text-xs leading-5 text-zinc-400">
                      You can change this anytime in Dashboard → Settings. Push is optional.
                    </p>
                  </>
                )}

                {pushState === "granted" && (
                  <div className="text-center">
                    <div className="mb-2 text-4xl">✅</div>
                    <div className="mb-2 text-base font-bold text-emerald-600">Push notifications enabled!</div>
                    <p className="mb-4 text-sm text-zinc-600">You're all set. We'll notify you the moment something happens on your handle.</p>
                    <button
                      type="button"
                      onClick={handleFinish}
                      className="rounded-xl bg-zinc-950 px-8 py-3 text-base font-extrabold tracking-tight text-white transition hover:bg-zinc-800"
                    >
                      Enter Clocked →
                    </button>
                  </div>
                )}

                {pushState === "denied" && (
                  <div>
                    <div className="mb-4 rounded-xl border border-stone-200 bg-stone-100 px-4 py-3 text-sm leading-6 text-zinc-600">
                      ⚠️ Notifications are blocked right now. You can enable them later from your browser settings or inside the app.
                    </div>
                    <button
                      type="button"
                      onClick={handleFinish}
                      className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-base font-extrabold tracking-tight text-white transition hover:bg-zinc-800"
                    >
                      Continue anyway →
                    </button>
                  </div>
                )}
              </Card>

              <button type="button" onClick={() => setCurrentStep(3)} className="mt-3 text-sm text-zinc-500 hover:text-zinc-950">
                ← Back
              </button>
            </section>
          )}
        </main>

        <aside className="order-2 lg:order-3">
          <InfoCard title="Why join Clocked?">
            <div className="space-y-3">
              {whyJoinItems.map((item) => (
                <WhyRow key={item.title} icon={item.icon} title={item.title} text={item.text} />
              ))}
            </div>
          </InfoCard>

          <InfoCard title="🔒 Your privacy">
            <p className="text-sm font-medium leading-7 text-zinc-950">
              We only store your email and password securely. Your Instagram handle is optional. We <strong>never</strong> sell your data, run ads, or share your identity with anyone — <strong>ever.</strong>
            </p>
          </InfoCard>

          <InfoCard title="🤔 Why do people Clock someone?">
            <div className="space-y-3">
              {reasonsToClock.map((item) => (
                <WhyRow key={item.title} icon={item.icon} title={item.title} text={item.text} />
              ))}
            </div>
          </InfoCard>

          <div className="rounded-2xl bg-zinc-950 p-5">
            <div className="mb-1 text-base font-bold text-white">🎉 It's actually fun</div>
            <p className="text-sm leading-6 text-white/50">
              Clocked isn't just red flags. It's where people share real experiences — good and bad. Green flags, unexpected praise, honest opinions. The internet being actually honest for once.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepBar({ currentStep }) {
  return (
    <div className="mb-8 flex items-center pb-6">
      {stepLabels.map((label, index) => {
        const stepNumber = index + 1;
        const done = stepNumber < currentStep;
        const active = stepNumber === currentStep;

        return (
          <React.Fragment key={label}>
            <div className="relative flex-shrink-0">
              <div
                className={classNames(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-extrabold transition",
                  done
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : active
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-stone-300 bg-white text-zinc-400"
                )}
              >
                {stepNumber}
              </div>
              <div className={classNames("absolute left-1/2 top-10 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium", active ? "text-zinc-950" : done ? "text-emerald-600" : "text-zinc-400")}>
                {label}
              </div>
            </div>
            {index < stepLabels.length - 1 && (
              <div className={classNames("h-px flex-1", done ? "bg-emerald-600" : "bg-stone-200")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="mb-3 rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">{title}</div>
      {children}
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-6">
      <div className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-950">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-sm">{icon}</div>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  noMargin = false,
}) {
  return (
    <div className={classNames(noMargin ? "" : "mb-4")}>
      <label className="mb-1 block text-xs font-medium text-zinc-600">{label}</label>
      {children}
    </div>
  );
}

function WhyRow({ icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-stone-100 text-sm">{icon}</div>
      <div className="text-sm leading-6 text-zinc-600">
        <span className="block font-medium text-zinc-950">{title}</span>
        {text}
      </div>
    </div>
  );
}

function inputClassName(hasError, withLeadingIcon = false) {
  return classNames(
    "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:ring-4 focus:ring-zinc-950/5",
    withLeadingIcon && "pl-7",
    hasError ? "border-red-600 focus:border-red-600" : "border-stone-300 focus:border-zinc-950"
  );
}
