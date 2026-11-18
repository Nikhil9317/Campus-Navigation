import {
  AccessibilityPreference,
  CampusCategory,
  CampusLocation,
  ComputedRoute,
  DiscoverMode,
  RouteStep,
  TravelMode,
} from '../types/campus';

export const LPU_CENTER: [number, number] = [31.253313, 75.703277];
export const LPU_BOUNDS: [[number, number], [number, number]] = [
  [31.2445, 75.6960],
  [31.2615, 75.7125],
];

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;

const OSM_TILE_URL =
  env?.VITE_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OVERPASS_PRIMARY =
  env?.VITE_OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';
const OVERPASS_FALLBACK = 'https://overpass.kumi.systems/api/interpreter';
const NOMINATIM_URL =
  env?.VITE_NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org';
const OSRM_FOOT_URL =
  env?.VITE_OSRM_FOOT_API_URL || 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';
const OSRM_DRIVE_URL =
  env?.VITE_OSRM_DRIVE_API_URL || 'https://router.project-osrm.org/route/v1/driving';

export { OSM_TILE_URL };

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) {
    return `${mins} min`;
  }
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}

function classifyOsmElement(tags: Record<string, string>): {
  category: CampusCategory;
  subCategory: string;
  discoverModes: DiscoverMode[];
  nearbyFacilityType?: CampusLocation['nearbyFacilityType'];
} {
  const amenity = tags.amenity || '';
  const leisure = tags.leisure || '';
  const sport = tags.sport || '';
  const office = tags.office || '';
  const building = tags.building || '';

  if (amenity === 'toilets') {
    return {
      category: 'admin_services',
      subCategory: 'Restroom Facility',
      discoverModes: ['essentials'],
      nearbyFacilityType: 'restroom',
    };
  }
  if (amenity === 'bank' || amenity === 'atm') {
    return {
      category: 'admin_services',
      subCategory: 'Banking & ATM',
      discoverModes: ['essentials'],
      nearbyFacilityType: 'banking',
    };
  }
  if (amenity === 'parking' || amenity === 'parking_space') {
    return {
      category: 'admin_services',
      subCategory: 'Parking Area',
      discoverModes: ['essentials'],
      nearbyFacilityType: 'parking',
    };
  }
  if (amenity === 'hospital' || amenity === 'clinic' || amenity === 'pharmacy') {
    return {
      category: 'student_facilities',
      subCategory: 'Medical Facility',
      discoverModes: ['essentials'],
      nearbyFacilityType: 'medical',
    };
  }
  if (amenity === 'library') {
    return {
      category: 'academic',
      subCategory: 'Library',
      discoverModes: ['study'],
      nearbyFacilityType: 'library',
    };
  }
  if (amenity === 'restaurant' || amenity === 'cafe' || amenity === 'fast_food' || tags.shop === 'bakery') {
    return {
      category: 'food_shopping',
      subCategory: amenity ? amenity.replace(/_/g, ' ') : 'Dining & Cafe',
      discoverModes: ['food'],
      nearbyFacilityType: 'food',
    };
  }
  if (leisure === 'sports_centre' || leisure === 'pitch' || sport) {
    return {
      category: 'student_facilities',
      subCategory: sport ? `${sport.replace(/_/g, ' ')} Facility` : 'Sports Facility',
      discoverModes: ['sports', 'student_life'],
    };
  }
  if (tags.tourism === 'hostel') {
    return {
      category: 'residential',
      subCategory: 'Hostel / Residence',
      discoverModes: ['student_life'],
    };
  }
  if (office || building || amenity === 'university') {
    return {
      category: 'academic',
      subCategory: 'Academic / Campus Building',
      discoverModes: ['study'],
    };
  }
  return {
    category: 'admin_services',
    subCategory: 'Campus Point of Interest',
    discoverModes: ['essentials'],
  };
}

export interface OverpassSyncResult {
  locations: CampusLocation[];
  status: 'live' | 'cached' | 'unavailable';
  message: string;
}

const OVERPASS_CACHE_KEY = 'lpu_overpass_pois_v1';

