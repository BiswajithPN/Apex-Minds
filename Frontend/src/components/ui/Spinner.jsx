import { Loader2 } from 'lucide-react';

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizes[size]} text-accent-500 animate-spin`} />
    </div>
  );
}

export function CardSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 ${className}`}>
      {/* Title skeleton */}
      <div className="h-5 w-2/3 bg-slate-200 rounded-lg animate-skeleton-pulse mb-4" />
      {/* Line skeletons */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 bg-slate-100 rounded-md animate-skeleton-pulse mb-3"
          style={{
            width: `${85 - i * 15}%`,
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-accent-500 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}
