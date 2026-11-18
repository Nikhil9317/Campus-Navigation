import L from 'leaflet';
import {
  Crosshair,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LPU_CENTER, OSM_TILE_URL } from '../services/campusMapService';
import { CampusLocation, ComputedRoute } from '../types/campus';
import { CATEGORY_META, VERIFICATION_META } from '../utils/campusHelpers';

interface LeafletCampusMapProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  onSelectLocation: (loc: CampusLocation) => void;
  route: ComputedRoute | null;
  userCoords: [number, number] | null;
  onRequestLocateMe: () => void;
  isLocating?: boolean;
  locationError?: string | null;
  onResetMap: () => void;
  compact?: boolean;
  nominatimPin?: { lat: number; lon: number; label: string } | null;
  highlightedIds?: Set<string>;
}

function buildMarkerIcon(
  loc: CampusLocation,
  isSelected: boolean,
  isStart: boolean,
  isEnd: boolean,
  isHighlighted: boolean
): L.DivIcon {
  const cat = CATEGORY_META[loc.category];
  const isSample = loc.verificationStatus === 'sample';
  const fill = isStart ? '#16A34A' : isEnd ? '#2563EB' : isSample ? '#64748B' : cat.colorHex;
  const size = isSelected || isStart || isEnd ? 34 : isHighlighted ? 30 : 26;

  // Distinct geometric shapes by category so markers remain distinguishable without color alone
  let shapeSvg = '';
  if (isStart || isEnd) {
    const label = isStart ? 'S' : 'D';
    shapeSvg = `
      <svg width="${size}" height="${size + 8}" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 2C9.163 2 2 9.163 2 18C2 28.5 18 42 18 42C18 42 34 28.5 34 18C34 9.163 26.837 2 18 2Z" fill="${fill}" stroke="#FFFFFF" stroke-width="2.5"/>
        <text x="18" y="22" text-anchor="middle" fill="#FFFFFF" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="700">${label}</text>
      </svg>
    `;
    return L.divIcon({
      className: 'lpu-custom-marker',
      html: shapeSvg,
      iconSize: [size, size + 8],
      iconAnchor: [size / 2, size + 6],
      popupAnchor: [0, -(size + 4)],
    });
  }

  const ring = isSelected
    ? `<circle cx="16" cy="16" r="15" stroke="#2563EB" stroke-width="2.5" fill="rgba(37, 99, 235, 0.14)"/>`
    : '';

  const strokeDash = isSample ? 'stroke-dasharray="3 2"' : '';

  if (loc.category === 'academic') {
    shapeSvg = `
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
        ${ring}
        <circle cx="16" cy="16" r="10.5" fill="${fill}" stroke="#FFFFFF" stroke-width="2" ${strokeDash}/>
        <path d="M11 13.5L16 11L21 13.5L16 16L11 13.5Z" fill="#FFFFFF"/>
        <path d="M12.5 15.5V19C12.5 19 14 20.5 16 20.5C18 20.5 19.5 19 19.5 19V15.5" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    `;
  } else if (loc.category === 'student_facilities') {
    shapeSvg = `
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
        ${ring}
        <rect x="6" y="6" width="20" height="20" rx="5" fill="${fill}" stroke="#FFFFFF" stroke-width="2" ${strokeDash}/>
        <circle cx="16" cy="16" r="4.2" stroke="#FFFFFF" stroke-width="1.6"/>
      </svg>
    `;
  } else if (loc.category === 'food_shopping') {
    shapeSvg = `
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
        ${ring}
        <path d="M16 4.5L27.5 16L16 27.5L4.5 16L16 4.5Z" fill="${fill}" stroke="#FFFFFF" stroke-width="2" ${strokeDash}/>
        <circle cx="16" cy="16" r="2.8" fill="#FFFFFF"/>
      </svg>
    `;
  } else if (loc.category === 'residential') {
    shapeSvg = `
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
        ${ring}
        <circle cx="16" cy="16" r="10.5" fill="${fill}" stroke="#FFFFFF" stroke-width="2" ${strokeDash}/>
        <path d="M11.5 16.5L16 12.2L20.5 16.5V20.5H17.5V17.5H14.5V20.5H11.5V16.5Z" fill="#FFFFFF"/>
      </svg>
    `;
  } else {
    shapeSvg = `
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
        ${ring}
        <rect x="6.5" y="6.5" width="19" height="19" rx="9.5" fill="${fill}" stroke="#FFFFFF" stroke-width="2" ${strokeDash}/>
        <rect x="13" y="13" width="6" height="6" rx="1" fill="#FFFFFF"/>
      </svg>
    `;
  }

  return L.divIcon({
    className: 'lpu-custom-marker',
    html: shapeSvg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function LeafletCampusMap({
  locations,
  selectedLocation,
  onSelectLocation,
  route,
  userCoords,
  onRequestLocateMe,
  isLocating = false,
  locationError = null,
  onResetMap,
  compact = false,
  nominatimPin = null,
  highlightedIds,
}: LeafletCampusMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const userLayerRef = useRef<L.LayerGroup | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegend, setShowLegend] = useState(!compact);
  const [tileError, setTileError] = useState(false);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapHostRef.current || mapRef.current) return;

    const map = L.map(mapHostRef.current, {
      center: LPU_CENTER,
      zoom: compact ? 15 : 16,
      zoomControl: false,
      attributionControl: true,
    });

    const tileLayer = L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    });

    let failedTiles = 0;
    tileLayer.on('tileerror', () => {
      failedTiles += 1;
      if (failedTiles >= 3) {
        setTileError(true);
      }
    });
    tileLayer.on('tileload', () => {
      setTileError(false);
    });

    tileLayer.addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      routeLayerRef.current = null;
      userLayerRef.current = null;
    };
  }, [compact]);

  // Sync fullscreen escape / native listener
  useEffect(() => {
    const handleFsChange = () => {
      const fsEl = document.fullscreenElement;
      if (!fsEl && isFullscreen) {
        // Keep CSS fallback if user didn't press native exit, otherwise sync
      }
      window.setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 150);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [isFullscreen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [isFullscreen, compact]);

  // Render destination markers
  useEffect(() => {
    const layer = markersLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();

    locations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const isStart = route?.startId === loc.id;
      const isEnd = route?.endId === loc.id;
      const isHighlighted = highlightedIds ? highlightedIds.has(loc.id) : false;

      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: buildMarkerIcon(loc, isSelected, isStart, isEnd, isHighlighted),
        zIndexOffset: isSelected || isStart || isEnd ? 600 : isHighlighted ? 300 : 100,
      });

      const catMeta = CATEGORY_META[loc.category];
      const verMeta = VERIFICATION_META[loc.verificationStatus];

      const popupEl = document.createElement('div');
      popupEl.className = 'min-w-[210px] max-w-[260px]';
      popupEl.innerHTML = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="font-size: 11px; font-weight: 600; color: ${catMeta.colorHex};">
            ${catMeta.shortLabel} · ${verMeta.label}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-top: 2px;">
            ${loc.name.replace(/</g, '&lt;')}
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">
            ${loc.description.slice(0, 95).replace(/</g, '&lt;')}${loc.description.length > 95 ? '...' : ''}
          </div>
          <div style="font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #64748B; margin-top: 6px;">
            ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}
          </div>
        </div>
      `;

      marker.bindPopup(popupEl);
      marker.on('click', () => {
        onSelectLocation(loc);
      });

      marker.addTo(layer);
    });

    if (nominatimPin) {
      const pinMarker = L.circleMarker([nominatimPin.lat, nominatimPin.lon], {
        radius: 8,
        color: '#0F172A',
        weight: 2,
        fillColor: '#38BDF8',
        fillOpacity: 0.9,
      });
      pinMarker.bindPopup(
        `<div style="font-size:12px;font-weight:600;color:#0F172A;">${nominatimPin.label.replace(/</g, '&lt;')}</div><div style="font-size:11px;color:#64748B;">Nominatim Place Match</div>`
      );
      pinMarker.addTo(layer);
    }
  }, [locations, selectedLocation, route, nominatimPin, highlightedIds, onSelectLocation]);

  // Center map on selectedLocation when changed (if no active route overrides bounds)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation || route) return;
    map.flyTo([selectedLocation.latitude, selectedLocation.longitude], Math.max(map.getZoom(), 17), {
      duration: 0.5,
    });
  }, [selectedLocation, route]);

  // Center on Nominatim pin when searched
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !nominatimPin) return;
    map.flyTo([nominatimPin.lat, nominatimPin.lon], 16, { duration: 0.5 });
  }, [nominatimPin]);

  // Render active OSRM route polyline + start/end markers if custom GPS start
  useEffect(() => {
    const layer = routeLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();
    if (!route || route.geometry.length === 0) return;

    // Outer casing for crisp contrast on OSM map tiles
    L.polyline(route.geometry, {
      color: '#1E3A8A',
      weight: 7,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layer);

    const routeLine = L.polyline(route.geometry, {
      color: '#2563EB',
      weight: 4.5,
      opacity: 0.95,
      dashArray: route.mode === 'walking' ? '8 6' : undefined,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layer);

    if (route.startId === 'user-gps') {
      const gpsStart = L.marker(route.startCoords, {
        icon: L.divIcon({
          className: 'lpu-custom-marker',
          html: `<svg width="32" height="40" viewBox="0 0 36 44"><path d="M18 2C9.163 2 2 9.163 2 18C2 28.5 18 42 18 42C18 42 34 28.5 34 18C34 9.163 26.837 2 18 2Z" fill="#16A34A" stroke="#FFF" stroke-width="2.5"/><text x="18" y="22" text-anchor="middle" fill="#FFF" font-size="13" font-weight="700">S</text></svg>`,
          iconSize: [32, 40],
          iconAnchor: [16, 38],
        }),
      });
      gpsStart.bindPopup('<strong>Your Current Location</strong>');
      gpsStart.addTo(layer);
    }

    map.fitBounds(routeLine.getBounds(), {
      padding: [48, 48],
      maxZoom: 18,
    });
  }, [route]);

  // Render user GPS marker ONLY after user granted permission
  useEffect(() => {
    const layer = userLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!userCoords) return;

    L.circle(userCoords, {
      radius: 30,
      color: '#2563EB',
      weight: 1,
      fillColor: '#2563EB',
      fillOpacity: 0.15,
    }).addTo(layer);

    L.circleMarker(userCoords, {
      radius: 7,
      color: '#FFFFFF',
      weight: 2.5,
      fillColor: '#2563EB',
      fillOpacity: 1,
    })
      .bindPopup('Your Current GPS Location')
      .addTo(layer);
  }, [userCoords]);

  const handleToggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        if (containerRef.current && containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } catch {
        // CSS fixed fullscreen fallback still activates
      }
      setIsFullscreen(true);
    } else {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch {
        // ignore
      }
      setIsFullscreen(false);
    }
  };

  const handleReset = () => {
    onResetMap();
    mapRef.current?.flyTo(LPU_CENTER, compact ? 15 : 16, { duration: 0.45 });
  };

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[1100] bg-slate-100 flex flex-col'
          : `relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${
              compact ? 'h-[340px] sm:h-[380px]' : 'h-[440px] sm:h-[540px] lg:h-[620px]'
            }`
      }
    >
      {/* Leaflet Canvas */}
      <div ref={mapHostRef} className="w-full h-full" />

      {/* OSM Tile Failure Notice (Honest degradation) */}
      {tileError && (
        <div className="absolute top-3 left-3 right-16 z-[500] bg-white/95 border border-amber-300 text-amber-900 px-3 py-2 rounded-lg text-xs shadow-sm">
          OpenStreetMap tiles are temporarily slow or unreachable. Campus markers and coordinates remain interactive below.
        </div>
      )}

      {/* Location permission error notice */}
      {locationError && (
        <div className="absolute bottom-14 left-3 right-3 sm:right-auto sm:max-w-sm z-[500] bg-white/95 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs shadow-sm">
          {locationError}
        </div>
      )}

      {/* Right Map Controls */}
      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] border-b border-slate-100 cursor-pointer"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {!compact && (
          <>
            <button
              type="button"
              onClick={onRequestLocateMe}
              disabled={isLocating}
              className="w-9 h-9 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] cursor-pointer disabled:opacity-50"
              title="Locate me (requires browser permission)"
              aria-label="Locate me"
            >
              <Crosshair className={`w-4 h-4 ${userCoords ? 'text-[#2563EB]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="w-9 h-9 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] cursor-pointer"
              title={isFullscreen ? 'Exit full screen' : 'Full-screen map'}
              aria-label={isFullscreen ? 'Exit full screen' : 'Full-screen map'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="w-9 h-9 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] cursor-pointer"
          title="Reset map view to LPU Phagwara"
          aria-label="Reset map"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowLegend((prev) => !prev)}
          className={`w-9 h-9 border rounded-lg shadow-sm flex items-center justify-center cursor-pointer ${
            showLegend
              ? 'bg-[#0F172A] border-[#0F172A] text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          title="Toggle map legend"
          aria-label="Toggle map legend"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Visible Map Legend */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-[500] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-2.5 shadow-sm max-w-[250px]">
          <div className="text-[11px] font-bold text-[#0F172A] mb-1.5">LPU Campus Legend</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <span className="truncate">Academic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 shrink-0" />
              <span className="truncate">Facilities</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rotate-45 bg-amber-600 shrink-0" />
              <span className="truncate">Food & Mall</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
              <span className="truncate">Residential</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0" />
              <span className="truncate">Admin & Gate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-blue-600 shrink-0" />
              <span className="truncate">Mapped Route</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
