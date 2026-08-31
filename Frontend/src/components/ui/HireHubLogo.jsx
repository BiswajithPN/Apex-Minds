import React from 'react';

export default function HireHubLogo({
  size = 'md',
  showText = true,
  textColor = 'text-slate-900',
  accentColor = 'text-accent-500',
  className = '',
}) {
  const sizeMap = {
    sm: { box: 'w-12 h-12', icon: 'w-10 h-10', text: 'text-xl' },
    md: { box: 'w-14 h-14', icon: 'w-11 h-11', text: 'text-2xl' },
    lg: { box: 'w-16 h-16', icon: 'w-13 h-13', text: 'text-3xl' },
  };

  const { box, text, icon } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2 ml-1 ${className}`}>
      <div className={`${box} overflow-hidden shrink-0 `}>
        <img
          src="/Hirehub-logo.png"
          alt="HireHub"
          className={`${icon} object-contain mix-blend-multiply`}
        />
      </div>

      {showText && (
        <span className={`${text} font-black tracking-tight ${textColor}`}>
          Hire<span className={accentColor}>Hub</span>
        </span>
      )}
    </div>
  );
}
