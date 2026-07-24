import React from "react";

interface CyberHubLogoProps {
  className?: string;
}

export default function CyberHubLogo({ className = "w-8 h-8" }: CyberHubLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top/Right Wing */}
      <path d="M 65.8,16.3 L 66.8,62.6 L 63.4,68.0 L 58.2,59.5 L 51.4,55.5 L 51.4,50.4 L 58.2,48.0 L 53.8,29.2 L 61.0,29.2 Z" />
      {/* Left Wing */}
      <path d="M 14.6,52.6 L 46.8,30.0 L 49.4,46.8 L 50.8,50.8 L 48.0,51.0 L 28.5,50.4 Z" />
      {/* Bottom Right Wing */}
      <path d="M 71.0,80.0 L 31.5,57.0 L 51.0,56.0 L 51.0,51.0 L 63.0,61.0 Z" />
    </svg>
  );
}
