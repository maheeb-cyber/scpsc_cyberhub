import React, { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, UserPlus, LogIn, CheckCircle2, RefreshCw, KeyRound, AlertTriangle, UserCheck, BookOpen, Lock, ChevronRight, ChevronLeft, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Profile } from "../types";
import { LANGUAGE_OPTIONS, getTranslation } from "../utils/translations";
import { safeJson } from "../utils/api";

interface AuthPageProps {
  onAuthSuccess: (user: User, profile: Profile, token: string) => void;
  languageCode: string;
  onLanguageChange: (code: string) => void;
}

export default function AuthPage({ onAuthSuccess, languageCode, onLanguageChange }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Custom school/student registration states
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [chId, setChId] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState("");
  const [avatarBase64, setAvatarBase64] = useState("");

  // Option Step System for Registration (Option 1: Personal, Option 2: Academic, Option 3: Security)
  const [regOptionTab, setRegOptionTab] = useState<"personal" | "academic" | "security">("personal");
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);

  // Secret Admin Access state
  const [adminClicks, setAdminClicks] = useState(0);
  const [showAdminGateway, setShowAdminGateway] = useState(false);
  const [adminGatewayKey, setAdminGatewayKey] = useState("");

  // Forgot password flow
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Secret shortcut listener for Admin Access (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        setShowAdminGateway(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleShieldClick = () => {
    const newCount = adminClicks + 1;
    if (newCount >= 5) {
      setShowAdminGateway(true);
      setAdminClicks(0);
    } else {
      setAdminClicks(newCount);
      // reset after 3 seconds of inactivity
      setTimeout(() => setAdminClicks(0), 3000);
    }
  };

  const handleAdminGatewaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (adminGatewayKey.trim() === "admin123" || adminGatewayKey.trim() === "admin@cyberhub.edu") {
      setEmail("admin@cyberhub.edu");
      setPassword("admin123");
      setIsLogin(true);
      setShowAdminGateway(false);
      setAdminGatewayKey("");
    } else {
      setError("Invalid Administrative Security Key.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("File exceeds maximum limit of 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Helper validation checks for step options
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isPersonalComplete = Boolean(name.trim() && username.trim() && avatarBase64);
  const isAcademicComplete = Boolean(
    roll.trim() && /^\d+$/.test(roll.trim()) &&
    className.trim() && /^\d+$/.test(className.trim()) &&
    section.trim() && /^[a-zA-Z\s]+$/.test(section.trim())
  );
  const isSecurityComplete = Boolean(
    phone.trim() && /^\d{6,15}$/.test(phone.trim()) &&
    email.trim() && emailRegex.test(email.trim()) &&
    password.length >= 6
  );

  const getMissingFields = () => {
    const list: { field: string; tab: "personal" | "academic" | "security" }[] = [];
    if (!avatarBase64) list.push({ field: "Profile Photo (Upload from device)", tab: "personal" });
    if (!name.trim()) list.push({ field: "Full Name", tab: "personal" });
    if (!username.trim()) list.push({ field: "Username", tab: "personal" });
    
    if (!roll.trim()) {
      list.push({ field: "Roll Number (Numbers only)", tab: "academic" });
    } else if (!/^\d+$/.test(roll.trim())) {
      list.push({ field: "Roll Number (Must be numbers only)", tab: "academic" });
    }

    if (!className.trim()) {
      list.push({ field: "Class (Numbers only)", tab: "academic" });
    } else if (!/^\d+$/.test(className.trim())) {
      list.push({ field: "Class (Must be numbers only)", tab: "academic" });
    }

    if (!section.trim()) {
      list.push({ field: "Section (Text only)", tab: "academic" });
    } else if (!/^[a-zA-Z\s]+$/.test(section.trim())) {
      list.push({ field: "Section (Must be text only)", tab: "academic" });
    }

    if (!phone.trim()) {
      list.push({ field: "Phone Number (Numbers only)", tab: "security" });
    } else if (!/^\d{6,15}$/.test(phone.trim())) {
      list.push({ field: "Phone Number (Must be numbers only, 6-15 digits)", tab: "security" });
    }

    if (!email.trim()) {
      list.push({ field: "Email Address (Mandatory)", tab: "security" });
    } else if (!emailRegex.test(email.trim())) {
      list.push({ field: "Email Address (Must be a valid format: name@domain.com)", tab: "security" });
    }

    if (!password || password.length < 6) list.push({ field: "Passphrase (min 6 chars)", tab: "security" });
    return list;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Strict Frontend Validation for Registration
    if (!isLogin) {
      setHasAttemptedSubmit(true);
      const missing = getMissingFields();

      if (missing.length > 0) {
        setMissingFieldsList(missing.map(m => m.field));
        setShowValidationModal(true);
        setError(`Cannot Submit: Please fix the ${missing.length} required field(s).`);
        
        // Auto navigate to the first option step with missing fields
        setRegOptionTab(missing[0].tab);
        return;
      }
    }

    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin 
      ? { email: email.trim(), password } 
      : { 
          email: email.trim(), 
          password, 
          username: username.trim(), 
          name: name.trim(), 
          roll: roll.trim(), 
          class: className.trim(), 
          section: section.trim(), 
          chId: chId.trim(), 
          phone: phone.trim(), 
          skills, 
          avatar: avatarBase64 
        };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data?.error || `Authentication failed (Status ${res.status})`);
      }

      if (!data?.user || !data?.token) {
        throw new Error("Invalid server authentication response. Please retry.");
      }

      onAuthSuccess(data.user, data.profile, data.token);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      setOtpSent(true);
      setLoading(false);
    }, 1200);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp !== "1337") {
      setError("Invalid security verification code (Try '1337')");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setResetSuccess(true);
      setLoading(false);
      setTimeout(() => {
        setShowForgotPassword(false);
        setOtpSent(false);
        setResetSuccess(false);
        setPassword("");
        setEmail("");
        setIsLogin(true);
      }, 2000);
    }, 1500);
  };

  return (
    <div id="auth-container" className="min-h-screen bg-cyber-bg cyber-grid flex flex-col items-center justify-center p-4 relative font-sans pt-24 sm:pt-4">
      {/* Absolute top language selector */}
      <div className="absolute top-6 flex flex-col sm:flex-row items-center gap-3 z-50">
        <div className="relative flex items-center bg-gray-950/80 border border-gray-800 rounded-full px-3 py-1.5 backdrop-blur-md">
          <select
            value={languageCode}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-transparent border-none text-[11px] font-mono font-bold text-gray-300 outline-none cursor-pointer focus:ring-0 select-none py-0 px-1"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-gray-950 text-gray-200">
                {lang.flag} {lang.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Secret Admin Gateway Modal */}
      <AnimatePresence>
        {showAdminGateway && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-gray-950 border border-emerald-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-emerald-900 pb-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>RESTRICTED ADMIN GATEWAY</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminGateway(false)}
                  className="text-xs text-gray-500 hover:text-white font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-400 font-mono">
                System Administrator Override Enabled. Input master key or admin password to populate credentials.
              </p>

              <form onSubmit={handleAdminGatewaySubmit} className="space-y-3">
                <input
                  type="password"
                  placeholder="Master Key / Passphrase"
                  value={adminGatewayKey}
                  onChange={(e) => setAdminGatewayKey(e.target.value)}
                  className="w-full bg-gray-900 border border-emerald-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-mono font-bold py-2 rounded-lg text-xs transition-all cursor-pointer"
                >
                  AUTHENTICATE OVERRIDE
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Incomplete Registration Warning Alert Modal */}
        {showValidationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-gray-950 border border-red-800 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start border-b border-red-900/60 pb-3">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
                  <div>
                    <h3 className="text-sm font-display font-bold text-white uppercase">Registration Incomplete</h3>
                    <p className="text-[10px] font-mono text-red-400">Form cannot be submitted with empty required fields</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowValidationModal(false)}
                  className="text-xs text-gray-400 hover:text-white font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-300 font-mono">
                  Please complete the following required items before finalizing your student membership:
                </p>
                <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl space-y-1.5 max-h-48 overflow-y-auto">
                  {missingFieldsList.map((field, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs font-mono text-red-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <span>{field} is required</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-900">
                <button
                  type="button"
                  onClick={() => {
                    setRegOptionTab("personal");
                    setShowValidationModal(false);
                  }}
                  className={`py-2 px-1 text-[10px] font-mono font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    !isPersonalComplete ? "bg-red-950 border-red-800 text-red-300 hover:bg-red-900" : "bg-gray-900 border-gray-800 text-gray-400"
                  }`}
                >
                  Option 1: Personal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegOptionTab("academic");
                    setShowValidationModal(false);
                  }}
                  className={`py-2 px-1 text-[10px] font-mono font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    !isAcademicComplete ? "bg-red-950 border-red-800 text-red-300 hover:bg-red-900" : "bg-gray-900 border-gray-800 text-gray-400"
                  }`}
                >
                  Option 2: Academic
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegOptionTab("security");
                    setShowValidationModal(false);
                  }}
                  className={`py-2 px-1 text-[10px] font-mono font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    !isSecurityComplete ? "bg-red-950 border-red-800 text-red-300 hover:bg-red-900" : "bg-gray-900 border-gray-800 text-gray-400"
                  }`}
                >
                  Option 3: Security
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-mono font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                GOT IT, LET ME COMPLETE FORM
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md bg-gray-950/95 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-6">
          <div 
            onClick={handleShieldClick}
            title="Savar Cantonment IT Hub"
            className="inline-flex p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 mb-3 cursor-pointer select-none hover:bg-emerald-900 transition-all shadow"
          >
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-white">
            CYBER HUB
          </h1>
          <p className="text-xs font-mono text-emerald-400 mt-1 uppercase tracking-widest font-bold">Student Security & IT Portal</p>
        </div>

        <AnimatePresence mode="wait">
          {!showForgotPassword ? (
            <motion.div
              key="auth-forms"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Form selection tabs */}
              <div className="flex border border-gray-800 rounded-lg p-1 bg-gray-900/60 mb-6 font-mono text-xs">
                <button
                  type="button"
                  id="tab-login"
                  onClick={() => { setIsLogin(true); setError(""); setHasAttemptedSubmit(false); }}
                  className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                    isLogin ? "bg-emerald-500 text-gray-950 font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{getTranslation(languageCode, "login_terminal")}</span>
                </button>
                <button
                  type="button"
                  id="tab-register"
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                    !isLogin ? "bg-emerald-500 text-gray-950 font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{getTranslation(languageCode, "register_terminal")}</span>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 text-red-400 text-xs rounded-lg flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {/* LOGIN FORM */}
                {isLogin && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1 flex justify-between items-center">
                        <span>EMAIL ADDRESS / USERNAME / ROLL NO</span>
                        <span className="text-[10px] text-emerald-400 font-mono">LOGIN IDENTIFIER</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. student@cyberhub.edu, username, or Roll (1024)"
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                      <p className="text-[10px] text-gray-500 font-mono mt-1">
                        💡 You can log in using your registered Email, Username, or Student Roll number.
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider">
                          SECURITY PASSPHRASE
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs font-mono text-sky-400 hover:text-sky-300 hover:underline bg-transparent cursor-pointer"
                        >
                          FORGOT PASSWORD?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* REGISTER FORM: STEP-BY-STEP OPTION SELECTOR SYSTEM */}
                {!isLogin && (
                  <div className="space-y-4">
                    {/* Option Selector Navigation Tabs */}
                    <div className="grid grid-cols-3 gap-1.5 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setRegOptionTab("personal")}
                        className={`py-2 px-1 rounded-lg flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                          regOptionTab === "personal"
                            ? "bg-emerald-500 text-gray-950 font-bold shadow"
                            : hasAttemptedSubmit && !isPersonalComplete
                            ? "bg-red-950/40 text-red-400 border border-red-800/60"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <UserCheck className="w-3 h-3" />
                          {isPersonalComplete && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                        </div>
                        <span>1. PERSONAL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegOptionTab("academic")}
                        className={`py-2 px-1 rounded-lg flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                          regOptionTab === "academic"
                            ? "bg-emerald-500 text-gray-950 font-bold shadow"
                            : hasAttemptedSubmit && !isAcademicComplete
                            ? "bg-red-950/40 text-red-400 border border-red-800/60"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <BookOpen className="w-3 h-3" />
                          {isAcademicComplete && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                        </div>
                        <span>2. ACADEMIC</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegOptionTab("security")}
                        className={`py-2 px-1 rounded-lg flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                          regOptionTab === "security"
                            ? "bg-emerald-500 text-gray-950 font-bold shadow"
                            : hasAttemptedSubmit && !isSecurityComplete
                            ? "bg-red-950/40 text-red-400 border border-red-800/60"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <Lock className="w-3 h-3" />
                          {isSecurityComplete && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                        </div>
                        <span>3. SECURITY</span>
                      </button>
                    </div>

                    {/* Progress Indicator */}
                    <div className="w-full bg-gray-900 rounded-full h-1 overflow-hidden border border-gray-800">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{
                          width: regOptionTab === "personal" ? "33%" : regOptionTab === "academic" ? "66%" : "100%"
                        }}
                      />
                    </div>

                    {/* OPTION TAB 1: PERSONAL & PHOTO */}
                    {regOptionTab === "personal" && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                        <div className="p-2.5 bg-gray-900/40 border border-gray-800/80 rounded-lg">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold block mb-1">
                            OPTION 1: IDENTITY & PROFILE PHOTO
                          </span>
                          <p className="text-[9px] font-mono text-gray-400">
                            Upload student photo and enter your full name & username.
                          </p>
                        </div>

                        {/* Profile Photo Upload */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider flex justify-between">
                            <span>PROFILE PHOTO *</span>
                            {hasAttemptedSubmit && !avatarBase64 && (
                              <span className="text-red-400 font-bold">REQUIRED</span>
                            )}
                          </label>
                          <div className={`flex items-center space-x-3 p-3 bg-gray-900/60 border rounded-lg ${
                            hasAttemptedSubmit && !avatarBase64 ? "border-red-500/80" : "border-gray-800"
                          }`}>
                            <div className="w-12 h-12 rounded-xl border border-gray-800 bg-gray-950 flex items-center justify-center overflow-hidden shrink-0 relative">
                              {avatarBase64 ? (
                                <img src={avatarBase64} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <input
                                type="file"
                                accept="image/*"
                                id="register-avatar-upload"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              <label
                                htmlFor="register-avatar-upload"
                                className="inline-block bg-gray-800 hover:bg-gray-700 text-white text-[9px] font-mono py-1 px-2.5 rounded cursor-pointer transition-all border border-gray-700 font-bold uppercase"
                              >
                                {avatarBase64 ? "Change Photo" : "Upload Photo *"}
                              </label>
                              <p className="text-[8px] text-gray-500 font-mono">JPG, PNG up to 2MB.</p>
                            </div>
                          </div>
                        </div>

                        {/* Full Name & Username */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                              <span>FULL NAME *</span>
                              {hasAttemptedSubmit && !name.trim() && (
                                <span className="text-red-400 font-bold">REQUIRED</span>
                              )}
                            </label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Abrar Tasnim"
                              className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 ${
                                hasAttemptedSubmit && !name.trim() ? "border-red-500/80" : "border-gray-800"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                              <span>CHOOSE USERNAME *</span>
                              {hasAttemptedSubmit && !username.trim() && (
                                <span className="text-red-400 font-bold">REQUIRED</span>
                              )}
                            </label>
                            <input
                              type="text"
                              required
                              value={username}
                              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                              placeholder="savar_cypher"
                              className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono ${
                                hasAttemptedSubmit && !username.trim() ? "border-red-500/80" : "border-gray-800"
                              }`}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setRegOptionTab("academic")}
                          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs py-2 rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-all mt-2 font-bold"
                        >
                          <span>Proceed to Option 2: Academic Info</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}

                    {/* OPTION TAB 2: ACADEMIC DETAILS */}
                    {regOptionTab === "academic" && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                        <div className="p-2.5 bg-gray-900/40 border border-gray-800/80 rounded-lg">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold block mb-1">
                            OPTION 2: ACADEMIC CREDENTIALS
                          </span>
                          <p className="text-[9px] font-mono text-gray-400">
                            Provide your SCPSC roll number, class, section & optional club ID.
                          </p>
                        </div>

                        {/* Roll, Class & Section */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                              <span>ROLL NO (NUMBER) *</span>
                              {hasAttemptedSubmit && (!roll.trim() || !/^\d+$/.test(roll.trim())) && (
                                <span className="text-red-400 font-bold">*</span>
                              )}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              required
                              value={roll}
                              onChange={(e) => setRoll(e.target.value.replace(/\D/g, ""))}
                              placeholder="e.g. 1024"
                              className={`w-full bg-gray-900 border rounded-lg px-2.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono ${
                                hasAttemptedSubmit && (!roll.trim() || !/^\d+$/.test(roll.trim())) ? "border-red-500/80" : "border-gray-800"
                              }`}
                            />
                            <span className="text-[8px] text-gray-500 font-mono block mt-0.5">Numbers only</span>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                              <span>CLASS (NUMBER) *</span>
                              {hasAttemptedSubmit && (!className.trim() || !/^\d+$/.test(className.trim())) && (
                                <span className="text-red-400 font-bold">*</span>
                              )}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              required
                              value={className}
                              onChange={(e) => setClassName(e.target.value.replace(/\D/g, ""))}
                              placeholder="e.g. 10"
                              className={`w-full bg-gray-900 border rounded-lg px-2.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono ${
                                hasAttemptedSubmit && (!className.trim() || !/^\d+$/.test(className.trim())) ? "border-red-500/80" : "border-gray-800"
                              }`}
                            />
                            <span className="text-[8px] text-gray-500 font-mono block mt-0.5">e.g. 6-12</span>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                              <span>SECTION (TEXT) *</span>
                              {hasAttemptedSubmit && (!section.trim() || !/^[a-zA-Z\s]+$/.test(section.trim())) && (
                                <span className="text-red-400 font-bold">*</span>
                              )}
                            </label>
                            <input
                              type="text"
                              required
                              value={section}
                              onChange={(e) => setSection(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                              placeholder="e.g. A / Padma"
                              className={`w-full bg-gray-900 border rounded-lg px-2.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono ${
                                hasAttemptedSubmit && (!section.trim() || !/^[a-zA-Z\s]+$/.test(section.trim())) ? "border-red-500/80" : "border-gray-800"
                              }`}
                            />
                            <span className="text-[8px] text-gray-500 font-mono block mt-0.5">Letters only</span>
                          </div>
                        </div>

                        {/* Club ID */}
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                            CLUB ID (CH ID)
                          </label>
                          <input
                            type="text"
                            value={chId}
                            onChange={(e) => setChId(e.target.value)}
                            placeholder="CH-2026-X (Optional)"
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>

                        <div className="flex space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setRegOptionTab("personal")}
                            className="flex-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-mono text-xs py-2 rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-all"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Option 1</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegOptionTab("security")}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs py-2 rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-all font-bold"
                          >
                            <span>Option 3</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* OPTION TAB 3: CONTACT & SECURITY */}
                    {regOptionTab === "security" && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                        <div className="p-2.5 bg-gray-900/40 border border-gray-800/80 rounded-lg">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold block mb-1">
                            OPTION 3: CONTACT & PASSPHRASE
                          </span>
                          <p className="text-[9px] font-mono text-gray-400">
                            Enter your phone, email, passphrase, and key tech skills.
                          </p>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                            <span>PHONE NUMBER (NUMBER ONLY) *</span>
                            {hasAttemptedSubmit && (!phone.trim() || !/^\d{6,15}$/.test(phone.trim())) && (
                              <span className="text-red-400 font-bold">REQUIRED (NUMBERS)</span>
                            )}
                          </label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder="e.g. 01700000000 (Numbers only)"
                            className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono ${
                              hasAttemptedSubmit && (!phone.trim() || !/^\d{6,15}$/.test(phone.trim())) ? "border-red-500/80" : "border-gray-800"
                            }`}
                          />
                          <span className="text-[8px] text-gray-500 font-mono block mt-0.5">Numeric digits only (e.g. 01712345678)</span>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                            <span>EMAIL ADDRESS (MUST BE VALID) *</span>
                            {hasAttemptedSubmit && (!email.trim() || !emailRegex.test(email.trim())) && (
                              <span className="text-red-400 font-bold">MUST BE VALID EMAIL</span>
                            )}
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value.trim())}
                            placeholder="e.g. student@cyberhub.edu"
                            className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono ${
                              hasAttemptedSubmit && (!email.trim() || !emailRegex.test(email.trim())) ? "border-red-500/80" : "border-gray-800"
                            }`}
                          />
                          <span className="text-[8px] text-gray-500 font-mono block mt-0.5">Mandatory valid email address format (name@domain.com)</span>
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                            <span>SECURITY PASSPHRASE * (MIN 6 CHARS)</span>
                            {hasAttemptedSubmit && (!password || password.length < 6) && (
                              <span className="text-red-400 font-bold">MIN 6 CHARS</span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 ${
                                hasAttemptedSubmit && (!password || password.length < 6) ? "border-red-500/80" : "border-gray-800"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Skills */}
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                            SKILLS (SPLIT COMMA)
                          </label>
                          <input
                            type="text"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="Python, C++, React (Optional)"
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setRegOptionTab("academic")}
                            className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-mono text-xs py-1.5 rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-all mb-2"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Review Option 2</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  id="submit-auth"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-display font-bold py-3 rounded-lg text-sm transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer mt-4"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isLogin ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>INITIALIZE PORTAL SESSION</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>SUBMIT REGISTRATION</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
                <h2 className="text-base font-display font-medium text-white flex items-center space-x-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>CREDENTIAL RECOVERY</span>
                </h2>
                <button
                  onClick={() => { setShowForgotPassword(false); setOtpSent(false); setError(""); }}
                  className="text-xs font-mono text-gray-500 hover:text-white cursor-pointer"
                >
                  CANCEL
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 text-red-400 text-xs rounded-lg">
                  {error}
                </div>
              )}

              {resetSuccess ? (
                <div className="p-6 bg-emerald-950/40 border border-emerald-800 text-center rounded-xl space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                  <h3 className="text-base font-bold text-white">RECOVERY SUCCESS</h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Security parameter reset. Returning to main login portal...
                  </p>
                </div>
              ) : !otpSent ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                    Enter your registered email address to receive an offline simulation security recovery code.
                  </p>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">
                      REGISTERED EMAIL
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@cyberhub.edu"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-mono font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>DISPATCH RECOVERY CODE</span>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-emerald-400 text-xs font-mono">
                    Verification code dispatched to {email}. (Simulation Code: <span className="font-bold underline text-white">1337</span>)
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">
                      VERIFICATION CODE
                    </label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="1337"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">
                      NEW SECURITY PASSPHRASE
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-mono font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>UPDATE SECURITY PASSPHRASE</span>}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
