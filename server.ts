import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { spawn } from "child_process";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ----------------------------------------------------
// DATABASE SYSTEM (JSON FILE PERSISTENCE)
// ----------------------------------------------------
interface User {
  id: string;
  email: string;
  password?: string;
  role: "Admin" | "Executive" | "Member" | "Guest";
  username: string;
  name?: string;
  roll?: string;
  class?: string;
  section?: string;
  chId?: string;
  phone?: string;
  skills?: string[];
}

interface Profile {
  userId: string;
  username: string;
  bio: string;
  avatar: string;
  banner: string;
  skills: string[];
  socialLinks: { github?: string; facebook?: string; linkedin?: string };
  badges: string[];
  achievements: string[];
  theme: "Dark" | "Light" | "Cyber" | "Neon" | "AMOLED";
  accentColor: string;
  language: string;
  fontSize: "sm" | "md" | "lg";
  profileVisibility: "Public" | "Private";
  name?: string;
  roll?: string;
  class?: string;
  section?: string;
  chId?: string;
  phone?: string;
  attendance?: { date: string; status: "Present" | "Absent"; className: string }[];
}

interface CustomPage {
  id: string;
  title: string;
  icon: string;
  content: string;
  updatedAt: string;
}

interface ClassSchedule {
  id: string;
  title: string;
  type: "Club Class" | "Online Class";
  date: string;
  link: string;
  topic: string;
  instructor: string;
}

interface SystemAlert {
  type: "thrilled" | "chilled" | "none";
  message: string;
}

interface Department {
  id: string;
  name: string;
  logo: string;
  banner: string;
  description: string;
  leader: string;
  membersCount: number;
  members: string[]; // User IDs
  gallery: string[];
  resources: { title: string; link: string }[];
  usefulLinks: { label: string; url: string }[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    points: number;
  }[];
  negativeMarking: boolean;
  participantsCount: number;
}

interface QuizResult {
  id: string;
  userId: string;
  username: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  timestamp: string;
  certificateId?: string;
}

interface Executive {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar: string;
  email: string;
  socials: { github?: string; facebook?: string; linkedin?: string };
  bio: string;
  achievements: string[];
  speech?: string;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  email: string;
  content: string;
  timestamp: string;
  replies: {
    id: string;
    sender: string;
    content: string;
    timestamp: string;
  }[];
}

interface Event {
  id: string;
  title: string;
  type: "Workshop" | "Hackathon" | "Seminar" | "Competition";
  description: string;
  date: string;
  countdown: string;
  image: string;
  registeredUsers: string[]; // User IDs
}

interface GalleryItem {
  id: string;
  title: string;
  type: "Photo" | "Video" | "Document";
  url: string;
  category: string;
  uploadedAt: string;
}

interface Notification {
  id: string;
  userId: string; // 'all' or specific ID
  title: string;
  message: string;
  type: "quiz" | "event" | "reply" | "system";
  timestamp: string;
  read: boolean;
}

interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

interface DatabaseSchema {
  users: User[];
  profiles: Profile[];
  departments: Department[];
  quizzes: Quiz[];
  results: QuizResult[];
  executives: Executive[];
  messages: Message[];
  events: Event[];
  gallery: GalleryItem[];
  notifications: Notification[];
  logs: AuditLog[];
  customPages: CustomPage[];
  classes: ClassSchedule[];
  systemAlert: SystemAlert;
}

