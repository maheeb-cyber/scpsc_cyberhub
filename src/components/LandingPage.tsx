import React, { useEffect, useRef, useState } from "react";
import { Code2, Palette, Film, Fingerprint, ArrowRight, Layers, FileCode2, MonitorPlay, Key, Shield, Info, Users, Award, Mail, Github, Linkedin, Facebook, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LANGUAGE_OPTIONS, getTranslation } from "../utils/translations";
import { Executive } from "../types";
import CyberHubLogo from "./CyberHubLogo";
import { safeJson } from "../utils/api";

interface LandingPageProps {
  onNavigateToAuth: () => void;
  languageCode: string;
  onLanguageChange: (code: string) => void;
}

export default function LandingPage({ onNavigateToAuth, languageCode, onLanguageChange }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loadingExecs, setLoadingExecs] = useState(true);

  // Hidden admin click counter
  const [logoClicks, setLogoClicks] = useState(0);
  const [showSecretModal, setShowSecretModal] = useState(false);

  // Fetch real-time executive team from backend
  useEffect(() => {
    const fetchExecutives = async () => {
      try {
        const res = await fetch("/api/executives");
        if (res.ok) {
          const data = await safeJson(res, []);
          setExecutives(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load executives", err);
      } finally {
        setLoadingExecs(false);
      }
    };
    fetchExecutives();
  }, []);

  // Secret admin shortcut listener (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        setShowSecretModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogoSecretClick = () => {
    const newCount = logoClicks + 1;
    if (newCount >= 5) {
      setShowSecretModal(true);
      setLogoClicks(0);
    } else {
      setLogoClicks(newCount);
      setTimeout(() => setLogoClicks(0), 3000);
    }
  };

  // Particle background canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particlesCount = 80;
    const particles: { x: number; y: number; z: number; ox: number; oy: number; oz: number; color: string }[] = [];
    const sphereRadius = Math.min(width, height) * 0.3;

    for (let i = 0; i < particlesCount; i++) {
      const theta = Math.acos(-1 + (2 * i) / particlesCount);
      const phi = Math.sqrt(particlesCount * Math.PI) * theta;

      const x = sphereRadius * Math.sin(theta) * Math.cos(phi);
      const y = sphereRadius * Math.sin(theta) * Math.sin(phi);
      const z = sphereRadius * Math.cos(theta);

      particles.push({
        x,
        y,
        z,
        ox: x,
        oy: y,
        oz: z,
        color: i % 2 === 0 ? "rgba(56, 189, 248, 0.4)" : "rgba(99, 102, 241, 0.3)"
      });
    }

    let angleY = 0.0015;
    let angleX = 0.0008;

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      const cosAY = Math.cos(angleY);
      const sinAY = Math.sin(angleY);
      const cosAX = Math.cos(angleX);
      const sinAX = Math.sin(angleX);

      particles.forEach((p) => {
        let x1 = p.ox * cosAY - p.oz * sinAY;
        let z1 = p.ox * sinAY + p.oz * cosAY;

        let y2 = p.oy * cosAX - z1 * sinAX;
        let z2 = p.oy * sinAX + z1 * cosAX;

        p.ox = x1;
        p.oy = y2;
        p.oz = z2;

        const depthFactor = 500;
        const scale = depthFactor / (depthFactor + z2);
        const screenX = centerX + x1 * scale;
        const screenY = centerY + y2 * scale;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(1, 2 * scale), 0, Math.PI * 2);
        ctx.fill();
      });

      // Connections
      ctx.strokeStyle = "rgba(56, 189, 248, 0.04)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particlesCount; i += 2) {
        for (let j = i + 1; j < particlesCount; j += 10) {
          const dx = particles[i].ox - particles[j].ox;
          const dy = particles[i].oy - particles[j].oy;
          const dz = particles[i].oz - particles[j].oz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < sphereRadius * 0.35) {
            const scaleI = 500 / (500 + particles[i].oz);
            const scaleJ = 500 / (500 + particles[j].oz);

            ctx.beginPath();
            ctx.moveTo(centerX + particles[i].ox * scaleI, centerY + particles[i].oy * scaleI);
            ctx.lineTo(centerX + particles[j].ox * scaleJ, centerY + particles[j].oy * scaleJ);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cyber-bg text-gray-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background Interactive canvas */}
      <div className="absolute inset-0 z-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-bg via-transparent to-cyber-bg pointer-events-none" />
      </div>

      {/* Secret Admin Portal Modal */}
      <AnimatePresence>
        {showSecretModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-gray-950 border border-cyber-cyan/50 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <div className="flex items-center space-x-2 text-cyber-cyan font-mono font-bold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-cyber-cyan" />
                  <span>RESTRICTED ADMIN GATEWAY</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSecretModal(false)}
                  className="text-xs text-gray-500 hover:text-white font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-400 font-mono">
                System Administrator access verified. Click below to enter the terminal authentication login page.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowSecretModal(false);
                  onNavigateToAuth();
                }}
                className="w-full bg-cyber-cyan hover:bg-cyber-cyan/90 text-gray-950 font-mono font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
              >
                PROCEED TO TERMINAL LOGIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between relative z-10 py-6 px-6">
        <div 
          onClick={handleLogoSecretClick}
          className="flex items-center space-x-2 cursor-pointer select-none group"
          title="SCPSC Cyber Hub"
        >
          <div className="w-8 h-8 flex items-center justify-center text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] group-hover:scale-110 transition-transform">
            <CyberHubLogo className="w-7 h-7" />
          </div>
          <span className="font-display text-sm font-extrabold tracking-tight text-white uppercase">CYBER HUB</span>
        </div>

        {/* Language Selector */}
        <div className="relative flex items-center bg-gray-950/40 border border-gray-900 rounded-full px-3 py-1.5 backdrop-blur-md z-50">
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
      </header>

      {/* Main Page Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-6 max-w-6xl mx-auto w-full py-8 space-y-20">
        
        {/* HERO HEADLINE & CALL TO ACTION */}
        <div className="text-center max-w-2xl mx-auto space-y-6 pt-4">
          <div className="space-y-4">
            <motion.div 
              onClick={handleLogoSecretClick}
              className="w-24 h-24 mx-auto text-sky-400 drop-shadow-[0_0_20px_rgba(56,189,248,0.4)] mb-2 flex items-center justify-center cursor-pointer"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              <CyberHubLogo className="w-20 h-20" />
            </motion.div>

            <motion.h1 
              className="text-6xl md:text-8xl font-display font-black tracking-tighter leading-none bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent uppercase py-1"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% auto" }}
            >
              CYBER HUB
            </motion.h1>
            
            <p className="text-lg md:text-xl font-mono text-gray-300 max-w-md mx-auto tracking-widest uppercase animate-pulse">
              Let's Build The Future
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="pt-2"
          >
            <button
              onClick={onNavigateToAuth}
              className="group bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-display font-bold px-10 py-3.5 rounded-xl text-xs tracking-widest uppercase hover:shadow-xl hover:shadow-sky-500/20 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center space-x-2 mx-auto"
            >
              <span>Start your journey</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>

        {/* SECTION 1: ABOUT US (FIRST SECTION) */}
        <section id="about-us" className="w-full bg-gray-950/50 backdrop-blur-md border border-gray-900 rounded-3xl p-8 md:p-12 space-y-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-900 pb-6 gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Info className="w-3.5 h-3.5" />
                <span>ABOUT OUR IT CLUB</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight uppercase">
                SAVAR CANTONMENT PUBLIC SCHOOL & COLLEGE IT CLUB
              </h2>
            </div>
            <p className="text-xs font-mono text-gray-400 max-w-xs leading-relaxed">
              Empowering students with cutting-edge software engineering, cybersecurity defense, and digital arts mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-white text-base">Our Mission</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                To build a world-class technology culture within Savar Cantonment Public School and College by training members in algorithms, web systems, UI/UX design, video rendering, and ethical security.
              </p>
            </div>

            <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-white text-base">Student Community</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                100% student-led initiative providing structured IT workshops, hackathon training, competitive coding bootcamps, and intra-institutional contests.
              </p>
            </div>

            <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-white text-base">Excellence & Achievements</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Over 250 active student members, 15+ national IT Olympiad awards, and continuous digital innovation projects managed under SCPSC guidelines.
              </p>
            </div>
          </div>

          {/* Stat Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-900/80">
            <div className="text-center p-4 bg-gray-900/30 rounded-xl border border-gray-900">
              <span className="block text-2xl md:text-3xl font-display font-black text-sky-400">250+</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Active Members</span>
            </div>
            <div className="text-center p-4 bg-gray-900/30 rounded-xl border border-gray-900">
              <span className="block text-2xl md:text-3xl font-display font-black text-indigo-400">15+</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Annual Seminars</span>
            </div>
            <div className="text-center p-4 bg-gray-900/30 rounded-xl border border-gray-900">
              <span className="block text-2xl md:text-3xl font-display font-black text-emerald-400">8+</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Hackathons Held</span>
            </div>
            <div className="text-center p-4 bg-gray-900/30 rounded-xl border border-gray-900">
              <span className="block text-2xl md:text-3xl font-display font-black text-purple-400">100%</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Student Driven</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: EXECUTIVE BOARD (DYNAMICALLY CONTROLLED VIA ADMIN PANEL) */}
        <section id="executives" className="w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-900 pb-4 gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                <span>EXECUTIVE BOARD & LEADERSHIP</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight uppercase">
                OUR EXECUTIVE COUNCIL
              </h2>
            </div>
            <p className="text-xs font-mono text-gray-400 max-w-xs leading-relaxed">
              Managed & synchronized directly from the SCPSC Cyber Hub Administrative Panel.
            </p>
          </div>

          {loadingExecs ? (
            <div className="text-center py-12 text-gray-500 font-mono text-xs">
              LOADING EXECUTIVE PANEL DATA...
            </div>
          ) : executives.length === 0 ? (
            <div className="p-8 text-center bg-gray-950/40 border border-gray-900 rounded-2xl space-y-2 font-mono text-xs text-gray-400">
              <p>No executive council members configured yet.</p>
              <p className="text-[10px] text-gray-500">Executive details can be populated dynamically from the Admin Panel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {executives.map((exec) => (
                <div 
                  key={exec.id} 
                  className="bg-gray-950/60 backdrop-blur-md border border-gray-900 rounded-2xl p-6 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden shadow-xl"
                >
                  <div className="space-y-4">
                    {/* Executive Avatar & Position */}
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-2xl border border-gray-800 bg-gray-900 flex items-center justify-center overflow-hidden shrink-0 relative group-hover:border-indigo-500/60 transition-colors">
                        {exec.avatar ? (
                          <img src={exec.avatar} alt={exec.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display font-bold text-lg text-indigo-400">
                            {exec.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 uppercase tracking-wider">
                          {exec.department || "Executive Board"}
                        </span>
                        <h3 className="font-display font-bold text-white text-base truncate">{exec.name}</h3>
                        <p className="text-xs font-mono text-sky-400 font-medium truncate">{exec.position}</p>
                      </div>
                    </div>

                    {/* Speech / Quote / Bio */}
                    {exec.speech ? (
                      <p className="text-xs text-gray-300 italic bg-gray-900/50 p-3 rounded-xl border border-gray-900/80 leading-relaxed font-sans">
                        "{exec.speech}"
                      </p>
                    ) : exec.bio ? (
                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed font-sans">
                        {exec.bio}
                      </p>
                    ) : null}

                    {/* Achievements tags */}
                    {exec.achievements && exec.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {exec.achievements.slice(0, 3).map((ach, idx) => (
                          <span key={idx} className="text-[9px] font-mono bg-gray-900 text-gray-400 px-2 py-0.5 rounded border border-gray-800">
                            🏆 {ach}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Social & Contact links */}
                  <div className="border-t border-gray-900 pt-3 flex items-center justify-between text-xs font-mono text-gray-500">
                    <span className="text-[10px] truncate max-w-[140px] text-gray-400">{exec.email}</span>
                    <div className="flex items-center space-x-2">
                      {exec.socials?.github && (
                        <a href={exec.socials.github} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {exec.socials?.linkedin && (
                        <a href={exec.socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {exec.socials?.facebook && (
                        <a href={exec.socials.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                          <Facebook className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: CLUB WINGS & SKILLS */}
        <section id="skills-wings" className="w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-900 pb-4 gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Code2 className="w-3.5 h-3.5" />
                <span>TECHNICAL WINGS</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight uppercase">
                CLUB DOMAINS & SKILL PILLARS
              </h2>
            </div>
            <p className="text-xs font-mono text-gray-400 max-w-xs leading-relaxed">
              Explore our core specialized technical departments and learning tracks.
            </p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Wing 1: Programming */}
            <div className="bg-gray-950/30 backdrop-blur-sm border border-gray-900 rounded-2xl p-5 hover:border-sky-500/30 transition-all duration-300 group flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">Programming</h3>
                  <p className="text-xs text-gray-400 mt-1">Competitive coding, algorithm design, data structures, and web application development.</p>
                </div>
              </div>
              
              <div className="bg-gray-900/40 rounded-lg p-3 font-mono text-[9px] text-sky-300/80 border border-gray-900/80 select-none pointer-events-none mt-2">
                <div className="flex items-center space-x-1 border-b border-gray-900/60 pb-1.5 mb-1.5 text-gray-500">
                  <FileCode2 className="w-3 h-3" />
                  <span>main.cpp</span>
                </div>
                <p><span className="text-pink-500">#include</span> &lt;iostream&gt;</p>
                <p><span className="text-indigo-400">int</span> main() &#123;</p>
                <p className="pl-3 text-emerald-400">std::cout &lt;&lt; <span className="text-amber-400">"SCPSC CYBER!"</span>;</p>
                <p className="pl-3"><span className="text-pink-500">return</span> <span className="text-amber-500">0</span>;</p>
                <p>&#125;</p>
              </div>
            </div>

            {/* Wing 2: Designing */}
            <div className="bg-gray-950/30 backdrop-blur-sm border border-gray-900 rounded-2xl p-5 hover:border-indigo-500/30 transition-all duration-300 group flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">Designing</h3>
                  <p className="text-xs text-gray-400 mt-1">UI/UX wireframing, branding systems, typography pairings, and vector graphics.</p>
                </div>
              </div>

              <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-900/80 flex flex-col space-y-2 mt-2">
                <div className="flex justify-between items-center text-[8px] font-mono text-gray-500">
                  <span className="flex items-center gap-1"><Layers className="w-2.5 h-2.5 text-indigo-400" /> ARTBOARD_01</span>
                  <span>800 x 600</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="h-6 rounded border border-dashed border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400/20" />
                  </div>
                  <div className="h-6 rounded border border-dashed border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-400/20" />
                  </div>
                  <div className="h-6 rounded border border-dashed border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-400/20" />
                  </div>
                </div>
                <div className="h-3 rounded bg-indigo-500/10 border border-indigo-500/20" />
              </div>
            </div>

            {/* Wing 3: Video Editing */}
            <div className="bg-gray-950/30 backdrop-blur-sm border border-gray-900 rounded-2xl p-5 hover:border-sky-500/30 transition-all duration-300 group flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">Video Editing</h3>
                  <p className="text-xs text-gray-400 mt-1">Multi-track timeline editing, audio sound synthesis, color grading, and motion graphics.</p>
                </div>
              </div>

              <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-900/80 flex flex-col space-y-1.5 mt-2">
                <div className="flex justify-between items-center text-[8px] font-mono text-gray-500">
                  <span className="flex items-center gap-1"><MonitorPlay className="w-2.5 h-2.5 text-sky-400" /> TIMELINE</span>
                  <span>00:14:22</span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 rounded bg-sky-500/20 relative overflow-hidden flex items-center px-1">
                    <span className="text-[6px] font-mono text-sky-300">Video_Intro.mp4</span>
                    <div className="absolute right-1/3 top-0 bottom-0 w-0.5 bg-sky-400" />
                  </div>
                  <div className="h-2 rounded bg-indigo-500/10 relative overflow-hidden flex items-center px-1">
                    <span className="text-[6px] font-mono text-indigo-300">Audio_Ambient.wav</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wing 4: Cyber Security */}
            <div className="bg-gray-950/30 backdrop-blur-sm border border-gray-900 rounded-2xl p-5 hover:border-indigo-500/30 transition-all duration-300 group flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">Cyber Security</h3>
                  <p className="text-xs text-gray-400 mt-1">Network auditing, penetration testing fundamentals, CTF challenge solving, and encryption.</p>
                </div>
              </div>

              <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-900/80 flex flex-col space-y-1.5 mt-2 font-mono text-[8px]">
                <div className="flex justify-between items-center text-gray-500">
                  <span className="flex items-center gap-1"><Key className="w-2.5 h-2.5 text-indigo-400" /> SEC_AUDIT</span>
                  <span className="text-emerald-400">SECURE</span>
                </div>
                <div className="text-gray-400 space-y-0.5">
                  <p>&gt; PORT 443: <span className="text-emerald-400">LISTENING</span></p>
                  <p>&gt; FIREWALL: <span className="text-indigo-400">SHIELD_ON</span></p>
                  <p>&gt; PACKETS: <span className="text-sky-300">0 FAULTS</span></p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-gray-900/40 py-8 px-6 backdrop-blur-sm bg-gray-950/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-gray-500">
          <div className="text-center sm:text-left space-y-1">
            <p className="text-gray-400 font-display font-bold uppercase tracking-wider">
              Savar Cantonment Public School and College IT Club
            </p>
            <p>&copy; 2026 Savar Cantonment, Dhaka, Bangladesh. All rights reserved.</p>
            <p className="text-gray-400 pt-1">
              Developed by{" "}
              <a
                href="https://maheeb1.netlify.app"
                target="_blank"
                rel="noreferrer"
                className="text-cyber-cyan hover:text-cyan-300 font-semibold underline underline-offset-2 transition-colors"
              >
                Md. Maheeb Hossain (maheeb1.netlify.app)
              </a>
            </p>
          </div>
          <div className="text-center sm:text-right text-gray-600">
            <span>PORTAL REVISION 2.4.2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
