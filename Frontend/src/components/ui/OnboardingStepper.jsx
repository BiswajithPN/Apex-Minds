import { Check } from 'lucide-react';

const steps = ['Create Account', 'Edit Profile', 'Upload Resume', 'Dashboard'];

export default function OnboardingStepper({ currentStep = 1 }) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8 animate-fade-in">
      <div className="flex items-center justify-between">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300
                    ${isCompleted
                      ? 'bg-accent-500 text-white shadow-md shadow-accent-500/30'
                      : isCurrent
                        ? 'bg-accent-500 text-white ring-4 ring-accent-100 shadow-md shadow-accent-500/30'
                        : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium whitespace-nowrap
                    ${isCurrent ? 'text-accent-600' : isCompleted ? 'text-slate-600' : 'text-slate-400'}
                  `}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-3 mt-[-20px]">
                  <div className="h-0.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-accent-500 rounded-full transition-all duration-500 ${
                        isCompleted ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