// Initial Seed Data
const getInitialData = (): DatabaseSchema => ({
  customPages: [
    {
      id: "page-scpsc-info",
      title: "SCPSC IT Code of Conduct",
      icon: "ShieldAlert",
      content: "## SCPSC IT Club Code of Conduct\n\nWelcome to the official **Cyber Hub** portal of **Savar Cantonment Public School and College IT Club**.\n\nAll members must strictly follow our core computational rules:\n\n1. **Integrity in Hacking**: All penetration tests and cyber exercises must be conducted within authorized target sandboxes. No offensive testing against real-world school or college infrastructure is permitted.\n2. **Collaborative Innovation**: Assist junior students with programming logic (C, C++, Python, Javascript, React).\n3. **Regular Attendance**: Standard members are expected to attend weekly offline club sessions. Attendance is logged and affects badging and certification rewards.\n\nFor any inquiries or permissions, please contact our General Secretary or IT Coordinator through the Support portal.",
      updatedAt: new Date().toISOString()
    }
  ],
  classes: [
    {
      id: "class-1",
      title: "CTF Cryptography Mastery",
      type: "Club Class",
      date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
      link: "Room 402 - Main Computer Lab",
      topic: "RSA public-key mathematics & cipher-text decryptions with Python.",
      instructor: "Abrar Tasnim"
    },
    {
      id: "class-2",
      title: "React Web Dev Interactive Nodes",
      type: "Online Class",
      date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
      link: "https://meet.google.com/abc-defg-hij",
      topic: "State machines, custom hooks, and dynamic router layouts.",
      instructor: "Mahir Faisal"
    }
  ],
  systemAlert: {
    type: "none",
    message: ""
  },
  users: [
    { id: "u-admin", email: "admin@cyberhub.edu", password: "admin123", role: "Admin", username: "cyber_director" },
    { id: "u-exec", email: "exec@cyberhub.edu", password: "exec123", role: "Executive", username: "cyber_sec_lead" },
    { id: "u-member", email: "member@cyberhub.edu", password: "member123", role: "Member", username: "savarian_coder" }
  ],
  profiles: [
    {
      userId: "u-admin",
      username: "cyber_director",
      bio: "IT Coordinator and Chief Admin at Savar Cantonment Public School & College.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      banner: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000",
      skills: ["Cyber Security", "Network Engineering", "Academic Leadership", "Linux Systems"],
      socialLinks: { github: "https://github.com", facebook: "https://facebook.com", linkedin: "https://linkedin.com" },
      badges: ["Founder Badge", "Security Auditing Elite", "Mentor Pro"],
      achievements: ["National ICT Award 2025", "Savar Cant. IT Club Patron"],
      theme: "Cyber",
      accentColor: "#00ffcc",
      language: "en",
      fontSize: "md",
      profileVisibility: "Public"
    },
    {
      userId: "u-exec",
      username: "cyber_sec_lead",
      bio: "Vice President of Cyber Security Dept. Enthusiast ethical hacker & CTF player.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      banner: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000",
      skills: ["Ethical Hacking", "Python Automation", "Linux Terminal", "Cryptography"],
      socialLinks: { github: "https://github.com", facebook: "https://facebook.com" },
      badges: ["Executive Lead", "CTF Conqueror"],
      achievements: ["Savar Inter-School Hackathon 1st Place", "Certified Cyber Specialist"],
      theme: "Neon",
      accentColor: "#ff007f",
      language: "en",
      fontSize: "md",
      profileVisibility: "Public"
    },
    {
      userId: "u-member",
      username: "savarian_coder",
      bio: "Class 10 Student at Savar Cantonment. Dedicated to web dev, programming and ICT.",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
      banner: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1000",
      skills: ["HTML/CSS", "JavaScript Basics", "Algorithms", "C Language"],
      socialLinks: { github: "https://github.com" },
      badges: ["Member Badge", "Bug Hunter Initiate"],
      achievements: ["Intra-School Quiz Runner Up", "Complete Web Starter Course"],
      theme: "Dark",
      accentColor: "#3b82f6",
      language: "en",
      fontSize: "md",
      profileVisibility: "Public"
    }
  ],
  departments: [
    {
      id: "dept-sec",
      name: "Cyber Security & CTF",
      logo: "ShieldAlert",
      banner: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600",
      description: "Dedicated to offensive and defensive security, CTFs, vulnerability disclosures, and cyber forensics. We train students in securing computer networks and digital systems.",
      leader: "Abrar Tasnim",
      membersCount: 14,
      members: ["u-exec", "u-admin"],
      gallery: [
        "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400"
      ],
      resources: [
        { title: "PortSwigger Web Security Academy", link: "https://portswigger.net/web-security" },
        { title: "OverTheWire Linux Wargames", link: "https://overthewire.org" }
      ],
      usefulLinks: [
        { label: "Savar Cant. CTF Portal", url: "#" },
        { label: "OWASP Top 10 Guidelines", url: "https://owasp.org" }
      ]
    },
    {
      id: "dept-soft",
      name: "Software Engineering & DSA",
      logo: "CodeXml",
      banner: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&q=80&w=600",
      description: "Focuses on algorithm logic, data structures, backend system engineering, and programming competitions in C/C++ and Python.",
      leader: "Sajid Hasan",
      membersCount: 18,
      members: ["u-member"],
      gallery: [
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=400"
      ],
      resources: [
        { title: "LeetCode Practice Problems", link: "https://leetcode.com" },
        { title: "GeeksForGeeks Data Structures", link: "https://geeksforgeeks.org" }
      ],
      usefulLinks: [
        { label: "IT Club Competitive Code Arena", url: "#" }
      ]
    },
    {
      id: "dept-robot",
      name: "Robotics & Embedded Systems",
      logo: "Cpu",
      banner: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=600",
      description: "Hands-on projects with Arduino, Raspberry Pi, microcontrollers, autonomous rovers, sensor nodes, and hardware-software interfacing.",
      leader: "Nusrat Jahan",
      membersCount: 12,
      members: [],
      gallery: [
        "https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?auto=format&fit=crop&q=80&w=400"
      ],
      resources: [
        { title: "Arduino Documentation", link: "https://www.arduino.cc" },
        { title: "Tinkercad Circuits 3D Simulation", link: "https://www.tinkercad.com" }
      ],
      usefulLinks: [
        { label: "RoboCup Junior Bangladesh Rules", url: "#" }
      ]
    },
    {
      id: "dept-web",
      name: "Web Development & Design",
      logo: "Globe",
      banner: "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=600",
      description: "Crafting beautiful responsive websites, full-stack application nodes, and modern visual identities. Covers HTML, CSS, React, and UX designs.",
      leader: "Monirul Islam",
      membersCount: 22,
      members: ["u-member"],
      gallery: [],
      resources: [
        { title: "MDN Web Docs", link: "https://developer.mozilla.org" },
        { title: "Figma UI/UX Best Practices", link: "https://figma.com" }
      ],
      usefulLinks: [
        { label: "SCPSC IT Club Website Repository", url: "https://github.com" }
      ]
    },
    {
      id: "dept-ai",
      name: "AI & Data Science",
      logo: "BrainCircuit",
      banner: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=600",
      description: "Exploring machine learning models, natural language processing, neural systems, computer vision, and analytics using Python frameworks.",
      leader: "Farhan Tanvir",
      membersCount: 15,
      members: [],
      gallery: [],
      resources: [
        { title: "Kaggle Machine Learning Courses", link: "https://kaggle.com" },
        { title: "Hugging Face Models Hub", link: "https://huggingface.co" }
      ],
      usefulLinks: [
        { label: "Introduction to AI - YouTube Series", url: "#" }
      ]
    }
  ],
  quizzes: [
    {
      id: "q-1",
      title: "Introduction to Cyber Security",
      description: "Test your core knowledge on defensive concepts, network ports, malware, and digital encryptions.",
      duration: 10,
      negativeMarking: true,
      questions: [
        {
          question: "Which port is standard for HTTPS encrypted traffic?",
          options: ["80", "22", "443", "8080"],
          correctIndex: 2,
          points: 10
        },
        {
          question: "What is symmetric key cryptography?",
          options: [
            "Using separate public and private keys",
            "Using the exact same key for encryption and decryption",
            "A cryptographic algorithm used only by NASA",
            "Hashing data into a irreversible checksum"
          ],
          correctIndex: 1,
          points: 10
        },
        {
          question: "What type of attack involves a hacker standing in the middle of a Wi-Fi connection reading active packets?",
          options: ["DDoS", "Man-in-the-Middle (MitM)", "SQL Injection", "Buffer Overflow"],
          correctIndex: 1,
          points: 10
        }
      ],
      participantsCount: 42
    },
    {
      id: "q-2",
      title: "JavaScript Logic & Web Basics",
      description: "Examine your comprehension of asynchronous events, closures, scopes, and DOM layouts.",
      duration: 15,
      negativeMarking: false,
      questions: [
        {
          question: "What is a JavaScript closure?",
          options: [
            "Closing a web page window via javascript",
            "A function together with its surrounding lexical environment",
            "A way to terminate an active loop",
            "Encoding JSON files"
          ],
          correctIndex: 1,
          points: 10
        },
        {
          question: "Which CSS display property allows grid alignments natively?",
          options: ["block", "flex", "grid", "inline-block"],
          correctIndex: 2,
          points: 10
        }
      ],
      participantsCount: 38
    }
  ],
  results: [
    {
      id: "res-1",
      userId: "u-member",
      username: "savarian_coder",
      quizId: "q-1",
      quizTitle: "Introduction to Cyber Security",
      score: 30,
      totalPoints: 30,
      correctAnswers: 3,
      totalQuestions: 3,
      timestamp: "2026-07-15T14:30:00Z",
      certificateId: "cert-101"
    }
  ],
  executives: [
    {
      id: "e-1",
      name: "Mahir Faisal",
      position: "President",
      department: "Web Development & ICT",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      email: "president@cyberhub.edu",
      socials: { github: "https://github.com", facebook: "https://facebook.com", linkedin: "https://linkedin.com" },
      bio: "Chief executive leading all tech modules, workshops, and school-level ICT integrations. Focused on React & scalable clouds.",
      achievements: ["National ICT Award 1st Place", "SCPSC IT Innovator of the Year"]
    },
    {
      id: "e-2",
      name: "Abrar Tasnim",
      position: "Vice President",
      department: "Cyber Security & CTF",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      email: "cyber_sec_lead@cyberhub.edu",
      socials: { github: "https://github.com", linkedin: "https://linkedin.com" },
      bio: "CTF champion, security audit supervisor, and primary instructor for Unix/Linux workshops at SCPSC.",
      achievements: ["Certified Ethical Hacker (CEH) Associate", "Bangladesh National High School Programming Contest Finalist"]
    },
    {
      id: "e-3",
      name: "Sajid Hasan",
      position: "General Secretary",
      department: "Software Engineering & DSA",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
      email: "se_sec@cyberhub.edu",
      socials: { github: "https://github.com", facebook: "https://facebook.com" },
      bio: "Algorithms nerd, training coordinator, and backend logic designer. Loves Competitive Programming in C++.",
      achievements: ["1500+ LeetCode Solved", "SCPSC Competitive Programming Olympiad Organizer"]
    },
    {
      id: "e-4",
      name: "Nusrat Jahan",
      position: "Treasurer & Embedded Lead",
      department: "Robotics & Embedded Systems",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      email: "robotics_treasurer@cyberhub.edu",
      socials: { linkedin: "https://linkedin.com", facebook: "https://facebook.com" },
      bio: "Embedded developer and budget manager. Designs autonomous line-followers and custom Arduino nodes.",
      achievements: ["SCPSC Science Fair 1st Prize in Engineering", "Dhaka Divisional Robot Race Champion"]
    }
  ],
  messages: [
    {
      id: "msg-1",
      userId: "u-member",
      username: "savarian_coder",
      email: "member@cyberhub.edu",
      content: "Hello Admin, when will the certificates for the Cyber Security Quiz be distributed?",
      timestamp: "2026-07-15T09:12:00Z",
      replies: [
        {
          id: "rep-1",
          sender: "Executive (Abrar Tasnim)",
          content: "Hi! The certificates are generated instantly. You can access and view them on your Dashboard under 'Certificates'. Let us know if you face issues!",
          timestamp: "2026-07-15T11:45:00Z"
        }
      ]
    }
  ],
  events: [
    {
      id: "evt-1",
      title: "SCPSC National Cyber Clash Hackathon 2026",
      type: "Hackathon",
      description: "A 24-hour team programming and ethical hacking challenge targeting critical infrastructure vulnerabilities. Teams compete for ultimate glory.",
      date: "2026-09-12T09:00:00Z",
      countdown: "2026-09-12T09:00:00.000Z",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600",
      registeredUsers: ["u-member", "u-exec"]
    },
    {
      id: "evt-2",
      title: "Penetration Testing & Web Sec Lab 101",
      type: "Workshop",
      description: "Hands-on virtual workshop practicing OWASP vulnerabilities. Learn to safely audit web applications in simulated environments.",
      date: "2026-07-28T14:00:00Z",
      countdown: "2026-07-28T14:00:00.000Z",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600",
      registeredUsers: ["u-member"]
    },
    {
      id: "evt-3",
      title: "Cyber Defense CTF Registration Deadline",
      type: "Competition",
      description: "Deadline to register for the Regional Inter-College Capture the Flag (CTF) Cyber Defense Championship. Build your squad of three.",
      date: "2026-07-22T23:59:00Z",
      countdown: "2026-07-22T23:59:00.000Z",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600",
      registeredUsers: []
    },
    {
      id: "evt-4",
      title: "Python Scripting for Security Automation",
      type: "Workshop",
      description: "Learn to write customized network scanners, banner grabbers, and vulnerability analysis tools using Python standard libraries.",
      date: "2026-07-25T10:00:00Z",
      countdown: "2026-07-25T10:00:00.000Z",
      image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=600",
      registeredUsers: []
    },
    {
      id: "evt-5",
      title: "IT Club SCPSC General Assembly Meeting",
      type: "Seminar",
      description: "First general meeting of the academic term. Discover upcoming cyber labs, research groups, exec positions, and project budgets.",
      date: "2026-08-03T15:30:00Z",
      countdown: "2026-08-03T15:30:00.000Z",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600",
      registeredUsers: ["u-member"]
    },
    {
      id: "evt-6",
      title: "National Cyber Defense Competition Deadline",
      type: "Competition",
      description: "Hard deadline for paper submission and infrastructure diagram upload for the National Cyber Defense Competition.",
      date: "2026-08-10T17:00:00Z",
      countdown: "2026-08-10T17:00:00.000Z",
      image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=600",
      registeredUsers: []
    }
  ],
  gallery: [
    {
      id: "g-1",
      title: "IT Club SCPSC Launch Ceremony",
      type: "Photo",
      url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800",
      category: "Ceremony",
      uploadedAt: "2026-01-10T12:00:00Z"
    },
    {
      id: "g-2",
      title: "Robotics Workshop Session 2",
      type: "Photo",
      url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800",
      category: "Robotics",
      uploadedAt: "2026-03-24T10:30:00Z"
    }
  ],
  notifications: [
    {
      id: "n-1",
      userId: "all",
      title: "New Quiz Published!",
      message: "Test your skills on Web and CSS alignments in the new Quiz section.",
      type: "quiz",
      timestamp: "2026-07-15T10:00:00Z",
      read: false
    },
    {
      id: "n-2",
      userId: "u-member",
      title: "Admin Replied",
      message: "Abrar Tasnim replied to your inquiry regarding certificate distributions.",
      type: "reply",
      timestamp: "2026-07-15T11:45:00Z",
      read: false
    }
  ],
  logs: [
    { id: "log-1", userId: "u-member", username: "savarian_coder", action: "Login", details: "Logged in from Chrome browser", timestamp: "2026-07-16T04:20:00Z" },
    { id: "log-2", userId: "u-member", username: "savarian_coder", action: "Quiz Submission", details: "Completed Introduction to Cyber Security with 100% score", timestamp: "2026-07-15T14:30:00Z" }
  ]
});

