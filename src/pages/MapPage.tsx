import {
  AlertTriangle,
  ArrowLeftRight,
  Car,
  Compass,
  Footprints,
  Heart,
  Info,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { LeafletCampusMap } from '../components/LeafletCampusMap';
import { OFFICIAL_LPU_EMERGENCY_CONTACTS } from '../data/emergencyContacts';
import {
  formatDistance,
  formatDuration,
  haversineDistanceMeters,
  NominatimResult,
  searchNominatimPlaces,
} from '../services/campusMapService';
import {
  AccessibilityPreference,
  CampusCategory,
  CampusLocation,
  ComputedRoute,
  TravelMode,
} from '../types/campus';
import {
  CATEGORY_META,
  smartSearchLocations,
  VERIFICATION_META,
} from '../utils/campusHelpers';

interface MapPageProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  onSelectLocation: (loc: CampusLocation) => void;
  startId: string;
  onStartIdChange: (id: string) => void;
  endId: string;
  onEndIdChange: (id: string) => void;
  travelMode: TravelMode;
  onTravelModeChange: (mode: TravelMode) => void;
  accessibilityPref: AccessibilityPreference;
  onAccessibilityPrefChange: (pref: AccessibilityPreference) => void;
  route: ComputedRoute | null;
  routeLoading: boolean;
  routeError: string | null;
  onCalculateRoute: () => void;
  onResetRoute: () => void;
  userCoords: [number, number] | null;
  isLocating: boolean;
  locationError: string | null;
  onRequestLocateMe: () => void;
  favouriteIds: string[];
  onToggleFavourite: (id: string) => void;
  recentSearches: string[];
  onRecordSearch: (term: string) => void;
  onShareQR: (loc: CampusLocation) => void;
  firstTimeVisitorMode: boolean;
  onToggleFirstTimeVisitor: () => void;
  overpassStatus: { status: 'idle' | 'loading' | 'live' | 'cached' | 'unavailable'; message: string };
  onSyncOverpass: () => void;
  onOpenEmergency: () => void;
  onOpenAddLocation: () => void;
  onStartDemo: () => void;
}

type FacilityQueryType = 'food' | 'medical' | 'parking' | 'library' | 'banking' | 'restroom';

