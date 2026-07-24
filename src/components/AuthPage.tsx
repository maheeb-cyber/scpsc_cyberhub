import React, { useState } from "react";
import { Shield, Eye, EyeOff, UserPlus, LogIn, CheckCircle2, RefreshCw, KeyRound, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Profile } from "../types";
import { LANGUAGE_OPTIONS, getTranslation } from "../utils/translations";
import CyberHubLogo from "./CyberHubLogo";

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

  // Custom school/cadet registration states
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [chId, setChId] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState("");
  const [avatarBase64, setAvatarBase64] = useState("");

  // Forgot password flow
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin 
      ? { email, password } 
      : { email, password, username, name, roll, class: className, section, chId, phone, skills, avatar: avatarBase64 };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
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

      <div className="w-full max-w-md bg-gray-950/85 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-scanline">
        {/* Glow corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyber-cyan" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyber-cyan" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyber-cyan" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyber-cyan" />

        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan mb-3">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-white via-gray-300 to-cyber-cyan bg-clip-text text-transparent">
            CYBER HUB
          </h1>
          <p className="text-xs font-mono text-cyber-cyan mt-1 uppercase tracking-widest animate-pulse">Let's Build The Future</p>
        </div>

        {/* QUICK LOGIN PRESETS */}
        <div className="mb-6 p-3 bg-gray-900/40 border border-gray-800 rounded-lg text-center">
          <span className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-2 font-bold">
            DIRECT PORTAL ACCESS (PRESETS)
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@cyberhub.edu");
                setPassword("admin123");
                setIsLogin(true);
                setError("");
              }}
              className="px-2 py-1.5 bg-red-950/40 hover:bg-red-900/30 border border-red-900/50 hover:border-red-500 rounded text-[10px] font-mono text-red-400 font-bold transition-all cursor-pointer"
            >
              ADMIN
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("exec@cyberhub.edu");
                setPassword("exec123");
                setIsLogin(true);
                setError("");
              }}
              className="px-2 py-1.5 bg-yellow-950/40 hover:bg-yellow-900/30 border border-yellow-900/50 hover:border-yellow-500 rounded text-[10px] font-mono text-yellow-400 font-bold transition-all cursor-pointer"
            >
              EXEC
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("member@cyberhub.edu");
                setPassword("member123");
                setIsLogin(true);
                setError("");
              }}
              className="px-2 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/30 border border-emerald-900/50 hover:border-emerald-500 rounded text-[10px] font-mono text-emerald-400 font-bold transition-all cursor-pointer"
            >
              MEMBER
            </button>
          </div>
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
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                    isLogin ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white"
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
                    !isLogin ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white"
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
                {!isLogin && (
                  <div className="space-y-4 border-b border-gray-900 pb-4 mb-4">
                    {/* Profile Photo Upload */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                        PROFILE PHOTO *
                      </label>
                      <div className="flex items-center space-x-4 p-3 bg-gray-900/60 border border-gray-800 rounded-lg">
                        <div className="w-12 h-12 rounded-xl border border-gray-800 bg-gray-950 flex items-center justify-center overflow-hidden shrink-0 relative">
                          {avatarBase64 ? (
                            <img src={avatarBase64} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[9px] text-gray-500 font-mono text-center leading-tight">NO<br/>PHOTO</div>
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
                            Upload Photo
                          </label>
                          <p className="text-[8px] text-gray-500 font-mono">JPG, PNG up to 2MB.</p>
                        </div>
                      </div>
                    </div>

                    {/* Full Name & Username row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                          FULL NAME *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Abrar Tasnim"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                          CHOOSE USERNAME *
                        </label>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                          placeholder="savar_cypher"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan font-mono"
                        />
                      </div>
                    </div>

                    {/* Roll, Class & Section row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                          ROLL NUMBER *
                        </label>
                        <input
                          type="text"
                          required
                          value={roll}
                          onChange={(e) => setRoll(e.target.value)}
                          placeholder="e.g. 1024"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                          CLASS *
                        </label>
                        <input
                          type="text"
                          required
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          placeholder="e.g. 10"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                          SECTION *
                        </label>
                        <input
                          type="text"
                          required
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          placeholder="e.g. A"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan font-mono"
                        />
                      </div>
                    </div>

                    {/* CH ID & Skills row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                          CLUB ID (CH ID)
                        </label>
                        <input
                          type="text"
                          value={chId}
                          onChange={(e) => setChId(e.target.value)}
                          placeholder="CH-2026-X (Optional)"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                          SKILLS (SPLIT COMMA)
                        </label>
                        <input
                          type="text"
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="Python, React (Optional)"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan"
                        />
                      </div>
                    </div>

                    {/* Phone Number row */}
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                        PHONE NUMBER *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan font-mono"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@cyberhub.edu"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider">
                      SECURITY PASSPHRASE
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs font-mono text-cyber-cyan/80 hover:text-cyber-cyan hover:underline bg-transparent"
                      >
                        FORGOT PASSWORD?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="submit-auth"
                  disabled={loading}
                  className="w-full bg-cyber-cyan hover:bg-cyber-cyan/90 text-gray-950 font-display font-semibold py-3 rounded-lg text-sm transition-all flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-cyber-cyan/20"
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
                      <span>PROVISION NEW ACCOUNT</span>
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
                  <KeyRound className="w-4 h-4 text-cyber-cyan" />
                  <span>CREDENTIAL RECOVERY</span>
                </h2>
                <button
                  onClick={() => { setShowForgotPassword(false); setOtpSent(false); setError(""); }}
                  className="text-xs font-mono text-gray-500 hover:text-white"
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
                <div className="p-6 bg-cyber-cyan/10 border border-cyber-cyan/30 text-center rounded-xl space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-cyber-cyan mx-auto animate-bounce" />
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
                      placeholder="e.g. member@cyberhub.edu"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan focus:ring-1"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs py-3 rounded-lg flex items-center justify-center space-x-2"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "REQUEST RECOVERY CODE"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="p-3 bg-yellow-950/40 border border-yellow-800/60 rounded-lg">
                    <p className="text-[10px] font-mono text-yellow-500 leading-relaxed uppercase font-bold mb-1">
                      SIMULATOR OTP DISPATCHED
                    </p>
                    <p className="text-[11px] font-mono text-gray-300 leading-normal">
                      Security recovery code dispatched. For verification, enter the code <strong className="text-cyber-cyan text-xs font-bold">1337</strong> to unlock passphrase update.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">
                      ENTER SECURITY CODE
                    </label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="1337"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm text-center text-cyber-cyan font-bold placeholder-gray-700 focus:outline-none focus:border-cyber-cyan"
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
                      placeholder="At least 6 characters"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyber-cyan"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-cyber-cyan text-gray-950 font-bold font-display text-xs py-3 rounded-lg flex items-center justify-center space-x-2"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "OVERWRITE PASSPHRASE"}
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
