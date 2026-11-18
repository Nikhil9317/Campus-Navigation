import { Navigation, Phone, ShieldAlert, X } from 'lucide-react';
import { OFFICIAL_LPU_EMERGENCY_CONTACTS } from '../data/emergencyContacts';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRouteToHospital: () => void;
}

export function EmergencyModal({
  isOpen,
  onClose,
  onRouteToHospital,
}: EmergencyModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
              <ShieldAlert className="w-4 h-4" />
              <span>Emergency Quick Access</span>
            </div>
            <h2 id="emergency-modal-title" className="text-lg font-bold text-[#0F172A] mt-1">
              LPU Medical & Campus Security Helplines
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official telephone numbers verified from Lovely Professional University (lpu.in).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            aria-label="Close emergency dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {OFFICIAL_LPU_EMERGENCY_CONTACTS.map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#0F172A]">{entry.label}</h3>
                <span className="text-xs font-medium text-emerald-700">{entry.availability}</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{entry.department}</p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {entry.numbers.map((num) => (
                  <a
                    key={num}
                    href={`tel:${num.replace(/[^+\d]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-semibold text-[#0F172A] hover:border-blue-600 hover:text-[#2563EB] transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{num}</span>
                  </a>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Source: {entry.source}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            For off-campus emergencies in India, dial <strong className="font-mono text-[#0F172A]">112</strong>.
          </p>
          <button
            type="button"
            onClick={() => {
              onRouteToHospital();
              onClose();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Navigate to Uni-Hospital</span>
          </button>
        </div>
      </div>
    </div>
  );
}