// Helper functions for reading/writing DB
const readDB = (): DatabaseSchema => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file, returning seeded initial data:", error);
    return getInitialData();
  }
};

const writeDB = (data: DatabaseSchema) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing database file:", error);
  }
};

// Log logger helper
const logAction = (userId: string, username: string, action: string, details: string) => {
  const db = readDB();
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    userId,
    username,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.logs.unshift(log);
  // Keep logs to a maximum of 100 entries for efficiency
  if (db.logs.length > 100) {
    db.logs = db.logs.slice(0, 100);
  }
  writeDB(db);
};

// ----------------------------------------------------
// AI SYSTEM (LAZY INIT GEMINI API)
// ----------------------------------------------------
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(customApiKey?: string): GoogleGenAI {
  if (customApiKey) {
    return new GoogleGenAI({
      apiKey: customApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

// Executing Gemini AI requests via Python backend as requested
function runPythonAI(apiKey: string, message: string, history: any[], systemPrompt: string, model: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", [path.join(process.cwd(), "backend_ai.py")]);
    let outputData = "";
    let errorData = "";

    pythonProcess.stdout.on("data", (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}. Error: ${errorData}`));
      }
      try {
        const parsed = JSON.parse(outputData.trim());
        if (parsed.error) {
          return reject(new Error(parsed.error + (parsed.details ? `: ${JSON.stringify(parsed.details)}` : "")));
        }
        resolve(parsed.response);
      } catch (err) {
        reject(new Error(`Failed to parse Python stdout: ${outputData}. Raw stderr: ${errorData}`));
      }
    });

    const inputPayload = JSON.stringify({
      api_key: apiKey,
      message,
      history,
      system_prompt: systemPrompt,
      model
    });

    pythonProcess.stdin.write(inputPayload);
    pythonProcess.stdin.end();
  });
}

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// Health and general settings
app.get("/api/health", (req, res) => {
  const db = readDB();
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    dbSize: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0,
    counts: {
      users: db.users.length,
      quizzes: db.quizzes.length,
      events: db.events.length,
      departments: db.departments.length
    }
  });
});

// Authentication Endpoint: LOGIN
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email/Username/Roll and password are required" });
  }

  const db = readDB();
  const searchKey = email.trim().toLowerCase();
  const user = db.users.find(u => 
    u.email.toLowerCase() === searchKey ||
    u.username.toLowerCase() === searchKey ||
    (u.roll && u.roll.toString().trim() === email.trim())
  );

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials. Please check your email/username/roll and password." });
  }

  // Get or create profile
  let profile = db.profiles.find(p => p.userId === user.id);
  if (!profile) {
    profile = {
      userId: user.id,
      username: user.username,
      bio: "Hello, I am a proud member of Savar Cantonment IT Club!",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      banner: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000",
      skills: user.skills || ["Computing"],
      socialLinks: {},
      badges: ["Club Affiliate"],
      achievements: [],
      theme: "Cyber",
      accentColor: "#00ffcc",
      language: "en",
      fontSize: "md",
      profileVisibility: "Public",
      name: user.name,
      roll: user.roll,
      class: user.class,
      section: user.section,
      chId: user.chId,
      phone: user.phone
    };
    db.profiles.push(profile);
    writeDB(db);
  }

  logAction(user.id, user.username, "Login", `User successfully logged in via credentials`);

  res.json({
    token: `session-token-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      name: user.name || profile.name,
      roll: user.roll || profile.roll,
      class: user.class || profile.class,
      section: user.section || profile.section,
      chId: user.chId || profile.chId,
      phone: user.phone || profile.phone
    },
    profile
  });
});

// Authentication Endpoint: REGISTER
app.post("/api/auth/register", (req, res) => {
  const { email, password, username, name, roll, class: className, section, chId, phone, skills, avatar } = req.body;
  
  // 1. Check mandatory fields presence
  if (!email || !password || !username || !name || !roll || !className || !section || !phone) {
    return res.status(400).json({ error: "All student fields (Name, Roll, Class, Section, Phone, Email, Username, Password) are required." });
  }

  // 2. Validate email must be a valid email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: "Invalid Email format. A valid email address is required (e.g. name@domain.com)." });
  }

  // 3. Validate Roll Number must be numbers only
  const sanitizedRoll = roll.toString().trim();
  if (!/^\d+$/.test(sanitizedRoll)) {
    return res.status(400).json({ error: "Roll Number must be numeric digits only (e.g. 1024)." });
  }

  // 4. Validate Class must be numbers only
  const sanitizedClass = className.toString().trim();
  if (!/^\d+$/.test(sanitizedClass)) {
    return res.status(400).json({ error: "Class must be a number (e.g. 9 or 10 or 11)." });
  }

  // 5. Validate Section must be text only
  const sanitizedSection = section.toString().trim();
  if (!/^[a-zA-Z\s]+$/.test(sanitizedSection)) {
    return res.status(400).json({ error: "Section must contain text characters only (e.g. A, B, Padma, Science)." });
  }

  // 6. Validate Phone Number must be numbers only
  const sanitizedPhone = phone.toString().trim();
  if (!/^\d{6,15}$/.test(sanitizedPhone)) {
    return res.status(400).json({ error: "Phone Number must contain numeric digits only (e.g. 01700000000)." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Security passphrase must be at least 6 characters." });
  }

  const db = readDB();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() || u.username.toLowerCase() === username.trim().toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "A student with this email address or username is already registered." });
  }

  const userId = `u-${Date.now()}`;
  // Determine role auto-assignment based on email for testing
  let role: "Admin" | "Executive" | "Member" = "Member";
  if (email.toLowerCase().includes("admin@")) role = "Admin";
  else if (email.toLowerCase().includes("exec@")) role = "Executive";

  const parsedSkills = skills ? (Array.isArray(skills) ? skills : skills.split(",").map((s: string) => s.trim()).filter(Boolean)) : ["Coding"];

  const newUser: User = { 
    id: userId, 
    email: email.trim(), 
    password, 
    role, 
    username: username.trim(),
    name: name.trim(),
    roll: sanitizedRoll,
    class: sanitizedClass,
    section: sanitizedSection,
    chId: chId ? chId.trim() : `CH-${sanitizedClass}${sanitizedRoll.slice(-3)}`,
    phone: sanitizedPhone,
    skills: parsedSkills
  };

  const newProfile: Profile = {
    userId,
    username: username.trim(),
    bio: `Hi! I am @${username.trim()}, Class ${sanitizedClass} (${sanitizedSection}) student. Proud member of Savar Cantonment Public School & College IT Club.`,
    avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
    banner: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000",
    skills: parsedSkills,
    socialLinks: {},
    badges: ["New Recruit", `Class ${sanitizedClass} Student`],
    achievements: [],
    theme: "Dark",
    accentColor: "#38bdf8",
    language: "en",
    fontSize: "md",
    profileVisibility: "Public",
    name: name.trim(),
    roll: sanitizedRoll,
    class: sanitizedClass,
    section: sanitizedSection,
    chId: newUser.chId,
    phone: sanitizedPhone,
    attendance: [
      { date: "2026-07-10", status: "Present", className: "Intro to Cyber Hub Systems" },
      { date: "2026-07-12", status: "Present", className: "Vite & React Component Construction" },
      { date: "2026-07-14", status: "Present", className: "Computational Security Foundations" }
    ]
  };

  db.users.push(newUser);
  db.profiles.push(newProfile);

  // Add notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: "all",
    title: "New Student Registered",
    message: `@${username} (Roll: ${roll}, Class: ${className}) has joined SCPSC IT Club. Welcome!`,
    type: "system",
    timestamp: new Date().toISOString(),
    read: false
  });

  writeDB(db);
  logAction(userId, username, "Registration", `User registered as ${name} (Roll: ${roll}) with role ${role}`);

  res.json({
    token: `session-token-${userId}-${Date.now()}`,
    user: { id: userId, email, username, role, name, roll, class: className, section, chId, phone },
    profile: newProfile
  });
});