export async function fetchOverpassPOIs(
  existingOsmIds: Set<string>
): Promise<OverpassSyncResult> {
  try {
    const cachedRaw = sessionStorage.getItem(OVERPASS_CACHE_KEY);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw) as { timestamp: number; locations: CampusLocation[] };
      if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
        return {
          locations: parsed.locations.filter((l) => !existingOsmIds.has(l.osmId || '')),
          status: 'cached',
          message: `Showing ${parsed.locations.length} live OpenStreetMap campus features (cached from Overpass).`,
        };
      }
    }
  } catch {
    // ignore storage errors
  }

  const query = `
    [out:json][timeout:12];
    (
      node(31.2455,75.6975,31.2610,75.7120)["amenity"];
      way(31.2455,75.6975,31.2610,75.7120)["amenity"];
      way(31.2455,75.6975,31.2610,75.7120)["leisure"="pitch"];
      way(31.2455,75.6975,31.2610,75.7120)["leisure"="sports_centre"];
      way(31.2455,75.6975,31.2610,75.7120)["building"]["name"];
    );
    out center;
  `;

  const endpoints = [OVERPASS_PRIMARY, OVERPASS_FALLBACK];

  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const elements = Array.isArray(data?.elements) ? data.elements : [];
      const mapped: CampusLocation[] = [];

      for (const el of elements) {
        const tags: Record<string, string> = el.tags || {};
        const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat;
        const lon = typeof el.lon === 'number' ? el.lon : el.center?.lon;
        if (typeof lat !== 'number' || typeof lon !== 'number') continue;

        // Skip generic unnamed campus polygons or parking spaces without useful info
        if (tags.amenity === 'university' && !tags.name) continue;
        if (tags.tourism === 'apartment' || tags.building === 'apartments') continue;
        if (!tags.name && tags.amenity !== 'toilets' && tags.amenity !== 'parking' && tags.amenity !== 'atm') {
          continue;
        }

        const osmId = `${el.type}/${el.id}`;
        const classification = classifyOsmElement(tags);
        const displayName =
          tags.name ||
          (tags.amenity === 'toilets'
            ? 'Mapped Campus Restroom'
            : tags.amenity === 'parking'
            ? `Campus Parking${tags.capacity ? ` (${tags.capacity} cap.)` : ''}`
            : tags.amenity === 'atm'
            ? 'Campus ATM'
            : 'OpenStreetMap Campus Point');

        const facilities: string[] = [];
        if (tags['building:levels']) facilities.push(`${tags['building:levels']} Levels`);
        if (tags.sport) facilities.push(`Sport: ${tags.sport}`);
        if (tags.surface) facilities.push(`Surface: ${tags.surface}`);
        if (tags.capacity) facilities.push(`Capacity: ${tags.capacity}`);
        if (tags.wheelchair) facilities.push(`Wheelchair: ${tags.wheelchair}`);
        if (facilities.length === 0) facilities.push('OpenStreetMap Mapped POI');

        mapped.push({
          id: `osm-${el.type}-${el.id}`,
          name: displayName,
          shortName: displayName,
          category: classification.category,
          subCategory: classification.subCategory,
          description: `Live point of interest retrieved from OpenStreetMap (${osmId}).`,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lon.toFixed(6)),
          verificationStatus: 'verified',
          source: `Live OpenStreetMap Overpass API (${osmId})`,
          osmId,
          facilities,
          openingHoursVerified: false,
          keywords: [displayName.toLowerCase(), tags.amenity || '', tags.sport || ''].filter(Boolean),
          discoverModes: classification.discoverModes,
          nearbyFacilityType: classification.nearbyFacilityType,
        });
      }

      try {
        sessionStorage.setItem(
          OVERPASS_CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), locations: mapped })
        );
      } catch {
        // ignore storage quota errors
      }

      return {
        locations: mapped.filter((l) => !existingOsmIds.has(l.osmId || '')),
        status: 'live',
        message: `Synced ${mapped.length} OpenStreetMap features around LPU Phagwara. Some campus blocks are not yet individually tagged in OSM and remain marked Approximate in our local dataset.`,
      };
    } catch {
      clearTimeout(timer);
    }
  }

  return {
    locations: [],
    status: 'unavailable',
    message:
      'Live Overpass API is temporarily busy or rate-limited. Displaying verified & approximate locations from campusLocations.json.',
  };
}

export interface NominatimResult {
  placeId: string;
  displayName: string;
  shortName: string;
  lat: number;
  lon: number;
  type: string;
}

