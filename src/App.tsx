import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddLocationModal } from './components/AddLocationModal';
import { CampusDemoBar } from './components/CampusDemoBar';
import { EmergencyModal } from './components/EmergencyModal';
import { Navbar } from './components/Navbar';
import { QRShareModal } from './components/QRShareModal';
import initialCampusLocations from './data/campusLocations.json';
import { AboutPage } from './pages/AboutPage';
import { SignInPage, SignUpPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { ExplorePage } from './pages/ExplorePage';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import {
  fetchCampusRoute,
  fetchOverpassPOIs,
  LPU_CENTER,
} from './services/campusMapService';
import {
  AccessibilityPreference,
  AppPage,
  CampusLocation,
  ComputedRoute,
  DemoUser,
  DiscoverMode,
  TravelMode,
} from './types/campus';

const FAVOURITES_KEY = 'lpu_campus_favourites_v1';
const RECENT_KEY = 'lpu_campus_recent_searches_v1';
const CUSTOM_LOCATIONS_KEY = 'lpu_campus_custom_locations_v1';

function readStoredArray<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const baseLocations = initialCampusLocations as CampusLocation[];

  const [customLocations, setCustomLocations] = useState<CampusLocation[]>(() =>
    readStoredArray<CampusLocation>(CUSTOM_LOCATIONS_KEY, [])
  );
  const [overpassLocations, setOverpassLocations] = useState<CampusLocation[]>([]);
  const [overpassStatus, setOverpassStatus] = useState<{
    status: 'idle' | 'loading' | 'live' | 'cached' | 'unavailable';
    message: string;
  }>({ status: 'idle', message: '' });

  const allLocations = useMemo(() => {
    const map = new Map<string, CampusLocation>();
    for (const loc of baseLocations) map.set(loc.id, loc);
    for (const loc of customLocations) map.set(loc.id, loc);
    for (const loc of overpassLocations) map.set(loc.id, loc);
    return Array.from(map.values());
  }, [baseLocations, customLocations, overpassLocations]);

  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [user, setUser] = useState<DemoUser | null>(null);

  // Selected location & Explore state
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(
    () =>
      baseLocations.find((l) => l.id === 'lpu-central-library-block-37') ||
      baseLocations[0] ||
      null
  );
  const [exploreSearch, setExploreSearch] = useState('');
  const [discoverMode, setDiscoverMode] = useState<DiscoverMode>('all');

  // Route planner state
  const [startId, setStartId] = useState<string>('lovely-institute-of-technology');
  const [endId, setEndId] = useState<string>('lpu-central-library-block-37');
  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
  const [accessibilityPref, setAccessibilityPref] =
    useState<AccessibilityPreference>('shortest');
  const [route, setRoute] = useState<ComputedRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Geolocation state (permission-gated)
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Local persistence: favourites & recent searches
  const [favouriteIds, setFavouriteIds] = useState<string[]>(() =>
    readStoredArray<string>(FAVOURITES_KEY, ['lpu-central-library-block-37', 'uni-mall'])
  );
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readStoredArray<string>(RECENT_KEY, [])
  );

  // Feature modals & modes
  const [firstTimeVisitorMode, setFirstTimeVisitorMode] = useState(false);
  const [qrLocation, setQrLocation] = useState<CampusLocation | null>(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [addLocationOpen, setAddLocationOpen] = useState(false);

  // Live Presentation Demo Mode
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Parse deep-linked QR destination on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destId = params.get('dest');
    const view = params.get('view');
    if (destId) {
      const found = allLocations.find((l) => l.id === destId);
      if (found) {
        setSelectedLocation(found);
        setEndId(found.id);
        setCurrentPage(view === 'explore' ? 'explore' : 'map');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favouriteIds));
    } catch {
      // ignore storage errors
    }
  }, [favouriteIds]);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches));
    } catch {
      // ignore storage errors
    }
  }, [recentSearches]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_LOCATIONS_KEY, JSON.stringify(customLocations));
    } catch {
      // ignore storage errors
    }
  }, [customLocations]);

  const handleToggleFavourite = useCallback((id: string) => {
    setFavouriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleRecordSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => [clean, ...prev.filter((t) => t !== clean)].slice(0, 6));
  }, []);

  const handleRequestLocateMe = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        setStartId('user-gps');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            'Location permission was denied. You can choose any campus building as your starting point instead.'
          );
        } else {
          setLocationError(
            'Unable to determine your GPS location right now. Please select a campus starting point manually.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const handleCalculateRoute = useCallback(
    async (overrideStartId?: string, overrideEndId?: string) => {
      const activeStartId = overrideStartId ?? startId;
      const activeEndId = overrideEndId ?? endId;

      if (!activeStartId || !activeEndId) {
        setRouteError('Please select both a starting point and a destination.');
        return;
      }

      const endLoc = allLocations.find((l) => l.id === activeEndId);
      if (!endLoc) {
        setRouteError('Selected destination could not be found.');
        return;
      }

      let startLabel = '';
      let startCoords: [number, number] | null = null;

      if (activeStartId === 'user-gps') {
        if (!userCoords) {
          setRouteError(
            'Please grant location permission first or select a campus landmark as your starting point.'
          );
          return;
        }
        startLabel = 'Your GPS Location';
        startCoords = userCoords;
      } else {
        const startLoc = allLocations.find((l) => l.id === activeStartId);
        if (!startLoc) {
          setRouteError('Selected starting point could not be found.');
          return;
        }
        startLabel = startLoc.shortName || startLoc.name;
        startCoords = [startLoc.latitude, startLoc.longitude];
      }

      setRouteLoading(true);
      setRouteError(null);

      const res = await fetchCampusRoute({
        startId: activeStartId,
        startLabel,
        startCoords,
        endId: endLoc.id,
        endLabel: endLoc.shortName || endLoc.name,
        endCoords: [endLoc.latitude, endLoc.longitude],
        mode: travelMode,
        accessibilityPreference: accessibilityPref,
      });

      setRouteLoading(false);
      if (res.route) {
        setRoute(res.route);
        setSelectedLocation(endLoc);
      } else {
        setRoute(null);
        setRouteError(res.error || 'Could not compute a route between these locations.');
      }
    },
    [startId, endId, allLocations, userCoords, travelMode, accessibilityPref]
  );

  const handleResetRoute = useCallback(() => {
    setRoute(null);
    setRouteError(null);
  }, []);

  const handleSyncOverpass = useCallback(async () => {
    setOverpassStatus({
      status: 'loading',
      message: 'Querying OpenStreetMap Overpass API for LPU Phagwara points of interest...',
    });
    const existingOsmIds = new Set(
      baseLocations.map((l) => l.osmId).filter((id): id is string => Boolean(id))
    );
    const result = await fetchOverpassPOIs(existingOsmIds);
    setOverpassLocations(result.locations);
    setOverpassStatus({ status: result.status, message: result.message });
  }, [baseLocations]);

  const handleOpenOnMap = useCallback(
    (loc: CampusLocation, startDirections = false) => {
      setSelectedLocation(loc);
      setEndId(loc.id);
      setCurrentPage('map');
      if (startDirections) {
        const fallbackStart =
          startId && startId !== loc.id
            ? startId
            : loc.id === 'lpu-main-entrance'
            ? 'lpu-central-library-block-37'
            : 'lpu-main-entrance';
        setStartId(fallbackStart);
        void handleCalculateRoute(fallbackStart, loc.id);
      } else {
        setRoute(null);
        setRouteError(null);
      }
    },
    [startId, handleCalculateRoute]
  );

  const handleAddCustomLocation = useCallback((loc: CampusLocation) => {
    setCustomLocations((prev) => [...prev, loc]);
    setSelectedLocation(loc);
    setEndId(loc.id);
  }, []);

  // 9-Step Live Presentation Demo Runner
  const runDemoStep = useCallback(
    (stepIndex: number) => {
      setDemoOpen(true);
      setDemoStep(stepIndex);

      const block37 = allLocations.find((l) => l.id === 'lpu-central-library-block-37');
      const lit = allLocations.find((l) => l.id === 'lovely-institute-of-technology');

      if (stepIndex === 0) {
        setQrLocation(null);
        setCurrentPage('home');
      } else if (stepIndex === 1) {
        setQrLocation(null);
        setDiscoverMode('all');
        setExploreSearch('Central Library');
        setCurrentPage('explore');
      } else if (stepIndex === 2) {
        setQrLocation(null);
        setExploreSearch('Central Library');
        if (block37) setSelectedLocation(block37);
        setCurrentPage('explore');
      } else if (stepIndex === 3) {
        setQrLocation(null);
        setRoute(null);
        setRouteError(null);
        if (block37) {
          setSelectedLocation(block37);
          setEndId(block37.id);
        }
        setCurrentPage('map');
      } else if (stepIndex === 4) {
        setQrLocation(null);
        if (lit) setStartId(lit.id);
        if (block37) {
          setSelectedLocation(block37);
          setEndId(block37.id);
        }
        setTravelMode('walking');
        setCurrentPage('map');
      } else if (stepIndex === 5) {
        setQrLocation(null);
        setCurrentPage('map');
        const sId = lit ? lit.id : 'lovely-institute-of-technology';
        const eId = block37 ? block37.id : 'lpu-central-library-block-37';
        setStartId(sId);
        setEndId(eId);
        void handleCalculateRoute(sId, eId);
      } else if (stepIndex === 6) {
        setQrLocation(null);
        setExploreSearch('');
        setDiscoverMode('study');
        setCurrentPage('explore');
      } else if (stepIndex === 7) {
        setQrLocation(null);
        setExploreSearch('');
        setDiscoverMode((prev) => (prev === 'food' ? 'sports' : 'food'));
        setCurrentPage('explore');
      } else if (stepIndex === 8) {
        if (block37) {
          setSelectedLocation(block37);
          setQrLocation(block37);
        }
      }
    },
    [allLocations, handleCalculateRoute]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        user={user}
        onSignOut={() => {
          setUser(null);
          setCurrentPage('home');
        }}
      />

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            locations={allLocations}
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => {
              setSelectedLocation(loc);
              setEndId(loc.id);
            }}
            onNavigate={setCurrentPage}
            onStartDemo={() => runDemoStep(0)}
            onOpenEmergency={() => setEmergencyOpen(true)}
            onOpenFirstTimeVisitor={() => {
              setFirstTimeVisitorMode(true);
              setCurrentPage('map');
            }}
            onOpenDiscoverMode={() => {
              setDiscoverMode('study');
              setExploreSearch('');
              setCurrentPage('explore');
            }}
          />
        )}

        {currentPage === 'signin' && (
          <SignInPage onSignIn={setUser} onNavigate={setCurrentPage} />
        )}

        {currentPage === 'signup' && (
          <SignUpPage onSignIn={setUser} onNavigate={setCurrentPage} />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            user={user}
            locations={allLocations}
            favouriteIds={favouriteIds}
            recentSearches={recentSearches}
            onSelectForMap={(loc) => handleOpenOnMap(loc, false)}
            onNavigate={setCurrentPage}
            onToggleFavourite={handleToggleFavourite}
            onRecordSearch={handleRecordSearch}
            onStartDemo={() => runDemoStep(0)}
            onOpenEmergency={() => setEmergencyOpen(true)}
            onOpenFirstTimeVisitor={() => {
              setFirstTimeVisitorMode(true);
              setCurrentPage('map');
            }}
            onOpenDiscoverMode={() => {
              setDiscoverMode('study');
              setCurrentPage('explore');
            }}
          />
        )}

        {currentPage === 'explore' && (
          <ExplorePage
            locations={allLocations}
            searchQuery={exploreSearch}
            onSearchQueryChange={setExploreSearch}
            discoverMode={discoverMode}
            onDiscoverModeChange={setDiscoverMode}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            onOpenOnMap={handleOpenOnMap}
            favouriteIds={favouriteIds}
            onToggleFavourite={handleToggleFavourite}
            onShareQR={(loc) => setQrLocation(loc)}
            onOpenAddLocation={() => setAddLocationOpen(true)}
          />
        )}

        {currentPage === 'map' && (
          <MapPage
            locations={allLocations}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            startId={startId}
            onStartIdChange={setStartId}
            endId={endId}
            onEndIdChange={setEndId}
            travelMode={travelMode}
            onTravelModeChange={setTravelMode}
            accessibilityPref={accessibilityPref}
            onAccessibilityPrefChange={setAccessibilityPref}
            route={route}
            routeLoading={routeLoading}
            routeError={routeError}
            onCalculateRoute={() => void handleCalculateRoute()}
            onResetRoute={handleResetRoute}
            userCoords={userCoords}
            isLocating={isLocating}
            locationError={locationError}
            onRequestLocateMe={handleRequestLocateMe}
            favouriteIds={favouriteIds}
            onToggleFavourite={handleToggleFavourite}
            recentSearches={recentSearches}
            onRecordSearch={handleRecordSearch}
            onShareQR={(loc) => setQrLocation(loc)}
            firstTimeVisitorMode={firstTimeVisitorMode}
            onToggleFirstTimeVisitor={() => setFirstTimeVisitorMode((prev) => !prev)}
            overpassStatus={overpassStatus}
            onSyncOverpass={() => void handleSyncOverpass()}
            onOpenEmergency={() => setEmergencyOpen(true)}
            onOpenAddLocation={() => setAddLocationOpen(true)}
            onStartDemo={() => runDemoStep(0)}
          />
        )}

        {currentPage === 'about' && <AboutPage />}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Campus Navigator · Lovely Professional University, Phagwara, Punjab · WS Section
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setEmergencyOpen(true)}
              className="text-red-700 font-semibold hover:underline cursor-pointer"
            >
              Uni-Hospital &amp; Helplines
            </button>
            <button
              type="button"
              onClick={() => runDemoStep(0)}
              className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
            >
              Try Campus Demo
            </button>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-800"
            >
              &copy; OpenStreetMap contributors
            </a>
          </div>
        </div>
      </footer>

      {/* Global Interactive Modals & Presenter Demo */}
      <QRShareModal location={qrLocation} onClose={() => setQrLocation(null)} />

      <EmergencyModal
        isOpen={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        onRouteToHospital={() => {
          const hosp = allLocations.find((l) => l.id === 'uni-hospital');
          if (hosp) handleOpenOnMap(hosp, true);
        }}
      />

      <AddLocationModal
        isOpen={addLocationOpen}
        onClose={() => setAddLocationOpen(false)}
        onAddLocation={handleAddCustomLocation}
        allLocations={allLocations}
        defaultCoords={
          selectedLocation
            ? [selectedLocation.latitude, selectedLocation.longitude]
            : LPU_CENTER
        }
      />

      <CampusDemoBar
        isOpen={demoOpen}
        currentStepIndex={demoStep}
        onRunStep={runDemoStep}
        onClose={() => setDemoOpen(false)}
      />
    </div>
  );
}
