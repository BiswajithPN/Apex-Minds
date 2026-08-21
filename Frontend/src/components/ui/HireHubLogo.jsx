import React from 'react';

export default function HireHubLogo({
  size = 'md',
  showText = true,
  textColor = 'text-slate-900',
  accentColor = 'text-accent-500',
  className = '',
}) {
  const sizeMap = {
    sm: { box: 'w-8 h-8 rounded-xl p-1.5', icon: 'w-5 h-5', text: 'text-xl' },
    md: { box: 'w-10 h-10 rounded-2xl p-2', icon: 'w-6 h-6', text: 'text-2xl' },
    lg: { box: 'w-12 h-12 rounded-2xl p-2.5', icon: 'w-7 h-7', text: 'text-3xl' },
  };

  const { box, text, icon } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* High Quality Brown Bag Logo Box */}
      <div
        className={`${box} bg-gradient-to-br from-[#854d0e] via-[#713f12] to-[#451a03] border border-[#a16207]/40 flex items-center justify-center shadow-lg shadow-amber-950/20 shrink-0 transition-transform active:scale-95`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${icon} text-[#fef08a]`}
        >
          {/* Top Handle */}
          <path
            d="M8.5 6V4.5C8.5 3.67 9.17 3 10 3H14C14.83 3 15.5 3.67 15.5 4.5V6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Main Bag Body */}
          <rect
            x="3"
            y="6"
            width="18"
            height="14"
            rx="3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Left Vertical Stitch / Strap */}
          <line
            x1="8.5"
            y1="6"
            x2="8.5"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Right Vertical Stitch / Strap */}
          <line
            x1="15.5"
            y1="6"
            x2="15.5"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <span className={`${text} font-black tracking-tight ${textColor}`}>
          Hire<span className={accentColor}>Hub</span>
        </span>
      )}
    </div>
  );
}
