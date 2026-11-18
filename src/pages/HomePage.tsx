import { ArrowRight, Compass, MapPin, Play, ShieldAlert, Sparkles } from 'lucide-react';
import { LeafletCampusMap } from '../components/LeafletCampusMap';
import { AppPage, CampusLocation } from '../types/campus';
import { CATEGORY_META } from '../utils/campusHelpers';

interface HomePageProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  onSelectLocation: (loc: CampusLocation) => void;
  onNavigate: (page: AppPage) => void;
  onStartDemo: () => void;
  onOpenEmergency: () => void;
  onOpenFirstTimeVisitor: () => void;
  onOpenDiscoverMode: () => void;
}

export function HomePage({
  locations,
  selectedLocation,
  onSelectLocation,
  onNavigate,
  onStartDemo,
  onOpenEmergency,
  onOpenFirstTimeVisitor,
  onOpenDiscoverMode,
}: HomePageProps) {
  const verifiedCount = locations.filter((l) => l.verificationStatus === 'verified').length;
  const approxCount = locations.filter((l) => l.verificationStatus === 'approximate').length;
  const previewLocations = locations.filter((l) => l.verificationStatus !== 'sample');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      {/* Main 2-column Hero matching Figma 01 — Home / Landing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div className="text-xs font-bold tracking-wider text-[#2563EB]">
            WELCOME TO YOUR CAMPUS · LPU PHAGWARA
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12] text-balance">
            Find your way. Explore your campus.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
            A smart campus guide for Lovely Professional University helping students and visitors
            locate academic blocks, Central Library — Block 37, Uni-Mall, Uni-Hospital, and mapped
            campus routes on real OpenStreetMap data.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('map')}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Explore campus</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onStartDemo}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 text-[#2563EB]" />
              <span>Try Campus Demo</span>
            </button>

            <button
              type="button"
              onClick={onOpenEmergency}
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Medical &amp; Emergency</span>
            </button>
          </div>

          {/* Grounded Data Summary (Clean unboxed tabular numerals) */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-6 max-w-lg">
            <div>
              <div className="text-2xl font-bold font-mono text-[#0F172A]">{verifiedCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">Verified OSM Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-[#0F172A]">{approxCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">Campus Zones</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-[#0F172A]">24×7</div>
              <div className="text-xs text-slate-500 mt-0.5">Uni-Hospital Info</div>
            </div>
          </div>
        </div>

        {/* Right Hero Column: Real Interactive LPU Map Preview inside soft blue frame */}
        <div className="lg:col-span-6">
          <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#0F172A]">
                  Lovely Professional University · Live Campus Preview
                </div>
                <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                  31.2533° N, 75.7033° E · Phagwara, Punjab
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('map')}
                className="text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Full map &rarr;
              </button>
            </div>

            <LeafletCampusMap
              locations={previewLocations}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => {
                onSelectLocation(loc);
              }}
              route={null}
              userCoords={null}
              onRequestLocateMe={() => onNavigate('map')}
              onResetMap={() => {}}
              compact
            />

            {selectedLocation && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[#2563EB]">
                    {CATEGORY_META[selectedLocation.category].label}
                  </div>
                  <div className="text-sm font-bold text-[#0F172A] truncate">
                    {selectedLocation.name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('map')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg shrink-0 cursor-pointer"
                >
                  Directions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature Quick Paths below hero */}
      <div className="mt-14 pt-10 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          type="button"
          onClick={onOpenFirstTimeVisitor}
          className="text-left p-6 bg-white border border-slate-200 hover:border-blue-300 rounded-xl transition-colors cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-4">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
            First-Time Visitor Mode
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            New to LPU? Start with essential gates, Admissions, Block 37 Central Library, Uni-Mall,
            and Uni-Hospital.
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenDiscoverMode}
          className="text-left p-6 bg-white border border-slate-200 hover:border-blue-300 rounded-xl transition-colors cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
            DISCOVER LPU Modes
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Explore campus life by Study, Food, Sports, Student Life, or Essentials mode with
            verified OpenStreetMap locations.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="text-left p-6 bg-white border border-slate-200 hover:border-blue-300 rounded-xl transition-colors cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-4">
            <MapPin className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
            Student Dashboard &amp; Favourites
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Quick-search blocks, access saved favourite places, and share scannable campus QR
            destination links.
          </p>
        </button>
      </div>

      <div className="mt-12 text-xs text-slate-500">
        Student project prototype · WS Section · OpenStreetMap &amp; OSRM grounded
      </div>
    </div>
  );
}
