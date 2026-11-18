const TEAM_MEMBERS = [
  { initials: 'NK', name: 'Nikhil Kaundal', section: 'WS Section', role: 'Project team member' },
  { initials: 'HR', name: 'Harsh Raj', section: 'WS Section', role: 'Project team member' },
  { initials: 'AV', name: 'Archit Verma', section: 'WS Section', role: 'Project team member' },
];

export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-10">
      {/* Header matching Figma 07 — About */}
      <div className="space-y-2">
        <div className="text-xs font-bold tracking-wider text-[#2563EB]">ABOUT OUR PROJECT</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A]">Meet our team</h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          We are a WS Section team building Campus Navigator, a geographically grounded smart
          campus navigation system for Lovely Professional University, Phagwara.
        </p>
      </div>

      {/* Our Project */}
      <section className="space-y-2">
        <h2 className="text-xl font-bold text-[#0F172A]">Our project</h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Campus Navigator helps students, parents, and first-time visitors locate verified LPU
          academic blocks, Block 37 Central Library, Uni-Mall, Uni-Hospital, sports grounds, and
          campus services using live OpenStreetMap tiles, Overpass POI queries, Nominatim search,
          and OSRM route planning.
        </p>
      </section>

      {/* Team Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TEAM_MEMBERS.map((member) => (
          <div
            key={member.name}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#EFF6FF] text-[#2563EB] font-display font-bold text-sm flex items-center justify-center shrink-0">
                {member.initials}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">{member.name}</h3>
                <p className="text-xs text-slate-500">{member.section}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
              {member.role}
            </div>
          </div>
        ))}
      </section>

      {/* Data Accuracy & OpenStreetMap Standards */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-[#0F172A]">
          Location Verification &amp; Open Data Standards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-600 leading-relaxed">
          <div>
            <div className="font-bold text-emerald-700 mb-1">Verified Locations</div>
            Exact coordinates confirmed directly from OpenStreetMap Overpass/Nominatim records
            (with OSM node or way IDs) or official university sources.
          </div>
          <div>
            <div className="font-bold text-amber-700 mb-1">Approximate Locations</div>
            General campus zone confirmed within LPU Phagwara boundaries, where exact building
            entrances are not yet individually tagged in OpenStreetMap.
          </div>
          <div>
            <div className="font-bold text-slate-700 mb-1">Sample Demo Entries</div>
            Fictional demonstration markers kept strictly separate from verified campus locations
            and visibly marked as Sample.
          </div>
        </div>
        <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
          Map tiles &amp; geographic data &copy; OpenStreetMap contributors (ODbL). Routing powered
          by OSRM &amp; OpenStreetMap Foot Router. Official helplines sourced from lpu.in.
        </p>
      </section>

      <div className="text-sm font-semibold text-[#2563EB]">
        Thank you for exploring our project.
      </div>
    </div>
  );
}
