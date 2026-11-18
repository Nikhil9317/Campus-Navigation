import {
  ArrowRight,
  BookOpen,
  Building2,
  Compass,
  Heart,
  Play,
  Search,
  ShieldAlert,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppPage, CampusLocation, DemoUser } from '../types/campus';
import { CATEGORY_META, smartSearchLocations, VERIFICATION_META } from '../utils/campusHelpers';

interface DashboardPageProps {
  user: DemoUser | null;
  locations: CampusLocation[];
  favouriteIds: string[];
  recentSearches: string[];
  onSelectForMap: (loc: CampusLocation) => void;
  onNavigate: (page: AppPage) => void;
  onToggleFavourite: (id: string) => void;
  onRecordSearch: (term: string) => void;
  onStartDemo: () => void;
  onOpenEmergency: () => void;
  onOpenFirstTimeVisitor: () => void;
  onOpenDiscoverMode: () => void;
}

export function DashboardPage({
  user,
  locations,
  favouriteIds,
  recentSearches,
  onSelectForMap,
  onNavigate,
  onToggleFavourite,
  onRecordSearch,
  onStartDemo,
  onOpenEmergency,
  onOpenFirstTimeVisitor,
  onOpenDiscoverMode,
}: DashboardPageProps) {
  const [query, setQuery] = useState('');

  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning!';
    if (hr < 17) return 'Good afternoon!';
    return 'Good evening!';
  }, []);

  const searchPool = useMemo(
    () => locations.filter((l) => l.verificationStatus !== 'sample'),
    [locations]
  );

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return smartSearchLocations(searchPool, query).slice(0, 6);
  }, [query, searchPool]);

  const favouriteLocations = useMemo(
    () => locations.filter((l) => favouriteIds.includes(l.id)),
    [locations, favouriteIds]
  );

  const libraryLoc = locations.find((l) => l.id === 'lpu-central-library-block-37');
  const litLoc = locations.find((l) => l.id === 'lovely-institute-of-technology');
  const uniMallLoc = locations.find((l) => l.id === 'uni-mall');

  const handlePickResult = (loc: CampusLocation) => {
    if (query.trim()) onRecordSearch(query.trim());
    onSelectForMap(loc);
    onNavigate('map');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12 space-y-8">
      {/* Header matching Figma 04 — Student Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-wider text-[#2563EB]">STUDENT DASHBOARD</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-1">
            {user ? `${greeting.replace('!', '')}, ${user.name}!` : greeting}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Where would you like to go on the LPU campus today?
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onStartDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Try Campus Demo</span>
          </button>
          <button
            type="button"
            onClick={onOpenEmergency}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Uni-Hospital &amp; Help</span>
          </button>
        </div>
      </div>

      {/* Smart Destination Search */}
      <div className="relative max-w-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a building, Block 37, LIT, Uni-Mall, hospital, ATM..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-30 divide-y divide-slate-100 overflow-hidden">
            {searchResults.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => handlePickResult(loc)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div>
                  <div className="text-sm font-semibold text-[#0F172A]">{loc.name}</div>
                  <div className="text-xs text-slate-500">
                    {CATEGORY_META[loc.category].label} ·{' '}
                    <span className={VERIFICATION_META[loc.verificationStatus].textClass}>
                      {VERIFICATION_META[loc.verificationStatus].label}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#2563EB] shrink-0">View on map &rarr;</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent Searches (if any) */}
      {recentSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Recent searches:</span>
          {recentSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 rounded-md text-slate-700 cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* Quick Access Triad matching Figma 04 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          type="button"
          onClick={() => libraryLoc && handlePickResult(libraryLoc)}
          className="text-left p-6 bg-white border border-slate-200 hover:border-blue-400 rounded-xl transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A]">Central Library — Block 37</h2>
          <p className="text-xs text-slate-600 mt-1">
            Books, reading halls &amp; OPAC · 8:00 AM – 9:00 PM
          </p>
        </button>

        <button
          type="button"
          onClick={() => litLoc && handlePickResult(litLoc)}
          className="text-left p-6 bg-white border border-slate-200 hover:border-blue-400 rounded-xl transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A]">Classrooms &amp; LIT Block</h2>
          <p className="text-xs text-slate-600 mt-1">
            Verified OpenStreetMap building · 7 levels
          </p>
        </button>

        <button
          type="button"
          onClick={() => uniMallLoc && handlePickResult(uniMallLoc)}
          className="text-left p-6 bg-white border border-slate-200 hover:border-blue-400 rounded-xl transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4">
            <Utensils className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A]">Uni-Mall &amp; Cafeterias</h2>
          <p className="text-xs text-slate-600 mt-1">
            Food courts, cafes, grocery &amp; student shops
          </p>
        </button>
      </div>

      {/* Primary Action + Quick Modes */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('map')}
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
        >
          <span>View campus map</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onOpenFirstTimeVisitor}
          className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#0F172A] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4 text-[#2563EB]" />
          <span>First-Time Visitor Mode</span>
        </button>
        <button
          type="button"
          onClick={onOpenDiscoverMode}
          className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#0F172A] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
          <span>Open DISCOVER LPU</span>
        </button>
      </div>

      {/* Saved Favourite Places */}
      <section className="pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">Your Favourite Places</h2>
            <p className="text-xs text-slate-500">Saved locally in your browser for quick access.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
          >
            Browse all places &rarr;
          </button>
        </div>

        {favouriteLocations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
            No favourite destinations saved yet. Open <strong>Explore</strong> or the{' '}
            <strong>Map</strong> to bookmark frequently visited places like Block 37 or Uni-Mall.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favouriteLocations.map((loc) => (
              <div
                key={loc.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => handlePickResult(loc)}
                  className="text-left min-w-0 flex-1 cursor-pointer"
                >
                  <div className="text-xs text-slate-500">{CATEGORY_META[loc.category].label}</div>
                  <div className="text-sm font-bold text-[#0F172A] truncate mt-0.5">{loc.name}</div>
                  <div className="text-xs text-[#2563EB] font-semibold mt-2">Open on map &rarr;</div>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFavourite(loc.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  aria-label={`Remove ${loc.name} from favourites`}
                  title="Remove from favourites"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