// Profile Management: GET PROFILE
app.get("/api/user/profile", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const db = readDB();
  const profile = db.profiles.find(p => p.userId === userId);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }
  res.json({ profile });
});

// Profile Management: UPDATE PROFILE & PREFERENCES
app.post("/api/user/profile", (req, res) => {
  const { userId, bio, avatar, banner, skills, socialLinks, theme, accentColor, language, fontSize, profileVisibility, username, name, roll, class: className, section, chId, phone, attendance } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required to update profile" });
  }

  const db = readDB();
  const profileIndex = db.profiles.findIndex(p => p.userId === userId);
  if (profileIndex === -1) {
    return res.status(404).json({ error: "Profile not found" });
  }

  const updatedProfile = {
    ...db.profiles[profileIndex],
    bio: bio !== undefined ? bio : db.profiles[profileIndex].bio,
    avatar: avatar !== undefined ? avatar : db.profiles[profileIndex].avatar,
    banner: banner !== undefined ? banner : db.profiles[profileIndex].banner,
    skills: skills !== undefined ? skills : db.profiles[profileIndex].skills,
    socialLinks: socialLinks !== undefined ? socialLinks : db.profiles[profileIndex].socialLinks,
    theme: theme !== undefined ? theme : db.profiles[profileIndex].theme,
    accentColor: accentColor !== undefined ? accentColor : db.profiles[profileIndex].accentColor,
    language: language !== undefined ? language : db.profiles[profileIndex].language,
    fontSize: fontSize !== undefined ? fontSize : db.profiles[profileIndex].fontSize,
    profileVisibility: profileVisibility !== undefined ? profileVisibility : db.profiles[profileIndex].profileVisibility,
    username: username !== undefined ? username : db.profiles[profileIndex].username,
    name: name !== undefined ? name : db.profiles[profileIndex].name,
    roll: roll !== undefined ? roll : db.profiles[profileIndex].roll,
    class: className !== undefined ? className : db.profiles[profileIndex].class,
    section: section !== undefined ? section : db.profiles[profileIndex].section,
    chId: chId !== undefined ? chId : db.profiles[profileIndex].chId,
    phone: phone !== undefined ? phone : db.profiles[profileIndex].phone,
    attendance: attendance !== undefined ? attendance : db.profiles[profileIndex].attendance
  };

  // Keep user record in sync
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    if (username) db.users[userIndex].username = username;
    if (name) db.users[userIndex].name = name;
    if (roll) db.users[userIndex].roll = roll;
    if (className) db.users[userIndex].class = className;
    if (section) db.users[userIndex].section = section;
    if (chId) db.users[userIndex].chId = chId;
    if (phone) db.users[userIndex].phone = phone;
  }

  db.profiles[profileIndex] = updatedProfile;
  writeDB(db);
  logAction(userId, updatedProfile.username, "Profile Update", `Customized bio, banner, or school information`);

  res.json({ profile: updatedProfile });
});

// Departments Endpoints
app.get("/api/departments", (req, res) => {
  const db = readDB();
  res.json(db.departments);
});

