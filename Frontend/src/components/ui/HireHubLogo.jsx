import React from 'react';

export default function HireHubLogo({
  size = 'md',
  showText = true,
  textColor = 'text-slate-900',
  accentColor = 'text-accent-500',
  className = '',
}) {
  const sizeMap = {
    sm: { box: 'w-8 h-8', icon: 'w-6 h-6', text: 'text-xl' },
    md: { box: 'w-10 h-10', icon: 'w-7 h-7', text: 'text-2xl' },
    lg: { box: 'w-12 h-12', icon: 'w-9 h-9', text: 'text-3xl' },
  };

  const { box, text, icon } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${box} rounded-xl overflow-hidden shadow-lg shrink-0 `}>
        <img
          src="/Hirehub-logo.png"
          alt="HireHub"
          className={`${icon} object-cover`}
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
