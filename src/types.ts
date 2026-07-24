export interface User {
  id: string;
  email: string;
  username: string;
  role: "Admin" | "Executive" | "Member" | "Guest";
  name?: string;
  roll?: string;
  class?: string;
  section?: string;
  chId?: string;
  phone?: string;
  skills?: string[];
}

export interface Profile {
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

export interface CustomPage {
  id: string;
  title: string;
  icon: string;
  content: string;
  updatedAt: string;
}

export interface ClassSchedule {
  id: string;
  title: string;
  type: "Club Class" | "Online Class";
  date: string;
  link: string; // online link or classroom number
  topic: string;
  instructor: string;
}

export interface SystemAlert {
  type: "thrilled" | "chilled" | "none";
  message: string;
}

export interface Department {
  id: string;
  name: string;
  logo: string;
  banner: string;
  description: string;
  leader: string;
  membersCount: number;
  members: string[];
  gallery: string[];
  resources: { title: string; link: string }[];
  usefulLinks: { label: string; url: string }[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: QuizQuestion[];
  negativeMarking: boolean;
  participantsCount: number;
}

export interface QuizResult {
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

export interface Executive {
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

export interface MessageReply {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  email: string;
  content: string;
  timestamp: string;
  replies: MessageReply[];
}

export interface Event {
  id: string;
  title: string;
  type: "Workshop" | "Hackathon" | "Seminar" | "Competition";
  description: string;
  date: string;
  countdown: string;
  image: string;
  registeredUsers: string[];
}

export interface GalleryItem {
  id: string;
  title: string;
  type: "Photo" | "Video" | "Document";
  url: string;
  category: string;
  uploadedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "quiz" | "event" | "reply" | "system";
  timestamp: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}
