import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const STATS = [
  { value: "12.8k", label: "handles searched", tone: "black" },
  { value: "4.2k", label: "red flags dropped", tone: "red" },
  { value: "8.9k", label: "green flags dropped", tone: "green" },
  { value: "94", label: "joined today", tone: "black" },
];

const TESTIMONIALS = [
  {
    quote:
      "Checked his handle before the second date. Found 3 red flags from different girls. Saved myself weeks of drama.",
    initial: "N",
    name: "Nisha R.",
    city: "Mumbai · Dating",
    flag: "🚩 Red flag",
    flagTone: "r",
    avatarBg: "#E2353A",
  },
  {
    quote:
      "Bought from a seller and she was amazing. Left her a green flag so others know she're legit. This should've existed years ago.",
    initial: "A",
    name: "Arjun M.",
    city: "Delhi · Seller",
    flag: "🟢 Green flag",
    flagTone: "g",
    avatarBg: "#1A9E5F",
  },
  {
    quote:
      "Shared my Flag Me card on stories. Got 31 green flags and 2 red ones. The red ones were my exes, obviously.",
    initial: "S",
    name: "Shreya K.",
    city: "Bangalore · Creator",
    flag: "🟢 Flag Me",
    flagTone: "g",
    avatarBg: "#7C3AED",
  },
];

const DISCLAIMERS = [
  {
    title: "I am 18 years or older",
    text: "I confirm I am of legal adult age. This platform is not for minors.",
    defaultChecked: true,
  },
  {
    title: "All flags I post are based on genuine personal experience",
    text: "I will only flag people I have actually interacted with directly.",
  },
  {
    title: "I take full legal responsibility for every flag I post",
    text: "Posting false or malicious content makes me solely legally liable — not Clocked.",
  },
  {
    title: "I will not use this platform to harass or stalk anyone",
    text: "Coordinated harassment and mass flagging will result in permanent removal.",
  },
  {
    title: "I understand all flags are opinion-based, not verified facts",
    text: "Flags represent individual experiences — not legal judgements.",
  },
  {
    title: "I agree to the Terms of Service and Privacy Policy",
    text: "I have read Clocked's Terms, Privacy Policy, and Community Guidelines.",
  },
];

const IDENTITY_MAP = {
  anon: "anonymous",
  named: "named",
};

const cx = (...args) => args.filter(Boolean).join(" ");

const initialDisclaimerState = DISCLAIMERS.map((item) => Boolean(item.defaultChecked));

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? data.message
        : "Something went wrong.";
    throw new Error(message);
  }

  return data;
}