app.post("/api/departments/:id/join", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required to join department" });
  }

  const db = readDB();
  const dept = db.departments.find(d => d.id === id);
  const user = db.users.find(u => u.id === userId);

  if (!dept || !user) {
    return res.status(404).json({ error: "Department or user not found" });
  }

  if (dept.members.includes(userId)) {
    return res.status(400).json({ error: "You are already a member of this department" });
  }

  dept.members.push(userId);
  dept.membersCount = dept.members.length;

  // Add badge to user's profile
  const profile = db.profiles.find(p => p.userId === userId);
  if (profile) {
    const badgeName = `${dept.name.split(" ")[0]} Operative`;
    if (!profile.badges.includes(badgeName)) {
      profile.badges.push(badgeName);
    }
  }

  writeDB(db);
  logAction(userId, user.username, "Department Join", `Enlisted into the ${dept.name} department`);

  res.json({ success: true, department: dept });
});

// Quizzes & Exams System
app.get("/api/quizzes", (req, res) => {
  const db = readDB();
  res.json(db.quizzes);
});

app.post("/api/quizzes/:id/submit", (req, res) => {
  const { id } = req.params;
  const { userId, answers } = req.body; // answers is an object mapping question Index to option Index { 0: 2, 1: 1 }
  if (!userId || !answers) {
    return res.status(400).json({ error: "userId and answers are required" });
  }

  const db = readDB();
  const quiz = db.quizzes.find(q => q.id === id);
  const user = db.users.find(u => u.id === userId);

  if (!quiz || !user) {
    return res.status(404).json({ error: "Quiz or user not found" });
  }

  let correctAnswers = 0;
  let score = 0;
  let totalPoints = 0;

  quiz.questions.forEach((q, index) => {
    totalPoints += q.points;
    const userAnswer = answers[index];
    if (userAnswer !== undefined) {
      if (userAnswer === q.correctIndex) {
        correctAnswers++;
        score += q.points;
      } else if (quiz.negativeMarking) {
        score -= Math.floor(q.points * 0.25); // -25% penalty for wrong answer
      }
    }
  });

  if (score < 0) score = 0;

  const resultId = `res-${Date.now()}`;
  let certificateId: string | undefined;

  // Award certificates if score is above 80%
  const passPercentage = (score / totalPoints) * 100;
  if (passPercentage >= 80) {
    certificateId = `CERT-IT-${Math.floor(100000 + Math.random() * 900000)}`;
    const profile = db.profiles.find(p => p.userId === userId);
    if (profile) {
      const achievement = `Master Certified in ${quiz.title}`;
      if (!profile.achievements.includes(achievement)) {
        profile.achievements.push(achievement);
      }
      if (!profile.badges.includes("Certificate Winner")) {
        profile.badges.push("Certificate Winner");
      }
    }
  }

  const quizResult: QuizResult = {
    id: resultId,
    userId,
    username: user.username,
    quizId: quiz.id,
    quizTitle: quiz.title,
    score,
    totalPoints,
    correctAnswers,
    totalQuestions: quiz.questions.length,
    timestamp: new Date().toISOString(),
    certificateId
  };

  quiz.participantsCount = (quiz.participantsCount || 0) + 1;
  db.results.push(quizResult);

  // Add notification
  db.notifications.push({
    id: `n-${Date.now()}`,
    userId,
    title: "Exam Evaluated",
    message: `You scored ${score}/${totalPoints} in '${quiz.title}'! ${certificateId ? "Certificate awarded." : ""}`,
    type: "quiz",
    timestamp: new Date().toISOString(),
    read: false
  });

  writeDB(db);
  logAction(userId, user.username, "Quiz Submitted", `Completed '${quiz.title}' with score ${score}/${totalPoints}`);

  res.json({ result: quizResult });
});

// Certificates
app.get("/api/certificates", (req, res) => {
  const { userId } = req.query;
  const db = readDB();
  if (userId) {
    return res.json(db.results.filter(r => r.userId === userId && r.certificateId));
  }
  res.json(db.results.filter(r => r.certificateId));
});

// Messages and Help System
app.get("/api/messages", (req, res) => {
  const { userId } = req.query;
  const db = readDB();
  if (userId) {
    return res.json(db.messages.filter(m => m.userId === userId));
  }
  res.json(db.messages);
});

app.post("/api/messages", (req, res) => {
  const { userId, content } = req.body;
  if (!userId || !content) {
    return res.status(400).json({ error: "userId and content are required" });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    userId,
    username: user.username,
    email: user.email,
    content,
    timestamp: new Date().toISOString(),
    replies: []
  };

  db.messages.unshift(newMessage);
  writeDB(db);
  logAction(userId, user.username, "Message Dispatch", `Sent a digital support inquiry to the Executive board`);

  res.json({ message: newMessage });
});

// Admin reply to messages
app.post("/api/messages/:id/reply", (req, res) => {
  const { id } = req.params;
  const { sender, content } = req.body;
  if (!sender || !content) {
    return res.status(400).json({ error: "sender and content are required for reply" });
  }

  const db = readDB();
  const messageIndex = db.messages.findIndex(m => m.id === id);
  if (messageIndex === -1) {
    return res.status(404).json({ error: "Message not found" });
  }

  const reply = {
    id: `rep-${Date.now()}`,
    sender,
    content,
    timestamp: new Date().toISOString()
  };

  db.messages[messageIndex].replies.push(reply);

  // Send alert to member
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: db.messages[messageIndex].userId,
    title: "New Support Reply",
    message: `${sender} responded: "${content.substring(0, 45)}..."`,
    type: "reply",
    timestamp: new Date().toISOString(),
    read: false
  });

  writeDB(db);
  logAction("u-admin", "Admin System", "Message Reply", `Responded to support thread of ${db.messages[messageIndex].username}`);

  res.json({ success: true, message: db.messages[messageIndex] });
});

// Notifications Endpoints
app.get("/api/notifications", (req, res) => {
  const { userId } = req.query;
  const db = readDB();
  if (userId) {
    const list = db.notifications.filter(n => n.userId === "all" || n.userId === userId);
    return res.json(list);
  }
  res.json(db.notifications);
});

app.post("/api/notifications/read", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const db = readDB();
  db.notifications.forEach(n => {
    if (n.userId === "all" || n.userId === userId) {
      n.read = true;
    }
  });
  writeDB(db);
  res.json({ success: true });
});

// Events Endpoints
app.get("/api/events", (req, res) => {
  const db = readDB();
  res.json(db.events);
});

app.post("/api/events/:id/register", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const db = readDB();
  const event = db.events.find(e => e.id === id);
  const user = db.users.find(u => u.id === userId);

  if (!event || !user) return res.status(404).json({ error: "Event or user not found" });

  if (event.registeredUsers.includes(userId)) {
    return res.status(400).json({ error: "Already registered for this event" });
  }

  event.registeredUsers.push(userId);

  // Add notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId,
    title: "Event Registered",
    message: `You registered for '${event.title}' successfully. Get ready!`,
    type: "event",
    timestamp: new Date().toISOString(),
    read: false
  });

  writeDB(db);
  logAction(userId, user.username, "Event Enrolment", `Signed up to participate in ${event.title}`);

  res.json({ success: true, event });
});

// Executive Panel Directory
app.get("/api/executives", (req, res) => {
  const db = readDB();
  res.json(db.executives);
});

// Executive Panel Management Endpoints
app.post("/api/admin/executives", (req, res) => {
  const { name, position, department, avatar, email, socials, bio, achievements, speech } = req.body;
  if (!name || !position) return res.status(400).json({ error: "Name and Position are required" });

  const db = readDB();
  const newExec: Executive = {
    id: `e-${Date.now()}`,
    name,
    position,
    department: department || "General IT",
    avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
    email: email || "",
    socials: socials || {},
    bio: bio || "",
    achievements: achievements || [],
    speech: speech || ""
  };

  db.executives = db.executives || [];
  db.executives.push(newExec);
  writeDB(db);

  res.json({ success: true, executive: newExec });
});

