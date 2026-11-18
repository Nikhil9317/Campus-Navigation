export type CampusCategory =
  | 'academic'
  | 'student_facilities'
  | 'food_shopping'
  | 'residential'
  | 'admin_services';

export type VerificationStatus = 'verified' | 'approximate' | 'sample';

export type DiscoverMode =
  | 'all'
  | 'study'
  | 'food'
  | 'sports'
  | 'student_life'
  | 'essentials';

export type TravelMode = 'walking' | 'driving';

export type AccessibilityPreference = 'shortest' | 'step_free';

export type AppPage =
  | 'home'
  | 'signin'
  | 'signup'
  | 'dashboard'
  | 'explore'
  | 'map'
  | 'about';

export interface CampusLocation {
  id: string;
  name: string;
  shortName?: string;
  category: CampusCategory;
  subCategory: string;
  description: string;
  latitude: number;
  longitude: number;
  verificationStatus: VerificationStatus;
  source: string;
  osmId?: string;
  facilities: string[];
  openingHours?: string;
  openingHoursVerified?: boolean;
  keywords?: string[];
  discoverModes: DiscoverMode[];
  isFirstTimeEssential?: boolean;
  nearbyFacilityType?: 'food' | 'medical' | 'parking' | 'library' | 'banking' | 'restroom';
  accessibilityNote?: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds?: number;
  roadName?: string;
  maneuverType?: string;
  maneuverModifier?: string;
}

export interface ComputedRoute {
  startId: string;
  startLabel: string;
  startCoords: [number, number];
  endId: string;
  endLabel: string;
  endCoords: [number, number];
  mode: TravelMode;
  distanceMeters: number;
  durationSeconds: number | null;
  geometry: [number, number][]; // [lat, lng] pairs for Leaflet
  steps: RouteStep[];
  landmarkDirections: string[];
  accessibilityVerified: boolean;
  accessibilityMessage: string;
  provider: string;
}

export interface DemoUser {
  name: string;
  email: string;
  isGuest?: boolean;
}
