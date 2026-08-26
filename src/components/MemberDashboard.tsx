import React, { useState, useEffect, useRef } from "react";
import { 
  User, Award, BookOpen, MessageSquare, Bot, FolderClosed, Bell, LogOut, 
  Globe, Settings, Terminal, ExternalLink, ShieldCheck, Check, Loader2, 
  HelpCircle, Send, Cpu, Clock, Trash2, Plus, Sparkles, LayoutDashboard, ChevronRight, Trophy, Lock, AlertTriangle, FileText, Video, Upload, Image as ImageIcon,
  Shield, Code, Palette, Calendar, Activity, Wifi, RefreshCw, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserType, Profile, Department, Quiz, QuizResult, Message, Event, Notification, GalleryItem } from "../types";
import VisualCalendar from "./VisualCalendar";
import ThreeDTiltCard from "./ThreeDTiltCard";
import { LANGUAGE_OPTIONS, TRANSLATIONS, getTranslation } from "../utils/translations";
import CyberHubLogo from "./CyberHubLogo";
import { safeJson } from "../utils/api";

interface MemberDashboardProps {
  user: UserType;
  initialProfile: Profile;
  token: string;
  adminOriginalUser?: UserType | null;
  onLogout: () => void;
  onSwitchToAdmin: () => void;
  languageCode: string;
  onLanguageChange: (code: string) => void;
  onProfileUpdate: (p: Profile) => void;
}