app.put("/api/admin/executives/:id", (req, res) => {
  const { id } = req.params;
  const { name, position, department, avatar, email, socials, bio, achievements, speech } = req.body;

  const db = readDB();
  db.executives = db.executives || [];
  const index = db.executives.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Executive panel member not found" });
  }

  db.executives[index] = {
    ...db.executives[index],
    name: name || db.executives[index].name,
    position: position || db.executives[index].position,
    department: department !== undefined ? department : db.executives[index].department,
    avatar: avatar !== undefined ? avatar : db.executives[index].avatar,
    email: email !== undefined ? email : db.executives[index].email,
    socials: socials !== undefined ? socials : db.executives[index].socials,
    bio: bio !== undefined ? bio : db.executives[index].bio,
    achievements: achievements !== undefined ? achievements : db.executives[index].achievements,
    speech: speech !== undefined ? speech : db.executives[index].speech
  };

  writeDB(db);
  res.json({ success: true, executive: db.executives[index] });
});

app.delete("/api/admin/executives/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.executives = db.executives || [];
  
  const initialCount = db.executives.length;
  db.executives = db.executives.filter(e => e.id !== id);

  if (db.executives.length === initialCount) {
    return res.status(404).json({ error: "Executive panel member not found" });
  }

  writeDB(db);
  res.json({ success: true });
});

// Gallery endpoints
app.get("/api/gallery", (req, res) => {
  const db = readDB();
  res.json(db.gallery);
});

app.post("/api/gallery/upload", (req, res) => {
  const { title, type, url, category } = req.body;
  if (!title || !url) return res.status(400).json({ error: "title and url are required" });

  const db = readDB();
  const newItem: GalleryItem = {
    id: `g-${Date.now()}`,
    title,
    type: type || "Photo",
    url,
    category: category || "General",
    uploadedAt: new Date().toISOString()
  };

  db.gallery.unshift(newItem);
  writeDB(db);
  logAction("u-admin", "Admin System", "Gallery Upload", `Uploaded media item '${title}' into SCPSC IT gallery`);

  res.json({ success: true, item: newItem });
});

// Gallery Delete endpoint
app.delete("/api/gallery/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.gallery.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Gallery item not found" });
  }
  const item = db.gallery[index];
  db.gallery.splice(index, 1);
  writeDB(db);
  logAction("u-admin", "Admin System", "Gallery Delete", `Deleted gallery item '${item.title}'`);
  res.json({ success: true, message: "Gallery item deleted successfully" });
});

// ----------------------------------------------------
// CYBER HUB AI (GEMINI PROXY API INTEGRATION)
// ----------------------------------------------------
app.post("/api/ai/chat", async (req, res) => {
  const { message, history, customApiKey, mode } = req.body; // history: Array of { role: 'user'|'model', text: '...' }
  if (!message) {
    return res.status(400).json({ error: "Message field is required" });
  }

  // SECRET OVERRIDE: Check if user sent administrative passwords/keywords
  const checkMsg = message.trim().toLowerCase();
  if (
    checkMsg.includes("password") || 
    checkMsg.includes("scpscitclub2026") || 
    checkMsg.includes("admin123") || 
    checkMsg.includes("scpsc-it-club-admin") || 
    checkMsg.includes("unlock admin")
  ) {
    return res.json({
      response: "🔑 **[ADMIN PORTAL ENTRY HANDSHAKE INITIATED]** 🔑\n\nI have verified your administrative credentials request. To complete the secure socket layer mapping, please trigger the verification key-code overlay using the connection node below:\n\n[SHOW_ADMIN_UNLOCK_BUTTON]"
    });
  }

  const selectedMode = mode || "study";

  try {
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key === "MOCK_KEY") {
      // Fallback response generator if key is placeholder or missing
      let mockAnswer = "";
      if (selectedMode === "study") {
        mockAnswer = "Hello! As your SCPSC Study Guide, I'm ready to explain any computer science, ICT, or basic science topic. What lesson are we preparing for?";
      } else if (selectedMode === "image") {
        mockAnswer = "Here is a beautifully generated creative prompt for your project:\n\n[GENERATE_IMAGE: futuristic cyber tech workspace, neon blue theme, glowing holographic interface, ultra-detailed]\n\nI can design different tech backgrounds or cyber icons, let me know!";
      } else if (selectedMode === "cyber security") {
        mockAnswer = "Ethical Hacking Core: Remember to practice penetration testing in authorized sandboxed environments. Learn about SQL Injection, XSS, and security headers. What security topic are you studying?";
      } else if (selectedMode === "programming") {
        mockAnswer = "Coding Engine Active: Practice arrays, hash maps, sorting algorithms, and standard algorithmic complexity (Big O). Ask me to generate any template in C++, Python, or JavaScript!";
      } else if (selectedMode === "graphic design") {
        mockAnswer = "UI/UX Console: Focus on responsive grids, Tailwind CSS utility spacing, and high-contrast typography pairing. Let's design gorgeous dashboards together!";
      } else {
        mockAnswer = "Affirmative Student! The Cyber Hub AI assistant is online and ready.";
      }
      return res.json({ response: `[FALLBACK MODE - Simulated AI Security Core]\n\n${mockAnswer}` });
    }

    const ai = getGeminiClient(customApiKey);
    
    // Custom System Prompt based on selected mode
    let systemPrompt = "";
    if (selectedMode === "study") {
      systemPrompt = `You are "Cyber Hub Academic Tutor", an interactive learning assistant for Savar Cantonment Public School and College.
      Help students learn tech concepts in detail. Break down topics step-by-step with analogies suitable for high school students. Cover computer fundamentals, school IT syllabus, and active club questions.`;
    } else if (selectedMode === "image") {
      systemPrompt = `You are "Cyber Hub Creative Visualizer". Your job is to analyze the user's design requests, describe the design layout, aesthetics, and colors, and automatically write a precise image description inside a special tag [GENERATE_IMAGE: <prompt>] so we can render it.
      Example response: "Sure, let's design a futuristic motherboard. Here is the aesthetic detail: [GENERATE_IMAGE: a futuristic glowing green motherboard, cyberpunk style, high detail, 8k resolution] Let me know what other designs you'd like!"`;
    } else if (selectedMode === "cyber security") {
      systemPrompt = `You are "Cyber Hub Security Analyst", a world-class penetration tester and ethical hacking instructor.
      Provide advanced tutorials on defensive security, CTFs, OWASP Top 10 vulnerabilities, secure coding, and cryptographic algorithms. Enforce safety and white-hat ethics.`;
    } else if (selectedMode === "programming") {
      systemPrompt = `You are "Cyber Hub Software Engineer", an elite developer and competitive coding coach.
      Provide optimized, well-structured code blocks (in C, C++, Python, JavaScript) with line-by-line analyses, algorithm complexities (Big O), and debugging support.`;
    } else if (selectedMode === "graphic design") {
      systemPrompt = `You are "Cyber Hub UI/UX Designer".
      Guide students on color palettes, spatial layouts, modern typography pairing, responsive design grids, and Tailwind CSS patterns to build gorgeous web interfaces.`;
    } else {
      systemPrompt = `You are "Cyber Hub AI Assistant", a general IT and Security advisor built for the SCPSC IT Club.`;
    }

    systemPrompt += `\n\nSECURITY PROTOCOLS & CONSTRAINTS:
    - Never expose, mention, or fabricate any Admin configurations, private databases, API keys, or secret URLs.
    - If asked about secrets, credentials, or sensitive configurations, respond that you are forbidden from revealing system parameters.
    - Keep responses professional, highly encouraging, instructive, and easy to parse for high school and college students. Use markdown formatting.`;

    const chatHistory = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    // Generate output content using Python AI Engine first as requested
    let responseText = "";
    try {
      console.log("Routing AI chat request through Python backend AI engine...");
      responseText = await runPythonAI(key, message, history || [], systemPrompt, "gemini-2.5-flash");
    } catch (pythonErr: any) {
      console.warn("Python AI Engine failed, trying fallback to Node @google/genai...", pythonErr.message);
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            ...chatHistory,
            { role: "user", parts: [{ text: message }] }
          ],
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7
          }
        });
        responseText = response.text || "AI completed generation but returned no text content.";
      } catch (nodeErr: any) {
        console.warn("Node AI client failed, falling back to simulated core...", nodeErr.message);
        
        // Dynamic simulated responses matching the user's queries if possible
        const userMsg = message.toLowerCase();
        let fallbackResponse = "";
        
        if (userMsg.includes("program") || userMsg.includes("code") || userMsg.includes("c++") || userMsg.includes("python") || userMsg.includes("java")) {
          fallbackResponse = "To build strong coding foundations, focus on algorithmic complexities and standard library templates (STL in C++, collections in Java/Python). Here is a standard structural layout for competitive program execution:\n\n```cpp\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Optimize standard I/O operations\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    cout << \"System Online\" << endl;\n    return 0;\n}\n```\nWhat specific programming puzzle or sorting technique are you working on today?";
        } else if (userMsg.includes("hack") || userMsg.includes("security") || userMsg.includes("cyber") || userMsg.includes("sql") || userMsg.includes("xss")) {
          fallbackResponse = "Security Alert: Penetration testing must strictly be practiced under authorized virtual lab nodes. Defensive mechanisms include:\n\n1. **Prepared Statements**: Defeat SQL Injection by separating query structures from parameter states.\n2. **Sanitization & Escaping**: Stop Cross-Site Scripting (XSS) by encoding untrusted inputs.\n3. **MFA Protocol**: Enforce multi-factor verification points across all system gateways.\n\nWhich defensive security concept or cryptographic cipher would you like to examine?";
        } else if (userMsg.includes("robot") || userMsg.includes("arduino") || userMsg.includes("hardware") || userMsg.includes("sensor")) {
          fallbackResponse = "Robotics & Hardware Core: Most modular microcontrollers (like Arduino) process instructions via a setup and execution loop. To interface with sensors:\n\n```cpp\nconst int SENSOR_PIN = A0;\n\nvoid setup() {\n    Serial.begin(9600);\n    pinMode(SENSOR_PIN, INPUT);\n}\n\nvoid loop() {\n    int signal = analogRead(SENSOR_PIN);\n    Serial.println(signal);\n    delay(100);\n}\n```\nWhat hardware controllers, motor drivers, or sensor systems are you designing?";
        } else {
          const mockAnswers = [
            "Affirmative Student! The Cyber Hub AI assistant is active. I can assist with competitive programming, hardware integration, and defensive security frameworks. What project are we compiling today?",
            "At Savar Cantonment Public School & College IT Club, we foster innovation across Cyber Security, Software Engineering, Web Development, Robotics, and AI. Each department runs hands-on workshops!",
            "Welcome to the security interface! If you are learning web architectures, make sure to read about the OWASP Top 10 vulnerabilities. Let me know what concepts you'd like to dive into.",
            "As an interactive learning node, I can generate boilerplate structures for your lab sessions. Let me know which stack or microcontroller you're using!"
          ];
          fallbackResponse = mockAnswers[Math.floor(Math.random() * mockAnswers.length)];
        }
        
        return res.json({ 
          response: `[DEMAND SPIKE DETECTED - Graceful Backup Core Activated]\n\n${fallbackResponse}` 
        });
      }
    }

    res.json({ response: responseText });
  } catch (error: any) {
    console.error("Gemini API Error in proxy controller:", error);
    res.status(500).json({ error: "Failed to communicate with AI core", details: error.message });
  }
});