export default function ClockedSignupReact() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    instagram_handle: "",
    default_identity: "anon",
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const usernameTimer = useRef(null);

  const [disclaimers, setDisclaimers] = useState(initialDisclaimerState);

  const [pushState, setPushState] = useState("ask");
  const [signupResult, setSignupResult] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    return () => {
      if (usernameTimer.current) {
        window.clearTimeout(usernameTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!resendCooldown) return undefined;
    const interval = window.setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [resendCooldown]);

  const cleanedUsername = form.username.trim().replace(/^@/, "").toLowerCase();
  const cleanedInstagram = form.instagram_handle.trim().replace(/^@/, "").toLowerCase();
  const cleanedEmail = form.email.trim().toLowerCase();

  const passwordStrength = useMemo(() => {
    const pw = form.password;
    if (!pw.length) return null;

    let score = 0;
    if (pw.length >= 8) score += 1;
    if (pw.length >= 12) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    return [
      { width: "15%", color: "#E2353A", label: "Too weak" },
      { width: "30%", color: "#E2353A", label: "Weak" },
      { width: "55%", color: "#F59E0B", label: "Fair" },
      { width: "78%", color: "#3B82F6", label: "Good" },
      { width: "100%", color: "#1A9E5F", label: "Strong 💪" },
    ][Math.min(score, 4)];
  }, [form.password]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail);
  const passwordValid = form.password.length >= 8;
  const passwordsMatch = form.password === form.confirmPassword && form.confirmPassword.length > 0;
  const usernameValidFormat = /^[a-z0-9_.]{3,30}$/.test(cleanedUsername);
  const usernameAvailable = usernameStatus === "available";
  const step1Ready = usernameAvailable && emailValid && passwordValid && passwordsMatch;
  const disclaimerCount = disclaimers.filter(Boolean).length;
  const canCreate = disclaimerCount === DISCLAIMERS.length;

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setGlobalError("");
  };

  useEffect(() => {
    if (usernameTimer.current) {
      window.clearTimeout(usernameTimer.current);
    }

    if (!cleanedUsername.length) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (!usernameValidFormat) {
      setUsernameStatus("taken");
      setUsernameMessage("Use 3–30 lowercase letters, numbers, underscores, or dots.");
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage("Checking availability...");

    usernameTimer.current = window.setTimeout(async () => {
      try {
        const data = await apiRequest(`http://localhost:5004/api/auth/check-username?username=${encodeURIComponent(cleanedUsername)}`);
        if (data.available) {
          setUsernameStatus("available");
          setUsernameMessage(`@${cleanedUsername} is available!`);
        } else {
          setUsernameStatus("taken");
          setUsernameMessage(data.message || `@${cleanedUsername} is already taken`);
        }
      } catch (error) {
        setUsernameStatus("taken");
        setUsernameMessage(error.message || "Unable to verify username right now.");
      }
    }, 500);
  }, [cleanedUsername, usernameValidFormat]);

  const validateStep1 = () => {
    const nextErrors = {};

    if (!usernameAvailable) {
      nextErrors.username = usernameValidFormat
        ? "Please choose an available username."
        : "Pick a valid username — at least 3 characters.";
    }

    if (!emailValid) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!passwordValid) {
      nextErrors.password = "Must be at least 8 characters.";
    }

    if (!passwordsMatch) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const goStep2 = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const submitSignup = async () => {
    if (!canCreate) return;

    setLoading(true);
    setGlobalError("");

    const payload = {
      email: cleanedEmail,
      username: cleanedUsername,
      password: form.password,
      instagram_handle: cleanedInstagram || undefined, // Use undefined instead of null
      default_identity: IDENTITY_MAP[form.default_identity],
      me_misunderstood: 'People think I am quiet, but I am just observing',
      me_pride: 'I am proud of my creativity and problem-solving skills'
    };

    try {
      console.log('Submitting signup with payload:', payload);
      const data = await apiRequest("http://localhost:5004/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log('Signup response:', data);

      // Store token and user data using AuthContext
      if (data.token && data.user) {
        loginWithToken(data.user, data.token);
        // Redirect to dashboard immediately after successful signup
        navigate('/dashboard');
        return;
      }

      // Fallback to original flow if no token
      setSignupResult({
        email: data.email || cleanedEmail,
        username: data.username || cleanedUsername,
      });
      setStep(4);
      setPushState("ask");
    } catch (error) {
      console.error('Signup error:', error);
      console.error('Error response:', error.response);
      setGlobalError(error.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  const finishSignup = () => {
    setStep(5);
  };

  const askPushPermission = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      finishSignup();
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        setPushState("granted");

        try {
          await apiRequest("/api/push/preferences", {
            method: "PATCH",
            body: JSON.stringify({
              enabled: true,
              permission: "granted",
            }),
          });
        } catch {
          // Preference save failure should not block the flow.
        }
      } else if (permission === "denied") {
        setPushState("denied");
        try {
          await apiRequest("/api/push/preferences", {
            method: "PATCH",
            body: JSON.stringify({
              enabled: false,
              permission: "denied",
            }),
          });
        } catch {
          // Ignore silent preference save failure.
        }
      } else {
        finishSignup();
      }
    } catch {
      finishSignup();
    }
  };

  const resendVerify = async () => {
    if (resendCooldown > 0 || !signupResult?.email) return;
    try {
      await apiRequest("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: signupResult.email }),
      });
      setResendCooldown(60);
    } catch (error) {
      setGlobalError(error.message || "Could not resend verification email.");
    }
  };

  const toggleDisclaimer = (index) => {
    setDisclaimers((current) => current.map((item, i) => (i === index ? !item : item)));
  };

  const displayHandle = signupResult?.username ? `@${signupResult.username}` : `@${cleanedUsername || "friend"}`;
  const displayEmail = signupResult?.email || cleanedEmail || "you@example.com";

  return (
    <div className="clocked-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html { font-size: 16px; }
        body { margin: 0; font-family: 'DM Sans', sans-serif; background: #F8F7F3; color: #0C0C0A; }
        a { color: inherit; }
        .clocked-app { min-height: 100vh; background: #F8F7F3; color: #0C0C0A; }
        .shell { min-height: 100vh; display: flex; flex-direction: column; }
        nav { height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; background: #FFFFFF; border-bottom: 1px solid #E5E4DE; flex-shrink: 0; }
        .nav-logo { font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 800; letter-spacing: -.5px; color: #0C0C0A; text-decoration: none; display: flex; align-items: center; gap: 8px; }
        .logo-flags { display: flex; gap: 4px; align-items: center; }
        .flag-shape { width: 9px; height: 15px; clip-path: polygon(0 0,100% 15%,100% 85%,0 100%); display: block; }
        .flag-r { background: #E2353A; }
        .flag-g { background: #1A9E5F; }
        .nav-link { font-size: .82rem; color: #5E5D58; }
        .nav-link a { color: #0C0C0A; font-weight: 500; text-decoration: none; }
        .page { flex: 1; display: grid; grid-template-columns: 1fr 420px 1fr; padding: 3rem 2rem; max-width: 1160px; margin: 0 auto; width: 100%; gap: 2.5rem; }
        .left-col, .form-col, .side-col { min-width: 0; }
        .form-eyebrow { font-size: .7rem; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #9E9D97; margin-bottom: .5rem; }
        .form-title { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; letter-spacing: -1px; color: #0C0C0A; margin-bottom: .4rem; line-height: 1.1; }
        .form-sub { font-size: .85rem; color: #5E5D58; line-height: 1.55; margin-bottom: 2rem; }
        .steps { display: flex; align-items: center; margin-bottom: 2rem; position: relative; padding-bottom: 24px; }
        .step-dot { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: .72rem; font-weight: 700; border: 1.5px solid #CCCBC4; color: #9E9D97; background: #FFFFFF; flex-shrink: 0; position: relative; z-index: 1; }
        .step-dot.active { background: #0C0C0A; border-color: #0C0C0A; color: #FFFFFF; }
        .step-dot.done { background: #1A9E5F; border-color: #1A9E5F; color: #FFFFFF; }
        .step-label { position: absolute; top: 36px; left: 50%; transform: translateX(-50%); font-size: .62rem; color: #9E9D97; white-space: nowrap; font-weight: 500; }
        .step-dot.active .step-label { color: #0C0C0A; font-weight: 600; }
        .step-dot.done .step-label { color: #1A9E5F; }
        .step-line { flex: 1; height: 1.5px; background: #E5E4DE; }
        .step-line.done { background: #1A9E5F; }
        .card { background: #FFFFFF; border: 1px solid #E5E4DE; border-radius: 14px; padding: 1.75rem; margin-bottom: 1rem; }
        .card-title { font-family: 'Syne', sans-serif; font-size: .95rem; font-weight: 700; color: #0C0C0A; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 8px; }
        .card-icon { width: 28px; height: 28px; border-radius: 8px; background: #F2F1EC; display: flex; align-items: center; justify-content: center; font-size: .9rem; }
        .field { margin-bottom: 1rem; }
        .field:last-child { margin-bottom: 0; }
        label { display: block; font-size: .78rem; font-weight: 500; color: #5E5D58; margin-bottom: 5px; }
        .input-wrap { position: relative; }
        input[type="email"], input[type="password"], input[type="text"] { width: 100%; font-family: 'DM Sans', sans-serif; font-size: .95rem; border: 1.5px solid #CCCBC4; border-radius: 8px; padding: 11px 14px; background: #FFFFFF; color: #0C0C0A; outline: none; transition: border-color .15s, box-shadow .15s; }
        input:focus { border-color: #0C0C0A; box-shadow: 0 0 0 3px rgba(0,0,0,.05); }
        input::placeholder { color: #9E9D97; font-size: .9rem; }
        input.error { border-color: #E2353A; }
        .input-prefix { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #9E9D97; font-weight: 700; font-family: 'Syne', sans-serif; font-size: .9rem; }
        .pw-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9E9D97; font-size: .78rem; font-family: 'DM Sans', sans-serif; font-weight: 500; padding: 4px; }
        .field-error { font-size: .72rem; color: #E2353A; margin-top: 4px; }
        .field-hint { font-size: .72rem; color: #9E9D97; margin-top: 4px; }
        .uname-status { display: flex; align-items: center; gap: 6px; margin-top: 5px; font-size: .73rem; font-weight: 500; }
        .uname-status.idle { display: none; }
        .uname-status.checking { color: #9E9D97; }
        .uname-status.available { color: #1A9E5F; }
        .uname-status.taken { color: #E2353A; }
        .uname-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .uname-status.checking .uname-dot { background: #9E9D97; animation: blink 1s infinite; }
        .uname-status.available .uname-dot { background: #1A9E5F; }
        .uname-status.taken .uname-dot { background: #E2353A; }
        .pw-strength { margin-top: 7px; }
        .pw-track { height: 3px; background: #E5E4DE; border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
        .pw-fill { height: 100%; border-radius: 2px; transition: width .35s, background .35s; }
        .pw-label { font-size: .68rem; font-weight: 600; }
        .identity-sub { font-size: .78rem; color: #5E5D58; margin-bottom: 1.1rem; line-height: 1.5; }
        .identity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .identity-opt { border: 1.5px solid #CCCBC4; border-radius: 8px; padding: 14px 12px; cursor: pointer; text-align: center; background: #F2F1EC; position: relative; user-select: none; }
        .identity-opt.sel-anon { border-color: #0C0C0A; background: #0C0C0A; }
        .identity-opt.sel-named { border-color: #1A9E5F; background: #F0FFF8; }
        .default-badge { position: absolute; top: -9px; left: 50%; transform: translateX(-50%); background: #0C0C0A; color: #FFFFFF; font-size: .58rem; font-weight: 700; letter-spacing: .5px; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
        .identity-opt.sel-anon .default-badge { background: #1A9E5F; }
        .opt-icon { font-size: 1.5rem; display: block; margin-bottom: 5px; }
        .opt-label { font-family: 'Syne', sans-serif; font-size: .83rem; font-weight: 700; display: block; margin-bottom: 3px; color: #0C0C0A; }
        .opt-desc { font-size: .68rem; color: #5E5D58; line-height: 1.35; }
        .identity-opt.sel-anon .opt-label { color: #FFFFFF; }
        .identity-opt.sel-anon .opt-desc { color: rgba(255,255,255,.5); }
        .identity-opt.sel-named .opt-label { color: #1A9E5F; }
        .identity-opt.sel-named .opt-desc { color: #1A9E5F; opacity: .7; }
        .disc-header { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 1.25rem; }
        .disc-icon { width: 38px; height: 38px; border-radius: 10px; background: #FFF0F0; border: 1px solid #FFBDBE; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
        .disc-title { font-family: 'Syne', sans-serif; font-size: .95rem; font-weight: 700; color: #0C0C0A; margin-bottom: 2px; }
        .disc-subtitle { font-size: .75rem; color: #5E5D58; line-height: 1.4; }
        .check-item { display: flex; align-items: flex-start; gap: 10px; padding: 11px 12px; border-radius: 8px; margin-bottom: 7px; cursor: pointer; border: 1.5px solid #E5E4DE; background: #F2F1EC; }
        .check-item.ticked { background: #F0FFF8; border-color: #A3E6C8; }
        .check-box { width: 20px; height: 20px; border-radius: 5px; border: 1.5px solid #CCCBC4; background: #FFFFFF; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; font-size: .75rem; color: transparent; }
        .check-item.ticked .check-box { background: #1A9E5F; border-color: #1A9E5F; color: #FFFFFF; }
        .check-num { font-family: 'Syne', sans-serif; font-size: .65rem; font-weight: 700; color: #9E9D97; flex-shrink: 0; margin-top: 3px; width: 16px; text-align: center; }
        .check-item.ticked .check-num { color: #1A9E5F; }
        .check-text { font-size: .8rem; color: #5E5D58; line-height: 1.45; flex: 1; }
        .check-text strong { color: #0C0C0A; font-weight: 600; display: block; margin-bottom: 1px; font-size: .82rem; }
        .disc-progress { display: flex; align-items: center; gap: 10px; margin-top: 1.1rem; }
        .disc-track { flex: 1; height: 4px; background: #E5E4DE; border-radius: 2px; overflow: hidden; }
        .disc-fill { height: 100%; background: #1A9E5F; border-radius: 2px; transition: width .3s; }
        .disc-count { font-size: .72rem; color: #9E9D97; white-space: nowrap; min-width: 40px; text-align: right; }
        .btn-row { display: flex; gap: 10px; }
        .back-btn { font-family: 'Syne', sans-serif; font-size: .9rem; font-weight: 700; background: #F2F1EC; color: #0C0C0A; border: 1px solid #CCCBC4; border-radius: 8px; padding: 14px 20px; cursor: pointer; flex-shrink: 0; }
        .submit-btn { width: 100%; font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: #FFFFFF; background: #0C0C0A; border: none; border-radius: 8px; padding: 14px; cursor: pointer; letter-spacing: -.3px; opacity: .35; pointer-events: none; flex: 1; }
        .submit-btn.ready { opacity: 1; pointer-events: auto; }
        .submit-note { text-align: center; font-size: .72rem; color: #9E9D97; margin-top: .75rem; line-height: 1.5; }
        .step-screen { display: none; }
        .step-screen.active { display: block; }
        .info-card { background: #FFFFFF; border: 1px solid #E5E4DE; border-radius: 14px; padding: 1.1rem 1.25rem; margin-bottom: 12px; }
        .info-title { font-family: 'Syne', sans-serif; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #9E9D97; margin-bottom: .9rem; }
        .stats-mini { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .stat-mini-card { background: #F2F1EC; border: 1px solid #E5E4DE; border-radius: 8px; padding: .85rem .75rem; text-align: center; }
        .stat-mini-num { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; display: block; line-height: 1; margin-bottom: 3px; }
        .stat-mini-label { font-size: .65rem; color: #9E9D97; line-height: 1.3; display: block; }
        .tone-black { color: #0C0C0A; }
        .tone-red { color: #E2353A; }
        .tone-green { color: #1A9E5F; }
        .testimonial { background: #F2F1EC; border: 1px solid #E5E4DE; border-radius: 8px; padding: .9rem 1rem; margin-bottom: 8px; }
        .testimonial:last-of-type { margin-bottom: 0; }
        .testi-quote { font-size: .78rem; color: #5E5D58; line-height: 1.5; margin-bottom: .6rem; font-style: italic; }
        .testi-footer { display: flex; align-items: center; gap: 8px; }
        .testi-avatar { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: .65rem; font-weight: 700; color: #FFFFFF; flex-shrink: 0; }
        .testi-name { font-size: .72rem; font-weight: 600; color: #0C0C0A; }
        .testi-city { font-size: .65rem; color: #9E9D97; }
        .testi-flag { margin-left: auto; font-size: .62rem; font-weight: 600; padding: 2px 7px; border-radius: 20px; white-space: nowrap; }
        .testi-flag.r { background: #FFF0F0; color: #E2353A; }
        .testi-flag.g { background: #F0FFF8; color: #1A9E5F; }
        .flagme-teaser, .black-card { background: #0C0C0A; border-radius: 14px; padding: 1.25rem; }
        .flagme-teaser { text-align: center; }
        .teaser-label { font-size: .62rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,.35); margin-bottom: .75rem; display: block; }
        .vibe-card-preview { background: #F8F7F3; border-radius: 10px; padding: .9rem; margin-bottom: 1rem; }
        .vibe-card-handle { font-family: 'Syne', sans-serif; font-size: .82rem; font-weight: 800; color: #0C0C0A; margin-bottom: .5rem; }
        .vibe-score-ring { width: 52px; height: 52px; border-radius: 50%; margin: 0 auto .5rem; display: flex; align-items: center; justify-content: center; background: conic-gradient(#1A9E5F 0% 72%, #E2353A 72% 100%); }
        .vibe-score-inner { width: 38px; height: 38px; border-radius: 50%; background: #F8F7F3; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: .72rem; font-weight: 800; color: #0C0C0A; }
        .vibe-flag-row { display: flex; justify-content: center; gap: 10px; font-size: .68rem; font-weight: 600; }
        .vibe-flag-r { color: #E2353A; }
        .vibe-flag-g { color: #1A9E5F; }
        .teaser-cta { font-size: .72rem; color: rgba(255,255,255,.45); line-height: 1.5; }
        .teaser-cta strong, .black-title { color: #FFFFFF; display: block; margin-bottom: 3px; font-size: .78rem; font-family: 'Syne', sans-serif; font-weight: 700; }
        .why-row-side { display: flex; flex-direction: column; gap: 10px; }
        .why-item-side { display: flex; gap: 10px; align-items: flex-start; }
        .why-bullet { width: 24px; height: 24px; border-radius: 7px; background: #F2F1EC; display: flex; align-items: center; justify-content: center; font-size: .8rem; flex-shrink: 0; }
        .why-text { font-size: .78rem; color: #5E5D58; line-height: 1.45; }
        .why-text strong { color: #0C0C0A; display: block; font-weight: 500; margin-bottom: 1px; }
        .black-title { font-size: .9rem; margin-bottom: 5px; }
        .black-text { font-size: .75rem; color: rgba(255,255,255,.5); line-height: 1.5; }
        .inline-stack { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.5rem; }
        .notify-item { display: flex; align-items: center; gap: 10px; background: #F2F1EC; border-radius: 8px; padding: .75rem 1rem; font-size: .82rem; color: #0C0C0A; }
        .muted-note { font-size: .72rem; color: #9E9D97; text-align: center; margin-top: .65rem; line-height: 1.5; }
        .success-wrap { text-align: center; padding: 2rem 1rem; }
        .success-title { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: #0C0C0A; margin-bottom: .35rem; letter-spacing: -.5px; }
        .success-handle { font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 700; color: #1A9E5F; margin-bottom: .9rem; display: block; }
        .success-sub { font-size: .88rem; color: #5E5D58; line-height: 1.55; margin-bottom: 1.1rem; }
        .go-btn { display: inline-flex; align-items: center; gap: 8px; background: #0C0C0A; color: #FFFFFF; font-family: 'Syne', sans-serif; font-size: .9rem; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; border: none; cursor: pointer; }
        .pill-email { background: #F2F1EC; border: 1px solid #E5E4DE; border-radius: 20px; padding: 5px 16px; font-size: .85rem; font-weight: 600; color: #0C0C0A; display: inline-block; margin-bottom: 1.25rem; }
        .status-box { background: #F2F1EC; border: 1px solid #E5E4DE; border-radius: 8px; padding: .85rem 1rem; font-size: .78rem; color: #5E5D58; line-height: 1.55; margin-bottom: 1rem; }
        .global-error { background: #FFF0F0; border: 1px solid #FFBDBE; color: #A61B1F; padding: 12px 14px; border-radius: 8px; font-size: .82rem; margin-bottom: 1rem; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
        @media (max-width: 900px) {
          .page { grid-template-columns: 1fr; padding: 2rem 1rem; gap: 0; }
          .left-col { order: 3; margin-top: 2rem; }
          .form-col { order: 1; }
          .side-col { order: 2; margin-top: 1.5rem; }
          .form-title { font-size: 1.65rem; }
          nav { padding: 0 1rem; }
        }
      `}</style>

      <div className="shell">
        <nav>
          <a href="/" className="nav-logo">
            <div className="logo-flags">
              <div className="flag-shape flag-r" />
              <div className="flag-shape flag-g" />
            </div>
            Clocked
          </a>
          <span className="nav-link">
            Already have an account? <a href="/login">Log in →</a>
          </span>
        </nav>

        <div className="page">
          <div className="left-col">
            <div className="info-card">
              <p className="info-title">📊 Community so far</p>
              <div className="stats-mini">
                {STATS.map((item) => (
                  <div key={item.label} className="stat-mini-card">
                    <span className={cx("stat-mini-num", `tone-${item.tone}`)}>{item.value}</span>
                    <span className="stat-mini-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-card">
              <p className="info-title">💬 What people are saying</p>
              {TESTIMONIALS.map((item) => (
                <div key={item.name} className="testimonial">
                  <p className="testi-quote">"{item.quote}"</p>
                  <div className="testi-footer">
                    <div className="testi-avatar" style={{ background: item.avatarBg }}>{item.initial}</div>
                    <div>
                      <div className="testi-name">{item.name}</div>
                      <div className="testi-city">{item.city}</div>
                    </div>
                    <span className={cx("testi-flag", item.flagTone)}>{item.flag}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flagme-teaser">
              <span className="teaser-label">After you sign up</span>
              <div className="vibe-card-preview">
                <div className="vibe-card-handle">@yourhandle</div>
                <div className="vibe-score-ring">
                  <div className="vibe-score-inner">72%</div>
                </div>
                <div className="vibe-flag-row">
                  <span className="vibe-flag-r">🚩 4 red</span>
                  <span className="vibe-flag-g">🟢 11 green</span>
                </div>
              </div>
              <div className="teaser-cta">
                <strong>Generate your Vibe Card</strong>
                Share to stories. Let the community flag you. See how people really see you.
              </div>
            </div>
          </div>

          <div className="form-col">
            <div className="form-eyebrow">Create account</div>
            <h1 className="form-title">Join the community.</h1>
            <p className="form-sub">Drop flags. See receipts. Know the vibe before you invest.</p>

            <div className="steps">
              {[1, 2, 3, 4].map((item, index) => (
                <React.Fragment key={item}>
                  <div className={cx("step-dot", step === item && "active", step > item && "done")}>
                    {item}
                    <span className="step-label">
                      {item === 1 ? "Account" : item === 2 ? "Identity" : item === 3 ? "Agree" : "Notify"}
                    </span>
                  </div>
                  {index < 3 && <div className={cx("step-line", step > index + 1 && "done")} />}
                </React.Fragment>
              ))}
            </div>

            {globalError ? <div className="global-error">{globalError}</div> : null}

            <div className={cx("step-screen", step === 1 && "active")}>
              <div className="card">
                <div className="card-title"><div className="card-icon">✉️</div> Account details</div>

                <div className="field">
                  <label htmlFor="username">Choose a username</label>
                  <div className="input-wrap">
                    <input
                      id="username"
                      type="text"
                      placeholder="yourname"
                      style={{ paddingLeft: 28 }}
                      value={form.username}
                      onChange={(e) => updateField("username", e.target.value)}
                      className={errors.username ? "error" : ""}
                    />
                    <span className="input-prefix">@</span>
                  </div>
                  <div className={cx("uname-status", usernameStatus)}>
                    <span className="uname-dot" />
                    <span>{usernameMessage}</span>
                  </div>
                  {errors.username ? <div className="field-error">{errors.username}</div> : null}
                  <div className="field-hint">✦ Shown only when you choose to post publicly.</div>
                </div>

                <div className="field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={errors.email ? "error" : ""}
                  />
                  {errors.email ? <div className="field-error">{errors.email}</div> : null}
                </div>

                <div className="field">
                  <label htmlFor="password">Password</label>
                  <PasswordInput
                    id="password"
                    value={form.password}
                    onChange={(value) => updateField("password", value)}
                    placeholder="minimum 8 characters"
                    error={errors.password}
                  />
                  {passwordStrength ? (
                    <div className="pw-strength">
                      <div className="pw-track">
                        <div className="pw-fill" style={{ width: passwordStrength.width, background: passwordStrength.color }} />
                      </div>
                      <span className="pw-label" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="field">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <PasswordInput
                    id="confirmPassword"
                    value={form.confirmPassword}
                    onChange={(value) => updateField("confirmPassword", value)}
                    placeholder="repeat your password"
                    error={errors.confirmPassword}
                  />
                </div>

                <div className="field">
                  <label htmlFor="instagram_handle">
                    Instagram handle <span style={{ color: "#9E9D97", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div className="input-wrap">
                    <input
                      id="instagram_handle"
                      type="text"
                      placeholder="instagram_handle"
                      style={{ paddingLeft: 28 }}
                      value={form.instagram_handle}
                      onChange={(e) => updateField("instagram_handle", e.target.value)}
                    />
                    <span className="input-prefix">@</span>
                  </div>
                  <div className="field-hint">ℹ️ Linking Instagram increases your credibility score.</div>
                </div>
              </div>

              <button className={cx("submit-btn", step1Ready && "ready")} onClick={goStep2} type="button">
                Continue →
              </button>
              <p className="submit-note">Your email is never shown publicly. <a href="/privacy-policy">Privacy Policy</a></p>
            </div>

            <div className={cx("step-screen", step === 2 && "active")}>
              <div className="card">
                <div className="card-title"><div className="card-icon">🎭</div> How do you want to post?</div>
                <p className="identity-sub">This is your default. You can change it on every individual flag you drop.</p>
                <div className="identity-grid">
                  <div
                    className={cx("identity-opt", form.default_identity === "anon" && "sel-anon")}
                    onClick={() => updateField("default_identity", "anon")}
                  >
                    <span className="default-badge">DEFAULT</span>
                    <span className="opt-icon">🎭</span>
                    <span className="opt-label">Anonymous</span>
                    <span className="opt-desc">Your @handle never shows on flags</span>
                  </div>
                  <div
                    className={cx("identity-opt", form.default_identity === "named" && "sel-named")}
                    onClick={() => updateField("default_identity", "named")}
                  >
                    <span className="opt-icon">✋</span>
                    <span className="opt-label">With my handle</span>
                    <span className="opt-desc">Your @handle shows on flags you post</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: "#F2F1EC", borderColor: "#E5E4DE" }}>
                <p style={{ fontSize: ".8rem", color: "#5E5D58", lineHeight: 1.6 }}>
                  <strong style={{ color: "#0C0C0A", display: "block", marginBottom: 4 }}>🔒 You can always change per flag</strong>
                  Even if you pick Anonymous as default, you can post with your handle on any specific flag — and vice versa.
                </p>
              </div>

              <div className="btn-row">
                <button className="back-btn" type="button" onClick={() => setStep(1)}>← Back</button>
                <button className="submit-btn ready" type="button" onClick={() => setStep(3)}>Continue to disclaimers →</button>
              </div>
            </div>

            <div className={cx("step-screen", step === 3 && "active")}>
              <div className="card">
                <div className="disc-header">
                  <div className="disc-icon">⚖️</div>
                  <div>
                    <div className="disc-title">Read this carefully before joining</div>
                    <div className="disc-subtitle">Tick every box individually. All 6 required to create your account.</div>
                  </div>
                </div>

                {DISCLAIMERS.map((item, index) => (
                  <div
                    key={item.title}
                    className={cx("check-item", disclaimers[index] && "ticked")}
                    onClick={() => toggleDisclaimer(index)}
                  >
                    <span className="check-num">{String(index + 1).padStart(2, "0")}</span>
                    <div className="check-box">{disclaimers[index] ? "✓" : ""}</div>
                    <div className="check-text">
                      <strong>{item.title}</strong>
                      {item.text}
                    </div>
                  </div>
                ))}

                <div className="disc-progress">
                  <div className="disc-track">
                    <div className="disc-fill" style={{ width: `${(disclaimerCount / DISCLAIMERS.length) * 100}%` }} />
                  </div>
                  <span className="disc-count">{disclaimerCount} / {DISCLAIMERS.length}</span>
                </div>
              </div>

              <div className="btn-row">
                <button className="back-btn" type="button" onClick={() => setStep(2)}>← Back</button>
                <button
                  className={cx("submit-btn", canCreate && "ready")}
                  type="button"
                  onClick={submitSignup}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create my account →"}
                </button>
              </div>
              <p className="submit-note">By joining you take full legal responsibility for your content. <a href="/grievance">Takedown requests</a></p>
            </div>

            <div className={cx("step-screen", step === 4 && "active")}>
              <div className="card">
                <div style={{ textAlign: "center", padding: ".5rem 0 1.25rem" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: ".85rem" }}>🔔</div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "#0C0C0A", marginBottom: ".4rem" }}>Stay in the loop.</div>
                  <p style={{ fontSize: ".85rem", color: "#5E5D58", lineHeight: 1.65, maxWidth: 320, margin: "0 auto" }}>
                    Get instant push notifications when someone searches your handle, drops a flag on you, or your watched handles get new receipts.
                  </p>
                </div>

                <div className="inline-stack">
                  <div className="notify-item"><span>👀</span><div><strong>Someone searched you</strong> — know instantly, with reason</div></div>
                  <div className="notify-item"><span>🚩</span><div><strong>New flag on your handle</strong> — red or green, right away</div></div>
                  <div className="notify-item"><span>👁</span><div><strong>Watched handle activity</strong> — new flags on handles you follow</div></div>
                  <div className="notify-item"><span>⚡</span><div><strong>Challenge mode live counter</strong> — real-time during your 48h window</div></div>
                </div>

                {pushState === "ask" && (
                  <>
                    <button className="go-btn" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }} type="button" onClick={askPushPermission}>
                      🔔 Enable push notifications
                    </button>
                    <button className="back-btn" style={{ width: "100%" }} type="button" onClick={finishSignup}>
                      Skip for now — I'll enable later
                    </button>
                    <p className="muted-note">You can change this anytime in Dashboard → Settings. Push is optional — email notifications are always on.</p>
                  </>
                )}

                {pushState === "granted" && (
                  <div style={{ textAlign: "center", padding: ".5rem 0" }}>
                    <div style={{ fontSize: "2rem", marginBottom: ".65rem" }}>✅</div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: ".95rem", fontWeight: 700, color: "#1A9E5F", marginBottom: ".4rem" }}>Push notifications enabled!</div>
                    <p style={{ fontSize: ".82rem", color: "#5E5D58", marginBottom: "1rem" }}>You're all set. We'll notify you the moment something happens on your handle.</p>
                    <button className="go-btn" type="button" onClick={finishSignup}>Create my account →</button>
                  </div>
                )}

                {pushState === "denied" && (
                  <>
                    <div className="status-box">⚠️ Blocked. You can re-enable notifications from your browser's address bar settings anytime. You'll still get email notifications.</div>
                    <button className="go-btn" style={{ width: "100%", justifyContent: "center" }} type="button" onClick={finishSignup}>
                      Continue anyway →
                    </button>
                  </>
                )}
              </div>

              <button className="back-btn" type="button" onClick={() => setStep(3)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".78rem", color: "#5E5D58", background: "none", border: "none", padding: 0 }}>
                ← Back
              </button>
            </div>

            <div className={cx("step-screen", step === 5 && "active")}>
              <div className="card">
                <div className="success-wrap">
                  <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 1.25rem" }}>
                    <div style={{ width: 72, height: 50, background: "#0C0C0A", borderRadius: 8, position: "relative", top: 11 }} />
                    <div style={{ position: "absolute", top: 0, left: 0, width: 0, height: 0, borderLeft: "36px solid transparent", borderRight: "36px solid transparent", borderTop: "25px solid #5E5D58" }} />
                    <div style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, background: "#1A9E5F", borderRadius: "50%", border: "2px solid #FFFFFF" }} />
                  </div>
                  <div className="success-title">Check your inbox.</div>
                  <span className="success-handle">{displayHandle}</span>
                  <p className="success-sub" style={{ marginBottom: ".5rem" }}>We've sent a verification link to</p>
                  <div className="pill-email">{displayEmail}</div>
                  <p className="success-sub">Click the link to activate your account. It expires in 24 hours. Check your spam folder if it doesn't arrive.</p>
                  <a href="/verify-email" className="go-btn" style={{ marginBottom: 8 }}>Open verify page →</a>
                  <button className="back-btn" style={{ width: "100%" }} type="button" onClick={resendVerify}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
                  </button>
                  <p className="muted-note">Email from <strong style={{ color: "#0C0C0A" }}>verify@clocked.in</strong></p>
                </div>
              </div>
            </div>
          </div>

          <div className="side-col">
            <div className="info-card">
              <p className="info-title">Why join Clocked?</p>
              <div className="why-row-side">
                <div className="why-item-side"><div className="why-bullet">🔍</div><div className="why-text"><strong>Search before you invest</strong>See community flags before a first date, shaadi meeting, or business deal.</div></div>
                <div className="why-item-side"><div className="why-bullet">🎭</div><div className="why-text"><strong>Post anonymously</strong>Your identity is protected by default. Nobody sees who flagged whom.</div></div>
                <div className="why-item-side"><div className="why-bullet">⚖️</div><div className="why-text"><strong>Always fair</strong>Every flagged person can post their own perspective. Two sides, always.</div></div>
                <div className="why-item-side"><div className="why-bullet">🔔</div><div className="why-text"><strong>Get notified</strong>Someone searched your handle? You'll know — and you can respond.</div></div>
              </div>
            </div>

            <div className="info-card">
              <p className="info-title">🔒 Your privacy</p>
              <p style={{ fontSize: ".82rem", color: "#0C0C0A", lineHeight: 1.7, fontWeight: 500 }}>
                We only store your email and password securely. Your Instagram handle is optional. We <strong>never</strong> sell your data, run ads, or share your identity with anyone — <strong>ever.</strong>
              </p>
            </div>

            <div className="info-card">
              <p className="info-title">🤔 Why do people Clock someone?</p>
              <div className="why-row-side">
                <div className="why-item-side"><div className="why-bullet">💔</div><div className="why-text"><strong>Got ghosted</strong>Disappeared after weeks of talking. Left on read, no closure, nothing.</div></div>
                <div className="why-item-side"><div className="why-bullet">🚨</div><div className="why-text"><strong>Spotted a red flag</strong>Love bombing, fake profiles, catfishing — warn others before they find out the hard way.</div></div>
                <div className="why-item-side"><div className="why-bullet">🟢</div><div className="why-text"><strong>Someone was genuinely great</strong>Good people deserve receipts too. Green flags matter just as much.</div></div>
                <div className="why-item-side"><div className="why-bullet">🛍️</div><div className="why-text"><strong>Bad seller or buyer</strong>Scammed, misled, terrible experience — the community deserves to know.</div></div>
              </div>
            </div>

            <div className="black-card">
              <p className="black-title">🎉 It's actually fun</p>
              <p className="black-text">Clocked isn't just red flags. It's where people share real experiences — good and bad. Green flags, unexpected praise, honest opinions. The internet being actually honest for once.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ id, value, onChange, placeholder, error }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <div className="input-wrap">
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={error ? "error" : ""}
        />
        <button className="pw-eye" type="button" onClick={() => setShow((current) => !current)}>
          {show ? "hide" : "show"}
        </button>
      </div>
      {error ? <div className="field-error">{error}</div> : null}
    </>
  );
}