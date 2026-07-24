import React, { useState, useEffect } from "react";
import { User, Profile } from "./types";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import MemberDashboard from "./components/MemberDashboard";
import AdminPanel from "./components/AdminPanel";
import { Loader2 } from "lucide-react";

export default function App() {
  const [screen, setScreen] = useState<"landing" | "auth" | "dashboard" | "admin">("landing");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string>("");
  const [sessionLoading, setSessionLoading] = useState(true);
  const [languageCode, setLanguageCode] = useState<string>(() => {
    return localStorage.getItem("cyber_hub_language") || "en";
  });

  // Check login session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedToken = localStorage.getItem("cyber_hub_token");
      const storedUser = localStorage.getItem("cyber_hub_user");

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const res = await fetch(`/api/user/profile?userId=${parsedUser.id}`);
          if (res.ok) {
            const data = await res.json();
            setUser(parsedUser);
            setProfile(data.profile);
            setToken(storedToken);
            setScreen("dashboard");
            if (data.profile.language) {
              setLanguageCode(data.profile.language);
              localStorage.setItem("cyber_hub_language", data.profile.language);
            }
          } else {
            // Token stale
            localStorage.clear();
          }
        } catch (err) {
          localStorage.clear();
        }
      }
      setSessionLoading(false);
    };
    checkSession();
  }, []);

  // Sync profile values with theme elements
  useEffect(() => {
    if (!profile) {
      document.body.className = "bg-cyber-bg font-sans text-gray-100";
      return;
    }

    const theme = profile.theme;
    let className = "font-sans text-gray-100 ";

    if (theme === "Dark") {
      className += "bg-cyber-bg text-gray-100";
    } else if (theme === "Light") {
      className += "bg-gray-50 text-gray-900";
    } else if (theme === "Cyber") {
      className += "bg-gray-950 text-cyber-cyan border-cyber-cyan";
    } else if (theme === "Neon") {
      className += "bg-gray-950 text-cyber-pink";
    } else if (theme === "AMOLED") {
      className += "bg-black text-gray-200";
    }

    document.body.className = className;

    // Sync languageCode from profile if profile is updated
    if (profile.language && profile.language !== languageCode) {
      setLanguageCode(profile.language);
      localStorage.setItem("cyber_hub_language", profile.language);
    }
  }, [profile]);

  const handleLanguageChange = (code: string) => {
    setLanguageCode(code);
    localStorage.setItem("cyber_hub_language", code);
  };

  const handleLoginSuccess = (loggedInUser: User, sessionToken: string, userProfile: Profile) => {
    setUser(loggedInUser);
    setToken(sessionToken);
    setProfile(userProfile);
    localStorage.setItem("cyber_hub_token", sessionToken);
    localStorage.setItem("cyber_hub_user", JSON.stringify(loggedInUser));
    if (userProfile.language) {
      setLanguageCode(userProfile.language);
      localStorage.setItem("cyber_hub_language", userProfile.language);
    }
    setScreen("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    setProfile(null);
    localStorage.removeItem("cyber_hub_token");
    localStorage.removeItem("cyber_hub_user");
    setScreen("landing");
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-cyber-bg text-gray-100 flex flex-col items-center justify-center space-y-3 font-mono text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-cyan" />
        <span>INITIALIZING PORTAL CONSOLE CORES...</span>
      </div>
    );
  }

  // Visual helper to inject customized styles based on selected profile theme
  const getThemeWrapperClass = () => {
    if (!profile) return "theme-dark";
    switch (profile.theme) {
      case "Light": return "theme-light bg-gray-50 text-gray-900";
      case "Cyber": return "theme-cyber bg-gray-950 text-cyber-cyan border-cyber-cyan";
      case "Neon": return "theme-neon bg-gray-950 text-cyber-pink";
      case "AMOLED": return "theme-amoled bg-black text-gray-200";
      default: return "theme-dark bg-cyber-bg text-gray-100";
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getThemeWrapperClass()}`}>
      {screen === "landing" && (
        <LandingPage 
          onNavigateToAuth={() => setScreen("auth")} 
          languageCode={languageCode}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {screen === "auth" && (
        <div className="relative">
          <button
            onClick={() => setScreen("landing")}
            className="absolute top-6 left-6 z-50 bg-gray-900/90 hover:bg-gray-800 border border-gray-800 hover:border-cyber-cyan text-white text-xs font-mono font-bold px-4 py-2 rounded-lg transition-all"
          >
            ← BACK TO PORTAL
          </button>
          <AuthPage 
            onAuthSuccess={(u, p, t) => handleLoginSuccess(u, t, p)} 
            languageCode={languageCode}
            onLanguageChange={handleLanguageChange}
          />
        </div>
      )}

      {screen === "dashboard" && user && profile && (
        <MemberDashboard 
          user={user} 
          initialProfile={profile} 
          token={token}
          onLogout={handleLogout}
          onSwitchToAdmin={() => setScreen("admin")}
          languageCode={languageCode}
          onLanguageChange={handleLanguageChange}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {screen === "admin" && user && (
        <AdminPanel 
          user={user} 
          onExit={() => setScreen("dashboard")} 
          languageCode={languageCode}
        />
      )}
    </div>
  );
}