// ----------------------------------------------------
// ADMIN CONSOLE ENDPOINTS
// ----------------------------------------------------
app.get("/api/admin/stats", (req, res) => {
  const db = readDB();
  const totalUsers = db.users.length;
  const totalSubmits = db.results.length;
  
  // Calculate analytics for charts
  const departmentCounts = db.departments.map(d => ({
    name: d.name.split(" ")[0],
    members: d.membersCount,
    resources: d.resources.length
  }));

  const trafficData = [
    { day: "Mon", visitors: 120, queries: 45 },
    { day: "Tue", visitors: 150, queries: 60 },
    { day: "Wed", visitors: 190, queries: 82 },
    { day: "Thu", visitors: 175, queries: 70 },
    { day: "Fri", visitors: 210, queries: 95 },
    { day: "Sat", visitors: 280, queries: 140 },
    { day: "Sun", visitors: 240, queries: 110 }
  ];

  const quizPassCount = db.results.filter(r => r.certificateId).length;

  res.json({
    totalUsers,
    totalQuizzes: db.quizzes.length,
    totalEvents: db.events.length,
    totalMessages: db.messages.length,
    quizPassCount,
    departmentCounts,
    trafficData,
    logsCount: db.logs.length
  });
});

app.get("/api/admin/users", (req, res) => {
  const db = readDB();
  // Don't leak passwords to frontend
  const list = db.users.map(u => ({ id: u.id, email: u.email, role: u.role, username: u.username }));
  res.json(list);
});

app.post("/api/admin/users/update-role", (req, res) => {
  const { targetUserId, newRole } = req.body;
  if (!targetUserId || !newRole) return res.status(400).json({ error: "targetUserId and newRole are required" });

  const db = readDB();
  const user = db.users.find(u => u.id === targetUserId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.role = newRole;
  writeDB(db);
  logAction("u-admin", "Admin System", "Role Update", `Changed role of user @${user.username} to ${newRole}`);
  res.json({ success: true, user });
});

app.post("/api/admin/users/send-activity", (req, res) => {
  const { targetUserId, activityTitle, activityDescription, type } = req.body;
  if (!targetUserId || !activityTitle || !activityDescription || !type) {
    return res.status(400).json({ error: "Missing targetUserId, activityTitle, activityDescription, or type" });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === targetUserId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const profile = db.profiles.find(p => p.userId === targetUserId);
  if (profile) {
    if (type === "Attendance") {
      if (!profile.attendance) profile.attendance = [];
      profile.attendance.push({
        date: new Date().toISOString().split("T")[0],
        status: "Present",
        className: activityTitle
      });
    } else if (type === "Achievement") {
      if (!profile.achievements) profile.achievements = [];
      if (!profile.achievements.includes(activityTitle)) {
        profile.achievements.push(activityTitle);
      }
    } else {
      if (!profile.badges) profile.badges = [];
      if (!profile.badges.includes(activityTitle)) {
        profile.badges.push(activityTitle);
      }
    }
  }

  // Push notification to the target user
  if (!db.notifications) db.notifications = [];
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: targetUserId,
    title: `Activity Awarded: ${activityTitle}`,
    message: activityDescription,
    type: "system",
    read: false,
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  logAction("u-admin", "Admin System", "Activity Post", `Logged student activity (${type}) for @${user.username}: ${activityTitle}`);
  res.json({ success: true });
});

app.get("/api/admin/logs", (req, res) => {
  const db = readDB();
  res.json(db.logs);
});

// Backup system
app.post("/api/admin/backup", (req, res) => {
  try {
    const db = readDB();
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    const filename = `backup-${Date.now()}.json`;
    fs.writeFileSync(path.join(backupDir, filename), JSON.stringify(db, null, 2));

    logAction("u-admin", "Admin System", "DB Backup", `Created system snapshot archive: ${filename}`);
    res.json({ success: true, filename, message: "Database backup created successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to perform backup", details: error.message });
  }
});

// Admin creations: Quiz and Events
app.post("/api/admin/quiz/create", (req, res) => {
  const { title, description, duration, questions, negativeMarking } = req.body;
  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ error: "Title and quiz questions are required" });
  }

  const db = readDB();
  const newQuiz: Quiz = {
    id: `q-${Date.now()}`,
    title,
    description: description || "No description provided",
    duration: Number(duration) || 10,
    questions,
    negativeMarking: !!negativeMarking,
    participantsCount: 0
  };

  db.quizzes.push(newQuiz);

  // Broadcast notification to all members
  db.notifications.push({
    id: `n-${Date.now()}`,
    userId: "all",
    title: "New Exam Released!",
    message: `Take the newly published quiz '${title}' now!`,
    type: "quiz",
    timestamp: new Date().toISOString(),
    read: false
  });

  writeDB(db);
  logAction("u-admin", "Admin System", "Quiz Creator", `Added new quiz exam '${title}' with ${questions.length} questions`);

  res.json({ success: true, quiz: newQuiz });
});

