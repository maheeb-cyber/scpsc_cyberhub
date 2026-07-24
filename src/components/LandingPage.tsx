import React, { useEffect, useRef } from "react";
import { Code2, Palette, Film, Fingerprint, ArrowRight, Layers, FileCode2, MonitorPlay, Key, Shield, Terminal, Cpu } from "lucide-react";
import { motion } from "motion/react";
import { LANGUAGE_OPTIONS, getTranslation } from "../utils/translations";
import CyberHubLogo from "./CyberHubLogo";

interface LandingPageProps {
  onNavigateToAuth: () => void;
  languageCode: string;
  onLanguageChange: (code: string) => void;
}

export default function LandingPage({ onNavigateToAuth, languageCode, onLanguageChange }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Smooth particle sphere background
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

    const particlesCount = 100;
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
        color: i % 2 === 0 ? "rgba(56, 189, 248, 0.4)" : "rgba(59, 130, 246, 0.3)"
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

      // Connections between close particles
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

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between relative z-10 py-6 px-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 flex items-center justify-center text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
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

      {/* Center Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-6xl mx-auto w-full py-12 space-y-16">
        
        {/* Hero Headline and Call to Action */}
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <div className="space-y-4">
            {/* Spinning/glowing large cyber hub logo */}
            <motion.div 
              className="w-24 h-24 mx-auto text-sky-400 drop-shadow-[0_0_20px_rgba(56,189,248,0.4)] mb-2 flex items-center justify-center"
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
              className="group bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-display font-bold px-10 py-3.5 rounded-xl text-xs tracking-widest uppercase hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center space-x-2 mx-auto"
            >
              <span>Start your journey</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>

        {/* Skills Section with visual code language and design illustrations */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Skill 1: Programming */}
          <div className="bg-gray-950/30 backdrop-blur-sm border border-gray-900 rounded-2xl p-5 hover:border-sky-500/30 transition-all duration-300 group flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-base">Programming</h3>
                <p className="text-xs text-gray-400 mt-1">Write high performance clean code, compile algorithms, and deploy web applets.</p>
              </div>
            </div>
            
            {/* Visual Design: Code snippet */}
            <div className="bg-gray-900/40 rounded-lg p-3 font-mono text-[9px] text-sky-300/80 border border-gray-900/80 select-none pointer-events-none mt-2">
              <div className="flex items-center space-x-1 border-b border-gray-900/60 pb-1.5 mb-1.5 text-gray-500">
                <FileCode2 className="w-3 h-3" />
                <span>main.cpp</span>
              </div>
              <p><span className="text-pink-500">#include</span> &lt;iostream&gt;</p>
              <p><span className="text-indigo-400">int</span> main() &#123;</p>
              <p className="pl-3 text-emerald-400">std::cout &lt;&lt; <span className="text-amber-400">"SCPSC!"</span>;</p>
              <p className="pl-3"><span className="text-pink-500">return</span> <span className="text-amber-500">0</span>;</p>
              <p>&#125;</p>
            </div>
          </div>

          {/* Skill 2: Designing */}
          <div className="bg-gray-950/30 backdrop-blur-sm border border-gray-900 rounded-2xl p-5 hover:border-indigo-500/30 transition-all duration-300 group flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-base">Designing</h3>
                <p className="text-xs text-gray-400 mt-1">Construct design systems, pair typography, align grids, and perfect layouts.</p>
              </div>
            </div>

            {/* Visual Design: Wireframe block */}
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

          {/* Skill 3: Video Editing */}
          <div className="bg-gray-950/30 backdrop-blur-sm border border-gray-900 rounded-2xl p-5 hover:border-sky-500/30 transition-all duration-300 group flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-base">Video Editing</h3>
                <p className="text-xs text-gray-400 mt-1">Splice media timelines, sync sound tracks, apply grading, and export animations.</p>
              </div>
            </div>

            {/* Visual Design: Video timeline track */}
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-900/80 flex flex-col space-y-1.5 mt-2">
              <div className="flex justify-between items-center text-[8px] font-mono text-gray-500">
                <span className="flex items-center gap-1"><MonitorPlay className="w-2.5 h-2.5 text-sky-400" /> TIMELINE</span>
                <span>00:14:22</span>
              </div>
              {/* Tracks */}
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

          {/* Skill 4: Cyber Security */}
          <div className="bg-gray-950/30 backdrop-blur-sm border border-gray-900 rounded-2xl p-5 hover:border-indigo-500/30 transition-all duration-300 group flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-base">Cyber Security</h3>
                <p className="text-xs text-gray-400 mt-1">Audit security systems, analyze risk models, decrypt payloads, and defend networks.</p>
              </div>
            </div>

            {/* Visual Design: Terminal Security Status */}
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
      </main>

      {/* Footer containing the humble text of Savar Cantonment */}
      <footer className="relative z-10 w-full border-t border-gray-900/40 py-8 px-6 backdrop-blur-sm bg-gray-950/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-gray-500">
          <div className="text-center sm:text-left space-y-1">
            <p className="text-gray-400 font-display font-bold uppercase tracking-wider">Savar Cantonment Public School and College IT Club</p>
            <p>&copy; 2026 Savar Cantonment, Dhaka, Bangladesh. All rights reserved.</p>
          </div>
          <div className="text-center sm:text-right text-gray-600">
            <span>PORTAL REVISION 2.4.2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