export async function searchNominatimPlaces(query: string): Promise<{
  results: NominatimResult[];
  error?: string;
}> {
  if (!query.trim()) return { results: [] };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const params = new URLSearchParams({
      q: `${query.trim()}, Phagwara, Punjab, India`,
      format: 'json',
      limit: '5',
      viewbox: '75.680,31.270,75.730,31.230',
    });
    const res = await fetch(`${NOMINATIM_URL}/search?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return {
        results: [],
        error: `Nominatim place search returned status ${res.status}. Showing local campus directory matches instead.`,
      };
    }
    const raw = await res.json();
    const results: NominatimResult[] = (Array.isArray(raw) ? raw : []).map((item: any) => ({
      placeId: String(item.place_id),
      displayName: String(item.display_name || ''),
      shortName: String(item.name || item.display_name?.split(',')[0] || 'Place'),
      lat: Number(item.lat),
      lon: Number(item.lon),
      type: String(item.type || item.class || 'place'),
    }));
    return { results };
  } catch {
    clearTimeout(timer);
    return {
      results: [],
      error: 'Nominatim place search is temporarily unavailable. Using local LPU campus dataset.',
    };
  }
}

function formatManeuverInstruction(step: any): string {
  const type = step.maneuver?.type || '';
  const mod = step.maneuver?.modifier ? ` ${step.maneuver.modifier}` : '';
  const roadName = step.name && step.name.trim().length > 0 ? ` onto ${step.name}` : ' along mapped campus path';

  if (type === 'depart') {
    return step.name ? `Start along ${step.name}` : 'Start along the mapped campus path';
  }
  if (type === 'arrive') {
    return 'Arrive at your destination area';
  }
  if (type === 'turn' || type === 'end of road') {
    return `Turn${mod}${roadName}`;
  }
  if (type === 'continue' || type === 'new name') {
    return `Continue${mod}${roadName}`;
  }
  if (type === 'roundabout' || type === 'rotary') {
    return `Take the roundabout${roadName}`;
  }
  if (type === 'fork') {
    return `Keep${mod} at fork${roadName}`;
  }
  return `Follow mapped path${roadName}`;
}

function buildLandmarkDirections(
  startLabel: string,
  endLabel: string,
  steps: RouteStep[]
): string[] {
  const namedRoads = Array.from(
    new Set(
      steps
        .map((s) => s.roadName?.trim())
        .filter((r): r is string => Boolean(r && r.length > 0))
    )
  );

  if (namedRoads.length > 0) {
    const roadSummary = namedRoads.slice(0, 3).join(' → ');
    return [
      `Start from ${startLabel}`,
      `Follow mapped route via ${roadSummary}`,
      `Reach ${endLabel}`,
    ];
  }

  return [
    `Start from ${startLabel}`,
    'Follow the mapped OpenStreetMap campus path',
    `Reach ${endLabel}`,
  ];
}

export async function fetchCampusRoute(params: {
  startId: string;
  startLabel: string;
  startCoords: [number, number];
  endId: string;
  endLabel: string;
  endCoords: [number, number];
  mode: TravelMode;
  accessibilityPreference: AccessibilityPreference;
}): Promise<{ route: ComputedRoute | null; error?: string }> {
  const { startCoords, endCoords, mode, accessibilityPreference } = params;

  if (
    Math.abs(startCoords[0] - endCoords[0]) < 0.00005 &&
    Math.abs(startCoords[1] - endCoords[1]) < 0.00005
  ) {
    return {
      route: null,
      error: 'Start and destination are at the same location. Please choose two different points.',
    };
  }

  const coordPair = `${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}`;
  const query = `?overview=full&geometries=geojson&steps=true`;

  const candidates =
    mode === 'walking'
      ? [
          {
            url: `${OSRM_FOOT_URL}/${coordPair}${query}`,
            provider: 'OpenStreetMap Foot Router (OSRM)',
            trustDuration: true,
          },
          {
            url: `https://router.project-osrm.org/route/v1/foot/${coordPair}${query}`,
            provider: 'OSRM Public Backup Router',
            // Note: router.project-osrm.org demo server returns car-speed duration even on /foot/, so omit duration rather than showing fabricated walking time
            trustDuration: false,
          },
        ]
      : [
          {
            url: `${OSRM_DRIVE_URL}/${coordPair}${query}`,
            provider: 'OSRM Driving Router',
            trustDuration: true,
          },
        ];

  for (const candidate of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const res = await fetch(candidate.url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;

      const data = await res.json();
      if (data?.code !== 'Ok' || !Array.isArray(data?.routes) || data.routes.length === 0) {
        continue;
      }

      const best = data.routes[0];
      const rawCoords: [number, number][] = best.geometry?.coordinates || [];
      if (rawCoords.length === 0) continue;

      const geometry: [number, number][] = rawCoords.map(([lon, lat]) => [lat, lon]);
      const rawSteps = best.legs?.[0]?.steps || [];
      const steps: RouteStep[] = rawSteps.map((s: any) => ({
        instruction: formatManeuverInstruction(s),
        distanceMeters: Number(s.distance || 0),
        durationSeconds: candidate.trustDuration ? Number(s.duration || 0) : undefined,
        roadName: s.name || undefined,
        maneuverType: s.maneuver?.type,
        maneuverModifier: s.maneuver?.modifier,
      }));

      const landmarkDirections = buildLandmarkDirections(
        params.startLabel,
        params.endLabel,
        steps
      );

      const accessibilityMessage =
        accessibilityPreference === 'step_free'
          ? 'Not verified for step-free accessibility: OpenStreetMap data for LPU internal walkways currently lacks complete wheelchair, curb-ramp, and step-count tags.'
          : 'Standard mapped path route. Accessibility attributes (steps/ramps) have not been verified in OpenStreetMap.';

      return {
        route: {
          startId: params.startId,
          startLabel: params.startLabel,
          startCoords,
          endId: params.endId,
          endLabel: params.endLabel,
          endCoords,
          mode,
          distanceMeters: Number(best.distance || 0),
          durationSeconds:
            candidate.trustDuration && typeof best.duration === 'number'
              ? Number(best.duration)
              : null,
          geometry,
          steps,
          landmarkDirections,
          accessibilityVerified: false,
          accessibilityMessage,
          provider: candidate.provider,
        },
      };
    } catch {
      window.clearTimeout(timer);
    }
  }

  return {
    route: null,
    error:
      'Routing service could not compute a road/path route right now (service unavailable or no connected path found between these points). You can still inspect the mapped destination pin directly on the map.',
  };
}
