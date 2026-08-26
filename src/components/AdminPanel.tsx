import React, { useState, useEffect } from "react";
import { 
  Shield, Users, BookOpen, Calendar, MessageSquare, Terminal, RefreshCw, 
  Database, Activity, Trash2, Plus, Check, ArrowLeft, HeartPulse, Send, Award, Image,
  Sun, Moon, HelpCircle
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from "recharts";
import { User, Department, Quiz, Message, Event, AuditLog, Executive } from "../types";
import { getTranslation } from "../utils/translations";
import CyberHubLogo from "./CyberHubLogo";
import { safeJson } from "../utils/api";

interface AdminPanelProps {
  user: User;
  onExit: () => void;
  onSwitchToMember?: (targetUser: User, targetProfile: any) => void;
  languageCode?: string;
}

export default function AdminPanel({ user, onExit, onSwitchToMember, languageCode = "en" }: AdminPanelProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return user.role === "Admin" || user.role === "Executive" || sessionStorage.getItem("admin_authenticated") === "true";
  });
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [isLoginNightMode, setIsLoginNightMode] = useState(true);

  // Switching & Linking Member Account states
  const [switchingUserId, setSwitchingUserId] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<{
    name: string;
    roll: string;
    class: string;
    section: string;
    phone: string;
    chId: string;
    skills: string;
  }>({ name: "", roll: "", class: "", section: "", phone: "", chId: "", skills: "" });

  // Login page AI Assistant
  const [loginAiMessage, setLoginAiMessage] = useState("");
  const [loginAiHistory, setLoginAiHistory] = useState<any[]>([
    { role: "model", text: "Security Portal Active. Verify system password or request assistance." }
  ]);
  const [loginAiLoading, setLoginAiLoading] = useState(false);

  // Student activity posting form states
  const [selectedActivityUser, setSelectedActivityUser] = useState<string | null>(null);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityType, setActivityType] = useState("Attendance");
  const [activityDesc, setActivityDesc] = useState("");
  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySuccess, setActivitySuccess] = useState<string | null>(null);

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");
    if (adminPasscode === "orma#*6769" || adminPasscode === "admin123") {
      sessionStorage.setItem("admin_authenticated", "true");
      setIsAdminAuthenticated(true);
    } else {
      setAdminLoginError("Invalid security access passcode.");
    }
  };

  const handleLoginAiSend = async () => {
    if (!loginAiMessage.trim()) return;
    const msg = loginAiMessage;
    setLoginAiMessage("");
    setLoginAiHistory(prev => [...prev, { role: "user", text: msg }]);
    setLoginAiLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: loginAiHistory.map(h => ({ role: h.role, text: h.text })),
          mode: "admin"
        })
      });
      const data = await safeJson(res, {});
      if (res.ok && data?.response) {
        setLoginAiHistory(prev => [...prev, { role: "model", text: data.response }]);
      } else {
        setLoginAiHistory(prev => [...prev, { role: "model", text: data?.error || "Admin AI Core is experiencing high demand. Please try again." }]);
      }
    } catch (err) {
      setLoginAiHistory(prev => [...prev, { role: "model", text: "Offline mode. Security connection error." }]);
    } finally {
      setLoginAiLoading(false);
    }
  };

  const handleSendActivity = async (targetUserId: string) => {
    if (!activityTitle.trim() || !activityDesc.trim()) {
      alert("Title and Description are required");
      return;
    }
    setActivityLoading(true);
    try {
      const res = await fetch("/api/admin/users/send-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          activityTitle,
          activityDescription: activityDesc,
          type: activityType
        })
      });
      if (res.ok) {
        setActivitySuccess(targetUserId);
        setActivityTitle("");
        setActivityDesc("");
        fetchAdminConsoleData();
        setTimeout(() => setActivitySuccess(null), 3500);
      } else {
        alert("Failed to dispatch activity log.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActivityLoading(false);
    }
  };

  // Quiz Creator Form
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDesc, setQuizDesc] = useState("");
  const [quizDur, setQuizDur] = useState(10);
  const [quizNegative, setQuizNegative] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([
    { question: "", options: ["", "", "", ""], correctIndex: 0, points: 10 }
  ]);

  // Event Scheduler Form
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState<any>("Workshop");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventImage, setEventImage] = useState("");

  // Gallery Uploader Form
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryType, setGalleryType] = useState<any>("Photo");
  const [galleryUrl, setGalleryUrl] = useState("");
  const [galleryCategory, setGalleryCategory] = useState("General");

  // Message reply field state
  const [replyTextMap, setReplyTextMap] = useState<{ [msgId: string]: string }>({});

  const fetchAdminConsoleData = async () => {
    try {
      const [statsRes, healthRes, usersRes, logsRes, msgRes, execsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/health"),
        fetch("/api/admin/users"),
        fetch("/api/admin/logs"),
        fetch("/api/messages"),
        fetch("/api/executives")
      ]);

      if (statsRes.ok) setStats(await safeJson(statsRes, null));
      if (healthRes.ok) setHealth(await safeJson(healthRes, null));
      if (usersRes.ok) setUsersList((await safeJson(usersRes, [])) || []);
      if (logsRes.ok) setLogs((await safeJson(logsRes, [])) || []);
      if (msgRes.ok) setMessages((await safeJson(msgRes, [])) || []);
      if (execsRes.ok) setExecutives((await safeJson(execsRes, [])) || []);
    } catch (err) {
      console.error("Error fetching admin panel data:", err);
    }
  };

  useEffect(() => {
    fetchAdminConsoleData();
    // Update live metrics every 10 seconds
    const interval = setInterval(fetchAdminConsoleData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Switch & Link to Member account view
  const handleSwitchToMemberAccount = async (targetUser: User) => {
    setSwitchingUserId(targetUser.id);
    try {
      const res = await fetch(`/api/user/profile?userId=${targetUser.id}`);
      if (res.ok) {
        const data = await safeJson(res, {});
        if (onSwitchToMember) {
          onSwitchToMember(targetUser, data?.profile);
        } else {
          alert(`Linked to member @${targetUser.username}. Refreshing console.`);
        }
      } else {
        alert("Could not load member profile details.");
      }
    } catch (err) {
      alert("Error linking to member account.");
    } finally {
      setSwitchingUserId(null);
    }
  };

  const handleOpenEditStudent = (usr: User) => {
    setEditingUserId(usr.id);
    setEditUserData({
      name: usr.name || "",
      roll: usr.roll || "",
      class: usr.class || "",
      section: usr.section || "",
      phone: usr.phone || "",
      chId: usr.chId || "",
      skills: usr.skills ? usr.skills.join(", ") : ""
    });
  };

  const handleSaveStudentInfo = async (targetUserId: string) => {
    try {
      const skillsArray = editUserData.skills.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          name: editUserData.name,
          roll: editUserData.roll,
          class: editUserData.class,
          section: editUserData.section,
          phone: editUserData.phone,
          chId: editUserData.chId,
          skills: skillsArray
        })
      });
      if (res.ok) {
        setEditingUserId(null);
        fetchAdminConsoleData();
      } else {
        alert("Failed to update student profile data.");
      }
    } catch (err) {
      alert("Connection error saving student information.");
    }
  };

  // Update user role
  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, newRole })
      });
      if (res.ok) {
        fetchAdminConsoleData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Perform snapshot backup
  const handleTriggerBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await safeJson(res, {});
      if (res.ok && data?.filename) {
        alert(`SNAPSHOT ARCHIVED SUCCESSFULLY: ${data.filename}`);
        fetchAdminConsoleData();
      } else {
        alert(`Backup failed: ${data?.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Dispatch replies
  const handleSendReply = async (msgId: string) => {
    const replyText = replyTextMap[msgId];
    if (!replyText?.trim()) return;

    try {
      const res = await fetch(`/api/messages/${msgId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: `Executive (${user.username})`,
          content: replyText
        })
      });
      if (res.ok) {
        setReplyTextMap(prev => ({ ...prev, [msgId]: "" }));
        fetchAdminConsoleData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add question block in Quiz Creator
  const handleAddQuestionBlock = () => {
    setQuizQuestions(prev => [
      ...prev,
      { question: "", options: ["", "", "", ""], correctIndex: 0, points: 10 }
    ]);
  };

  // Submit Quiz Creator
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim() || quizQuestions.length === 0) {
      alert("Quiz Title and Questions are required");
      return;
    }

    try {
      const res = await fetch("/api/admin/quiz/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle,
          description: quizDesc,
          duration: quizDur,
          questions: quizQuestions,
          negativeMarking: quizNegative
        })
      });
      if (res.ok) {
        alert("QUIZ EXAM PUBLISHED SUCCESSFULLY!");
        setQuizTitle("");
        setQuizDesc("");
        setQuizDur(10);
        setQuizNegative(false);
        setQuizQuestions([{ question: "", options: ["", "", "", ""], correctIndex: 0, points: 10 }]);
        setActiveMenu("dashboard");
        fetchAdminConsoleData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Event Scheduler
  const handleScheduleEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) {
      alert("Title and Date are required to schedule an event");
      return;
    }

    try {
      const res = await fetch("/api/admin/event/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle,
          type: eventType,
          description: eventDesc,
          date: eventDate,
          image: eventImage
        })
      });
      if (res.ok) {
        alert("EVENT ANNOUNCED SUCCESSFULLY!");
        setEventTitle("");
        setEventDesc("");
        setEventDate("");
        setEventImage("");
        setActiveMenu("dashboard");
        fetchAdminConsoleData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Gallery upload
  const handleUploadGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryTitle.trim() || !galleryUrl.trim()) {
      alert("Title and image URL are required for gallery");
      return;
    }

    try {
      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: galleryTitle,
          type: galleryType,
          url: galleryUrl,
          category: galleryCategory
        })
      });
      if (res.ok) {
        alert("GALLERY UPLOAD PERSISTED SUCCESSFULLY!");
        setGalleryTitle("");
        setGalleryUrl("");
        setGalleryCategory("General");
        setActiveMenu("dashboard");
        fetchAdminConsoleData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Executive form state
  const [editingExecId, setEditingExecId] = useState<string | null>(null);
  const [execName, setExecName] = useState("");
  const [execPosition, setExecPosition] = useState("");
  const [execDepartment, setExecDepartment] = useState("");
  const [execAvatar, setExecAvatar] = useState("");
  const [execEmail, setExecEmail] = useState("");
  const [execBio, setExecBio] = useState("");
  const [execSpeech, setExecSpeech] = useState("");
  const [execAchievements, setExecAchievements] = useState("");

  const resetExecForm = () => {
    setEditingExecId(null);
    setExecName("");
    setExecPosition("");
    setExecDepartment("");
    setExecAvatar("");
    setExecEmail("");
    setExecBio("");
    setExecSpeech("");
    setExecAchievements("");
  };

  const handleStartEditExec = (exec: Executive) => {
    setEditingExecId(exec.id);
    setExecName(exec.name);
    setExecPosition(exec.position);
    setExecDepartment(exec.department);
    setExecAvatar(exec.avatar);
    setExecEmail(exec.email);
    setExecBio(exec.bio);
    setExecSpeech(exec.speech || "");
    setExecAchievements(exec.achievements?.join(", ") || "");
  };

  const handleSaveExec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!execName.trim() || !execPosition.trim()) {
      alert("Name and Position are required");
      return;
    }

    const payload = {
      name: execName,
      position: execPosition,
      department: execDepartment,
      avatar: execAvatar,
      email: execEmail,
      bio: execBio,
      speech: execSpeech,
      achievements: execAchievements.split(",").map(a => a.trim()).filter(a => a)
    };

    try {
      const url = editingExecId ? `/api/admin/executives/${editingExecId}` : "/api/admin/executives";
      const method = editingExecId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingExecId ? "PANEL MEMBER UPDATED SUCCESSFULLY" : "NEW PANEL MEMBER ADDED");
        resetExecForm();
        fetchAdminConsoleData();
      } else {
        alert("Failed to save panel member data.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExec = async (id: string) => {
    if (!confirm("Are you sure you want to delete this panel member?")) return;

    try {
      const res = await fetch(`/api/admin/executives/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("PANEL MEMBER REMOVED");
        fetchAdminConsoleData();
      } else {
        alert("Failed to delete panel member.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div id="admin-login-screen" className={`min-h-screen ${isLoginNightMode ? "bg-gray-950 text-white" : "bg-slate-50 text-slate-900"} flex flex-col justify-between p-6 relative font-sans transition-colors duration-500`}>
        {/* Top bar with back button and Day/Night toggle */}
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-4 z-10">
          <button
            onClick={onExit}
            className={`px-3 py-1.5 rounded-lg border ${isLoginNightMode ? "border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white" : "border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900"} bg-transparent transition-all flex items-center space-x-1 font-mono text-[11px] font-bold`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>EXIT ADMIN PORTAL</span>
          </button>

          <button
            onClick={() => setIsLoginNightMode(!isLoginNightMode)}
            className={`p-2 rounded-full border ${isLoginNightMode ? "border-gray-800 text-yellow-400 hover:bg-gray-900" : "border-slate-300 text-indigo-600 hover:bg-slate-200"} bg-transparent transition-all`}
          >
            {isLoginNightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        {/* Split login bento layout */}
        <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 py-8 z-10">
          
          {/* Left panel: Login form */}
          <div className={`w-full lg:w-1/2 p-8 rounded-2xl border ${isLoginNightMode ? "bg-gray-900/60 border-gray-800/80" : "bg-white border-slate-200 shadow-xl"} max-w-md space-y-6 transition-all duration-300`}>
            <div className="space-y-2">
              <div className={`inline-flex p-3 rounded-xl ${isLoginNightMode ? "bg-cyber-pink/10 border border-cyber-pink/20 text-cyber-pink" : "bg-indigo-50 border border-indigo-100 text-indigo-600"}`}>
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-black tracking-tight uppercase">Admin Verification</h2>
              <p className={`text-xs ${isLoginNightMode ? "text-gray-400" : "text-slate-500"} font-sans`}>
                This zone is restricted to IT Club executives and faculty moderators.
              </p>
            </div>

            {adminLoginError && (
              <div className="p-3 bg-red-950/20 border border-red-800/60 text-red-400 text-xs rounded-lg font-mono">
                {adminLoginError}
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500">Security Access Code</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  required
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  className={`w-full rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-1 ${
                    isLoginNightMode 
                      ? "bg-gray-950 border border-gray-800 text-white placeholder-gray-700 focus:border-cyber-pink focus:ring-cyber-pink" 
                      : "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                  }`}
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isLoginNightMode 
                    ? "bg-cyber-pink hover:bg-cyber-pink/90 text-white shadow-lg shadow-cyber-pink/20" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15"
                }`}
              >
                Unlock Console
              </button>
            </form>
          </div>

          {/* Right panel: AI Assistant widget */}
          <div className={`w-full lg:w-1/2 p-6 rounded-2xl border ${isLoginNightMode ? "bg-gray-900/40 border-gray-800/60" : "bg-slate-100/80 border-slate-200"} h-[380px] max-w-md flex flex-col justify-between transition-all duration-300`}>
            <div className="border-b pb-3 mb-3 flex items-center justify-between border-dashed border-gray-800/60">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isLoginNightMode ? "bg-cyber-pink animate-pulse" : "bg-indigo-500 animate-pulse"}`} />
                <span className="font-mono text-[10px] font-bold tracking-wider uppercase">Admin Aide AI v1.2</span>
              </div>
              <HelpCircle className="w-4 h-4 text-gray-500" />
            </div>

            {/* Chat message box */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[11px] font-sans">
              {loginAiHistory.map((chat, i) => (
                <div key={i} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    chat.role === "user" 
                      ? (isLoginNightMode ? "bg-cyber-pink/10 text-white border border-cyber-pink/20" : "bg-indigo-50 text-indigo-900 border border-indigo-100") 
                      : (isLoginNightMode ? "bg-gray-950/80 text-gray-300 border border-gray-900" : "bg-white text-slate-800 border border-slate-200")
                  }`}>
                    {chat.text}
                  </div>
                </div>
              ))}
              {loginAiLoading && (
                <div className="flex justify-start">
                  <div className={`rounded-xl px-3 py-2 ${isLoginNightMode ? "bg-gray-950/80 border border-gray-900" : "bg-white border border-slate-200"} text-gray-500 font-mono text-[9px] animate-pulse`}>
                    THINKING...
                  </div>
                </div>
              )}
            </div>

            {/* Input message row */}
            <div className="mt-3 flex space-x-2 border-t border-dashed border-gray-800/60 pt-3">
              <input
                type="text"
                placeholder="Ask assistance..."
                value={loginAiMessage}
                onChange={(e) => setLoginAiMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLoginAiSend()}
                className={`flex-1 rounded-lg px-3 py-2 text-[11px] focus:outline-none ${
                  isLoginNightMode 
                    ? "bg-gray-950 border border-gray-800 text-white placeholder-gray-600 focus:border-cyber-pink" 
                    : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
                }`}
              />
              <button
                onClick={handleLoginAiSend}
                className={`px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isLoginNightMode ? "bg-cyber-pink text-white" : "bg-indigo-600 text-white"
                }`}
              >
                Send
              </button>
            </div>
          </div>

        </main>

        {/* Bottom copyright/footer representing Savar Cantonment Public School and College IT Club as simple human text */}
        <footer className={`w-full text-center py-4 font-mono text-[9px] ${isLoginNightMode ? "text-gray-600" : "text-slate-400"}`}>
          Savar Cantonment Public School and College IT Club (SCPSCCH). restricted system access.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-bg text-gray-100 flex flex-col font-sans relative selection:bg-cyber-pink selection:text-white">
      
      {/* GLOW TOP BOARD */}
      <header className="border-b border-gray-900 bg-gray-950/80 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onExit}
            className="p-1.5 rounded-lg border border-gray-800 hover:border-cyber-pink hover:text-cyber-pink text-gray-400 bg-transparent transition-all flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="font-display font-extrabold text-white text-base tracking-tight flex items-center space-x-1.5">
              <span className="text-cyber-pink drop-shadow-[0_0_6px_rgba(236,72,153,0.4)] flex items-center justify-center">
                <CyberHubLogo className="w-5 h-5" />
              </span>
              <span>ADMIN SECURITY CONSOLE</span>
            </span>
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">IT Admin operations console</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Quick Member Account Linker */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-gray-900/80 border border-emerald-500/40 px-2 py-1 rounded-lg">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider hidden lg:inline">🔗 Link Member:</span>
            <select
              value=""
              onChange={(e) => {
                const target = usersList.find(u => u.id === e.target.value);
                if (target) handleSwitchToMemberAccount(target);
              }}
              disabled={switchingUserId !== null}
              className="bg-transparent text-emerald-300 font-mono text-[11px] focus:outline-none cursor-pointer"
            >
              <option value="" disabled className="bg-gray-950 text-gray-400">
                {switchingUserId ? "Linking Account..." : "Select Member View..."}
              </option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id} className="bg-gray-950 text-white">
                  @{u.username} ({u.name || "Student"} - Roll: {u.roll || "N/A"})
                </option>
              ))}
            </select>
          </div>

          {health && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-gray-900/50 border border-gray-800 rounded-lg font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-ping" />
              <span className="text-gray-400">UPTIME: {Math.floor(health.uptime / 60)}M</span>
            </div>
          )}

          <button
            onClick={fetchAdminConsoleData}
            title="Refresh Console Data"
            className="p-1.5 border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:border-gray-700 bg-transparent cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
        
        {/* NAV-TABS FOR ADMIN MODULES */}
        <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-gray-900 bg-gray-950/40 p-4 font-mono text-xs uppercase tracking-wider space-y-1">
          <button
            onClick={() => setActiveMenu("dashboard")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all ${
              activeMenu === "dashboard" ? "bg-cyber-pink text-white font-bold shadow-lg shadow-cyber-pink/20" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
            }`}
          >
            Dashboard SOC
          </button>

          <button
            onClick={() => setActiveMenu("users")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all ${
              activeMenu === "users" ? "bg-cyber-pink text-white font-bold shadow-lg shadow-cyber-pink/20" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
            }`}
          >
            Members & RBAC
          </button>

          <button
            onClick={() => setActiveMenu("messages")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all ${
              activeMenu === "messages" ? "bg-cyber-pink text-white font-bold shadow-lg shadow-cyber-pink/20" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
            }`}
          >
            Support Inbox ({messages.length})
          </button>

          <button
            onClick={() => setActiveMenu("quiz")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all ${
              activeMenu === "quiz" ? "bg-cyber-pink text-white font-bold shadow-lg shadow-cyber-pink/20" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
            }`}
          >
            Quiz Creator
          </button>

          <button
            onClick={() => setActiveMenu("event")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all ${
              activeMenu === "event" ? "bg-cyber-pink text-white font-bold shadow-lg shadow-cyber-pink/20" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
            }`}
          >
            Event Scheduler
          </button>

          <button
            onClick={() => setActiveMenu("gallery")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all ${
              activeMenu === "gallery" ? "bg-cyber-pink text-white font-bold shadow-lg shadow-cyber-pink/20" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
            }`}
          >
            Gallery Manager
          </button>

          <button
            onClick={() => setActiveMenu("executives")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all ${
              activeMenu === "executives" ? "bg-cyber-pink text-white font-bold shadow-lg shadow-cyber-pink/20" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
            }`}
          >
            Panel Members
          </button>

          <button
            onClick={() => setActiveMenu("health")}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all ${
              activeMenu === "health" ? "bg-cyber-pink text-white font-bold shadow-lg shadow-cyber-pink/20" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
            }`}
          >
            NOC Nodes & Backup
          </button>
        </aside>

        {/* ADMIN WORKSPACE CONTAINER */}
        <main className="flex-1 p-6 overflow-y-auto">

          {/* 1. MODULE: DASHBOARD SOC */}
          {activeMenu === "dashboard" && stats && (
            <div className="space-y-8">
              
              {/* Pulsing Indicators Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border border-gray-900 bg-gray-950/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Total Users</span>
                  <div className="text-2xl font-bold font-display text-white">{stats.totalUsers} Members</div>
                </div>
                <div className="p-4 border border-gray-900 bg-gray-950/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Active Exams</span>
                  <div className="text-2xl font-bold font-display text-cyber-cyan">{stats.totalQuizzes} Portals</div>
                </div>
                <div className="p-4 border border-gray-900 bg-gray-950/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Certifications Issued</span>
                  <div className="text-2xl font-bold font-display text-cyber-pink">{stats.quizPassCount} Verified</div>
                </div>
                <div className="p-4 border border-gray-900 bg-gray-950/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Support Threads</span>
                  <div className="text-2xl font-bold font-display text-blue-400">{stats.totalMessages} Active</div>
                </div>
              </div>

              {/* Diagrams Segment */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Traffic Recharts Diagram */}
                <div className="lg:col-span-7 p-5 border border-gray-900 bg-gray-950/40 rounded-2xl space-y-4">
                  <h3 className="text-xs font-mono text-gray-400 uppercase font-bold tracking-wider">
                    Node Traffic Visitors & Queries Flow (Weekly)
                  </h3>
                  
                  <div className="h-64 font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.trafficData}>
                        <defs>
                          <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff007f" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ff007f" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#00ffcc" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="day" stroke="#4b5563" />
                        <YAxis stroke="#4b5563" />
                        <Tooltip contentStyle={{ backgroundColor: "#030712", borderColor: "#1f2937", borderRadius: "8px" }} />
                        <Legend />
                        <Area type="monotone" dataKey="visitors" stroke="#ff007f" fillOpacity={1} fill="url(#colorVisitors)" />
                        <Area type="monotone" dataKey="queries" stroke="#00ffcc" fillOpacity={1} fill="url(#colorQueries)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Students Scale across Departments */}
                <div className="lg:col-span-5 p-5 border border-gray-900 bg-gray-950/40 rounded-2xl space-y-4">
                  <h3 className="text-xs font-mono text-gray-400 uppercase font-bold tracking-wider">
                    Department Member Density
                  </h3>

                  <div className="h-64 font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.departmentCounts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="name" stroke="#4b5563" />
                        <YAxis stroke="#4b5563" />
                        <Tooltip contentStyle={{ backgroundColor: "#030712", borderColor: "#1f2937", borderRadius: "8px" }} />
                        <Bar dataKey="members" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* System Audit Logs Rolling Console */}
              <div className="p-5 border border-gray-900 bg-gray-950 rounded-2xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                  <h3 className="text-xs font-bold text-gray-400 flex items-center space-x-1.5">
                    <Terminal className="w-4 h-4 text-cyber-cyan" />
                    <span>Real-time Security Audit Stream Logs</span>
                  </h3>
                  <span className="text-[10px] text-gray-600">Max 100 entries</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 text-gray-400 text-[11px] leading-relaxed">
                  {logs.slice(0, 15).map((log) => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:space-x-2 border-b border-gray-900/40 pb-1.5">
                      <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className="text-cyber-pink font-semibold shrink-0">@{log.username}</span>
                      <strong className="text-cyber-cyan shrink-0 font-bold">{log.action}:</strong>
                      <span className="text-gray-300">{log.details}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 2. MODULE: STUDENTS & RBAC */}
          {activeMenu === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-900 pb-3">
                <div>
                  <h2 className="text-lg font-display font-bold text-white flex items-center space-x-2">
                    <Users className="w-5 h-5 text-cyber-pink" />
                    <span>Members Registry & Role-Based Access</span>
                  </h2>
                  <p className="text-xs text-gray-400">Link with any member account, test-drive student view, modify privileges, or edit details.</p>
                </div>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by name, roll, class..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full bg-gray-900/90 border border-gray-800 focus:border-cyber-pink text-white font-mono text-xs px-3 py-1.5 rounded-lg focus:outline-none placeholder-gray-600"
                  />
                </div>
              </div>

              {/* Quick Info / Account Linking Banner */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs text-emerald-300">
                <div className="flex items-center space-x-2.5">
                  <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white block font-sans text-sm">Live Member Account Linking Active</strong>
                    <span className="text-[11px] text-emerald-400/80">Click &quot;Open Portal&quot; on any student to test their dashboard, quizzes, and certificates in real-time.</span>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-900/40 px-2.5 py-1 rounded border border-emerald-500/30 shrink-0 text-center">
                  {usersList.length} REGISTERED STUDENTS
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">MEMBER & DETAILS</th>
                      <th className="py-3 px-4">EMAIL & CONTACT</th>
                      <th className="py-3 px-4">ROLE LEVEL</th>
                      <th className="py-3 px-4 text-right">MEMBER ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {usersList
                      .filter((u) => {
                        if (!userSearchTerm.trim()) return true;
                        const term = userSearchTerm.toLowerCase();
                        return (
                          u.username?.toLowerCase().includes(term) ||
                          u.name?.toLowerCase().includes(term) ||
                          u.email?.toLowerCase().includes(term) ||
                          u.roll?.toLowerCase().includes(term) ||
                          u.class?.toLowerCase().includes(term) ||
                          u.chId?.toLowerCase().includes(term)
                        );
                      })
                      .map((usr) => (
                      <React.Fragment key={usr.id}>
                        <tr className="hover:bg-gray-900/20">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">@{usr.username}</div>
                            <div className="text-[11px] text-gray-400 font-sans">
                              {usr.name || "Student"} {usr.roll ? `• Roll: ${usr.roll}` : ""} {usr.class ? `(Class ${usr.class}${usr.section ? `-${usr.section}` : ""})` : ""}
                            </div>
                            {usr.chId && (
                              <span className="text-[9px] text-cyber-cyan font-mono font-bold">CH-ID: {usr.chId}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-gray-400">
                            <div>{usr.email}</div>
                            {usr.phone && <div className="text-[10px] text-gray-500">{usr.phone}</div>}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              usr.role === "Admin" ? "bg-cyber-pink/10 border border-cyber-pink/20 text-cyber-pink" :
                              usr.role === "Executive" ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400" :
                              "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                            }`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end flex-wrap gap-1.5">
                              {/* 1. Switch & Link to Member Account */}
                              <button
                                type="button"
                                disabled={switchingUserId === usr.id}
                                onClick={() => handleSwitchToMemberAccount(usr)}
                                title="Open Member Portal as this user"
                                className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1"
                              >
                                {switchingUserId === usr.id ? (
                                  <span>Linking...</span>
                                ) : (
                                  <span>🔗 Open Portal</span>
                                )}
                              </button>

                              {/* 2. Edit student info */}
                              <button
                                type="button"
                                onClick={() => editingUserId === usr.id ? setEditingUserId(null) : handleOpenEditStudent(usr)}
                                className="px-2.5 py-1 rounded bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                              >
                                {editingUserId === usr.id ? "Close" : "✏️ Edit"}
                              </button>

                              {/* 3. Log Activity */}
                              <button
                                type="button"
                                onClick={() => setSelectedActivityUser(selectedActivityUser === usr.id ? null : usr.id)}
                                className="px-2.5 py-1 rounded bg-cyber-cyan/10 hover:bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                              >
                                {selectedActivityUser === usr.id ? "Close" : "⚡ Log"}
                              </button>

                              {/* 4. Role selector */}
                              <select
                                value={usr.role}
                                onChange={(e) => handleUpdateRole(usr.id, e.target.value)}
                                className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-[11px] text-gray-300 focus:outline-none cursor-pointer"
                              >
                                <option value="Member">Member</option>
                                <option value="Executive">Executive</option>
                                <option value="Admin">Admin</option>
                              </select>
                            </div>
                          </td>
                        </tr>

                        {/* EDIT STUDENT INFO INLINE FORM */}
                        {editingUserId === usr.id && (
                          <tr className="bg-gray-950/70 border-t border-b border-gray-800">
                            <td colSpan={4} className="p-4">
                              <div className="max-w-2xl space-y-3 font-mono text-xs">
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                  <h4 className="text-[11px] font-bold text-cyber-pink uppercase tracking-wider">
                                    EDIT STUDENT PROFILE: @{usr.username}
                                  </h4>
                                  <span className="text-[10px] text-gray-500">Auto-syncs with Member Dashboard</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[9px] text-gray-400 uppercase mb-1">Full Name</label>
                                    <input
                                      type="text"
                                      value={editUserData.name}
                                      onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                                      className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyber-pink"
                                      placeholder="Student Name"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-gray-400 uppercase mb-1">Roll Number (Numbers)</label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={editUserData.roll}
                                      onChange={(e) => setEditUserData({ ...editUserData, roll: e.target.value.replace(/\D/g, "") })}
                                      className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyber-pink font-mono"
                                      placeholder="e.g. 1024"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-gray-400 uppercase mb-1">Class / Grade (Numbers)</label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={editUserData.class}
                                      onChange={(e) => setEditUserData({ ...editUserData, class: e.target.value.replace(/\D/g, "") })}
                                      className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyber-pink font-mono"
                                      placeholder="e.g. 9 or 10 or 11"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[9px] text-gray-400 uppercase mb-1">Section (Text)</label>
                                    <input
                                      type="text"
                                      value={editUserData.section}
                                      onChange={(e) => setEditUserData({ ...editUserData, section: e.target.value.replace(/[^a-zA-Z\s]/g, "") })}
                                      className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyber-pink font-mono"
                                      placeholder="e.g. A / Meghna"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-gray-400 uppercase mb-1">Phone Number (Numbers)</label>
                                    <input
                                      type="tel"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={editUserData.phone}
                                      onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value.replace(/\D/g, "") })}
                                      className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyber-pink font-mono"
                                      placeholder="e.g. 01700000000"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-gray-400 uppercase mb-1">Club CH-ID</label>
                                    <input
                                      type="text"
                                      value={editUserData.chId}
                                      onChange={(e) => setEditUserData({ ...editUserData, chId: e.target.value })}
                                      className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyber-pink font-mono"
                                      placeholder="e.g. CH-9021"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[9px] text-gray-400 uppercase mb-1">Skills (comma separated)</label>
                                  <input
                                    type="text"
                                    value={editUserData.skills}
                                    onChange={(e) => setEditUserData({ ...editUserData, skills: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyber-pink"
                                    placeholder="Python, React, Ethical Hacking, Robotics"
                                  />
                                </div>

                                <div className="flex justify-end space-x-2 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingUserId(null)}
                                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded text-[10px] uppercase font-bold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveStudentInfo(usr.id)}
                                    className="px-4 py-1.5 bg-cyber-pink text-white hover:bg-cyber-pink/90 rounded text-[10px] uppercase font-bold cursor-pointer shadow"
                                  >
                                    Save Student Details
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* DISPATCH ACTIVITY FORM */}
                        {selectedActivityUser === usr.id && (
                          <tr className="bg-gray-950/50">
                            <td colSpan={4} className="p-4 border-t border-b border-gray-800">
                              <div className="max-w-xl space-y-4 font-mono text-xs">
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                  <h4 className="text-[11px] font-bold text-cyber-cyan uppercase tracking-wider">
                                    DISPATCH OFFICIAL ACTIVITY TO @{usr.username}
                                  </h4>
                                  {activitySuccess === usr.id && (
                                    <span className="text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded font-bold animate-bounce">
                                      ACTIVITY DISPATCHED
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[9px] text-gray-500 uppercase mb-1">Activity Title *</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Hacking Lab Complete"
                                      value={activityTitle}
                                      onChange={(e) => setActivityTitle(e.target.value)}
                                      className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] text-gray-500 uppercase mb-1">Target Section *</label>
                                    <select
                                      value={activityType}
                                      onChange={(e) => setActivityType(e.target.value)}
                                      className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                                    >
                                      <option value="Attendance">Attendance (Log Class Mark)</option>
                                      <option value="Achievement">Achievement (Award Achievement Pin)</option>
                                      <option value="Badge">Badge (Award Club Badge)</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[9px] text-gray-500 uppercase mb-1">Activity Description *</label>
                                  <textarea
                                    placeholder="Explain student task performance in detail..."
                                    rows={2}
                                    value={activityDesc}
                                    onChange={(e) => setActivityDesc(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan"
                                  />
                                </div>

                                <div className="flex justify-end space-x-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedActivityUser(null)}
                                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded text-[10px] uppercase font-bold"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={activityLoading}
                                    onClick={() => handleSendActivity(usr.id)}
                                    className="px-4 py-1 bg-cyber-cyan text-gray-950 hover:bg-cyber-cyan/90 rounded text-[10px] uppercase font-bold cursor-pointer"
                                  >
                                    {activityLoading ? "Sending..." : "Dispatch"}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. MODULE: SUPPORT INBOX */}
          {activeMenu === "messages" && (
            <div className="space-y-6">
              <div className="border-b border-gray-900 pb-3">
                <h2 className="text-lg font-display font-bold text-white">Support Inquiry Inbox</h2>
                <p className="text-xs text-gray-400">Respond directly to member issues. Submitted answers update profiles in real-time.</p>
              </div>

              <div className="space-y-6">
                {messages.length === 0 ? (
                  <p className="text-center font-mono text-xs text-gray-600 p-8 border border-dashed border-gray-900 rounded-xl">
                    No support tickets found in system queue.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="p-5 border border-gray-900 bg-gray-900/10 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                        <span>TICKET: {msg.id} | MEMBER: @{msg.username} ({msg.email})</span>
                        <span>{new Date(msg.timestamp).toLocaleString()}</span>
                      </div>

                      <p className="text-xs text-white bg-gray-950/60 p-3 rounded-lg leading-relaxed">{msg.content}</p>

                      {msg.replies.map((rep) => (
                        <div key={rep.id} className="bg-cyber-pink/5 border-l-2 border-cyber-pink p-3 rounded-r-lg space-y-1 ml-6 font-mono text-xs">
                          <span className="font-bold text-cyber-pink text-[10px]">{rep.sender}</span>
                          <p className="text-gray-300">{rep.content}</p>
                          <span className="text-[9px] text-gray-500">{new Date(rep.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}

                      {/* Reply Editor */}
                      <div className="pt-2 flex gap-2 ml-6">
                        <input
                          type="text"
                          value={replyTextMap[msg.id] || ""}
                          onChange={(e) => setReplyTextMap(prev => ({ ...prev, [msg.id]: e.target.value }))}
                          placeholder="Type response back to member..."
                          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSendReply(msg.id)}
                          className="bg-cyber-pink text-white font-mono text-[10px] font-bold px-4 py-2 rounded-lg flex items-center space-x-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>SEND REPLY</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. MODULE: QUIZ CREATOR */}
          {activeMenu === "quiz" && (
            <div className="space-y-6">
              <div className="border-b border-gray-900 pb-3">
                <h2 className="text-lg font-display font-bold text-white">Create Quiz & Exam questionnaires</h2>
                <p className="text-xs text-gray-400">Define MCQ question banks, duration parameters, and penalty marking profiles.</p>
              </div>

              <form onSubmit={handleCreateQuiz} className="space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">EXAM TITLE</label>
                    <input
                      type="text"
                      required
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="e.g. Advanced Cryptography Basics"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">DURATION (MINUTES)</label>
                    <input
                      type="number"
                      required
                      value={quizDur}
                      onChange={(e) => setQuizDur(Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">QUIZ DESCRIPTION SUMMARY</label>
                  <textarea
                    rows={2}
                    value={quizDesc}
                    onChange={(e) => setQuizDesc(e.target.value)}
                    placeholder="Short description highlighting curriculum details..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs text-white"
                  />
                </div>

                <div className="flex items-center space-x-2 bg-gray-900/25 p-3 rounded-xl border border-gray-900">
                  <input
                    type="checkbox"
                    id="neg-marking"
                    checked={quizNegative}
                    onChange={(e) => setQuizNegative(e.target.checked)}
                    className="accent-cyber-pink"
                  />
                  <label htmlFor="neg-marking" className="text-xs font-mono text-gray-300 cursor-pointer">
                    Enable penalty marks (-25% for incorrect submissions)
                  </label>
                </div>

                {/* Question builder modules */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <h3 className="text-xs font-mono text-gray-400 font-bold uppercase">Configure MCQs ({quizQuestions.length})</h3>
                    <button
                      type="button"
                      onClick={handleAddQuestionBlock}
                      className="text-[10px] font-mono text-cyber-pink border border-cyber-pink/20 bg-cyber-pink/5 hover:bg-cyber-pink hover:text-white px-2 py-1 rounded"
                    >
                      ADD MODULE
                    </button>
                  </div>

                  {quizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="p-4 border border-gray-900 bg-gray-950/20 rounded-xl space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">QUESTION TEXT #{qIdx + 1}</label>
                        <input
                          type="text"
                          required
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...quizQuestions];
                            updated[qIdx].question = e.target.value;
                            setQuizQuestions(updated);
                          }}
                          placeholder="Enter your question details..."
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {q.options.map((opt: string, oIdx: number) => (
                          <div key={oIdx}>
                            <label className="block text-[9px] font-mono text-gray-500 mb-0.5">OPTION {oIdx + 1}</label>
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => {
                                const updated = [...quizQuestions];
                                updated[qIdx].options[oIdx] = e.target.value;
                                setQuizQuestions(updated);
                              }}
                              className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-xs text-white"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">CORRECT OPTION INDEX</label>
                          <select
                            value={q.correctIndex}
                            onChange={(e) => {
                              const updated = [...quizQuestions];
                              updated[qIdx].correctIndex = Number(e.target.value);
                              setQuizQuestions(updated);
                            }}
                            className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          >
                            <option value={0}>Option 1</option>
                            <option value={1}>Option 2</option>
                            <option value={2}>Option 3</option>
                            <option value={3}>Option 4</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">POINTS AWARDED</label>
                          <input
                            type="number"
                            required
                            value={q.points}
                            onChange={(e) => {
                              const updated = [...quizQuestions];
                              updated[qIdx].points = Number(e.target.value);
                              setQuizQuestions(updated);
                            }}
                            className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="bg-cyber-pink hover:bg-cyber-pink/90 text-white font-display font-bold text-xs px-6 py-3 rounded-lg"
                >
                  PUBLISH EXAM QUESTIONNAIRE
                </button>
              </form>
            </div>
          )}

          {/* 5. MODULE: EVENT SCHEDULER */}
          {activeMenu === "event" && (
            <div className="space-y-6">
              <div className="border-b border-gray-900 pb-3">
                <h2 className="text-lg font-display font-bold text-white">Schedule Workshops, Seminars, & Competitions</h2>
                <p className="text-xs text-gray-400">Broadcast live countdown events, hackathons, and certifications access forms.</p>
              </div>

              <form onSubmit={handleScheduleEvent} className="space-y-5 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">EVENT TITLE</label>
                    <input
                      type="text"
                      required
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="e.g. Robotics Maze Solver Challenge"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">EVENT CLASSIFICATION</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as any)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="Workshop">Workshop</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Competition">Competition</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">LAUNCH SCHEDULING TIME</label>
                    <input
                      type="datetime-local"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-cyber-cyan uppercase mb-2 font-bold">UPLOAD EVENT BANNER OR CHOOSE PRESET</label>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-900/60 border border-dashed border-gray-800 rounded-lg text-center">
                        {eventImage ? (
                          <div className="space-y-1.5">
                            <img src={eventImage} alt="Preview" className="w-24 h-12 object-cover mx-auto rounded border border-gray-800" />
                            <button
                              type="button"
                              onClick={() => setEventImage("")}
                              className="text-[9px] text-red-400 font-mono hover:underline uppercase block mx-auto"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="file"
                              accept="image/*"
                              id="event-file-upload"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEventImage(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <label
                              htmlFor="event-file-upload"
                              className="inline-block bg-gray-800 hover:bg-gray-700 text-white text-[9px] font-mono py-1 px-3 rounded cursor-pointer transition-all border border-gray-700 font-bold uppercase"
                            >
                              Upload Local Image
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { name: "IT Workshop", url: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=400" },
                          { name: "Tech Talk", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400" },
                          { name: "Bootcamp", url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=400" }
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setEventImage(preset.url)}
                            className={`p-1 bg-gray-950 hover:bg-gray-900 border rounded text-[8px] font-mono text-gray-300 flex flex-col items-center text-center transition-all ${
                              eventImage === preset.url ? "border-cyber-pink bg-cyber-pink/10 text-white" : "border-gray-900"
                            }`}
                          >
                            <span className="truncate w-full">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">EVENT DESCRIPTION BRIEF</label>
                  <textarea
                    rows={3}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Enter curriculum outlines, schedules, team structures..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-cyber-pink hover:bg-cyber-pink/90 text-white font-display font-bold text-xs px-6 py-3 rounded-lg"
                >
                  BROADCAST SCHEDULING EVENT
                </button>
              </form>
            </div>
          )}

          {/* 6. MODULE: GALLERY MANAGER */}
          {activeMenu === "gallery" && (
            <div className="space-y-6">
              <div className="border-b border-gray-900 pb-3">
                <h2 className="text-lg font-display font-bold text-white">IT Club Gallery Upload manager</h2>
                <p className="text-xs text-gray-400">Upload and catalog captures of previous SCPSC launch ceremonies and labs.</p>
              </div>

              <form onSubmit={handleUploadGallery} className="space-y-5 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">MEDIA CAPTION TITLE</label>
                    <input
                      type="text"
                      required
                      value={galleryTitle}
                      onChange={(e) => setGalleryTitle(e.target.value)}
                      placeholder="e.g. SCPSC IT Hackathon 2026 Finals"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">CATEGORY FILTER</label>
                    <select
                      value={galleryCategory}
                      onChange={(e) => setGalleryCategory(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="Ceremony">Ceremony</option>
                      <option value="Robotics">Robotics</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2 font-bold text-cyber-cyan">UPLOAD GALLERY FILE OR CHOOSE PRESET</label>
                  
                  {/* File Upload zone */}
                  <div className="p-4 bg-gray-900/60 border border-dashed border-gray-800 rounded-lg text-center space-y-3">
                    {galleryUrl ? (
                      <div className="space-y-2">
                        <img src={galleryUrl} alt="Preview" className="w-32 h-20 object-cover mx-auto rounded border border-gray-800" />
                        <button
                          type="button"
                          onClick={() => setGalleryUrl("")}
                          className="text-[10px] text-red-400 font-mono hover:underline uppercase"
                        >
                          Clear Selection
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <input
                          type="file"
                          accept="image/*"
                          id="gallery-file-upload"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setGalleryUrl(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label
                          htmlFor="gallery-file-upload"
                          className="inline-block bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-mono py-1.5 px-4 rounded-lg cursor-pointer transition-all border border-gray-700 font-bold uppercase"
                        >
                          Select Image from Computer
                        </label>
                        <p className="text-[9px] text-gray-500 font-mono">PNG, JPG format automatically handled</p>
                      </div>
                    )}
                  </div>

                  {/* Preset Choices */}
                  <div className="mt-3">
                    <span className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Or Quick Presets:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: "IT Lab Room", url: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=400" },
                        { name: "Code Contest", url: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&q=80&w=400" },
                        { name: "Robotics Unit", url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=400" },
                        { name: "Prize Ceremony", url: "https://images.unsplash.com/photo-1496469888073-80de7e9b252c?auto=format&fit=crop&q=80&w=400" }
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setGalleryUrl(preset.url)}
                          className={`p-1.5 bg-gray-950 hover:bg-gray-900 border rounded text-[9px] font-mono text-gray-300 flex flex-col items-center text-center transition-all ${
                            galleryUrl === preset.url ? "border-cyber-pink bg-cyber-pink/10 text-white" : "border-gray-900"
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-8 object-cover rounded mb-1" />
                          <span className="truncate w-full">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-cyber-pink hover:bg-cyber-pink/90 text-white font-display font-bold text-xs px-6 py-3 rounded-lg"
                >
                  UPLOAD TO GALLERY
                </button>
              </form>
            </div>
          )}

          {/* MODULE: EXECUTIVE PANEL MEMBERS */}
          {activeMenu === "executives" && (
            <div className="space-y-8">
              <div className="border-b border-gray-900 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-display font-bold text-white">Executive & Panel Members</h2>
                  <p className="text-xs text-gray-400">Configure core IT Club executive panel portfolios, customize biographies, and assign dedicated messages/speeches.</p>
                </div>
                {editingExecId && (
                  <button 
                    onClick={resetExecForm}
                    className="text-xs text-cyber-pink hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                  >
                    Clear Edit Mode
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: ROSTER LIST */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">Current Panel Members ({executives.length})</h3>
                  {executives.length === 0 ? (
                    <div className="p-8 border border-dashed border-gray-800 text-center text-sm text-gray-500 rounded-xl">
                      No panel members discovered.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {executives.map((exec) => (
                        <div key={exec.id} className="p-4 bg-gray-950/40 border border-gray-900 rounded-xl flex flex-col justify-between space-y-4 hover:border-cyber-pink/50 transition-all">
                          <div className="flex items-start space-x-3">
                            <img 
                              src={exec.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                              alt={exec.name} 
                              className="w-12 h-12 rounded-lg object-cover border border-gray-800"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <h4 className="font-display font-bold text-sm text-white truncate">{exec.name}</h4>
                              <p className="text-xs text-cyber-pink font-mono">{exec.position}</p>
                              <p className="text-[10px] text-gray-400 truncate">{exec.department}</p>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <p className="text-[10px] font-mono text-gray-500">EMAIL: {exec.email || "N/A"}</p>
                            <p className="text-gray-300 italic line-clamp-2">"{exec.bio}"</p>
                          </div>

                          {exec.speech && (
                            <div className="bg-gray-900/60 rounded p-2.5 border border-gray-800/60">
                              <p className="text-[9px] font-mono uppercase tracking-widest text-cyber-cyan mb-1 font-semibold">★ Dedicated Speech:</p>
                              <p className="text-gray-400 text-[10px] italic line-clamp-3">"{exec.speech}"</p>
                            </div>
                          )}

                          {exec.achievements && exec.achievements.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {exec.achievements.map((ach, i) => (
                                <span key={i} className="text-[8px] font-mono bg-cyber-pink/10 text-cyber-pink px-1.5 py-0.5 rounded border border-cyber-pink/25">
                                  {ach}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="pt-2 border-t border-gray-900 flex justify-end space-x-2 font-mono text-[10px]">
                            <button
                              onClick={() => handleStartEditExec(exec)}
                              className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-gray-800 transition-all cursor-pointer"
                            >
                              Edit Profile
                            </button>
                            <button
                              onClick={() => handleDeleteExec(exec.id)}
                              className="px-2.5 py-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded border border-red-900/40 transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT: FORM */}
                <div className="p-5 border border-gray-900 bg-gray-950/30 rounded-xl space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">
                    {editingExecId ? "★ Edit Executive Profile" : "★ Add New Panel Portfolio"}
                  </h3>
                  
                  <form onSubmit={handleSaveExec} className="space-y-3 font-sans text-xs">
                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={execName}
                        onChange={(e) => setExecName(e.target.value)}
                        placeholder="e.g. Mahir Faisal"
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Executive Position</label>
                      <input 
                        type="text" 
                        required
                        value={execPosition}
                        onChange={(e) => setExecPosition(e.target.value)}
                        placeholder="e.g. President, Web Lead"
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Department Portfolio</label>
                      <input 
                        type="text" 
                        value={execDepartment}
                        onChange={(e) => setExecDepartment(e.target.value)}
                        placeholder="e.g. Cyber Security & CTF"
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-cyber-cyan uppercase block mb-2 font-bold">UPLOAD AVATAR OR CHOOSE PRESET</label>
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-900/60 border border-dashed border-gray-800 rounded text-center">
                          {execAvatar ? (
                            <div className="space-y-1.5">
                              <img src={execAvatar} alt="Preview" className="w-12 h-12 object-cover mx-auto rounded-full border border-gray-800" />
                              <button
                                type="button"
                                onClick={() => setExecAvatar("")}
                                className="text-[9px] text-red-400 font-mono hover:underline uppercase block mx-auto"
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <input
                                type="file"
                                accept="image/*"
                                id="exec-file-upload"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setExecAvatar(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <label
                                htmlFor="exec-file-upload"
                                className="inline-block bg-gray-800 hover:bg-gray-700 text-white text-[9px] font-mono py-1 px-3 rounded cursor-pointer transition-all border border-gray-700 font-bold uppercase"
                              >
                                Upload Avatar
                              </label>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { name: "Male 1", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100" },
                            { name: "Female 1", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" },
                            { name: "Male 2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" },
                            { name: "Female 2", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100" }
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setExecAvatar(preset.url)}
                              className={`p-1 bg-gray-950 hover:bg-gray-900 border rounded text-[8px] font-mono text-gray-300 flex flex-col items-center text-center transition-all ${
                                execAvatar === preset.url ? "border-cyber-pink bg-cyber-pink/10 text-white" : "border-gray-900"
                              }`}
                            >
                              <img src={preset.url} alt={preset.name} className="w-6 h-6 rounded-full object-cover mb-1" />
                              <span className="truncate w-full">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Contact Email</label>
                      <input 
                        type="email" 
                        value={execEmail}
                        onChange={(e) => setExecEmail(e.target.value)}
                        placeholder="executive@cyberhub.edu"
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Executive Biography</label>
                      <textarea 
                        rows={2}
                        value={execBio}
                        onChange={(e) => setExecBio(e.target.value)}
                        placeholder="Brief summary of duties and focus..."
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1 text-cyber-cyan font-semibold">★ Dedicated Speech / Message</label>
                      <textarea 
                        rows={3}
                        value={execSpeech}
                        onChange={(e) => setExecSpeech(e.target.value)}
                        placeholder="A custom dedicated address, speech, or message of support to the club members..."
                        className="w-full bg-gray-900 border border-cyber-cyan/30 rounded px-3 py-2 text-white resize-none focus:border-cyber-cyan"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Achievements (Comma-separated)</label>
                      <input 
                        type="text" 
                        value={execAchievements}
                        onChange={(e) => setExecAchievements(e.target.value)}
                        placeholder="e.g. CTF Finalist, ICT Olympiad 1st"
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white"
                      />
                    </div>

                    <div className="pt-2 flex gap-2 font-mono text-[10px]">
                      <button
                        type="submit"
                        className="flex-1 bg-cyber-pink hover:bg-cyber-pink/90 text-white font-bold py-2.5 rounded text-center transition-all cursor-pointer"
                      >
                        {editingExecId ? "UPDATE MEMBER" : "SAVE PORTFOLIO"}
                      </button>
                      {editingExecId && (
                        <button
                          type="button"
                          onClick={resetExecForm}
                          className="px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 7. MODULE: NOC NODES & BACKUP */}
          {activeMenu === "health" && health && (
            <div className="space-y-8">
              <div className="border-b border-gray-900 pb-3">
                <h2 className="text-lg font-display font-bold text-white">Network NOC Nodes & DB Backup Manager</h2>
                <p className="text-xs text-gray-400">View container specifications, node memory heaps, and archive database snapshots.</p>
              </div>

              {/* Memory heaps gauge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
                <div className="p-5 border border-gray-900 bg-gray-950/30 rounded-xl space-y-2">
                  <HeartPulse className="w-5 h-5 text-cyber-cyan" />
                  <span className="text-gray-500 block">CONTAINER HEALTH</span>
                  <div className="text-xl font-bold text-white uppercase">{health.status}</div>
                </div>

                <div className="p-5 border border-gray-900 bg-gray-950/30 rounded-xl space-y-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-500 block">DB PERSISTENCE SIZE</span>
                  <div className="text-xl font-bold text-white">{(health.dbSize / 1024).toFixed(2)} KB</div>
                </div>

                <div className="p-5 border border-gray-900 bg-gray-950/30 rounded-xl space-y-2">
                  <Activity className="w-5 h-5 text-cyber-pink" />
                  <span className="text-gray-500 block">VIRTUAL RSS HEAP</span>
                  <div className="text-xl font-bold text-white">
                    {Math.floor(health.memoryUsage.rss / (1024 * 1024))} MB
                  </div>
                </div>
              </div>

              {/* Trigger Backup block */}
              <div className="p-6 border-2 border-dashed border-gray-900 bg-gray-950/20 rounded-2xl text-center space-y-4 max-w-lg mx-auto">
                <Database className="w-12 h-12 text-cyber-pink mx-auto animate-bounce" />
                <h3 className="text-base font-display font-bold text-white">Backup Database Snapshot</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Exporting db.json creates a timestamped JSON snapshot archive under `./backups/` directory instantly, protecting user progress and quiz results from cold restart disruptions.
                </p>

                <button
                  onClick={handleTriggerBackup}
                  disabled={loading}
                  className="bg-cyber-pink hover:bg-cyber-pink/90 text-white font-mono text-xs font-bold px-5 py-2.5 rounded-lg flex items-center justify-center space-x-1 mx-auto"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  <span>ARCHIVE DB SNAPSHOT</span>
                </button>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
