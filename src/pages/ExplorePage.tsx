import {
  AlertCircle,
  Clock,
  Compass,
  Heart,
  MapPin,
  Navigation,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CampusCategory, CampusLocation, DiscoverMode } from '../types/campus';
import {
  CATEGORY_META,
  DISCOVER_MODES,
  smartSearchLocations,
  VERIFICATION_META,
} from '../utils/campusHelpers';

interface ExplorePageProps {
  locations: CampusLocation[];
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  discoverMode: DiscoverMode;
  onDiscoverModeChange: (mode: DiscoverMode) => void;
  selectedLocation: CampusLocation | null;
  onSelectLocation: (loc: CampusLocation) => void;
  onOpenOnMap: (loc: CampusLocation, startDirections?: boolean) => void;
  favouriteIds: string[];
  onToggleFavourite: (id: string) => void;
  onShareQR: (loc: CampusLocation) => void;
  onOpenAddLocation: () => void;
}

export function ExplorePage({
  locations,
  searchQuery,
  onSearchQueryChange,
  discoverMode,
  onDiscoverModeChange,
  selectedLocation,
  onSelectLocation,
  onOpenOnMap,
  favouriteIds,
  onToggleFavourite,
  onShareQR,
  onOpenAddLocation,
}: ExplorePageProps) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | CampusCategory>('all');
  const [verificationFilter, setVerificationFilter] = useState<
    'verified_approx' | 'verified_only' | 'sample_only'
  >('verified_approx');
  const [detailModalLoc, setDetailModalLoc] = useState<CampusLocation | null>(null);

  const filteredLocations = useMemo(() => {
    let pool = locations;

    if (verificationFilter === 'verified_only') {
      pool = pool.filter((l) => l.verificationStatus === 'verified');
    } else if (verificationFilter === 'sample_only') {
      pool = pool.filter((l) => l.verificationStatus === 'sample');
    } else {
      // Never mix sample entries into normal verified/approximate results
      pool = pool.filter((l) => l.verificationStatus !== 'sample');
    }

    if (discoverMode !== 'all' && verificationFilter !== 'sample_only') {
      pool = pool.filter((l) => l.discoverModes.includes(discoverMode));
    }

    if (categoryFilter !== 'all') {
      pool = pool.filter((l) => l.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      pool = smartSearchLocations(pool, searchQuery);
    }

    return pool;
  }, [locations, verificationFilter, discoverMode, categoryFilter, searchQuery]);

  const activeDiscoverMeta = DISCOVER_MODES.find((m) => m.id === discoverMode);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12 space-y-8">
      {/* Header matching Figma 05 — Explore Locations */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-wider text-[#2563EB]">EXPLORE</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-1">
            Find a campus location
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Explore verified OpenStreetMap buildings and LPU campus zones by category or discovery mode.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddLocation}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 text-[#2563EB]" />
          <span>Add Campus Location</span>
        </button>
      </div>

      {/* Signature Feature: DISCOVER LPU */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#0F172A]">DISCOVER LPU</h2>
            <span className="text-xs text-slate-500">
              · {activeDiscoverMeta?.subtitle}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {filteredLocations.length} matching places
          </span>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Discover LPU modes">
          {DISCOVER_MODES.map((mode) => {
            const active = discoverMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  onDiscoverModeChange(mode.id);
                  if (verificationFilter === 'sample_only') {
                    setVerificationFilter('verified_approx');
                  }
                }}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Search + Category + Verification Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search library, Block 37, LIT, Uni-Mall, hospital, hostel, parking..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="lg:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | CampusCategory)}
            aria-label="Filter by campus category"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Categories</option>
            <option value="academic">Academic</option>
            <option value="student_facilities">Student Facilities</option>
            <option value="food_shopping">Food &amp; Shopping</option>
            <option value="residential">Residential</option>
            <option value="admin_services">Administration &amp; Services</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <select
            value={verificationFilter}
            onChange={(e) =>
              setVerificationFilter(
                e.target.value as 'verified_approx' | 'verified_only' | 'sample_only'
              )
            }
            aria-label="Filter by location verification status"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="verified_approx">Verified + Approximate LPU</option>
            <option value="verified_only">Verified OSM Only</option>
            <option value="sample_only">Sample Demo Entries Only</option>
          </select>
        </div>
      </div>

      {/* Directory Grid matching Figma 05 numbered cards */}
      {filteredLocations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-[#0F172A]">
            No destinations matched your current search or filter.
          </p>
          <p className="text-xs text-slate-500">
            Try clearing the search term or switching back to All Campus mode.
          </p>
          <button
            type="button"
            onClick={() => {
              onSearchQueryChange('');
              setCategoryFilter('all');
              onDiscoverModeChange('all');
              setVerificationFilter('verified_approx');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLocations.map((loc, index) => {
            const catMeta = CATEGORY_META[loc.category];
            const verMeta = VERIFICATION_META[loc.verificationStatus];
            const isFav = favouriteIds.includes(loc.id);
            const isSelected = selectedLocation?.id === loc.id;
            const numLabel = String(index + 1).padStart(2, '0');

            return (
              <article
                key={loc.id}
                className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-colors ${
                  isSelected ? 'border-[#2563EB] ring-1 ring-[#2563EB]' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {numLabel}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleFavourite(loc.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isFav
                            ? 'text-red-600 bg-red-50'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        aria-label={isFav ? `Remove ${loc.name} from favourites` : `Save ${loc.name} to favourites`}
                        title={isFav ? 'Remove favourite' : 'Save favourite'}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onShareQR(loc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer"
                        aria-label={`Share QR code for ${loc.name}`}
                        title="Generate QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Clean unboxed metadata line */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{catMeta.shortLabel}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span className={`inline-flex items-center gap-1 font-medium ${verMeta.textClass}`}>
                      {loc.verificationStatus === 'verified' ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {verMeta.label}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] mt-1.5">{loc.name}</h3>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                    {loc.description}
                  </p>

                  {loc.openingHoursVerified && loc.openingHours && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{loc.openingHours}</span>
                    </div>
                  )}

                  <div className="mt-2.5 text-[11px] text-slate-500 truncate">
                    {loc.facilities.slice(0, 3).join(' · ')}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLocation(loc);
                      setDetailModalLoc(loc);
                    }}
                    className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    View details &rarr;
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenOnMap(loc, true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Directions</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Location Details Modal */}
      {detailModalLoc && (
        <div
          className="fixed inset-0 z-[1200] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-semibold text-[#2563EB]">
                  {CATEGORY_META[detailModalLoc.category].label} ·{' '}
                  <span className={VERIFICATION_META[detailModalLoc.verificationStatus].textClass}>
                    {VERIFICATION_META[detailModalLoc.verificationStatus].label}
                  </span>
                </div>
                <h2 id="detail-modal-title" className="text-xl font-bold text-[#0F172A] mt-1">
                  {detailModalLoc.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalLoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-sm">
              <p className="text-slate-600 leading-relaxed">{detailModalLoc.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs">
                <div>
                  <div className="text-slate-500 font-medium">Coordinates</div>
                  <div className="font-mono font-semibold text-[#0F172A] mt-0.5">
                    {detailModalLoc.latitude.toFixed(6)}, {detailModalLoc.longitude.toFixed(6)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Status Note</div>
                  <div className="text-[#0F172A] mt-0.5">
                    {VERIFICATION_META[detailModalLoc.verificationStatus].label}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-slate-500 font-medium">Location Source</div>
                  <div className="text-slate-700 mt-0.5">{detailModalLoc.source}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-[#0F172A] mb-1.5">Available Facilities</div>
                <p className="text-xs text-slate-600">
                  {detailModalLoc.facilities.join(' · ')}
                </p>
              </div>

              {detailModalLoc.openingHoursVerified && detailModalLoc.openingHours ? (
                <div>
                  <div className="text-xs font-bold text-[#0F172A] mb-1">Verified Hours</div>
                  <p className="text-xs text-emerald-700 font-medium">
                    {detailModalLoc.openingHours}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Opening hours not officially verified in current dataset.
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onShareQR(detailModalLoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFavourite(detailModalLoc.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      favouriteIds.includes(detailModalLoc.id) ? 'fill-red-600 text-red-600' : ''
                    }`}
                  />
                  <span>
                    {favouriteIds.includes(detailModalLoc.id) ? 'Saved' : 'Save'}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = detailModalLoc;
                    setDetailModalLoc(null);
                    onOpenOnMap(target, false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F172A] border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>View on Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = detailModalLoc;
                    setDetailModalLoc(null);
                    onOpenOnMap(target, true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
