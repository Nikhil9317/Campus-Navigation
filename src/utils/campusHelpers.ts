import { CampusCategory, CampusLocation, DiscoverMode, VerificationStatus } from '../types/campus';

export const CATEGORY_META: Record<
  CampusCategory,
  { label: string; shortLabel: string; colorHex: string; dotClass: string; textClass: string }
> = {
  academic: {
    label: 'Academic',
    shortLabel: 'Academic',
    colorHex: '#2563EB',
    dotClass: 'bg-blue-600',
    textClass: 'text-blue-700',
  },
  student_facilities: {
    label: 'Student Facilities',
    shortLabel: 'Facilities',
    colorHex: '#059669',
    dotClass: 'bg-emerald-600',
    textClass: 'text-emerald-700',
  },
  food_shopping: {
    label: 'Food & Shopping',
    shortLabel: 'Food & Retail',
    colorHex: '#D97706',
    dotClass: 'bg-amber-600',
    textClass: 'text-amber-700',
  },
  residential: {
    label: 'Residential',
    shortLabel: 'Residential',
    colorHex: '#4F46E5',
    dotClass: 'bg-indigo-600',
    textClass: 'text-indigo-700',
  },
  admin_services: {
    label: 'Administration & Services',
    shortLabel: 'Admin & Services',
    colorHex: '#0F172A',
    dotClass: 'bg-slate-900',
    textClass: 'text-slate-800',
  },
};

export const DISCOVER_MODES: {
  id: DiscoverMode;
  label: string;
  subtitle: string;
}[] = [
  { id: 'all', label: 'All Campus', subtitle: 'Full LPU directory' },
  { id: 'study', label: 'Study Mode', subtitle: 'Libraries, academic blocks & labs' },
  { id: 'food', label: 'Food Mode', subtitle: 'Food courts, cafes & Uni-Mall' },
  { id: 'sports', label: 'Sports Mode', subtitle: 'Grounds, courts & sports centre' },
  { id: 'student_life', label: 'Student Life Mode', subtitle: 'Hostels, clubs & auditorium' },
  { id: 'essentials', label: 'Essentials Mode', subtitle: 'Medical, banking, gates & parking' },
];

export const VERIFICATION_META: Record<
  VerificationStatus,
  { label: string; description: string; textClass: string }
> = {
  verified: {
    label: 'Verified',
    description: 'Exact position confirmed via OpenStreetMap / official map record',
    textClass: 'text-emerald-700',
  },
  approximate: {
    label: 'Approximate',
    description: 'General campus zone known; exact building entrance not confirmed in OSM',
    textClass: 'text-amber-700',
  },
  sample: {
    label: 'Sample (Demo)',
    description: 'Demonstration placeholder with fictional position; isolated from verified data',
    textClass: 'text-slate-500',
  },
};

export function smartSearchLocations(
  locations: CampusLocation[],
  query: string
): CampusLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return locations;

  const tokens = q.split(/\s+/).filter(Boolean);
  return locations
    .map((loc) => {
      const catLabel = CATEGORY_META[loc.category].label.toLowerCase();
      const haystack = [
        loc.name,
        loc.shortName || '',
        loc.subCategory,
        catLabel,
        loc.description,
        ...(loc.keywords || []),
        ...(loc.facilities || []),
      ]
        .join(' ')
        .toLowerCase();

      let score = 0;
      if (loc.name.toLowerCase() === q) score += 100;
      else if (loc.name.toLowerCase().startsWith(q)) score += 60;
      else if (loc.name.toLowerCase().includes(q)) score += 40;

      const allMatch = tokens.every((t) => haystack.includes(t));
      if (!allMatch) return { loc, score: 0 };

      score += tokens.length * 10;
      if (loc.verificationStatus === 'verified') score += 5;
      if (loc.verificationStatus === 'sample') score -= 20;
      return { loc, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.loc);
}
