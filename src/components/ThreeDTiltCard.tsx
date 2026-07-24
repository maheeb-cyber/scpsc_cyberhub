import React from "react";

interface ThreeDTiltCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export default function ThreeDTiltCard({ children, className = "" }: ThreeDTiltCardProps) {
  return (
    <div className={`w-full h-full rounded-2xl ${className}`}>
      {children}
    </div>
  );
}