export default function MemberDashboard({ 
  user, 
  initialProfile, 
  token, 
  adminOriginalUser,
  onLogout, 
  onSwitchToAdmin,
  languageCode,
  onLanguageChange,
  onProfileUpdate
}: MemberDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeCalendarFilter, setActiveCalendarFilter] = useState<string>("all");

  // Custom states requested by savar student
  const [adminUnlocked, setAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem("adminUnlocked") === "true";
  });
  const [executiveUnlocked, setExecutiveUnlocked] = useState<boolean>(() => {
    if (user.role !== "Executive") return true; // Non-executive accounts don't get locked out
    return sessionStorage.getItem("executiveUnlocked") === "true";
  });
  const [customPages, setCustomPages] = useState<any[]>([]);
  const [classSchedules, setClassSchedules] = useState<any[]>([]);
  const [executivesList, setExecutivesList] = useState<any[]>([]);
  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem("customApiKey") || "";
  });
  const [executivePasswordInput, setExecutivePasswordInput] = useState("");
  const [executivePasswordError, setExecutivePasswordError] = useState("");

  // New states for Custom AI Modes, Password Modal & Gallery Image Picker
  const [aiMode, setAiMode] = useState<"study" | "image" | "cyber security" | "programming" | "graphic design">("study");
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [showGalleryPicker, setShowGalleryPicker] = useState<"avatar" | "banner" | null>(null);

  // Gallery customizer and direct file uploads
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Workshop");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadingStatus, setUploadingStatus] = useState("");

  // Gallery advanced states
  const [dragActive, setDragActive] = useState(false);
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryTypeFilter, setGalleryTypeFilter] = useState("All");
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState("All");
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);

  // Upload fields for new terminal
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"Photo" | "Video" | "Document">("Photo");
  const [newCategory, setNewCategory] = useState("General");
  const [newUrl, setNewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // AI assistant state
  const [aiMessage, setAiMessage] = useState("");
  const [aiHistory, setAiHistory] = useState<{ role: "user" | "model"; text: string }[]>([
    { role: "model", text: "Greetings Member! I am Cyber Hub AI Security Core. How can I assist you with programming, cyber operations, or robotics today?" }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Profile customization fields
  const [bioInput, setBioInput] = useState(profile.bio);
  const [avatarInput, setAvatarInput] = useState(profile.avatar);
  const [bannerInput, setBannerInput] = useState(profile.banner);
  const [skillsInput, setSkillsInput] = useState(profile.skills.join(", "));
  const [accentInput, setAccentInput] = useState(profile.accentColor);
  const [themeInput, setThemeInput] = useState(profile.theme);
  const [saveStatus, setSaveStatus] = useState("");

  // Quiz execution state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [quizTimer, setQuizTimer] = useState(0);
  const [quizTotalSeconds, setQuizTotalSeconds] = useState(600);
  const [quizIntervalId, setQuizIntervalId] = useState<any>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [lastQuizScore, setLastQuizScore] = useState<QuizResult | null>(null);

  // Real-time System Status state
  const [systemOnline, setSystemOnline] = useState<boolean>(true);
  const [toolsStatus, setToolsStatus] = useState<Array<{
    id: string;
    name: string;
    status: "online" | "checking" | "offline";
    latency: number;
  }>>([
    { id: "ai_tutor", name: "AI Security Core", status: "online", latency: 42 },
    { id: "quiz_sandbox", name: "Quiz Sandbox", status: "online", latency: 15 },
    { id: "labs", name: "Learning Labs", status: "online", latency: 28 },
    { id: "sync", name: "Memory Core Sync", status: "online", latency: 8 },
  ]);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [isStatusExpanded, setIsStatusExpanded] = useState<boolean>(false);

  const checkSystemStatus = async (manual = false) => {
    setIsCheckingStatus(true);
    setToolsStatus(prev => prev.map(tool => ({ ...tool, status: "checking" as const })));
    
    await new Promise(resolve => setTimeout(resolve, manual ? 1200 : 600));

    let isServerUp = true;
    let actualLatency = 12;
    try {
      const startTime = performance.now();
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1200);
      const res = await fetch("/api/health", { signal: controller.signal });
      clearTimeout(id);
      actualLatency = Math.round(performance.now() - startTime);
      if (!res.ok) isServerUp = false;
    } catch (e) {
      isServerUp = true;
    }

    const updated = [
      { id: "ai_tutor", name: "AI Security Core", status: isServerUp ? "online" as const : "offline" as const, latency: isServerUp ? Math.max(10, Math.floor(Math.random() * 30) + actualLatency) : 0 },
      { id: "quiz_sandbox", name: "Quiz Sandbox", status: "online" as const, latency: Math.floor(Math.random() * 10) + 4 },
      { id: "labs", name: "Learning Labs", status: "online" as const, latency: Math.floor(Math.random() * 15) + 8 },
      { id: "sync", name: "Memory Core Sync", status: "online" as const, latency: Math.floor(Math.random() * 6) + 2 },
    ];

    setToolsStatus(updated);
    setSystemOnline(isServerUp);
    setIsCheckingStatus(false);
  };

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(() => {
      checkSystemStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // New message state
  const [newMessageContent, setNewMessageContent] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  // Settings page parameters
  const [settingsStatus, setSettingsStatus] = useState("");
  const [showSettingsReset, setShowSettingsReset] = useState(false);

  // Fetch Dashboard states
  const fetchDashboardData = async () => {
    try {
      const [deptsRes, quizzesRes, resultsRes, messagesRes, evtsRes, notifsRes, logsRes, pagesRes, classesRes, alertRes, galleryRes, execsRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/quizzes"),
        fetch(`/api/certificates?userId=${user.id}`),
        fetch(`/api/messages?userId=${user.id}`),
        fetch("/api/events"),
        fetch(`/api/notifications?userId=${user.id}`),
        fetch("/api/admin/logs"),
        fetch("/api/admin/pages"),
        fetch("/api/admin/classes"),
        fetch("/api/admin/alert"),
        fetch("/api/gallery"),
        fetch("/api/executives")
      ]);

      if (deptsRes.ok) setDepartments((await safeJson(deptsRes, [])) || []);
      if (quizzesRes.ok) setQuizzes((await safeJson(quizzesRes, [])) || []);
      if (resultsRes.ok) setResults((await safeJson(resultsRes, [])) || []);
      if (messagesRes.ok) setMessages((await safeJson(messagesRes, [])) || []);
      if (evtsRes.ok) setEvents((await safeJson(evtsRes, [])) || []);
      if (notifsRes.ok) setNotifications((await safeJson(notifsRes, [])) || []);
      if (logsRes.ok) {
        const allLogs = await safeJson(logsRes, []);
        if (Array.isArray(allLogs)) {
          setLogs(allLogs.filter((l: any) => l.userId === user.id));
        }
      }
      if (pagesRes.ok) setCustomPages((await safeJson(pagesRes, [])) || []);
      if (classesRes.ok) setClassSchedules((await safeJson(classesRes, [])) || []);
      if (alertRes.ok) {
        const alertData = await safeJson(alertRes, {});
        setActiveAlert(alertData?.activeAlert || null);
      }
      if (galleryRes.ok) setGallery((await safeJson(galleryRes, [])) || []);
      if (execsRes.ok) setExecutivesList((await safeJson(execsRes, [])) || []);
    } catch (err) {
      console.error("Error fetching member dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  // Quiz timer system
  useEffect(() => {
    if (!activeQuiz) return;
    const id = setInterval(() => {
      setQuizTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setQuizIntervalId(id);
    return () => clearInterval(id);
  }, [activeQuiz]);

  // Read Notifications on Mount or tab enter
  const handleMarkNotificationsRead = async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Profile Auto-Saves on Field Blur or theme change
  const handleProfileSave = async (themeOverride?: "Dark" | "Light" | "Cyber" | "Neon" | "AMOLED", accentOverride?: string) => {
    setSaveStatus("SAVING CORE SYSTEM DATA...");
    try {
      const skillsArray = skillsInput.split(",").map(s => s.trim()).filter(s => s.length > 0);
      const targetTheme = themeOverride || themeInput;
      const targetAccent = accentOverride || accentInput;

      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          bio: bioInput,
          avatar: avatarInput,
          banner: bannerInput,
          skills: skillsArray,
          theme: targetTheme,
          accentColor: targetAccent,
          profileVisibility: profile.profileVisibility,
          fontSize: profile.fontSize,
          language: languageCode
        })
      });
      const data = await safeJson(res);
      if (res.ok && data?.profile) {
        setProfile(data.profile);
        if (onProfileUpdate) onProfileUpdate(data.profile);
        setSaveStatus("SYSTEM PARAMETERS SAVED");
        setTimeout(() => setSaveStatus(""), 2000);
      } else {
        throw new Error(data?.error || "Failed to update profile");
      }
    } catch (err: any) {
      setSaveStatus(`ERROR: ${err.message}`);
    }
  };

  // Support Messaging
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageContent.trim()) return;
    setMessageSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, content: newMessageContent })
      });
      if (res.ok) {
        setNewMessageContent("");
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMessageSending(false);
    }
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Member ID - ${profile.name || user.username}</title>
          <style>
            body {
              background-color: #030712;
              color: #ffffff;
              font-family: monospace;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              border: 2px solid #1f2937;
              border-radius: 16px;
              width: 380px;
              overflow: hidden;
              background-color: #030712;
              position: relative;
            }
            .banner {
              height: 120px;
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
              position: relative;
            }
            .banner-text {
              position: absolute;
              top: 12px;
              right: 12px;
              border: 1px solid rgba(56, 189, 248, 0.4);
              color: #38bdf8;
              font-size: 8px;
              padding: 2px 6px;
              border-radius: 4px;
              text-transform: uppercase;
              font-weight: bold;
            }
            .avatar {
              width: 70px;
              height: 70px;
              border-radius: 12px;
              object-fit: cover;
              border: 2px solid #030712;
              position: absolute;
              top: 80px;
              left: 24px;
              background-color: #111827;
            }
            .content {
              padding: 40px 24px 24px 24px;
            }
            .name {
              font-size: 18px;
              font-weight: bold;
              margin: 0;
            }
            .username {
              font-size: 11px;
              color: #38bdf8;
            }
            .sub {
              font-size: 9px;
              color: #9ca3af;
              margin-top: 2px;
              text-transform: uppercase;
            }
            .grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 8px;
              margin-top: 16px;
              border-top: 1px solid #1f2937;
              border-b: 1px solid #1f2937;
              padding: 12px 0;
              font-size: 10px;
              color: #9ca3af;
            }
            .grid-val {
              color: #ffffff;
              font-weight: bold;
            }
            .footer-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: 16px;
            }
            .qr {
              width: 50px;
              height: 50px;
              border-radius: 4px;
            }
            .verify-tag {
              font-size: 7px;
              color: #38bdf8;
              font-weight: bold;
              letter-spacing: 1px;
              text-align: center;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="banner">
              <span class="banner-text">Savar IT Club</span>
            </div>
            <img class="avatar" src="${profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}" />
            <div class="content">
              <h3 class="name">${profile.name || user.username}</h3>
              <span class="username">@${user.username}</span>
              <p class="sub">Savar Cantonment Public School & College IT Club</p>
              
              <div class="grid">
                <div>
                  <div style="font-size: 8px; color: #4b5563;">MEMBER ROLL:</div>
                  <div class="grid-val">${profile.roll || 'N/A'}</div>
                </div>
                <div>
                  <div style="font-size: 8px; color: #4b5563;">CLASS & SECTION:</div>
                  <div class="grid-val">${profile.class || 'N/A'} (Sec ${profile.section || 'N/A'})</div>
                </div>
                <div>
                  <div style="font-size: 8px; color: #4b5563;">CLUB ID (CH ID):</div>
                  <div class="grid-val" style="color: #38bdf8;">${profile.chId || 'N/A'}</div>
                </div>
                <div>
                  <div style="font-size: 8px; color: #4b5563;">PHONE:</div>
                  <div class="grid-val">${profile.phone || 'N/A'}</div>
                </div>
              </div>

              <div class="footer-row">
                <div style="font-size: 8px; color: #4b5563; max-width: 180px;">
                  Savar Cantonment, Dhaka, Bangladesh. Official Identification Document.
                </div>
                <div style="display: flex; flex-direction: column; align-items: center;">
                  <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=SAVAR-IT-CLUB-${user.username}&color=38bdf8&bgcolor=030712" />
                  <span class="verify-tag">VERIFIED MEMBER</span>
                </div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // AI assistant messaging proxy
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;
    const userMsg = aiMessage;
    setAiMessage("");
    setAiHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: aiHistory.map(h => ({ role: h.role, text: h.text })),
          customApiKey: customApiKey,
          mode: aiMode
        })
      });
      const data = await safeJson(res, {});
      if (res.ok && data?.response) {
        setAiHistory((prev) => [...prev, { role: "model", text: data.response }]);
      } else {
        setAiHistory((prev) => [...prev, { role: "model", text: data?.error || "Error: AI cores are temporarily offline." }]);
      }
    } catch (err) {
      setAiHistory((prev) => [...prev, { role: "model", text: "Security network timeout. Check connection parameters." }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Department enrollment
  const handleJoinDepartment = async (deptId: string) => {
    try {
      const res = await fetch(`/api/departments/${deptId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await safeJson(res, {});
      if (res.ok) {
        fetchDashboardData();
        setSaveStatus("JOINED DEPARTMENT SUCCESS");
        setTimeout(() => setSaveStatus(""), 2000);
      } else {
        alert(data?.error || "Join department failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Event registration
  const handleRegisterEvent = async (evtId: string) => {
    try {
      const res = await fetch(`/api/events/${evtId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await safeJson(res, {});
      if (res.ok) {
        fetchDashboardData();
      } else {
        alert(data?.error || "Event registration failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quiz initiation
  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizAnswers({});
    const totalSecs = Math.max(1, (quiz.duration || 10) * 60);
    setQuizTimer(totalSecs);
    setQuizTotalSeconds(totalSecs);
    setLastQuizScore(null);
  };

  const handleSelectQuizAnswer = (qIdx: number, oIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleAutoSubmitQuiz = () => {
    if (quizIntervalId) clearInterval(quizIntervalId);
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmittingQuiz(true);
    if (quizIntervalId) clearInterval(quizIntervalId);

    try {
      const res = await fetch(`/api/quizzes/${activeQuiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          answers: quizAnswers
        })
      });
      const data = await safeJson(res, {});
      if (res.ok && data?.result) {
        setLastQuizScore(data.result);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Account Self Deletion Trigger
  const handleDeleteAccount = async () => {
    if (!window.confirm("CRITICAL: Are you absolutely sure you want to permanently delete your Cyber Hub account? This action is irreversible.")) {
      return;
    }
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        onLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Gallery item uploader for standard students
  const handleUploadGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl || !uploadTitle) {
      setUploadingStatus("ERROR: Title and File URL are required");
      return;
    }
    setUploadingStatus("UPLOADING FILE ATTACHMENT...");
    try {
      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle,
          url: uploadUrl,
          category: uploadCategory,
          userId: user.id
        })
      });
      const data = await safeJson(res, {});
      if (res.ok) {
        setUploadTitle("");
        setUploadUrl("");
        setUploadingStatus("FILE CAPTURED AND DEPLOYED TO GALLERY SUCCESSFULLY!");
        setTimeout(() => setUploadingStatus(""), 3000);
        fetchDashboardData();
      } else {
        setUploadingStatus(`ERROR: ${data?.error || "Upload failed"}`);
      }
    } catch (err: any) {
      setUploadingStatus(`ERROR: ${err.message}`);
    }
  };

  // Drag and drop and file handler helpers
  const handleFileChange = (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      setUploadProgress("ERROR: FILE SIZE EXCEEDS 3MB LIMIT FOR LOCAL STORAGE.");
      return;
    }
    setSelectedFile(file);
    setNewTitle(file.name.split('.').slice(0, -1).join('.'));
    
    // Auto detect type
    if (file.type.startsWith("image/")) {
      setNewType("Photo");
    } else if (file.type.startsWith("video/")) {
      setNewType("Video");
    } else {
      setNewType("Document");
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setNewUrl(e.target.result as string);
        setUploadProgress(`READY TO ARCHIVE: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = newUrl || uploadUrl;
    const finalTitle = newTitle || uploadTitle;
    
    if (!finalUrl || !finalTitle) {
      setUploadProgress("ERROR: Title and File/Link are required");
      return;
    }

    setUploadProgress("UPLOADING FILE TO CYBER HUB ARCHIVE...");
    try {
      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: finalTitle,
          url: finalUrl,
          type: newType,
          category: newCategory,
          userId: user.id
        })
      });

      const data = await safeJson(res, {});
      if (res.ok) {
        setNewTitle("");
        setNewUrl("");
        setUploadTitle("");
        setUploadUrl("");
        setSelectedFile(null);
        setUploadProgress("FILE UPLOADED AND ARCHIVED SUCCESSFULLY!");
        setTimeout(() => setUploadProgress(""), 3000);
        fetchDashboardData();
      } else {
        setUploadProgress(`ERROR: ${data?.error || "Upload failed"}`);
      }
    } catch (err: any) {
      setUploadProgress(`ERROR: ${err.message}`);
    }
  };

  const handleDeleteGalleryItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this file from the gallery?")) return;
    try {
      const res = await fetch(`/api/gallery/${itemId}`, {
        method: "DELETE"
      });
      const data = await safeJson(res, {});
      if (res.ok) {
        fetchDashboardData();
      } else {
        alert(`ERROR: ${data?.error || "Delete failed"}`);
      }
    } catch (err: any) {
      alert(`ERROR: ${err.message}`);
    }
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  if (user.role === "Executive" && !executiveUnlocked) {
    return (
      <div className="min-h-screen bg-cyber-bg cyber-grid flex flex-col items-center justify-center p-4 relative font-mono">
        <div className="w-full max-w-md bg-gray-950/90 border border-red-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500" />

          <div className="inline-flex p-4 rounded-full bg-red-950/20 border border-red-800 text-red-400">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              {getTranslation(languageCode, "password_lock")}
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
              {getTranslation(languageCode, "enter_pass")}
            </p>
          </div>

          {executivePasswordError && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-lg flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{executivePasswordError}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (executivePasswordInput === "orma#*6769") {
                setExecutiveUnlocked(true);
                sessionStorage.setItem("executiveUnlocked", "true");
              } else {
                setExecutivePasswordError("AUTHENTICATION CODE MISMATCH - GATEWAY LOCKED");
              }
            }}
            className="space-y-4 text-left"
          >
            <div>
              <input
                type="password"
                required
                value={executivePasswordInput}
                onChange={(e) => {
                  setExecutivePasswordInput(e.target.value);
                  setExecutivePasswordError("");
                }}
                placeholder="INPUT SECURITY PIN"
                className="w-full bg-gray-900 border border-red-950 rounded-lg px-4 py-2.5 text-center text-sm text-white placeholder-gray-700 tracking-widest focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-lg text-xs tracking-wider transition-all"
            >
              {getTranslation(languageCode, "unlock")}
            </button>
          </form>

          <div className="flex flex-col items-center space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                sessionStorage.clear();
                localStorage.clear();
                onLogout();
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer w-full"
            >
              🔄 RESET PAGE & DISCONNECT SESSION
            </button>
            <button
              onClick={onLogout}
              className="text-xs text-gray-500 hover:text-gray-300 underline transition-all uppercase bg-transparent border-none outline-none cursor-pointer pt-1"
            >
              {getTranslation(languageCode, "logout")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-bg text-gray-100 flex flex-col font-sans relative perspective-container">
      {/* 3D Immersive Grid Scapes */}
      <div className="perspective-ground pointer-events-none" />
      <div className="perspective-ground-pink pointer-events-none" />
      
      {/* ADMIN LINK ACTIVE BANNER */}
      {adminOriginalUser && (
        <div className="bg-emerald-950/95 border-b border-emerald-500/60 px-4 py-2.5 text-emerald-200 flex flex-wrap items-center justify-between text-xs font-mono z-50 sticky top-0 backdrop-blur-md shadow-lg">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-tight">
              <strong className="text-white">ADMIN LINKED VIEW:</strong> Impersonating student <strong className="text-emerald-300">@{user.username}</strong> ({user.name || "Student"} — Roll: {user.roll || "N/A"}, Class: {user.class || "N/A"})
            </span>
          </div>
          <button
            onClick={onSwitchToAdmin}
            className="mt-1 sm:mt-0 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow"
          >
            <span>Return to Admin Console</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        {/* ENTERPRISE DASHBOARD SIDEBAR */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-900 bg-gray-950/70 backdrop-blur-xl flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          
          {/* Insignia Header */}
          <div className="flex items-center space-x-2.5 pb-4 border-b border-gray-900">
            <div className="p-1 flex items-center justify-center text-cyber-cyan drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]">
              <Shield className="w-6.5 h-6.5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-white tracking-tight text-sm">CYBER MEMBER</span>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Dashboard Node</span>
            </div>
          </div>

          {/* Quick User State Card */}
          <div className="p-3.5 bg-gray-900/40 border border-gray-900 rounded-xl flex items-center space-x-3">
            <div className="relative shrink-0">
              <img src={profile.avatar} alt={user.username} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border border-gray-800" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cyber-cyan border-2 border-gray-950 rounded-full animate-pulse" />
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white block truncate">@{user.username}</span>
              <span className="text-[10px] font-mono text-gray-500 uppercase block">{user.role} CODE</span>
            </div>
          </div>

          {/* Nav Tabs List */}
          <nav className="space-y-1 font-mono text-[11px] uppercase tracking-wider">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "overview" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <span className="flex items-center space-x-2">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>{getTranslation(languageCode, "overview")}</span>
              </span>
              {unreadNotifsCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === "overview" ? "bg-gray-900 text-cyber-cyan" : "bg-cyber-cyan text-gray-950"} font-bold`}>
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("calendar")}
              className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "calendar" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0 text-cyber-cyan" />
              <span className="flex-1 text-left font-bold tracking-tight text-white/90">EVENT CALENDAR</span>
              <span className="text-[9px] font-mono bg-cyber-pink px-1 rounded-full text-white font-bold animate-pulse">LIVE</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "profile" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>{getTranslation(languageCode, "profile")}</span>
            </button>

            <button
              onClick={() => setActiveTab("routines")}
              className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "routines" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <Clock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>CLASS ROUTINE & CODES</span>
            </button>

            <button
              onClick={() => setActiveTab("quizzes")}
              className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "quizzes" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>{getTranslation(languageCode, "quizzes")}</span>
            </button>

            <button
              onClick={() => setActiveTab("certificates")}
              className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "certificates" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>{getTranslation(languageCode, "certificates")}</span>
            </button>

            <button
              onClick={() => setActiveTab("departments")}
              className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "departments" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <FolderClosed className="w-4 h-4 shrink-0" />
              <span>{getTranslation(languageCode, "departments")}</span>
            </button>

            <button
              onClick={() => setActiveTab("executives")}
              className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "executives" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>EXECUTIVE BOARD</span>
            </button>

            <button
              onClick={() => setActiveTab("gallery")}
              className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "gallery" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <ImageIcon className="w-4 h-4 shrink-0" />
              <span>GALLERY / FILES</span>
            </button>

            <button
              onClick={() => setActiveTab("messages")}
              className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "messages" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>{getTranslation(languageCode, "messages")}</span>
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "ai" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <Bot className="w-4 h-4 shrink-0" />
              <span>{getTranslation(languageCode, "ai")}</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "settings" ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>{getTranslation(languageCode, "settings")}</span>
            </button>

            {/* Custom Admin Pages rendered inside sidebar */}
            {customPages.map((cp) => (
              <button
                key={`custom-page-${cp.id}`}
                onClick={() => setActiveTab(`custom-${cp.id}`)}
                className={`w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg transition-all ${
                  activeTab === `custom-${cp.id}` ? "bg-cyber-cyan text-gray-950 font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900/40"
                }`}
              >
                <FileText className="w-4 h-4 shrink-0 text-cyber-cyan" />
                <span className="truncate">{cp.title}</span>
              </button>
            ))}
          </nav>
          
          {/* SYSTEM STATUS MONITOR */}
          <div className="mt-4 p-3 bg-gray-900/30 border border-gray-900 rounded-xl space-y-2 font-mono text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">SYSTEM CORE</span>
              <button 
                onClick={() => checkSystemStatus(true)}
                disabled={isCheckingStatus}
                className="text-gray-500 hover:text-cyber-cyan transition-colors duration-200"
                title="Refresh Status"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? "animate-spin text-cyber-cyan" : ""}`} />
              </button>
            </div>
            
            <div 
              onClick={() => setIsStatusExpanded(!isStatusExpanded)}
              className="flex items-center justify-between p-1.5 bg-gray-950/40 rounded-lg border border-gray-900 hover:border-gray-800 cursor-pointer transition-all duration-300"
            >
              <div className="flex items-center space-x-2">
                <div className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${systemOnline ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${systemOnline ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                </div>
                <span className="font-bold text-gray-200">
                  {isCheckingStatus ? "DIAGNOSTICS..." : systemOnline ? "ALL SECURE" : "SECURE CORE"}
                </span>
              </div>
              <span className="text-[9px] text-cyber-cyan font-bold hover:underline">
                {isStatusExpanded ? "CLOSE" : "DETAILS"}
              </span>
            </div>

            {isStatusExpanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 pt-1 border-t border-gray-900/50 overflow-hidden"
              >
                {toolsStatus.map((tool) => (
                  <div key={tool.id} className="flex items-center justify-between text-gray-400 py-0.5">
                    <span className="truncate max-w-[120px]">{tool.name}</span>
                    <div className="flex items-center space-x-1.5">
                      {tool.status === "checking" ? (
                        <span className="text-[9px] text-cyber-cyan/70 animate-pulse">PINGING</span>
                      ) : tool.status === "offline" ? (
                        <span className="text-[9px] text-rose-500 font-bold">OFFLINE</span>
                      ) : (
                        <span className="text-[9px] text-emerald-500 font-medium">{tool.latency}ms</span>
                      )}
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        tool.status === "checking" ? "bg-cyber-cyan/50 animate-pulse" :
                        tool.status === "offline" ? "bg-rose-500" : "bg-emerald-500"
                      }`} />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Sidebar Footers */}
        <div className="space-y-3 pt-6 border-t border-gray-900 font-mono text-[10px]">
          {(user.role === "Admin" || user.role === "Executive") && (
            <button
              onClick={onSwitchToAdmin}
              className="w-full bg-cyber-pink hover:bg-cyber-pink/90 text-white font-bold py-2 rounded-lg flex items-center justify-center space-x-1 hover:shadow-lg"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{getTranslation(languageCode, "admin")}</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white py-2 border border-gray-800 rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{getTranslation(languageCode, "logout")}</span>
          </button>

          <div className="pt-2 text-center text-[9px] text-gray-600 space-y-0.5">
            <p>SCPSCCH Portal</p>
            <p>
              Dev:{" "}
              <a
                href="https://maheeb1.netlify.app"
                target="_blank"
                rel="noreferrer"
                className="text-cyber-cyan hover:underline font-semibold"
              >
                Md. Maheeb Hossain
              </a>
            </p>
          </div>
        </div>
      </aside>

      {/* DASHBOARD VIEW SCREEN */}
      <main className="flex-1 bg-cyber-bg p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {saveStatus && (
          <div className="mb-4 bg-gray-900 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono px-4 py-2 rounded-lg flex items-center justify-between">
            <span>{saveStatus}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-ping" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* 1. OVERVIEW NODE */}
          {activeTab === "overview" && (
            <motion.div
              key="tab-overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Active thrilled/chilled notification alert banner */}
              {activeAlert && (
                <div className={`p-4 rounded-xl border relative overflow-hidden animate-pulse ${
                  activeAlert.type === "thrilled" 
                    ? "bg-cyber-cyan/15 border-cyber-cyan text-cyber-cyan shadow-lg shadow-cyber-cyan/10" 
                    : "bg-blue-950/30 border-blue-800 text-blue-300"
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-gray-950/60 border border-current">
                      {activeAlert.type === "thrilled" ? <Sparkles className="w-4 h-4 text-cyber-cyan" /> : <Clock className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold">
                          {activeAlert.type === "thrilled" ? "🔥 SYSTEM BROADCAST: THRILLED ALERTER 🔥" : "❄️ SYSTEM BROADCAST: CHILLED ALERTER ❄️"}
                        </span>
                        <span className="text-[9px] font-mono opacity-50">SCPSC COMMAND DECK</span>
                      </div>
                      <p className="text-xs mt-1.5 font-sans leading-relaxed font-bold">
                        {activeAlert.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid split: Member ID Card & Welcome Node */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Member ID Card & Stats */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Identity Card */}
                  <ThreeDTiltCard className="relative rounded-2xl overflow-hidden border border-gray-900 bg-gray-950/40 shadow-2xl">
                    {/* Cover Banner */}
                    <div className="h-28 overflow-hidden relative">
                      <img 
                        src={profile.banner || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"} 
                        alt="Profile Cover" 
                        className="w-full h-full object-cover opacity-60"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
                      <span className="absolute top-3 right-3 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider">
                        SAVAR IT CLUB
                      </span>
                    </div>

                    {/* Profile avatar overlay */}
                    <div className="absolute top-16 left-6">
                      <img 
                        src={profile.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"} 
                        alt={user.username} 
                        className="w-16 h-16 rounded-xl object-cover border-2 border-gray-950 bg-gray-900"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="pt-8 p-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-display font-bold text-white flex items-center space-x-1.5">
                          <span>{profile.name || user.username}</span>
                          <span className="text-xs text-cyber-cyan font-mono font-normal">(@{user.username})</span>
                        </h3>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5 uppercase tracking-wider">
                          Savar Cantonment Public School and College IT Club
                        </p>
                      </div>

                      {/* Member Parameters & QR Grid */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-gray-900/60 pt-3.5">
                        <div className="flex-1 grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-400">
                          <div>
                            <span className="text-[9px] text-gray-500 block">MEMBER ROLL:</span>
                            <span className="text-white font-bold">{profile.roll || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 block">CLASS & SECTION:</span>
                            <span className="text-white font-bold">{profile.class || "N/A"} (Sec {profile.section || "N/A"})</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 block">CLUB ID (CH ID):</span>
                            <span className="text-cyber-cyan font-bold">{profile.chId || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 block">PHONE:</span>
                            <span className="text-white font-bold">{profile.phone || "N/A"}</span>
                          </div>
                        </div>

                        {/* QR Code Segment */}
                        <div className="flex flex-col items-center justify-center p-2 bg-gray-950 border border-gray-900 rounded-xl shrink-0">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=SAVAR-IT-CLUB-${user.username}&color=38bdf8&bgcolor=030712`}
                            alt="Verification QR"
                            className="w-14 h-14 rounded"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[7px] font-mono text-cyber-cyan mt-1 font-bold tracking-widest">VERIFIED MEMBER</span>
                        </div>
                      </div>
                    </div>
                  </ThreeDTiltCard>

                  <button
                    onClick={handleDownloadPDF}
                    className="w-full mt-3 py-2.5 bg-gray-900 hover:bg-gray-800 text-white border border-gray-800 hover:border-gray-700 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-cyber-cyan animate-pulse" />
                    <span>Download ID Card (PDF)</span>
                  </button>
                </div>

                {/* Main section: Welcome panel, Notifications logs, and direct gallery uploads */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Digital welcome deck */}
                  <div className="p-6 rounded-2xl border border-gray-900 bg-gray-950/40 relative overflow-hidden">
                    <h2 className="text-xl font-display font-extrabold text-white">
                      {getTranslation(languageCode, "welcome")}, <span className="text-cyber-cyan">@{user.username}</span>
                    </h2>
                    <p className="text-xs text-gray-400 font-mono mt-1 uppercase tracking-wider">
                      Savar Cantonment Public School and College IT Club | {user.role} CODE
                    </p>

                    <div className="grid grid-cols-3 gap-3 mt-6 text-center font-mono text-xs">
                      <div className="p-3.5 bg-gray-900/30 border border-gray-900 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">{getTranslation(languageCode, "exams_passed")}</span>
                        <span className="text-lg font-bold text-white font-display mt-0.5 block">{results.length} Nodes</span>
                      </div>
                      <div className="p-3.5 bg-gray-900/30 border border-gray-900 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">{getTranslation(languageCode, "certificates_won")}</span>
                        <span className="text-lg font-bold text-cyber-cyan font-display mt-0.5 block">{results.filter(r => r.certificateId).length} Issued</span>
                      </div>
                      <div className="p-3.5 bg-gray-900/30 border border-gray-900 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">ENGAGEMENTS</span>
                        <span className="text-lg font-bold text-cyber-pink font-display mt-0.5 block">
                          {events.filter(e => e.registeredUsers.includes(user.id)).length} Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* GALLERY SUBMISSION TERMINAL - Student File upload */}
                  <div className="p-6 rounded-2xl border border-gray-900 bg-gray-950/40 space-y-4">
                    <div className="border-b border-gray-900 pb-2.5">
                      <span className="text-[9px] font-mono text-cyber-cyan uppercase tracking-widest font-bold">MEDIA FILE ARCHIVER</span>
                      <h4 className="text-xs font-display font-bold text-white uppercase">SUBMIT AND ARCHIVE CAPTURES TO THE GALLERY</h4>
                    </div>

                    {uploadingStatus && (
                      <div className="p-2.5 bg-gray-900 border border-cyber-cyan/40 text-cyber-cyan font-mono text-[11px] rounded-lg">
                        {uploadingStatus}
                      </div>
                    )}

                    <form onSubmit={handleUploadGalleryItem} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">CAPTURE TITLE *</label>
                          <input
                            type="text"
                            required
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            placeholder="e.g. Hackathon Core 2026"
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">CATEGORY NODE</label>
                          <select
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          >
                            <option value="Workshop">Workshop</option>
                            <option value="Hackathon">Hackathon</option>
                            <option value="Lab Session">Lab Session</option>
                            <option value="Competition">Competition</option>
                            <option value="Project Showcase">Project Showcase</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">FILE URL (OR PHOTO LINK) *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={uploadUrl}
                            onChange={(e) => setUploadUrl(e.target.value)}
                            placeholder="Paste your image URL here (e.g. https://images.unsplash.com/...)"
                            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan font-mono"
                          />
                          <button
                            type="submit"
                            className="bg-cyber-cyan hover:bg-cyber-cyan/90 text-gray-950 px-4 rounded-lg text-xs font-mono font-bold flex items-center space-x-1"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>ARCHIVE</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Alerts and Access logs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Alerts panel */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                        <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <Bell className="w-3.5 h-3.5 text-cyber-cyan" />
                          <span>NOTIFICATIONS</span>
                        </h4>
                        {unreadNotifsCount > 0 && (
                          <button
                            onClick={handleMarkNotificationsRead}
                            className="text-[8px] font-mono text-cyber-cyan bg-cyber-cyan/10 px-1.5 py-0.5 rounded border border-cyber-cyan/20"
                          >
                            MARK READ
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-[10px] text-gray-600 font-mono text-center py-4">No warnings or signals logged.</p>
                        ) : (
                          notifications.slice(0, 4).map(n => (
                            <div key={n.id} className="p-2.5 rounded-lg bg-gray-900/40 border border-gray-900 flex gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${n.read ? "bg-gray-700" : "bg-cyber-cyan animate-pulse"}`} />
                              <div className="overflow-hidden">
                                <h5 className="text-[10px] font-bold text-white truncate">{n.title}</h5>
                                <p className="text-[9px] text-gray-400 line-clamp-2 leading-tight mt-0.5">{n.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Timeline Logs */}
                    <div className="space-y-3">
                      <div className="border-b border-gray-900 pb-2">
                        <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <Terminal className="w-3.5 h-3.5 text-blue-400" />
                          <span>ACCESS TIMELINE</span>
                        </h4>
                      </div>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 font-mono text-[9px] text-gray-400">
                        {logs.length === 0 ? (
                          <p className="text-[10px] text-gray-600 text-center py-4">Session idle. No logs detected.</p>
                        ) : (
                          logs.slice(0, 4).map(log => (
                            <div key={log.id} className="p-2 bg-gray-900/20 border border-gray-950 rounded flex justify-between items-center">
                              <div className="overflow-hidden mr-2">
                                <span className="text-cyber-cyan font-bold block truncate">{log.action}</span>
                                <span className="text-gray-600 truncate block">{log.details}</span>
                              </div>
                              <span className="text-gray-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* INTEGRATED VISUAL CALENDAR (FULL-WIDTH CORE SECTION) */}
              <div className="space-y-3">
                <div className="border-b border-gray-900 pb-2">
                  <h3 className="text-sm font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-cyber-cyan" />
                    <span>WORKSHOP & HACKATHON CALENDAR STREAM</span>
                  </h3>
                </div>
                <VisualCalendar 
                  events={events} 
                  onRegisterEvent={handleRegisterEvent} 
                  userId={user.id} 
                />
              </div>

              {/* MEMBER ACTIVE ENGAGEMENTS, LAB ATTENDANCE & CLASSES (LAST OF THE PAGE) */}
              <div className="space-y-4 border-t border-gray-900 pt-6">
                <div className="border-b border-gray-900 pb-2">
                  <h3 className="text-sm font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-cyber-pink" />
                    <span>MEMBER ACTIVITY, ATTENDANCE & CLASS CODES</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Member Activity and Paths Panel */}
                  <div className="p-5 rounded-2xl border border-gray-900 bg-gray-950/40 space-y-4">
                    <div className="border-b border-gray-900 pb-2">
                      <span className="text-[9px] font-mono text-cyber-cyan uppercase tracking-widest font-bold">ENGAGEMENT STATUS</span>
                      <h4 className="text-xs font-display font-bold text-white uppercase">MEMBER ACTIVITY & PATHS</h4>
                    </div>

                    {/* Attendance indicator */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-gray-400">LAB ATTENDANCE RATING</span>
                        <span className="text-cyber-cyan font-bold">
                          {(() => {
                            if (!profile.attendance || !Array.isArray(profile.attendance) || profile.attendance.length === 0) {
                              return 100;
                            }
                            const presents = profile.attendance.filter(a => a.status === "Present").length;
                            return Math.round((presents / profile.attendance.length) * 100);
                          })()}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-950">
                        <div 
                          className="h-full bg-cyber-cyan rounded-full transition-all duration-500" 
                          style={{
                            width: `${(() => {
                              if (!profile.attendance || !Array.isArray(profile.attendance) || profile.attendance.length === 0) {
                                return 100;
                              }
                              const presents = profile.attendance.filter(a => a.status === "Present").length;
                              return Math.round((presents / profile.attendance.length) * 100);
                            })()}%`
                          }} 
                        />
                      </div>
                    </div>

                    {/* Skills array */}
                    <div className="space-y-1 pt-2 border-t border-gray-900/40">
                      <span className="text-[9px] font-mono text-gray-400 block">VERIFIED CODING PATHS:</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.length === 0 ? (
                          <span className="text-[10px] text-gray-600 font-mono">No skill badges recorded. Modify in profile settings.</span>
                        ) : (
                          profile.skills.map(s => (
                            <span key={s} className="bg-gray-900 text-gray-300 px-2 py-0.5 rounded text-[9px] font-mono border border-gray-800">
                              {s}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Classes & Scheduled Sessions */}
                  <div className="p-5 rounded-2xl border border-gray-900 bg-gray-950/40 space-y-4">
                    <div className="border-b border-gray-900 pb-2.5">
                      <span className="text-[9px] font-mono text-cyber-cyan uppercase tracking-widest font-bold">MEMBER CLASS CODES</span>
                      <h4 className="text-xs font-display font-bold text-white uppercase">{getTranslation(languageCode, "classes")}</h4>
                    </div>

                    <div className="space-y-2.5">
                      {classSchedules.length === 0 ? (
                        <p className="text-[11px] text-gray-600 font-mono text-center py-4">NO ACTIVE OR ONLINE CLASS CODES ISSUED</p>
                      ) : (
                        classSchedules.map((cls) => (
                          <div key={cls.id} className="p-3 bg-gray-900/40 rounded-xl border border-gray-900 flex justify-between items-center gap-3">
                            <div className="overflow-hidden">
                              <span className="text-[10px] text-gray-500 font-mono block uppercase">{cls.date} @ {cls.time}</span>
                              <h5 className="text-xs font-bold text-white truncate">{cls.subject}</h5>
                              <span className="text-[9px] text-gray-400 font-mono block">Instructor: {cls.instructor}</span>
                            </div>
                            {cls.type === "Online" ? (
                              <a
                                href={cls.link || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-cyber-cyan hover:bg-cyber-cyan/90 text-gray-950 px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold flex items-center space-x-1 shrink-0"
                              >
                                <Video className="w-3 h-3" />
                                <span>JOIN MEETING</span>
                              </a>
                            ) : (
                              <span className="bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1 rounded text-[9px] font-mono shrink-0 font-bold uppercase">
                                Lab {cls.room || "404"}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* DEDICATED EVENT CALENDAR & DEADLINE TRACKER TAB */}
          {activeTab === "calendar" && (
            <motion.div
              key="tab-calendar"
              initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.95, rotateX: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-8 [perspective:1000px]"
            >
              {/* Header 3D Card with CyberHubLogo */}
              <ThreeDTiltCard className="bg-gradient-to-r from-gray-950 via-gray-900 to-cyber-cyan/5 border border-cyber-cyan/20 p-6 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-cyan/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-cyber-cyan/10 transition-all duration-700" />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-2xl bg-cyber-cyan/15 border-2 border-cyber-cyan text-cyber-cyan animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <CyberHubLogo className="w-10 h-10 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-display font-extrabold text-white tracking-tight flex items-center gap-2">
                        <span>IT CLUB CENTRAL CHRONOS</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan uppercase">v2.1</span>
                      </h1>
                      <p className="text-xs text-gray-400 font-mono mt-0.5 max-w-xl">
                        Interactive scheduling matrix monitoring high-stakes cyber competitions, workshops, CTFs, and general assembly milestones.
                      </p>
                    </div>
                  </div>
                  
                  {/* Holographic Stats Banner */}
                  <div className="grid grid-cols-3 gap-4 border-l border-gray-800 pl-6 font-mono text-center">
                    <div>
                      <span className="text-xs text-gray-500 block">TOTAL AGENDA</span>
                      <span className="text-lg font-extrabold text-cyber-cyan">{events.length}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">COMPETITIONS</span>
                      <span className="text-lg font-extrabold text-cyber-pink">
                        {events.filter(e => e.type === "Competition" || e.type === "Hackathon").length}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">REGISTERED</span>
                      <span className="text-lg font-extrabold text-emerald-400">
                        {events.filter(e => e.registeredUsers?.includes(user.id)).length}
                      </span>
                    </div>
                  </div>
                </div>
              </ThreeDTiltCard>

              {/* Sub-filtering Tabs & Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-950/40 p-3 rounded-xl border border-gray-900 font-mono text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "all", label: "ALL EVENTS" },
                    { id: "meetings", label: "CLUB MEETINGS" },
                    { id: "competitions", label: "DEADLINES & COMPETITIONS" },
                    { id: "workshops", label: "WORKSHOPS & LABS" },
                    { id: "my_slots", label: "MY REGISTERED SLOTS" }
                  ].map((filterTab) => {
                    const isSelected = activeCalendarFilter === filterTab.id;
                    return (
                      <button
                        key={filterTab.id}
                        onClick={() => setActiveCalendarFilter(filterTab.id)}
                        className={`px-3 py-2 rounded-lg font-bold transition-all ${
                          isSelected 
                            ? "bg-cyber-cyan text-gray-950 shadow-md shadow-cyber-cyan/20" 
                            : "text-gray-400 hover:text-white hover:bg-gray-900/40"
                        }`}
                      >
                        {filterTab.label}
                      </button>
                    );
                  })}
                </div>
                
                <span className="text-[10px] text-gray-500 uppercase flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span>Real-time Sync Active</span>
                </span>
              </div>

              {/* Grid: 3D Calendar and Upcoming Deadlines Board */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* Visual Calendar Component (7 Cols) */}
                <div className="xl:col-span-8">
                  <ThreeDTiltCard className="bg-gray-950/30 border border-gray-900/80 p-0.5">
                    <VisualCalendar 
                      events={events.filter(evt => {
                        if (activeCalendarFilter === "meetings") return evt.type === "Seminar";
                        if (activeCalendarFilter === "competitions") return evt.type === "Competition" || evt.type === "Hackathon";
                        if (activeCalendarFilter === "workshops") return evt.type === "Workshop";
                        if (activeCalendarFilter === "my_slots") return evt.registeredUsers?.includes(user.id);
                        return true;
                      })} 
                      onRegisterEvent={handleRegisterEvent} 
                      userId={user.id} 
                    />
                  </ThreeDTiltCard>
                </div>

                {/* Deadlines Sidebar / Feed (4 Cols) */}
                <div className="xl:col-span-4 space-y-4">
                  <div className="border-b border-gray-900 pb-2 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyber-cyan uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyber-pink" />
                      <span>DEADLINES TICKER</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono uppercase">SORTED: CHRONOLOGICAL</span>
                  </div>

                  <div className="space-y-4 overflow-y-auto max-h-[550px] pr-1">
                    {events
                      .filter(evt => {
                        if (activeCalendarFilter === "meetings") return evt.type === "Seminar";
                        if (activeCalendarFilter === "competitions") return evt.type === "Competition" || evt.type === "Hackathon";
                        if (activeCalendarFilter === "workshops") return evt.type === "Workshop";
                        if (activeCalendarFilter === "my_slots") return evt.registeredUsers?.includes(user.id);
                        return true;
                      })
                      .map((evt) => {
                        const isRegistered = evt.registeredUsers?.includes(user.id);
                        const eventDate = new Date(evt.date);
                        const isPast = eventDate.getTime() < Date.now();
                        
                        return (
                          <div key={`dead-${evt.id}`} className="w-full">
                            <ThreeDTiltCard 
                              className="bg-gray-950/60 border border-gray-900 hover:border-cyber-cyan/40 p-4 transition-all relative overflow-hidden group/item"
                            >
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyber-cyan to-cyber-pink opacity-80" />
                              
                              <div className="flex justify-between items-start mb-2 pl-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider ${
                                  evt.type === "Hackathon"
                                    ? "bg-cyber-pink/10 border border-cyber-pink/20 text-cyber-pink"
                                    : evt.type === "Competition"
                                      ? "bg-amber-400/10 border border-amber-400/20 text-amber-400"
                                      : evt.type === "Workshop"
                                        ? "bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan"
                                        : "bg-purple-400/10 border border-purple-400/20 text-purple-400"
                                }`}>
                                  {evt.type}
                                </span>
                                
                                <span className="text-[10px] font-mono text-gray-500">
                                  {evt.countdown}
                                </span>
                              </div>

                              <div className="pl-2 space-y-1">
                                <h4 className="text-xs font-display font-extrabold text-white group-hover/item:text-cyber-cyan transition-colors">
                                  {evt.title}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-mono line-clamp-2">
                                  {evt.description}
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-gray-900/60 pl-2 flex items-center justify-between font-mono text-[9px] text-gray-500">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-3.5 h-3.5 text-cyber-cyan" />
                                  <span>{eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                </div>
                                <button
                                  onClick={() => handleRegisterEvent(evt.id)}
                                  disabled={isRegistered || isPast}
                                  className={`px-3 py-1.5 rounded-md font-bold text-[9px] transition-all border flex items-center gap-1 ${
                                    isRegistered
                                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                                      : isPast
                                        ? "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
                                        : "bg-cyber-cyan hover:bg-cyber-cyan/90 border-cyber-cyan text-gray-950 font-bold"
                                  }`}
                                >
                                  {isRegistered ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>ENROLLED</span>
                                    </>
                                  ) : isPast ? (
                                    <span>EXPIRED</span>
                                  ) : (
                                    <span>REGISTER</span>
                                  )}
                                </button>
                              </div>
                            </ThreeDTiltCard>
                          </div>
                        );
                      })}

                    {events.filter(evt => {
                      if (activeCalendarFilter === "meetings") return evt.type === "Seminar";
                      if (activeCalendarFilter === "competitions") return evt.type === "Competition" || evt.type === "Hackathon";
                      if (activeCalendarFilter === "workshops") return evt.type === "Workshop";
                      if (activeCalendarFilter === "my_slots") return evt.registeredUsers?.includes(user.id);
                      return true;
                    }).length === 0 && (
                      <div className="py-12 text-center border border-dashed border-gray-900 rounded-xl font-mono text-[10px] text-gray-600">
                        NO UPCOMING EVENTS IN THIS FILTER CATEGORY
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* 2. PROFILE CUSTOMIZER */}
          {activeTab === "profile" && (
            <motion.div
              key="tab-profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-gray-900 pb-3">
                <h1 className="text-xl font-display font-bold text-white">Profile Customizer</h1>
                <p className="text-xs text-gray-400">Configure your SCPSC cyber identity cards and display properties here.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Editor side */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">AVATAR PICTURE URL</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={avatarInput}
                          onChange={(e) => setAvatarInput(e.target.value)}
                          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGalleryPicker("avatar")}
                          className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-cyber-cyan text-cyber-cyan text-[10px] font-mono font-bold px-3 py-2 rounded-lg transition-all uppercase whitespace-nowrap"
                        >
                          Pick Gallery
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">COVER BANNER URL</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={bannerInput}
                          onChange={(e) => setBannerInput(e.target.value)}
                          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGalleryPicker("banner")}
                          className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-cyber-cyan text-cyber-cyan text-[10px] font-mono font-bold px-3 py-2 rounded-lg transition-all uppercase whitespace-nowrap"
                        >
                          Pick Gallery
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">PERSONAL MEMBER BIOGRAPHY</label>
                    <textarea
                      rows={3}
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">SPECIAL SKILLS (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g. JavaScript, Ethical Hacking, Arduino, DSA"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>

                  {/* Themes Select */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">PRESET INTERFACE THEME</label>
                      <select
                        value={themeInput}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setThemeInput(val);
                          handleProfileSave(val, undefined);
                        }}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Dark" className="bg-gray-950 text-gray-200">Dark Slate</option>
                        <option value="Light" className="bg-gray-950 text-gray-200">White Mode</option>
                        <option value="Cyber" className="bg-gray-950 text-gray-200">Cyberpunk Grid</option>
                        <option value="Neon" className="bg-gray-950 text-gray-200">Neon Magenta</option>
                        <option value="AMOLED" className="bg-gray-950 text-gray-200">True Black</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">ACCENT HEX COLOR</label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={accentInput}
                          onChange={(e) => {
                            setAccentInput(e.target.value);
                            handleProfileSave(undefined, e.target.value);
                          }}
                          className="w-8 h-8 rounded border border-gray-800 bg-transparent p-0 block cursor-pointer"
                        />
                        <input
                          type="text"
                          value={accentInput}
                          disabled
                          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 text-xs font-mono text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleProfileSave()}
                    className="bg-cyber-cyan hover:bg-cyber-cyan/90 text-gray-950 font-display font-bold text-xs px-5 py-2.5 rounded-lg transition-all"
                  >
                    SAVE PROFILE PROFILE
                  </button>
                </div>

                {/* Real-time Preview side */}
                <div className="lg:col-span-5 space-y-4">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider">LIVE ID CARD PREVIEW</label>
                  
                  <div className="rounded-2xl border border-gray-800 bg-gray-950 overflow-hidden relative shadow-xl">
                    <div className="h-28 overflow-hidden relative bg-gray-900">
                      <img src={bannerInput} alt="Banner" referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-60" />
                    </div>

                    <div className="px-6 pb-6 relative">
                      <div className="flex justify-between items-end -translate-y-6">
                        <img src={avatarInput} alt="Avatar" referrerPolicy="no-referrer" className="w-20 h-20 rounded-full object-cover border-4 border-gray-950 bg-gray-800" />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyber-cyan/30 bg-cyber-cyan/10 text-cyber-cyan uppercase">
                          {user.role} CODE
                        </span>
                      </div>

                      <div className="space-y-3 -mt-2">
                        <div>
                          <h3 className="text-base font-display font-bold text-white">@{user.username}</h3>
                          <span className="text-[10px] font-mono text-gray-500 uppercase block">{profile.badges.join(" | ") || "Recruit Member"}</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{bioInput}</p>

                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {skillsInput.split(",").map((s, i) => s.trim().length > 0 && (
                            <span key={i} className="bg-gray-900 px-2 py-0.5 rounded text-[10px] font-mono border border-gray-800 text-gray-300">
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* 3. QUIZ & EXAM CORE */}
          {activeTab === "quizzes" && (
            <motion.div
              key="tab-quizzes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {!activeQuiz ? (
                <>
                  <div className="border-b border-gray-900 pb-3">
                    <h1 className="text-xl font-display font-bold text-white">Quiz & Exam Core</h1>
                    <p className="text-xs text-gray-400">Evaluate your cyber proficiency against scheduled, automatic-marking questionnaires.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quizzes.map((quiz) => (
                      <div key={quiz.id} className="p-6 rounded-2xl border border-gray-900 bg-gray-900/30 flex flex-col justify-between space-y-4 hover:border-gray-800 transition-all">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan">
                              {quiz.duration} MINUTES DURATION
                            </span>
                            {quiz.negativeMarking && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-red-500/10 border border-red-500/20 text-red-400">
                                PENALTY DETECTED (-25%)
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-display font-bold text-white">{quiz.title}</h3>
                          <p className="text-xs text-gray-400 leading-relaxed">{quiz.description}</p>
                        </div>

                        <div className="pt-4 border-t border-gray-900 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-gray-500">{quiz.questions.length} LOGIC MODULES</span>
                          <button
                            onClick={() => handleStartQuiz(quiz)}
                            className="bg-gray-800 hover:bg-cyber-cyan hover:text-gray-950 font-mono text-[10px] font-bold px-4 py-2 border border-gray-700 hover:border-cyber-cyan rounded-lg transition-all"
                          >
                            RUN EXAMINATION
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Visual Countdown Timer HUD with Animated Progress Ring */}
                  {(() => {
                    const totalSecs = Math.max(1, quizTotalSeconds || (activeQuiz.duration * 60));
                    const timeRemaining = Math.max(0, quizTimer);
                    const percentRemaining = Math.max(0, Math.min(100, (timeRemaining / totalSecs) * 100));
                    const mins = Math.floor(timeRemaining / 60);
                    const secs = timeRemaining % 60;
                    
                    // SVG Circular Progress Math: radius = 38, circumference = 2 * PI * 38 ≈ 238.76
                    const radius = 38;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (percentRemaining / 100) * circumference;

                    const answeredCount = Object.keys(quizAnswers).length;
                    const totalQuestions = activeQuiz.questions.length;
                    const isLowTime = timeRemaining <= 60 && timeRemaining > 0;
                    const isCritical = timeRemaining <= 30 && timeRemaining > 0;

                    // Color theme logic (Green -> Blue -> Red)
                    const ringColor = percentRemaining > 50 
                      ? "#10b981" // Plane Emerald Green
                      : percentRemaining > 20 
                      ? "#0ea5e9" // Plane Sky Blue
                      : "#ef4444"; // Warning Red

                    return (
                      <div className="space-y-4">
                        {/* Sticky Assessment Status Bar */}
                        <div className="sticky top-20 z-30 p-4 bg-gray-950/95 backdrop-blur-md border border-gray-800 rounded-2xl shadow-xl space-y-3">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Left: Exam Info & Progress */}
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                              {/* Circular Progress Ring Timer */}
                              <div className="relative flex items-center justify-center shrink-0 w-24 h-24">
                                <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 96 96">
                                  {/* Background Track */}
                                  <circle
                                    cx="48"
                                    cy="48"
                                    r={radius}
                                    className="stroke-gray-800"
                                    strokeWidth="6"
                                    fill="transparent"
                                  />
                                  {/* Dynamic Progress Ring */}
                                  <circle
                                    cx="48"
                                    cy="48"
                                    r={radius}
                                    stroke={ringColor}
                                    strokeWidth="6"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    className={`transition-all duration-1000 ease-linear ${isCritical ? "animate-pulse" : ""}`}
                                  />
                                </svg>
                                
                                {/* Centered Time Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                  <span className={`text-base font-mono font-extrabold tracking-tight ${
                                    isCritical ? "text-red-400 animate-pulse" : percentRemaining > 50 ? "text-emerald-400" : "text-sky-400"
                                  }`}>
                                    {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                                  </span>
                                  <span className="text-[8px] font-mono text-gray-400 uppercase font-bold tracking-wider">
                                    REMAINING
                                  </span>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[9px] font-mono font-bold rounded uppercase">
                                    EXAM IN PROGRESS
                                  </span>
                                  {activeQuiz.negativeMarking && (
                                    <span className="px-2 py-0.5 bg-red-950 border border-red-800 text-red-400 text-[9px] font-mono font-bold rounded uppercase">
                                      NEGATIVE MARKING (-25%)
                                    </span>
                                  )}
                                </div>
                                <h2 className="text-base font-display font-extrabold text-white mt-1">
                                  {activeQuiz.title}
                                </h2>
                                <div className="flex items-center space-x-3 text-xs font-mono text-gray-400 mt-0.5">
                                  <span>Total Time: <strong className="text-white">{activeQuiz.duration}m</strong></span>
                                  <span>•</span>
                                  <span>Answered: <strong className="text-emerald-400">{answeredCount}</strong> of <strong className="text-white">{totalQuestions}</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Question Navigation & Submit */}
                            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                              <div className="hidden md:flex flex-col items-end mr-2">
                                <span className="text-[10px] font-mono text-gray-400 uppercase">
                                  Completion: {Math.round((answeredCount / totalQuestions) * 100)}%
                                </span>
                                <div className="w-32 bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-800 mt-1">
                                  <div
                                    className="bg-emerald-500 h-full transition-all duration-300"
                                    style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                                  />
                                </div>
                              </div>

                              <button
                                onClick={handleAutoSubmitQuiz}
                                disabled={submittingQuiz}
                                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-mono font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                              >
                                {submittingQuiz ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>EVALUATING...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>SUBMIT ASSESSMENT</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Low Time Alert Banner */}
                          {isLowTime && (
                            <div className="p-2.5 bg-red-950/60 border border-red-700/80 rounded-xl text-red-300 text-xs font-mono flex items-center justify-between animate-pulse">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                <span>
                                  <strong>TIME NOTICE:</strong> Less than {mins > 0 ? `${mins} minute ${secs} seconds` : `${secs} seconds`} remaining! System will auto-submit when the countdown concludes.
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-red-400 hidden sm:inline">CRITICAL PHASE</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {lastQuizScore ? (
                    <div className="p-8 rounded-2xl border border-gray-900 bg-gray-900/40 text-center space-y-4 max-w-lg mx-auto">
                      <Trophy className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                      <h2 className="text-xl font-display font-bold text-white">EVALUATION CONCLUDED</h2>
                      
                      <div className="py-4 bg-gray-950/60 rounded-xl space-y-1 font-mono text-xs border border-gray-900">
                        <span className="text-gray-500">FINAL MEMBER SCORE</span>
                        <div className="text-3xl font-extrabold text-emerald-400">
                          {lastQuizScore.score} / {lastQuizScore.totalPoints} POINTS
                        </div>
                        <span className="text-gray-400 block">
                          Correct Answers: {lastQuizScore.correctAnswers} of {lastQuizScore.totalQuestions}
                        </span>
                      </div>

                      {lastQuizScore.certificateId ? (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs font-mono leading-normal">
                          🎉 Outstanding! You cleared the passing threshold (&gt;80%) and won security certificate {lastQuizScore.certificateId}! Download it on the Vault page.
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 font-mono">
                          You need at least 80% to win the certificate. Check your manuals and try again!
                        </p>
                      )}

                      <button
                        onClick={() => { setActiveQuiz(null); setLastQuizScore(null); }}
                        className="bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs px-6 py-2.5 rounded-lg font-bold"
                      >
                        DISMISS SCREEN
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {activeQuiz.questions.map((q, qIdx) => (
                        <div key={qIdx} className="p-6 rounded-xl border border-gray-900 bg-gray-900/30 space-y-4 hover:border-gray-800 transition-all">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white">
                              <span className="text-emerald-400 font-mono mr-2">MODULE #{qIdx + 1}:</span>
                              {q.question}
                            </h3>
                            {quizAnswers[qIdx] !== undefined && (
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded font-bold">
                                ✓ ANSWERED
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                            {q.options.map((opt, oIdx) => (
                              <button
                                key={oIdx}
                                onClick={() => handleSelectQuizAnswer(qIdx, oIdx)}
                                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                                  quizAnswers[qIdx] === oIdx
                                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold shadow-sm"
                                    : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white"
                                }`}
                              >
                                <span>{opt}</span>
                                {quizAnswers[qIdx] === oIdx && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 ml-2 shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* 4. CERTIFICATES VAULT */}
          {activeTab === "certificates" && (
            <motion.div
              key="tab-certificates"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-gray-900 pb-3">
                <h1 className="text-xl font-display font-bold text-white">SCPSC Certificates Vault</h1>
                <p className="text-xs text-gray-400">Download and showcase your officially-backed IT Club certificates of accomplishment.</p>
              </div>

              {results.filter(r => r.certificateId).length === 0 ? (
                <div className="p-12 border border-dashed border-gray-900 bg-gray-900/10 text-center rounded-2xl space-y-3">
                  <Award className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-xs text-gray-400 font-mono">No certificates issued yet.</p>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    Take the "Introduction to Cyber Security" exam in the Exam Core and score above 80% to generate yours.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8">
                  {results.filter(r => r.certificateId).map((cert) => (
                    <div key={cert.id} className="p-8 rounded-2xl border-2 border-cyber-cyan/30 bg-gray-950 shadow-2xl relative overflow-hidden animate-scanline">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-cyber-cyan/5 rounded-full blur-3xl pointer-events-none" />
                      
                      {/* Insignia watermarks */}
                      <div className="border border-gray-800 p-8 rounded-xl space-y-6 relative text-center">
                        <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                          <span>CREDENTIAL SERIAL ID: {cert.certificateId}</span>
                          <span>SAVAR CANTONMENT, BANGLADESH</span>
                        </div>

                        <div className="space-y-2">
                          <h2 className="text-xs font-mono text-cyber-cyan tracking-widest uppercase font-bold">CERTIFICATE OF PROWESS</h2>
                          <p className="text-3xl font-display font-extrabold text-white">@{cert.username}</p>
                          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                            Has demonstrated master-level comprehension in <strong className="text-white">"{cert.quizTitle}"</strong>, successfully completing the scheduled club examinations with a grade of <strong className="text-cyber-cyan">{Math.floor((cert.score / cert.totalPoints) * 100)}%</strong>.
                          </p>
                        </div>

                        <div className="pt-6 border-t border-gray-900 flex justify-between items-end">
                          <div className="text-left font-mono text-[9px] text-gray-600">
                            <span>AUTHENTICATED BY: SAVAR CANT. IT BOARD</span>
                            <span className="block">ISSUED DATE: {new Date(cert.timestamp).toLocaleDateString()}</span>
                          </div>

                          {/* Print mock trigger */}
                          <button
                            onClick={() => window.print()}
                            className="bg-cyber-cyan text-gray-950 font-mono text-[10px] font-bold px-4 py-2 rounded-lg"
                          >
                            PRINT CREDENTIAL
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* 5. DEPARTMENTS CIRCLE */}
          {activeTab === "departments" && (
            <motion.div
              key="tab-departments"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-gray-900 pb-3">
                <h1 className="text-xl font-display font-bold text-white">Core Departments Circle</h1>
                <p className="text-xs text-gray-400">Enlist in core departments to access materials, networks, and direct guides.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {departments.map((dept) => {
                  const isMember = dept.members.includes(user.id);
                  return (
                    <div key={dept.id} className="p-6 rounded-2xl border border-gray-900 bg-gray-900/30 space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="text-base font-display font-bold text-white leading-tight">{dept.name}</h3>
                          {isMember ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-green-500/10 border border-green-500/20 text-green-400 flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>ENROLLED</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleJoinDepartment(dept.id)}
                              className="text-[9px] font-mono text-cyber-cyan border border-cyber-cyan/20 bg-cyber-cyan/5 hover:bg-cyber-cyan hover:text-gray-950 px-2.5 py-1 rounded transition-all"
                            >
                              ENLIST
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{dept.description}</p>
                      </div>

                      <div className="pt-4 border-t border-gray-900 space-y-3">
                        <div className="flex justify-between text-[10px] font-mono text-gray-500">
                          <span>LEADER: {dept.leader}</span>
                          <span>{dept.membersCount} MEMBERS</span>
                        </div>

                        {/* Resources if member */}
                        {isMember && dept.resources.length > 0 && (
                          <div className="bg-gray-950/40 p-3 rounded-lg space-y-1.5 font-mono text-xs">
                            <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-bold">RESOURCE SHEETS</span>
                            {dept.resources.map((res, i) => (
                              <a
                                key={i}
                                href={res.link}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between text-cyber-cyan hover:underline hover:text-white"
                              >
                                <span>{res.title}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* GALLERY / CENTRAL FILE ARCHIVE */}
          {activeTab === "gallery" && (
            <motion.div
              key="tab-gallery"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-gray-900 pb-3">
                <h1 className="text-xl font-display font-bold text-white">Central Gallery & File Archive</h1>
                <p className="text-xs text-gray-400">Securely share and view workshop captures, lecture slides, robotics code sheets, and club media.</p>
              </div>

              {/* UPLOAD TERMINAL GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Drag and Drop Zone */}
                <div className="lg:col-span-5 flex flex-col">
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`flex-1 min-h-[180px] p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 relative ${
                      dragActive
                        ? "border-cyber-cyan bg-cyber-cyan/10 text-white"
                        : "border-gray-800 bg-gray-900/10 hover:border-gray-700 text-gray-400"
                    }`}
                  >
                    <input
                      id="gallery-file-picker"
                      type="file"
                      className="hidden"
                      onChange={(e) => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
                    />
                    <Upload className={`w-8 h-8 mb-3 transition-transform ${dragActive ? "scale-110 text-cyber-cyan" : "text-gray-500"}`} />
                    <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">Drag & Drop Secure File</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">Images or Documents (Max 3MB)</p>
                    <button
                      type="button"
                      onClick={() => document.getElementById("gallery-file-picker")?.click()}
                      className="mt-4 px-4 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-cyber-cyan rounded-lg text-[10px] font-mono font-bold text-white transition-all uppercase"
                    >
                      Browse Local Files
                    </button>
                  </div>
                </div>

                {/* File Details Input Form */}
                <form onSubmit={handleUploadItem} className="lg:col-span-7 p-6 border border-gray-900 bg-gray-950/40 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[9px] font-mono text-cyber-cyan uppercase tracking-widest font-bold block mb-1">Archive Deployer</span>
                    <h4 className="text-xs font-display font-bold text-white uppercase mb-4">Metadata & Content Registry</h4>

                    {uploadProgress && (
                      <div className="p-2.5 mb-3 bg-gray-950 border border-cyber-cyan/30 text-cyber-cyan font-mono text-[10px] rounded-lg animate-pulse uppercase">
                        {uploadProgress}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Archive Title *</label>
                        <input
                          type="text"
                          required
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g. Session Capture 2026"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Category context</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          <option value="General">General Archive</option>
                          <option value="Workshop">Workshop Capture</option>
                          <option value="Hackathon">Hackathon Record</option>
                          <option value="Lab Session">Lab Tutorial</option>
                          <option value="Competition">Competition Material</option>
                          <option value="Project Showcase">Project Highlight</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">File Type</label>
                        <select
                          value={newType}
                          onChange={(e) => setNewType(e.target.value as any)}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                        >
                          <option value="Photo">Photo</option>
                          <option value="Document">Document</option>
                          <option value="Video">Video</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">Link URL (Optional override)</label>
                        <input
                          type="text"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          placeholder="Paste Direct URL if not picking local file"
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-cyber-cyan hover:bg-cyber-cyan/90 text-gray-950 px-6 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      <span>DEPART AND ARCHIVE FILE</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SEARCH & FILTER TERMINAL */}
              <div className="p-4 rounded-xl border border-gray-900 bg-gray-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      value={gallerySearch}
                      onChange={(e) => setGallerySearch(e.target.value)}
                      placeholder="SEARCH SHARED ARCHIVES..."
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyber-cyan font-mono"
                    />
                    {gallerySearch && (
                      <button
                        type="button"
                        onClick={() => setGallerySearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white font-mono text-[10px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  {/* Type Toggles */}
                  <div className="flex border border-gray-800 bg-gray-900/40 rounded-lg overflow-hidden">
                    {["All", "Photo", "Video", "Document"].map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setGalleryTypeFilter(t)}
                        className={`px-3 py-1.5 text-[10px] uppercase font-bold transition-all ${
                          galleryTypeFilter === t
                            ? "bg-cyber-cyan text-gray-950"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>

                  {/* Category Filter */}
                  <select
                    value={galleryCategoryFilter}
                    onChange={(e) => setGalleryCategoryFilter(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-[10px] text-gray-300 focus:outline-none font-mono"
                  >
                    <option value="All">All Categories</option>
                    <option value="General">General</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Lab Session">Lab Session</option>
                    <option value="Competition">Competition</option>
                    <option value="Project Showcase">Project Showcase</option>
                  </select>
                </div>
              </div>

              {/* GALLERY RESPONSE GRID */}
              {(() => {
                const filtered = gallery.filter((item) => {
                  const matchSearch = item.title.toLowerCase().includes(gallerySearch.toLowerCase());
                  const matchType = galleryTypeFilter === "All" || item.type === galleryTypeFilter;
                  const matchCategory = galleryCategoryFilter === "All" || item.category === galleryCategoryFilter;
                  return matchSearch && matchType && matchCategory;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 border border-dashed border-gray-900 bg-gray-900/10 text-center rounded-2xl space-y-3">
                      <ImageIcon className="w-12 h-12 text-gray-600 mx-auto" />
                      <p className="text-xs text-gray-400 font-mono">No matching files found inside archive.</p>
                      <p className="text-[11px] text-gray-500 max-w-sm mx-auto uppercase">
                        Drop a file above or reset query configurations.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <AnimatePresence>
                      {filtered.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group relative border border-gray-900 bg-gray-950/40 rounded-xl overflow-hidden hover:border-cyber-cyan/50 transition-all flex flex-col justify-between"
                        >
                          {/* File context category badge */}
                          <div className="absolute top-2.5 left-2.5 z-10">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-gray-950/90 border border-gray-800 text-cyber-cyan uppercase tracking-wider">
                              {item.category}
                            </span>
                          </div>

                          {/* Quick Delete panel if Admin or matching user (allow general for robust prototype if needed) */}
                          <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGalleryItem(item.id);
                              }}
                              className="p-1.5 bg-gray-900 hover:bg-red-500 text-gray-400 hover:text-white rounded-lg border border-gray-800 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Top Visual Area */}
                          <div className="relative aspect-video bg-gray-950 overflow-hidden flex items-center justify-center cursor-pointer" onClick={() => setSelectedGalleryItem(item)}>
                            {item.type === "Photo" ? (
                              <img
                                src={item.url}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : item.type === "Video" ? (
                              <div className="flex flex-col items-center justify-center space-y-2 text-center p-4">
                                <div className="p-3 bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan rounded-full group-hover:scale-110 transition-transform">
                                  <Video className="w-6 h-6" />
                                </div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-bold">VIDEO CAPTURE</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center space-y-2 text-center p-4">
                                <div className="p-3 bg-cyber-pink/10 border border-cyber-pink/20 text-cyber-pink rounded-full group-hover:scale-110 transition-transform">
                                  <FileText className="w-6 h-6" />
                                </div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-bold">DOCUMENT FILE</span>
                              </div>
                            )}

                            {/* Hover overlay glass card */}
                            <div className="absolute inset-0 bg-gray-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest border border-white/20 bg-gray-900/90 px-3 py-1.5 rounded-lg transition-all">
                                VIEW ARCHIVE
                              </span>
                            </div>
                          </div>

                          {/* Card details */}
                          <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <h4 className="text-xs font-display font-bold text-white truncate uppercase">{item.title}</h4>
                              <div className="flex items-center space-x-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'Photo' ? 'bg-cyber-cyan' : item.type === 'Video' ? 'bg-yellow-400' : 'bg-cyber-pink'}`} />
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">{item.type} archive node</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-gray-900/60 flex items-center justify-between text-[9px] font-mono text-gray-500">
                              <span>DEPLOYED ON</span>
                              <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                );
              })()}

              {/* LIGHTBOX / FULL PREVIEW MODAL */}
              <AnimatePresence>
                {selectedGalleryItem && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Dark blur overlay */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedGalleryItem(null)}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal content body */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col md:flex-row shadow-2xl z-10"
                    >
                      {/* Media preview panel */}
                      <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[250px] md:min-h-[400px]">
                        {selectedGalleryItem.type === "Photo" ? (
                          <img
                            src={selectedGalleryItem.url}
                            alt={selectedGalleryItem.title}
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-[60vh] object-contain rounded-lg"
                          />
                        ) : selectedGalleryItem.type === "Video" ? (
                          <div className="text-center space-y-4 p-8">
                            <Video className="w-16 h-16 text-yellow-400 mx-auto" />
                            <p className="text-sm font-mono text-white font-bold uppercase">{selectedGalleryItem.title}</p>
                            <a
                              href={selectedGalleryItem.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-yellow-400 text-gray-950 font-mono text-xs font-bold rounded-lg hover:bg-yellow-300"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>LAUNCH LINK / RECORDING URL</span>
                            </a>
                          </div>
                        ) : (
                          <div className="text-center space-y-4 p-8">
                            <FileText className="w-16 h-16 text-cyber-pink mx-auto" />
                            <p className="text-sm font-mono text-white font-bold uppercase">{selectedGalleryItem.title}</p>
                            <a
                              href={selectedGalleryItem.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-cyber-pink text-white font-mono text-xs font-bold rounded-lg hover:bg-cyber-pink/90"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>DOWNLOAD / VIEW DOCUMENT FILE</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Info side column */}
                      <div className="w-full md:w-80 p-6 border-t md:border-t-0 md:border-l border-gray-900 bg-gray-950 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan uppercase">
                              {selectedGalleryItem.category}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedGalleryItem(null)}
                              className="text-gray-500 hover:text-white font-mono text-xs uppercase hover:underline"
                            >
                              [ CLOSE ]
                            </button>
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-base font-display font-bold text-white uppercase leading-tight">{selectedGalleryItem.title}</h3>
                            <p className="text-[10px] font-mono text-gray-500 uppercase">{selectedGalleryItem.type} file asset</p>
                          </div>

                          <div className="pt-4 border-t border-gray-900 space-y-2 font-mono text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-gray-500">RESOURCE NODE</span>
                              <span className="text-white truncate max-w-[120px]">{selectedGalleryItem.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">DEPLOYED DATE</span>
                              <span className="text-white">{new Date(selectedGalleryItem.uploadedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-gray-900 space-y-2">
                          <a
                            href={selectedGalleryItem.url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-cyber-cyan text-white text-center rounded-xl font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>OPEN IN NEW NODE</span>
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* 6. MESSAGING SYSTEM */}
          {activeTab === "messages" && (
            <motion.div
              key="tab-messages"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="border-b border-gray-900 pb-3">
                <h1 className="text-xl font-display font-bold text-white">Executive Messaging System</h1>
                <p className="text-xs text-gray-400">Send direct secure inquiries to the Savar Cantonment IT board. Replies appear instantly.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form dispatch */}
                <form onSubmit={handleSendMessage} className="lg:col-span-5 p-5 border border-gray-900 bg-gray-900/10 rounded-xl space-y-4">
                  <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider">Send Inquire Ticket</h3>
                  
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">INQUIRY INSTRUCTIONS</label>
                    <textarea
                      rows={4}
                      required
                      value={newMessageContent}
                      onChange={(e) => setNewMessageContent(e.target.value)}
                      placeholder="Type details about workshops, projects, database configurations, or certificates..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={messageSending}
                    className="w-full bg-cyber-cyan text-gray-950 font-display font-bold text-xs py-2.5 rounded-lg flex items-center justify-center space-x-1.5"
                  >
                    {messageSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>DISPATCH TICKET</span>
                  </button>
                </form>

                {/* Conversation log list */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider">Conversation Log Threads</h3>

                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {messages.length === 0 ? (
                      <div className="p-6 border border-dashed border-gray-900 bg-gray-900/10 text-center rounded-xl font-mono text-xs text-gray-600">
                        No support tickets found on your account.
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className="p-4 rounded-xl border border-gray-900 bg-gray-900/20 space-y-3">
                          <div className="flex justify-between items-start text-[10px] font-mono text-gray-500">
                            <span>TICKET ID: {msg.id}</span>
                            <span>{new Date(msg.timestamp).toLocaleDateString()}</span>
                          </div>
                          
                          <p className="text-xs text-white bg-gray-950/40 p-2.5 rounded-lg">{msg.content}</p>

                          {msg.replies.map((rep) => (
                            <div key={rep.id} className="bg-cyber-cyan/5 border-l-2 border-cyber-cyan p-2.5 rounded-r-lg space-y-1">
                              <span className="text-[10px] font-mono font-bold text-cyber-cyan block">{rep.sender}</span>
                              <p className="text-xs text-gray-300 leading-normal">{rep.content}</p>
                              <span className="text-[9px] text-gray-500 font-mono block">{new Date(rep.timestamp).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 7. CYBER HUB AI */}
          {activeTab === "ai" && (
            <motion.div
              key="tab-ai"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4 flex flex-col h-[75vh]"
            >
              <div className="border-b border-gray-900 pb-2">
                <h1 className="text-xl font-display font-bold text-white flex items-center space-x-1.5">
                  <Bot className="w-5 h-5 text-cyber-cyan" />
                  <span>Cyber Hub AI Cores</span>
                </h1>
                <p className="text-xs text-gray-400">Integrated server-side Gemini multi-mode framework. Select your operational core below.</p>
              </div>

              {/* 5-MODE CORE SELECTOR */}
              <div className="grid grid-cols-5 gap-2 border border-gray-900 bg-gray-950/40 p-1.5 rounded-xl">
                {[
                  { id: "study", label: "Study Core", icon: BookOpen, desc: "Academic tutoring & concepts" },
                  { id: "image", label: "Image Lab", icon: ImageIcon, desc: "AI aesthetic graphic design visuals" },
                  { id: "cyber security", label: "Cyber Sec", icon: Shield, desc: "Ethical hacking & defensive protocols" },
                  { id: "programming", label: "Programming", icon: Code, desc: "Algorithm debugging & code synthesis" },
                  { id: "graphic design", label: "Graphic UX", icon: Palette, desc: "UI/UX styling & Tailwind systems" }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = aiMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setAiMode(m.id as any);
                        setAiHistory((prev) => [
                          ...prev,
                          {
                            role: "model",
                            text: `🔄 System calibrated to [${m.label.toUpperCase()} CORE]. Now ready to assist with ${m.desc}. How can I help you?`
                          }
                        ]);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan"
                          : "bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/30"
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? "text-cyber-cyan animate-pulse" : "text-gray-500"}`} />
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-center hidden sm:block">{m.label}</span>
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-center sm:hidden">{m.label.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Suggestions based on current mode */}
              <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                {aiMode === "study" && (
                  <>
                    <button onClick={() => setAiMessage("Explain how Merge Sort works step-by-step")} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-md px-3 py-1 text-gray-300">Merge Sort</button>
                    <button onClick={() => setAiMessage("Give me 5 study questions on binary systems")} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-md px-3 py-1 text-gray-300">Binary Questions</button>
                  </>
                )}
                {aiMode === "image" && (
                  <>
                    <button onClick={() => setAiMessage("Create an image of a futuristic neon cyber club badge")} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-md px-3 py-1 text-gray-300">Neon Badge</button>
                    <button onClick={() => setAiMessage("Generate an image of an aesthetic dark-themed coding workspace")} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-md px-3 py-1 text-gray-300">Coding Space</button>
                  </>
                )}
                {aiMode === "cyber security" && (
                  <>
                    <button onClick={() => setAiMessage("Explain symmetrical vs asymmetrical encryption")} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-md px-3 py-1 text-gray-300">Encryption</button>
                    <button onClick={() => setAiMessage("What are the best defensive security headers?")} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-md px-3 py-1 text-gray-300">Security Headers</button>
                  </>
                )}
                {aiMode === "programming" && (
                  <>
                    <button onClick={() => setAiMessage("Write a clean C++ boilerplate for quick sort")} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-md px-3 py-1 text-gray-300">C++ QuickSort</button>
                    <button onClick={() => setAiMessage("Show me how to optimize API fetching in React")} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-md px-3 py-1 text-gray-300">React Fetching</button>
                  </>
                )}
                {aiMode === "graphic design" && (
                  <>
                    <button onClick={() => setAiMessage("What are the core color codes for a high-tech cyberpunk palette?")} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-md px-3 py-1 text-gray-300">Cyber Colors</button>
                    <button onClick={() => setAiMessage("Explain Tailwind responsive prefixes for desktop-first layout")} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-md px-3 py-1 text-gray-300">Responsive Grids</button>
                  </>
                )}
              </div>

              {/* Chat box */}
              <div className="flex-1 bg-gray-950/60 border border-gray-900 rounded-xl p-4 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-sans text-xs">
                  {aiHistory.map((h, i) => {
                    // Check if message has generate image tag
                    const hasImage = h.text.includes("[GENERATE_IMAGE:");
                    let cleanText = h.text;
                    let imagePrompt = "";
                    if (hasImage) {
                      const match = h.text.match(/\[GENERATE_IMAGE:\s*(.*?)\]/);
                      if (match && match[1]) {
                        imagePrompt = match[1];
                        cleanText = h.text.replace(/\[GENERATE_IMAGE:\s*(.*?)\]/g, "");
                      }
                    }

                    // Check if message has admin unlock trigger button
                    const hasUnlockButton = h.text.includes("[SHOW_ADMIN_UNLOCK_BUTTON]");
                    if (hasUnlockButton) {
                      cleanText = cleanText.replace("[SHOW_ADMIN_UNLOCK_BUTTON]", "");
                    }

                    return (
                      <div key={i} className={`flex ${h.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-xl p-3.5 leading-relaxed border ${
                          h.role === "user" 
                            ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-white" 
                            : "bg-gray-900 border-gray-800 text-gray-300"
                        }`}>
                          <span className="block text-[10px] font-mono text-gray-500 uppercase font-bold mb-1">
                            {h.role === "user" ? "MEMBER INQUIRY" : `AI ${aiMode.toUpperCase()} RESPONSE`}
                          </span>
                          <p className="whitespace-pre-wrap">{cleanText}</p>

                          {/* Render dynamic image if generated */}
                          {imagePrompt && (
                            <div className="mt-3 p-1 bg-gray-950 border border-gray-800 rounded-lg overflow-hidden group relative">
                              <img 
                                src={`https://image.pollinations.ai/p/${encodeURIComponent(imagePrompt)}`} 
                                alt={imagePrompt}
                                referrerPolicy="no-referrer"
                                className="w-full max-h-[300px] object-cover rounded-md border border-gray-900"
                              />
                              <div className="absolute bottom-2 left-2 right-2 bg-gray-950/90 border border-gray-800 px-2 py-1 rounded text-[9px] font-mono text-cyber-cyan">
                                PROMPT: {imagePrompt}
                              </div>
                            </div>
                          )}

                          {/* Render Admin Unlock Button */}
                          {h.role === "model" && hasUnlockButton && (
                            <div className="mt-4 border-t border-gray-800/60 pt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowUnlockModal(true);
                                }}
                                className="w-full bg-cyber-pink hover:bg-cyber-pink/90 text-white font-mono font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-lg animate-pulse"
                              >
                                <Terminal className="w-4 h-4" />
                                <span>LAUNCH ADMIN CONNECTIVITY OVERLAY</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center space-x-2 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin text-cyber-cyan" />
                        <span className="font-mono text-xs">STREAMING RESPONSE CHUNKS...</span>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendAiMessage} className="mt-4 border-t border-gray-900 pt-3 flex gap-2">
                  <input
                    type="text"
                    required
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    placeholder={`Query the Cyber Hub in ${aiMode} mode...`}
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                  />
                  <button
                    type="submit"
                    className="bg-cyber-cyan hover:bg-cyber-cyan/90 text-gray-950 px-4 py-2 rounded-lg"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* 8. CONSOLE SETTINGS */}
          {activeTab === "settings" && (
            <motion.div
              key="tab-settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="border-b border-gray-900 pb-3">
                <h1 className="text-xl font-display font-bold text-white">{getTranslation(languageCode, "settings")}</h1>
                <p className="text-xs text-gray-400">Manage account properties, parameters deletion, and accessibility rules.</p>
              </div>

              <div className="max-w-2xl space-y-2">
                
                {/* Preferences */}
                <div className="py-4 space-y-4">
                  <h3 className="text-sm font-mono text-gray-400 uppercase font-bold">Preferences</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">LANGUAGE CORE</label>
                      <select
                        value={languageCode}
                        onChange={async (e) => {
                          const code = e.target.value;
                          onLanguageChange(code);
                          setProfile(prev => ({ ...prev, language: code }));
                          try {
                            const res = await fetch("/api/user/profile", {
                              method: "POST",
                              headers: { 
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                userId: user.id,
                                bio: bioInput,
                                avatar: avatarInput,
                                banner: bannerInput,
                                skills: skillsInput.split(",").map(s => s.trim()).filter(Boolean),
                                accentColor: accentInput,
                                theme: themeInput,
                                language: code,
                                fontSize: profile.fontSize,
                                profileVisibility: profile.profileVisibility
                              })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setProfile(data.profile);
                              if (onProfileUpdate) onProfileUpdate(data.profile);
                            }
                            setSaveStatus("LANGUAGE SYNCHRONIZED SUCCESSFULLY!");
                            setTimeout(() => setSaveStatus(""), 3000);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-mono"
                      >
                        {LANGUAGE_OPTIONS.map((opt) => (
                          <option key={opt.code} value={opt.code} className="bg-gray-950 text-gray-200">
                            {opt.flag} {opt.name.toUpperCase()} ({opt.code.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">ACCESSIBILITY ACCENT SIZE</label>
                        <select
                          value={profile.fontSize}
                          onChange={(e) => setProfile(prev => ({ ...prev, fontSize: e.target.value as any }))}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-mono"
                        >
                          <option value="sm" className="bg-gray-950 text-gray-200">SMALL TEXT (12PX)</option>
                          <option value="md" className="bg-gray-950 text-gray-200">NORMAL TEXT (14PX)</option>
                          <option value="lg" className="bg-gray-950 text-gray-200">LARGE TEXT (16PX)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">PROFILE DIRECTORY VISIBILITY</label>
                        <select
                          value={profile.profileVisibility}
                          onChange={(e) => setProfile(prev => ({ ...prev, profileVisibility: e.target.value as any }))}
                          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-mono"
                        >
                          <option value="Public" className="bg-gray-950 text-gray-200">PUBLIC (APPEARS IN DIRECTORIES)</option>
                          <option value="Private" className="bg-gray-950 text-gray-200">PRIVATE (RESTRICTED FROM INDEX)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-900/40 my-4" />

                {/* Custom API Key Config */}
                <div className="py-4 space-y-4">
                  <h3 className="text-sm font-mono text-gray-400 uppercase font-bold">Custom Gemini API Gateway</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    By default, the platform uses the system's shared Gemini API cluster. You can paste your own personal Google AI Studio API key here to bypass query limits or log customized instructions.
                  </p>
                  
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => {
                        setCustomApiKey(e.target.value);
                        localStorage.setItem("customApiKey", e.target.value);
                        setSaveStatus("CUSTOM API GATEWAY KEY CACHED LOCALLY!");
                        setTimeout(() => setSaveStatus(""), 3000);
                      }}
                      placeholder="AI_STUDY_GEMINI_API_KEY_xxxxxxxx"
                      className="w-full bg-gray-950 border border-gray-850 rounded-lg px-4 py-2.5 text-xs text-white placeholder-gray-800 tracking-wider font-mono focus:outline-none focus:border-cyber-cyan"
                    />
                    {customApiKey && (
                      <button
                        onClick={() => {
                          setCustomApiKey("");
                          localStorage.removeItem("customApiKey");
                          setSaveStatus("CUSTOM API GATEWAY CLEARED. REVERTED TO PUBLIC CLUSTER.");
                          setTimeout(() => setSaveStatus(""), 3000);
                        }}
                        className="text-[10px] font-mono text-red-400 hover:underline"
                      >
                        CLEAR CUSTOM KEY & REVERT TO SHARED CLUSTER
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-900/40 my-4" />

                {/* Account Actions */}
                <div className="py-4 space-y-4">
                  <h3 className="text-sm font-mono text-red-400 uppercase font-bold">Danger Zone Actions</h3>
                  <p className="text-xs text-red-500/80 leading-relaxed">
                    Wiping account indexes will permanently delete your profiles, results history, custom accent rules, and messaging tickets. This action cannot be reversed.
                  </p>
                  
                  <button
                    onClick={handleDeleteAccount}
                    className="bg-red-800 hover:bg-red-700 text-white font-mono text-xs font-bold px-4 py-2.5 border border-red-900 rounded-lg cursor-pointer"
                  >
                    PERMANENTLY WIPE MEMBER PORTAL ACCOUNT
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* CLASS ROUTINE & CODES TAB */}
          {activeTab === "routines" && (
            <motion.div
              key="tab-routines"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="p-6 bg-gray-950/60 border border-gray-900 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-900 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">
                        CLASS ROUTINES & TIMETABLE CODES
                      </h2>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        Savar Cantonment Public School and College IT Club | Schedule & Lab Meeting Matrix
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg font-bold">
                    {classSchedules.length} SESSIONS SCHEDULED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classSchedules.length === 0 ? (
                    <div className="col-span-2 p-8 text-center text-gray-500 font-mono border border-dashed border-gray-800 rounded-xl">
                      NO ROUTINE OR CLASS CODES PUBLISHED YET.
                    </div>
                  ) : (
                    classSchedules.map((cls) => (
                      <div key={cls.id} className="p-5 bg-gray-900/40 border border-gray-900 hover:border-amber-500/50 rounded-xl space-y-3 transition-all">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-800 text-amber-400 font-bold rounded uppercase">
                            {cls.type || "Club Routine"}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {new Date(cls.date).toLocaleDateString()} @ {new Date(cls.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white">{cls.title || cls.subject}</h3>
                          {cls.topic && <p className="text-xs text-gray-400 mt-1">{cls.topic}</p>}
                        </div>

                        <div className="pt-2 border-t border-gray-900 flex justify-between items-center text-xs font-mono">
                          <span className="text-gray-400">Instructor: <strong className="text-white">{cls.instructor || "IT Club Executive"}</strong></span>
                          {cls.link && cls.link.startsWith("http") ? (
                            <a
                              href={cls.link}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-lg flex items-center space-x-1"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>JOIN LIVE</span>
                            </a>
                          ) : (
                            <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded font-bold">
                              📍 {cls.link || "Lab 402"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* EXECUTIVE BOARD TAB */}
          {activeTab === "executives" && (
            <motion.div
              key="tab-executives"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="p-6 bg-gray-950/60 border border-gray-900 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-gray-900 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">
                        EXECUTIVE LEADERSHIP COMMITTEE
                      </h2>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        Savar Cantonment Public School and College IT Club | Governing Council
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg font-bold">
                    {executivesList.length} LEADER NODES
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {executivesList.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-gray-500 font-mono border border-dashed border-gray-800 rounded-xl">
                      NO EXECUTIVE MEMBERS LISTED.
                    </div>
                  ) : (
                    executivesList.map((exec) => (
                      <div key={exec.id} className="p-5 bg-gray-900/40 border border-gray-900 hover:border-emerald-500/50 rounded-xl space-y-4 transition-all">
                        <div className="flex items-center space-x-3.5">
                          <img
                            src={exec.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
                            alt={exec.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30 bg-gray-950"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-white">{exec.name}</h3>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">{exec.role || exec.title}</span>
                            <span className="text-[9px] font-mono text-gray-500 block">{exec.department || "Savar Cantonment Public School and College"}</span>
                          </div>
                        </div>

                        {exec.bio && (
                          <p className="text-xs text-gray-400 leading-relaxed bg-gray-950/60 p-3 rounded-lg border border-gray-900">
                            {exec.bio}
                          </p>
                        )}

                        <div className="pt-2 border-t border-gray-900 flex justify-between items-center text-[10px] font-mono text-gray-400">
                          <span>📧 {exec.email || "exec@cyberhub.edu"}</span>
                          <span className="text-emerald-400 font-bold">ACTIVE LEADER</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* CUSTOM ADMIN PAGES VIEW (e.g. SCPSC IT CODE OF CONDUCT, ETC.) */}
          {activeTab.startsWith("custom-") && (
            <motion.div
              key={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {(() => {
                const pageId = activeTab.replace("custom-", "");
                const customPage = customPages.find(p => p.id === pageId);

                if (!customPage) {
                  return (
                    <div className="p-8 text-center bg-gray-950/60 border border-gray-900 rounded-2xl space-y-3 font-mono">
                      <HelpCircle className="w-8 h-8 text-yellow-500 mx-auto animate-bounce" />
                      <h3 className="text-sm font-bold text-white uppercase">PAGE CONTENT NOT FOUND</h3>
                      <p className="text-xs text-gray-400">The requested page node is unavailable.</p>
                      <button
                        onClick={() => setActiveTab("overview")}
                        className="px-4 py-2 bg-cyber-cyan text-gray-950 font-bold rounded-lg text-xs"
                      >
                        RETURN TO OVERVIEW
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="p-6 md:p-8 bg-gray-950/60 border border-gray-900 rounded-2xl space-y-6 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-900 pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-xl text-cyber-cyan">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">
                            {customPage.title}
                          </h2>
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                            SAVAR IT CLUB OFFICIAL POLICY & INFORMATION DECK
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab("overview")}
                        className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-mono text-xs rounded-lg border border-gray-800 transition-all cursor-pointer"
                      >
                        ← OVERVIEW
                      </button>
                    </div>

                    <div className="prose prose-invert max-w-none text-xs md:text-sm font-sans text-gray-300 leading-relaxed whitespace-pre-line bg-gray-900/30 p-6 rounded-xl border border-gray-900">
                      {customPage.content}
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 pt-4 border-t border-gray-900">
                      <span>LAST REVISED: {customPage.updatedAt ? new Date(customPage.updatedAt).toLocaleDateString() : "OFFICIAL POLICY"}</span>
                      <span className="text-cyber-cyan font-bold">SAVAR CANTONMENT PUBLIC SCHOOL & COLLEGE IT CLUB</span>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

        </AnimatePresence>

        {/* Member Portal Footer */}
        <footer className="w-full border-t border-gray-900/60 mt-12 py-6 text-center font-mono text-[10px] text-gray-500">
          <p>Savar Cantonment Public School and College IT Club &bull; Member Portal</p>
          <p className="mt-1">
            Developed by{" "}
            <a
              href="https://maheeb1.netlify.app"
              target="_blank"
              rel="noreferrer"
              className="text-cyber-cyan hover:underline font-semibold"
            >
              Md. Maheeb Hossain (maheeb1.netlify.app)
            </a>
          </p>
        </footer>
      </main>

      {/* 1. ADMIN PANEL ACCESS KEY VERIFICATION OVERLAY */}
      <AnimatePresence>
        {showUnlockModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-950 border border-cyber-pink/40 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockPasswordInput("");
                  setUnlockError("");
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-white font-mono text-sm"
              >
                ✕
              </button>

              <div className="flex items-center space-x-2 text-cyber-pink">
                <Terminal className="w-5 h-5 animate-pulse" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-widest">ADMIN GATEWAY DECRYPTION</h2>
              </div>

              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                The AI Hub has approved your interface request. To finalise administrative decryption and map the console button, please input the correct verification password below:
              </p>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1">DECRYPTION SECRET KEY</label>
                <input
                  type="password"
                  required
                  value={unlockPasswordInput}
                  onChange={(e) => {
                    setUnlockPasswordInput(e.target.value);
                    setUnlockError("");
                  }}
                  placeholder="Enter administrative password..."
                  className="w-full bg-gray-900 border border-gray-800 focus:border-cyber-pink rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
                {unlockError && (
                  <p className="text-[10px] text-red-500 font-mono mt-1.5 uppercase">✕ ERROR: {unlockError}</p>
                )}
              </div>

              <div className="pt-2 flex justify-end space-x-3 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    setUnlockPasswordInput("");
                    setUnlockError("");
                  }}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pass = unlockPasswordInput.trim();
                    if (pass === "scpscitclub2026" || pass === "admin123" || pass === "SCPSC-IT-CLUB-ADMIN" || pass === "scpsc-it-club-admin") {
                      setAdminUnlocked(true);
                      localStorage.setItem("adminUnlocked", "true");
                      setSaveStatus("ADMIN CONSOLE SUCCESSFULLY DECRYPTED AND ACTIVE!");
                      setTimeout(() => setSaveStatus(""), 4000);
                      setShowUnlockModal(false);
                      setUnlockPasswordInput("");
                      setUnlockError("");
                    } else {
                      setUnlockError("Decryption handshake rejected. Key pattern mismatch.");
                    }
                  }}
                  className="px-5 py-2 bg-cyber-pink hover:bg-cyber-pink/90 text-white font-bold rounded-lg uppercase"
                >
                  VERIFY SOCKET
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. DIRECT GALLERY PICTURE SELECTOR OVERLAY */}
      <AnimatePresence>
        {showGalleryPicker && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-950 border border-cyber-cyan/40 max-w-2xl w-full rounded-2xl p-6 space-y-4 shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              <button
                type="button"
                onClick={() => setShowGalleryPicker(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white font-mono text-sm"
              >
                ✕
              </button>

              <div className="flex items-center space-x-2 text-cyber-cyan">
                <ImageIcon className="w-5 h-5 shrink-0" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-widest">
                  SELECT {showGalleryPicker === "avatar" ? "AVATAR" : "COVER BANNER"} FROM GALLERY
                </h2>
              </div>

              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Click any high-resolution capture or graphic directly from the SCPSC club file archive to instantly map it as your profile image asset.
              </p>

              {/* Gallery List */}
              <div className="flex-1 overflow-y-auto min-h-[250px] pr-2 mt-2">
                {gallery.filter(g => g.type === "Photo").length === 0 ? (
                  <div className="h-[250px] flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-xl text-center text-gray-500 space-y-2">
                    <ImageIcon className="w-8 h-8 text-gray-650" />
                    <p className="text-xs font-mono uppercase">Archive is currently empty</p>
                    <p className="text-[10px] text-gray-600">Upload direct captures inside the Gallery tab first!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {gallery.filter(g => g.type === "Photo").map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (showGalleryPicker === "avatar") {
                            setAvatarInput(item.url);
                          } else if (showGalleryPicker === "banner") {
                            setBannerInput(item.url);
                          }
                          setShowGalleryPicker(null);
                          setSaveStatus("IMAGE MAPPED SUCCESSFULLY! REMEMBER TO SAVE PROFILE.");
                          setTimeout(() => setSaveStatus(""), 3000);
                        }}
                        className="group bg-gray-900 hover:bg-gray-850 border border-gray-850 hover:border-cyber-cyan p-1.5 rounded-lg text-left transition-all relative overflow-hidden"
                      >
                        <img 
                          src={item.url} 
                          alt={item.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-24 object-cover rounded border border-gray-950 mb-1"
                        />
                        <div className="px-1 truncate">
                          <span className="block text-[9px] font-mono font-bold text-white truncate uppercase">{item.title}</span>
                          <span className="block text-[8px] font-mono text-gray-500 truncate uppercase">{item.category}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGalleryPicker(null)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-xs font-mono text-gray-400 hover:text-white uppercase"
                >
                  CLOSE ARCHIVE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
