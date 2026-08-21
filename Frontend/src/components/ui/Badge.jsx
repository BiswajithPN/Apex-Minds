const variants = {
  accent:  'bg-accent-100 text-accent-700 ring-accent-200',
  success: 'bg-success-100 text-success-700 ring-success-200',
  warning: 'bg-warn-100 text-warn-700 ring-warn-200',
  danger:  'bg-danger-100 text-danger-700 ring-danger-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export default function Badge({ variant = 'neutral', size = 'sm', children, className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full ring-1 ring-inset
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {children}
    </span>
  );
}