export function MapPage({
  locations,
  selectedLocation,
  onSelectLocation,
  startId,
  onStartIdChange,
  endId,
  onEndIdChange,
  travelMode,
  onTravelModeChange,
  accessibilityPref,
  onAccessibilityPrefChange,
  route,
  routeLoading,
  routeError,
  onCalculateRoute,
  onResetRoute,
  userCoords,
  isLocating,
  locationError,
  onRequestLocateMe,
  favouriteIds,
  onToggleFavourite,
  recentSearches,
  onRecordSearch,
  onShareQR,
  firstTimeVisitorMode,
  onToggleFirstTimeVisitor,
  overpassStatus,
  onSyncOverpass,
  onOpenEmergency,
  onOpenAddLocation,
  onStartDemo,
}: MapPageProps) {
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CampusCategory>('all');
  const [includeSample, setIncludeSample] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);

  // Nominatim place search state
  const [nominatimResults, setNominatimResults] = useState<NominatimResult[]>([]);
  const [nominatimLoading, setNominatimLoading] = useState(false);
  const [nominatimError, setNominatimError] = useState<string | null>(null);
  const [nominatimPin, setNominatimPin] = useState<{ lat: number; lon: number; label: string } | null>(null);

  // Nearest facility finder state
  const [activeFacilityType, setActiveFacilityType] = useState<FacilityQueryType | null>(null);

  const visibleLocations = useMemo(() => {
    let pool = locations;
    if (!includeSample) {
      pool = pool.filter((l) => l.verificationStatus !== 'sample');
    }
    if (firstTimeVisitorMode) {
      pool = pool.filter((l) => l.isFirstTimeEssential);
    }
    if (categoryFilter !== 'all') {
      pool = pool.filter((l) => l.category === categoryFilter);
    }
    return pool;
  }, [locations, includeSample, firstTimeVisitorMode, categoryFilter]);

  const searchMatches = useMemo(() => {
    if (!sidebarSearch.trim()) return [];
    const pool = includeSample
      ? locations
      : locations.filter((l) => l.verificationStatus !== 'sample');
    return smartSearchLocations(pool, sidebarSearch).slice(0, 6);
  }, [locations, sidebarSearch, includeSample]);

  const selectorLocations = useMemo(
    () => locations.filter((l) => l.verificationStatus !== 'sample'),
    [locations]
  );

  const favouriteLocations = useMemo(
    () => locations.filter((l) => favouriteIds.includes(l.id)),
    [locations, favouriteIds]
  );

  // Reference coordinate for Nearest Facility Finder (GPS if granted, else chosen Start point, else LPU Main Gate/Center)
  const referencePoint = useMemo((): { label: string; coords: [number, number] } => {
    if (startId === 'user-gps' && userCoords) {
      return { label: 'your GPS location', coords: userCoords };
    }
    const startLoc = locations.find((l) => l.id === startId);
    if (startLoc) {
      return { label: startLoc.shortName || startLoc.name, coords: [startLoc.latitude, startLoc.longitude] };
    }
    if (userCoords) {
      return { label: 'your GPS location', coords: userCoords };
    }
    return { label: 'Central Campus (Block 37 zone)', coords: [31.254921, 75.704619] };
  }, [startId, userCoords, locations]);

  const nearestFacilities = useMemo(() => {
    if (!activeFacilityType) return [];
    return locations
      .filter(
        (l) =>
          l.verificationStatus !== 'sample' &&
          l.nearbyFacilityType === activeFacilityType
      )
      .map((l) => ({
        location: l,
        distance: haversineDistanceMeters(
          referencePoint.coords[0],
          referencePoint.coords[1],
          l.latitude,
          l.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);
  }, [activeFacilityType, locations, referencePoint]);

  const handleNominatimSearch = async () => {
    if (!sidebarSearch.trim()) return;
    setNominatimLoading(true);
    setNominatimError(null);
    const res = await searchNominatimPlaces(sidebarSearch);
    setNominatimLoading(false);
    setNominatimResults(res.results);
    if (res.error) setNominatimError(res.error);
  };

  const handleSwapEndpoints = () => {
    if (startId === 'user-gps') return;
    const prevStart = startId;
    onStartIdChange(endId);
    onEndIdChange(prevStart);
  };

  const handleResetAll = () => {
    onResetRoute();
    setNominatimPin(null);
    setNominatimResults([]);
    setCategoryFilter('all');
    setActiveFacilityType(null);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-5">
      {/* Top Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-wider text-[#2563EB]">
            CAMPUS MAP · LOVELY PROFESSIONAL UNIVERSITY
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-0.5">
            Find your destination
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Interactive OpenStreetMap of LPU Phagwara with OSRM path routing and verified campus data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleFirstTimeVisitor}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              firstTimeVisitorMode
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-white text-[#0F172A] border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>First-Time Visitor Mode</span>
          </button>

          <button
            type="button"
            onClick={onSyncOverpass}
            disabled={overpassStatus.status === 'loading'}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#2563EB] ${
                overpassStatus.status === 'loading' ? 'animate-spin' : ''
              }`}
            />
            <span>Sync Live OSM POIs</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddLocation}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Add Location</span>
          </button>

          <button
            type="button"
            onClick={onStartDemo}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Try Campus Demo</span>
          </button>
        </div>
      </div>

      {/* Overpass / OpenStreetMap Data Status Notice */}
      {overpassStatus.status !== 'idle' && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            overpassStatus.status === 'unavailable'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-blue-50/70 border-blue-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{overpassStatus.message}</span>
          </div>
        </div>
      )}

      {/* First-Time Visitor Mode Guided Strip */}
      {firstTimeVisitorMode && (
        <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#2563EB]">
              First-Time Visitor Mode Active
            </div>
            <p className="text-xs text-slate-700 mt-0.5">
              Showing essential LPU newcomer destinations: Main Entrance, Admissions &amp; Admin,
              Central Library (Block 37), Uni-Mall, Uni-Hospital, and Academic Blocks.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleFirstTimeVisitor}
            className="px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-blue-200 rounded-lg hover:bg-blue-50 shrink-0 cursor-pointer"
          >
            Show all campus locations
          </button>
        </div>
      )}

      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#0F172A] cursor-pointer"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
            <span>{mobileSidebarOpen ? 'Hide Search & Route Controls' : 'Show Search & Route Controls'}</span>
          </span>
          <span>{mobileSidebarOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Main Split Product Layout: LEFT SIDEBAR + MAIN MAP AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT SIDEBAR */}
        <aside
          className={`lg:col-span-4 xl:col-span-4 space-y-4 ${
            mobileSidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* 1. Search Destinations */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <label htmlFor="map-search" className="block text-xs font-bold text-[#0F172A]">
              Search Campus or Phagwara
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="map-search"
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Block 37, Uni-Mall, LIT, hospital, ATM..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {sidebarSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setSidebarSearch('');
                    setNominatimResults([]);
                    setNominatimError(null);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {searchMatches.length > 0 && (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {searchMatches.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      onRecordSearch(loc.shortName || loc.name);
                      onSelectLocation(loc);
                      onEndIdChange(loc.id);
                      setSidebarSearch('');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#0F172A] truncate">{loc.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {CATEGORY_META[loc.category].shortLabel} ·{' '}
                        {VERIFICATION_META[loc.verificationStatus].label}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#2563EB] shrink-0">Select</span>
                  </button>
                ))}
              </div>
            )}

            {sidebarSearch.trim().length >= 3 && (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleNominatimSearch}
                  disabled={nominatimLoading}
                  className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer disabled:opacity-50"
                >
                  {nominatimLoading
                    ? 'Searching OpenStreetMap Nominatim...'
                    : `Search "${sidebarSearch}" via Nominatim →`}
                </button>
              </div>
            )}

            {nominatimError && (
              <p className="text-[11px] text-amber-700">{nominatimError}</p>
            )}

            {nominatimResults.length > 0 && (
              <div className="border border-blue-200 bg-blue-50/40 rounded-lg divide-y divide-blue-100">
                {nominatimResults.map((res) => (
                  <button
                    key={res.placeId}
                    type="button"
                    onClick={() =>
                      setNominatimPin({
                        lat: res.lat,
                        lon: res.lon,
                        label: res.shortName,
                      })
                    }
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-[#0F172A] truncate">
                      {res.shortName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{res.displayName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Route Planner */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A]">Route Planner</h2>
              <button
                type="button"
                onClick={handleSwapEndpoints}
                disabled={startId === 'user-gps'}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline disabled:opacity-40 cursor-pointer"
                title="Swap start and destination"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Swap</span>
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label htmlFor="route-start" className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Starting Point
                </label>
                <select
                  id="route-start"
                  value={startId}
                  onChange={(e) => {
                    if (e.target.value === 'user-gps' && !userCoords) {
                      onRequestLocateMe();
                    }
                    onStartIdChange(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select starting point...</option>
                  <option value="user-gps">
                    {userCoords ? 'My Current GPS Location (Active)' : 'Use My Current GPS Location'}
                  </option>
                  {selectorLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.shortName || loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="route-end" className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Destination
                </label>
                <select
                  id="route-end"
                  value={endId}
                  onChange={(e) => {
                    onEndIdChange(e.target.value);
                    const found = locations.find((l) => l.id === e.target.value);
                    if (found) onSelectLocation(found);
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select destination...</option>
                  {selectorLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.shortName || loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Travel Mode */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onTravelModeChange('walking')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    travelMode === 'walking'
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>Walking</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTravelModeChange('driving')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    travelMode === 'driving'
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Driving</span>
                </button>
              </div>

              {/* Accessibility Preference */}
              <div>
                <div className="text-[11px] font-semibold text-slate-600 mb-1">
                  Route Preference
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onAccessibilityPrefChange('shortest')}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border cursor-pointer ${
                      accessibilityPref === 'shortest'
                        ? 'bg-blue-50 text-[#2563EB] border-blue-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Shortest Route
                  </button>
                  <button
                    type="button"
                    onClick={() => onAccessibilityPrefChange('step_free')}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border cursor-pointer ${
                      accessibilityPref === 'step_free'
                        ? 'bg-blue-50 text-[#2563EB] border-blue-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Step-Free Preference
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCalculateRoute}
                  disabled={routeLoading || !startId || !endId}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {routeLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  <span>{routeLoading ? 'Calculating...' : 'Get Directions'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  title="Reset route & filters"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* 3. Category Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A]">Category Filters</h2>
              <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSample}
                  onChange={(e) => setIncludeSample(e.target.checked)}
                  className="rounded border-slate-300 text-[#2563EB] focus:ring-blue-600"
                />
                <span>Show Sample</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({locations.filter((l) => includeSample || l.verificationStatus !== 'sample').length})
              </button>
              {(Object.keys(CATEGORY_META) as CampusCategory[]).map((catKey) => (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategoryFilter(catKey)}
                  className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer ${
                    categoryFilter === catKey
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {CATEGORY_META[catKey].shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Nearest Facility Finder */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-[#0F172A]">Nearest Facility Finder</h2>
              <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                From {referencePoint.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'food', label: 'Food' },
                  { id: 'medical', label: 'Medical' },
                  { id: 'parking', label: 'Parking' },
                  { id: 'library', label: 'Library' },
                  { id: 'banking', label: 'ATM / Bank' },
                  { id: 'restroom', label: 'Restrooms' },
                ] as { id: FacilityQueryType; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setActiveFacilityType((prev) => (prev === item.id ? null : item.id))
                  }
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-md border cursor-pointer ${
                    activeFacilityType === item.id
                      ? 'bg-blue-50 text-[#2563EB] border-blue-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {activeFacilityType && (
              <div className="pt-2 space-y-1.5">
                {nearestFacilities.length === 0 ? (
                  <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    No standalone public {activeFacilityType} nodes are mapped in OpenStreetMap for
                    LPU yet. Use &ldquo;Sync Live OSM POIs&rdquo; or check inside academic blocks and Uni-Mall.
                  </p>
                ) : (
                  nearestFacilities.map(({ location: loc, distance }) => (
                    <div
                      key={loc.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/70"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectLocation(loc);
                          onEndIdChange(loc.id);
                        }}
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-[#0F172A] truncate">
                          {loc.shortName || loc.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {formatDistance(distance)} away · {VERIFICATION_META[loc.verificationStatus].label}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectLocation(loc);
                          onEndIdChange(loc.id);
                          if (!startId) onStartIdChange('lpu-main-entrance');
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-[#2563EB] hover:bg-blue-50 rounded cursor-pointer shrink-0"
                      >
                        Select
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 5. Favourites & Recent Searches */}
          {(favouriteLocations.length > 0 || recentSearches.length > 0) && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              {favouriteLocations.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-[#0F172A] mb-1.5">Favourite Destinations</h2>
                  <div className="space-y-1">
                    {favouriteLocations.map((loc) => (
                      <div key={loc.id} className="flex items-center justify-between gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectLocation(loc);
                            onEndIdChange(loc.id);
                          }}
                          className="text-left text-slate-700 hover:text-[#2563EB] font-medium truncate cursor-pointer"
                        >
                          {loc.shortName || loc.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleFavourite(loc.id)}
                          className="text-[11px] text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
                          aria-label={`Remove ${loc.name} from favourites`}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recentSearches.length > 0 && (
                <div className={favouriteLocations.length > 0 ? 'pt-2.5 border-t border-slate-100' : ''}>
                  <h2 className="text-xs font-bold text-[#0F172A] mb-1.5">Recent Searches</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.slice(0, 5).map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setSidebarSearch(term)}
                        className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. Emergency Quick Access */}
          <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                <ShieldAlert className="w-4 h-4" />
                <span>Emergency Quick Access</span>
              </div>
              <button
                type="button"
                onClick={onOpenEmergency}
                className="text-[11px] font-semibold text-red-700 hover:underline cursor-pointer"
              >
                All helplines &rarr;
              </button>
            </div>
            <p className="text-[11px] text-red-900/80">
              Uni-Hospital (24×7):{' '}
              <a
                href="tel:01824501227"
                className="inline-flex items-center gap-1 font-mono font-bold underline"
              >
                <Phone className="w-3 h-3" />
                {OFFICIAL_LPU_EMERGENCY_CONTACTS[0].numbers[0]}
              </a>
            </p>
            <button
              type="button"
              onClick={() => {
                const hosp = locations.find((l) => l.id === 'uni-hospital');
                if (hosp) {
                  onSelectLocation(hosp);
                  onEndIdChange(hosp.id);
                  if (!startId) onStartIdChange('lpu-main-entrance');
                }
              }}
              className="w-full py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors cursor-pointer"
            >
              Select Uni-Hospital Destination
            </button>
          </div>
        </aside>

        {/* MAIN AREA: Interactive Leaflet OpenStreetMap + Selected Details + Route Panel */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-4">
          <LeafletCampusMap
            locations={visibleLocations}
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => {
              onSelectLocation(loc);
              onEndIdChange(loc.id);
            }}
            route={route}
            userCoords={userCoords}
            onRequestLocateMe={onRequestLocateMe}
            isLocating={isLocating}
            locationError={locationError}
            onResetMap={handleResetAll}
            nominatimPin={nominatimPin}
          />

          {/* Route Error / Unavailable Fallback */}
          {routeError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <div>
                  <div className="font-bold">Route Unavailable</div>
                  <p className="mt-0.5 leading-relaxed">{routeError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onResetRoute}
                className="text-xs font-semibold text-amber-900 hover:underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* BOTTOM ROUTE PANEL */}
          {route && (
            <section
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
              aria-label="Active Route Summary and Steps"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-[#2563EB]">
                    ACTIVE {route.mode.toUpperCase()} ROUTE · {route.provider}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0F172A] mt-0.5">
                    {route.startLabel} &rarr; {route.endLabel}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onResetRoute}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Route</span>
                </button>
              </div>

              {/* Metrics: Distance & Time (only when supported by OSRM) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] text-slate-500 font-medium">Route Distance</div>
                  <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">
                    {formatDistance(route.distanceMeters)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] text-slate-500 font-medium">Estimated Time</div>
                  <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">
                    {route.durationSeconds !== null
                      ? formatDuration(route.durationSeconds)
                      : 'Not provided'}
                  </div>
                  {route.durationSeconds === null && (
                    <div className="text-[10px] text-slate-500">
                      Backup router omitted walking speed
                    </div>
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] text-slate-500 font-medium">Travel Mode</div>
                  <div className="text-sm font-bold text-[#0F172A] mt-1 capitalize">
                    {route.mode}
                  </div>
                </div>
              </div>

              {/* Accessibility Transparency Notice */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>{route.accessibilityMessage}</span>
              </div>

              {/* Landmark-Based Directions + Step-by-Step OSRM Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#0F172A]">Landmark-Based Summary</h3>
                  <div className="p-3.5 bg-[#EFF6FF] border border-blue-100 rounded-lg text-xs text-[#0F172A] leading-relaxed">
                    {route.landmarkDirections.join(' → ')}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#0F172A]">
                    Mapped Path Steps ({route.steps.length})
                  </h3>
                  <ol className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {route.steps.map((step, i) => (
                      <li
                        key={`${i}-${step.instruction}`}
                        className="flex items-start justify-between gap-2 text-xs text-slate-700 pb-1.5 border-b border-slate-100 last:border-0"
                      >
                        <span>
                          <span className="font-mono text-slate-400 mr-1.5">{i + 1}.</span>
                          {step.instruction}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 shrink-0">
                          {formatDistance(step.distanceMeters)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>
          )}

          {/* Selected Destination Details Card */}
          {selectedLocation && (
            <section
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
              aria-label="Selected Destination Details"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-[#2563EB]">
                      {CATEGORY_META[selectedLocation.category].label}
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        VERIFICATION_META[selectedLocation.verificationStatus].textClass
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {VERIFICATION_META[selectedLocation.verificationStatus].label}
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span className="font-mono">
                      {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#0F172A] mt-1">
                    {selectedLocation.name}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleFavourite(selectedLocation.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        favouriteIds.includes(selectedLocation.id)
                          ? 'fill-red-600 text-red-600'
                          : ''
                      }`}
                    />
                    <span>
                      {favouriteIds.includes(selectedLocation.id) ? 'Saved' : 'Save'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onShareQR(selectedLocation)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Share QR</span>
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedLocation.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="font-semibold text-[#0F172A]">Facilities: </span>
                  <span className="text-slate-600">{selectedLocation.facilities.join(' · ')}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#0F172A]">Source: </span>
                  <span className="text-slate-600">{selectedLocation.source}</span>
                </div>
              </div>

              {selectedLocation.openingHoursVerified && selectedLocation.openingHours && (
                <div className="text-xs font-medium text-emerald-700">
                  Verified Hours: {selectedLocation.openingHours}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onStartIdChange(selectedLocation.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Set as Start</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEndIdChange(selectedLocation.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Set as Destination</span>
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
