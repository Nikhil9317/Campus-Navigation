import { Download, Plus, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { CampusCategory, CampusLocation, VerificationStatus } from '../types/campus';
import { LPU_CENTER } from '../services/campusMapService';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLocation: (location: CampusLocation) => void;
  allLocations: CampusLocation[];
  defaultCoords?: [number, number];
}

export function AddLocationModal({
  isOpen,
  onClose,
  onAddLocation,
  allLocations,
  defaultCoords,
}: AddLocationModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CampusCategory>('academic');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(
    String(defaultCoords ? defaultCoords[0].toFixed(6) : LPU_CENTER[0].toFixed(6))
  );
  const [longitude, setLongitude] = useState(
    String(defaultCoords ? defaultCoords[1].toFixed(6) : LPU_CENTER[1].toFixed(6))
  );
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('approximate');
  const [source, setSource] = useState('Team verified campus survey / official LPU directory');
  const [facilitiesText, setFacilitiesText] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!name.trim() || !description.trim()) {
      setError('Please enter a destination name and description.');
      return;
    }
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat < 31.23 || lat > 31.28 || lon < 75.68 || lon > 75.73) {
      setError('Coordinates should fall within the LPU Phagwara region (Lat ~31.24–31.26, Lon ~75.69–75.71).');
      return;
    }

    const id = `custom-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;

    const facilities = facilitiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newLoc: CampusLocation = {
      id,
      name: name.trim(),
      shortName: name.trim(),
      category,
      subCategory: subCategory.trim() || 'Campus Destination',
      description: description.trim(),
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
      verificationStatus,
      source: source.trim() || 'Team addition to campusLocations.json',
      facilities: facilities.length > 0 ? facilities : ['Campus Facility'],
      openingHours: openingHours.trim() || undefined,
      openingHoursVerified: Boolean(openingHours.trim() && verificationStatus === 'verified'),
      discoverModes:
        category === 'academic'
          ? ['study']
          : category === 'food_shopping'
          ? ['food']
          : category === 'student_facilities'
          ? ['student_life']
          : category === 'residential'
          ? ['student_life']
          : ['essentials'],
    };

    onAddLocation(newLoc);
    setName('');
    setDescription('');
    setSubCategory('');
    setFacilitiesText('');
    setOpeningHours('');
    onClose();
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(allLocations, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campusLocations.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-[1200] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-location-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl my-8">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold text-[#2563EB]">Campus Dataset Editor</p>
            <h2 id="add-location-title" className="text-lg font-bold text-[#0F172A] mt-0.5">
              Add verified or approximate LPU location
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Destination Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Block 34 — Computer Science Wing"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CampusCategory)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="academic">Academic</option>
                <option value="student_facilities">Student Facilities</option>
                <option value="food_shopping">Food & Shopping</option>
                <option value="residential">Residential</option>
                <option value="admin_services">Administration & Services</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verification Status
              </label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="verified">Verified (Exact GPS/OSM)</option>
                <option value="approximate">Approximate (General Zone)</option>
                <option value="sample">Sample (Demo Placeholder)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Latitude (N)
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Longitude (E)
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of building purpose and landmarks"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source of Location Data
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verified Hours (Optional)
              </label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="Only if officially confirmed"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Available Facilities (comma-separated)
            </label>
            <input
              type="text"
              value={facilitiesText}
              onChange={(e) => setFacilitiesText(e.target.value)}
              placeholder="e.g., Labs, Reading Room, Restrooms"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export campusLocations.json</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Location</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
