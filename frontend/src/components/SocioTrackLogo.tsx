import React from "react";

interface SocioTrackLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  showTagline?: boolean;
  light?: boolean;
}

export function SocioTrackLogo({
  className = "",
  size = "md",
  showWordmark = true,
  showTagline = false,
  light = false,
}: SocioTrackLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Network & Intelligence Symbol */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#5146D8] via-[#3478F6] to-[#6C63FF] shadow-md shadow-[#5146D8]/20 text-white shrink-0`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5"
        >
          {/* Interconnected Neural & Growth Graph */}
          <path
            d="M7 23L13 15L19 19L25 9"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          />
          {/* Network Node 1 (Social origin) */}
          <circle cx="7" cy="23" r="2.5" fill="white" />
          {/* Network Node 2 (Intelligence node) */}
          <circle cx="13" cy="15" r="2.5" fill="white" />
          {/* Network Node 3 (Memory check) */}
          <circle cx="19" cy="19" r="2.5" fill="white" />
          {/* Growth Node with Sparkle Center */}
          <circle cx="25" cy="9" r="3.2" fill="#ECE9FF" />
          <circle cx="25" cy="9" r="1.5" fill="#5146D8" />
          {/* AI Sparkle Star */}
          <path
            d="M26 4L26.6 5.8L28.4 6.4L26.6 7L26 8.8L25.4 7L23.6 6.4L25.4 5.8L26 4Z"
            fill="#FFD700"
            className="animate-pulse"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-extrabold tracking-tight ${textSizes[size]} ${
                light ? "text-white" : "text-[#172033]"
              }`}
            >
              Socio<span className="text-[#5146D8]">Track</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECE9FF] text-[#5146D8] border border-[#5146D8]/20 tracking-wider uppercase">
              AI Agent
            </span>
          </div>
          {showTagline && (
            <p
              className={`text-xs ${
                light ? "text-blue-100/80" : "text-[#718096]"
              } font-normal tracking-normal`}
            >
              Create Smarter. Engage Deeper. Grow Together.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