app.post("/api/admin/event/create", (req, res) => {
  const { title, type, description, date, image } = req.body;
  if (!title || !type || !date) {
    return res.status(400).json({ error: "Title, type and date are required for creating event" });
  }

  const db = readDB();
  const newEvent: Event = {
    id: `evt-${Date.now()}`,
    title,
    type,
    description: description || "Join our upcoming event!",
    date,
    countdown: new Date(date).toISOString(),
    image: image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600",
    registeredUsers: []
  };

  db.events.unshift(newEvent);

  // Broadcast notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: "all",
    title: "New Event Scheduled!",
    message: `Join the upcoming '${title}' on ${new Date(date).toLocaleDateString()}. Register now!`,
    type: "event",
    timestamp: new Date().toISOString(),
    read: false
  });

  writeDB(db);
  logAction("u-admin", "Admin System", "Event Scheduled", `Announced new club event '${title}'`);

  res.json({ success: true, event: newEvent });
});

// Delete user account endpoint (Member self-deletion or Admin delete)
app.post("/api/user/delete-account", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const db = readDB();
  const uIndex = db.users.findIndex(u => u.id === userId);
  if (uIndex === -1) return res.status(404).json({ error: "User account not found" });

  const username = db.users[uIndex].username;
  db.users.splice(uIndex, 1);

  const pIndex = db.profiles.findIndex(p => p.userId === userId);
  if (pIndex !== -1) db.profiles.splice(pIndex, 1);

  writeDB(db);
  logAction("u-admin", "Admin System", "Account Erasure", `Permanently wiped data profile for @${username}`);

  res.json({ success: true, message: "Account deleted successfully" });
});

// ----------------------------------------------------
// DYNAMIC ALERTS, PAGES, AND CLASSES ENDPOINTS
// ----------------------------------------------------

// Active Alerts System
app.get("/api/admin/alert", (req, res) => {
  const db = readDB();
  res.json(db.systemAlert || { type: "none", message: "" });
});

app.post("/api/admin/alert", (req, res) => {
  const { type, message } = req.body;
  const db = readDB();
  db.systemAlert = {
    type: type || "none",
    message: message || ""
  };

  if (type && type !== "none") {
    // Add system notification for members
    db.notifications.push({
      id: `alert-${Date.now()}`,
      userId: "all",
      title: `System Alert: ${type.toUpperCase()} Status Activated`,
      message: message,
      type: "system",
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  writeDB(db);
  logAction("u-admin", "Admin System", "Alert Updated", `Set alert banner mode to '${type}'`);
  res.json({ success: true, systemAlert: db.systemAlert });
});

// Custom Sub-Pages CMS
app.get("/api/admin/pages", (req, res) => {
  const db = readDB();
  res.json(db.customPages || []);
});

app.post("/api/admin/pages", (req, res) => {
  const { id, title, icon, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required for custom page creation" });
  }

  const db = readDB();
  if (!db.customPages) db.customPages = [];

  let targetId = id;
  const existingPageIndex = id ? db.customPages.findIndex(p => p.id === id) : -1;

  if (existingPageIndex !== -1) {
    db.customPages[existingPageIndex] = {
      ...db.customPages[existingPageIndex],
      title,
      icon: icon || "FileCode",
      content,
      updatedAt: new Date().toISOString()
    };
    logAction("u-admin", "Admin System", "CMS Page Modified", `Edited custom page: ${title}`);
  } else {
    targetId = `page-${Date.now()}`;
    db.customPages.push({
      id: targetId,
      title,
      icon: icon || "FileCode",
      content,
      updatedAt: new Date().toISOString()
    });
    logAction("u-admin", "Admin System", "CMS Page Created", `Published custom page: ${title}`);
  }

  writeDB(db);
  res.json({ success: true, pages: db.customPages });
});

app.delete("/api/admin/pages/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (!db.customPages) db.customPages = [];

  const index = db.customPages.findIndex(p => p.id === id);
  if (index !== -1) {
    const title = db.customPages[index].title;
    db.customPages.splice(index, 1);
    writeDB(db);
    logAction("u-admin", "Admin System", "CMS Page Removed", `Deleted custom page: ${title}`);
    return res.json({ success: true, pages: db.customPages });
  }
  res.status(404).json({ error: "Page not found" });
});

// Club Classes & Online Lessons Schedules
app.get("/api/admin/classes", (req, res) => {
  const db = readDB();
  res.json(db.classes || []);
});

app.post("/api/admin/classes", (req, res) => {
  const { id, title, type, date, link, topic, instructor } = req.body;
  if (!title || !type || !date || !link) {
    return res.status(400).json({ error: "Title, Type (Club Class/Online Class), Date, Link/Room, and Topic are required" });
  }

  const db = readDB();
  if (!db.classes) db.classes = [];

  const existingClassIndex = id ? db.classes.findIndex(c => c.id === id) : -1;
  const newClass = {
    id: id || `class-${Date.now()}`,
    title,
    type,
    date,
    link,
    topic: topic || "Course material study",
    instructor: instructor || "Club Executive"
  };

  if (existingClassIndex !== -1) {
    db.classes[existingClassIndex] = newClass;
    logAction("u-admin", "Admin System", "Class Scheduled Update", `Updated class: ${title}`);
  } else {
    db.classes.push(newClass);
    // Broadcast notification
    db.notifications.push({
      id: `class-notif-${Date.now()}`,
      userId: "all",
      title: `New ${type} Scheduled!`,
      message: `Join '${title}' on ${new Date(date).toLocaleDateString()}. Access via Overview node.`,
      type: "system",
      timestamp: new Date().toISOString(),
      read: false
    });
    logAction("u-admin", "Admin System", "Class Scheduled", `Added new class: ${title}`);
  }

  writeDB(db);
  res.json({ success: true, classes: db.classes });
});

app.delete("/api/admin/classes/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (!db.classes) db.classes = [];

  const index = db.classes.findIndex(c => c.id === id);
  if (index !== -1) {
    const title = db.classes[index].title;
    db.classes.splice(index, 1);
    writeDB(db);
    logAction("u-admin", "Admin System", "Class Scheduled Removed", `Canceled class: ${title}`);
    return res.json({ success: true, classes: db.classes });
  }
  res.status(404).json({ error: "Class not found" });
});

// API Catch-All: prevent any unmatched /api calls from falling through to Vite HTML
app.all(/^\/api(\/.*)?$/, (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
});

// Global API error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[API Error]", err);
  if (res.headersSent) {
    return next(err);
  }
  const status = typeof err.status === "number" ? err.status : typeof err.statusCode === "number" ? err.statusCode : 500;
  res.status(status).json({
    error: err.message || "Internal server error",
    status
  });
});

// ----------------------------------------------------
// DEV AND VITE INTEGRATION MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  // Serve backend API routes first, and fall back to Vite SPA
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support React Router client-side fallbacks
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Cyber Hub Server Node] Active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
