import { ArrowRight, ChevronLeft, Play, Sparkles, X } from 'lucide-react';

export interface DemoStep {
  step: number;
  title: string;
  description: string;
  actionLabel: string;
}

export const CAMPUS_DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'Welcome to Campus Navigator',
    description: 'Start on the LPU overview page — works instantly with zero student login required.',
    actionLabel: 'Go to Home',
  },
  {
    step: 2,
    title: 'Search for Central Library',
    description: 'Open the Explore directory and filter for "Central Library" using smart search.',
    actionLabel: 'Search Library',
  },
  {
    step: 3,
    title: 'Select Central Library — Block 37',
    description: 'Inspect Block 37 details, verified circulation hours (8 AM – 9 PM), and location status.',
    actionLabel: 'Select Block 37',
  },
  {
    step: 4,
    title: 'View Mapped Location on OpenStreetMap',
    description: 'Jump straight to the interactive Leaflet LPU map centered on Phagwara, Punjab.',
    actionLabel: 'Open on Map',
  },
  {
    step: 5,
    title: 'Choose Starting Point',
    description: 'Set Lovely Institute of Technology (Verified OSM building) as your starting point.',
    actionLabel: 'Set Start Point',
  },
  {
    step: 6,
    title: 'Request Walking Directions',
    description: 'Compute a real path-based walking route via OSRM with distance, time, and steps.',
    actionLabel: 'Calculate Route',
  },
  {
    step: 7,
    title: 'Open DISCOVER LPU',
    description: 'Switch to LPU Campus Discovery Mode to browse by student lifestyle and needs.',
    actionLabel: 'Open Discover LPU',
  },
  {
    step: 8,
    title: 'Explore Food, Sports & Student Facilities',
    description: 'Browse Food Mode, Sports Mode (mapped grounds & courts), and Student Life facilities.',
    actionLabel: 'Preview Categories',
  },
  {
    step: 9,
    title: 'Generate Destination QR Code',
    description: 'Create a scannable QR code for Central Library — Block 37 so anyone can open it directly.',
    actionLabel: 'Generate QR Code',
  },
];

interface CampusDemoBarProps {
  isOpen: boolean;
  currentStepIndex: number;
  onRunStep: (stepIndex: number) => void;
  onClose: () => void;
}

export function CampusDemoBar({
  isOpen,
  currentStepIndex,
  onRunStep,
  onClose,
}: CampusDemoBarProps) {
  if (!isOpen) return null;

  const step = CAMPUS_DEMO_STEPS[currentStepIndex];

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[440px] z-[1150] bg-[#0F172A] text-white rounded-xl border border-slate-700 shadow-2xl p-4"
      role="region"
      aria-label="Live Campus Demo Guide"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Live Presentation Demo · Step {step.step} of {CAMPUS_DEMO_STEPS.length}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1">{step.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          aria-label="Exit demo mode"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{step.description}</p>

      {/* Progress track */}
      <div className="grid grid-cols-9 gap-1 mt-3">
        {CAMPUS_DEMO_STEPS.map((s, idx) => (
          <button
            key={s.step}
            type="button"
            onClick={() => onRunStep(idx)}
            className={`h-1.5 rounded-full transition-colors cursor-pointer ${
              idx <= currentStepIndex ? 'bg-[#3B82F6]' : 'bg-slate-700 hover:bg-slate-600'
            }`}
            aria-label={`Jump to demo step ${s.step}: ${s.title}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={() => onRunStep(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRunStep(currentStepIndex)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
          >
            <Play className="w-3 h-3" />
            <span>{step.actionLabel}</span>
          </button>

          {currentStepIndex < CAMPUS_DEMO_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => onRunStep(currentStepIndex + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
            >
              <span>Finish Demo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
