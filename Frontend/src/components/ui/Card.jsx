const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ children, hover = false, padding = 'md', className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-slate-200/60 shadow-sm
        ${hover ? 'hover:shadow-lg hover:shadow-accent-500/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer' : ''}
        ${paddings[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
