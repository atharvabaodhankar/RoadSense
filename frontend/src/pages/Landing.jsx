import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text-secondary)] font-sans min-h-screen flex flex-col items-center">
      {/* Navbar */}
      <nav className="w-full border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-50">
        <div className="max-w-[1000px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/roadsense.png" alt="RoadSense" className="w-8 h-8 object-contain" />
            <span className="text-[var(--text-primary)] font-bold text-lg tracking-tight">RoadSense</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="bg-[var(--green)] hover:opacity-90 text-white text-sm px-4 py-2 rounded font-semibold transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="w-full max-w-[1000px] px-6 flex flex-col gap-24 pt-20 pb-24">
        {/* Hero */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 max-w-[760px]">
            <h1 className="text-[var(--text-primary)] text-5xl md:text-6xl font-semibold leading-[1.1] tracking-[-0.03em]">
              Smarter Roads, <br/>
              <span className="text-[var(--green)]">Safer Cities.</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-[580px] leading-relaxed font-normal">
              Automated defect detection for modern public works. Replace manual clipboard surveys with high-precision AI analysis.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link to="/signup" className="bg-[var(--green)] hover:opacity-90 text-white h-12 px-6 rounded flex items-center gap-2 text-base font-semibold transition-all">
              <span>Get Started</span>
              <span className="text-lg">→</span>
            </Link>
            <Link to="/login" className="bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--text-primary)] text-[var(--text-primary)] h-12 px-6 rounded text-base font-medium transition-all flex items-center">
              See Live Demo
            </Link>
          </div>

          {/* Stats */}
          <div className="pt-4 flex flex-wrap items-center gap-8 border-t border-[var(--border)] w-full max-w-md">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">Analysis Accuracy</span>
              <span className="font-mono text-sm text-[var(--text-primary)]">99.4%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">Processing Speed</span>
              <span className="font-mono text-sm text-[var(--text-primary)]">~45ms / Frame</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">Deployment</span>
              <span className="font-mono text-sm text-[var(--text-primary)]">On-Prem / Cloud</span>
            </div>
          </div>

          {/* Product Preview Card */}
          <div className="card hover:border-[var(--text-primary)] transition-colors">
            {/* Browser chrome */}
            <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[var(--red)]"></div>
                <div className="w-3 h-3 rounded-full bg-[var(--yellow)]"></div>
                <div className="w-3 h-3 rounded-full bg-[var(--green)]"></div>
              </div>
              <span className="font-mono text-xs text-[var(--text-tertiary)] mx-auto">RoadSense Dashboard — Inspection #INS-2847</span>
            </div>

            {/* Preview content */}
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--surface-2)]">
              {/* Left: Road image */}
              <div className="flex flex-col gap-3">
                <span className="font-mono text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Original → Annotated</span>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg w-full h-44 md:h-52 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{background: 'repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)'}}></div>
                  <div className="absolute left-1/2 top-0 bottom-0 w-[3px] opacity-40" style={{background: 'repeating-linear-gradient(to bottom, #f5c518 0px, #f5c518 12px, transparent 12px, transparent 22px)'}}></div>
                  
                  {/* Pothole bbox */}
                  <div className="absolute border-2 border-dashed border-red-500 rounded-sm" style={{top:'28%', left:'18%', width:'38%', height:'32%'}}>
                    <div className="absolute -top-5 left-0 bg-red-500 text-white text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap">pothole — 94%</div>
                  </div>
                  
                  {/* Crack bbox */}
                  <div className="absolute border-2 border-dashed border-amber-500 rounded-sm" style={{top:'55%', left:'55%', width:'28%', height:'25%'}}>
                    <div className="absolute -top-5 left-0 bg-amber-500 text-white text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap">crack — 81%</div>
                  </div>
                  
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-mono px-2 py-1 rounded">YOLOv8 · Roboflow</div>
                </div>
                
                {/* Defect chips */}
                <div className="flex flex-wrap gap-2">
                  <span className="pill critical">
                    Pothole
                  </span>
                  <span className="pill moderate">
                    Alligator Crack
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium font-mono bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[var(--text-tertiary)]"></span>Crack
                  </span>
                </div>
              </div>

              {/* Right: Score panel */}
              <div className="flex flex-col gap-4">
                <span className="font-mono text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Road Quality Score</span>
                <div className="card hover:border-[var(--text-primary)] p-5 flex flex-col gap-4 transition-colors">
                  <div className="flex items-end gap-3">
                    <span className="text-[52px] font-bold leading-none tracking-[-3px] text-[var(--red)] font-mono">38</span>
                    <span className="text-[var(--text-tertiary)] text-sm mb-2 font-mono">/100</span>
                  </div>
                  
                  <div className="pill critical pulse-red">
                    Critical
                  </div>
                  
                  <div className="h-[5px] bg-[var(--border)] rounded-sm overflow-hidden">
                    <div className="h-full bg-[var(--red)] rounded-sm transition-all duration-1000" style={{width:'38%'}}></div>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-1 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-[7px] h-[7px] rounded-full bg-[var(--red)]"></span>
                        <span className="text-xs font-mono text-[var(--text-secondary)]">Potholes</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-[7px] h-[7px] rounded-full bg-[var(--yellow)]"></span>
                        <span className="text-xs font-mono text-[var(--text-secondary)]">Alligator Cracks</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">1</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-[7px] h-[7px] rounded-full bg-[var(--text-tertiary)]"></span>
                        <span className="text-xs font-mono text-[var(--text-secondary)]">Cracks</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live footer */}
            <div className="border-t border-[var(--border)] bg-[var(--surface)] px-5 py-3 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[var(--green)] pulse-dot"></span>
              <span className="font-mono text-xs text-[var(--text-tertiary)]">LIVE · 3 new inspections in the last hour · Supabase Realtime connected</span>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card hover:border-[var(--text-primary)] p-6 flex flex-col gap-4 transition-colors cursor-default">
            <div className="w-10 h-10 rounded bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] text-xl">
              🎯
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-[var(--text-primary)] font-semibold text-lg tracking-tight">AI Defect Detection</h3>
              <p className="text-[var(--text-tertiary)] text-sm leading-relaxed">YOLOv8 detects potholes, alligator cracks, and surface damage in under 45ms. Bounding boxes drawn automatically on every flagged image.</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="pill critical">
                Pothole
              </span>
              <span className="pill moderate">
                Alligator Crack
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium font-mono bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]">
                <span className="w-[5px] h-[5px] rounded-full bg-[var(--text-tertiary)]"></span>Crack
              </span>
            </div>
          </div>

          <div className="card hover:border-[var(--text-primary)] p-6 flex flex-col gap-4 transition-colors cursor-default">
            <div className="w-10 h-10 rounded bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] text-xl">
              📍
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-[var(--text-primary)] font-semibold text-lg tracking-tight">GPS Auto-Tagging</h3>
              <p className="text-[var(--text-tertiary)] text-sm leading-relaxed">Every inspection is pinned to exact coordinates the moment a photo is submitted. No manual entry. No data loss.</p>
            </div>
            <div className="mt-1 flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2">
              <span className="text-[var(--text-tertiary)] text-sm">📍</span>
              <span className="font-mono text-xs text-[var(--text-tertiary)]">18.5590° N, 73.7868° E · Baner Road, Pune</span>
            </div>
          </div>

          <div className="card hover:border-[var(--text-primary)] p-6 flex flex-col gap-4 transition-colors cursor-default">
            <div className="w-10 h-10 rounded bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] text-xl">
              📊
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-[var(--text-primary)] font-semibold text-lg tracking-tight">Live Admin Dashboard</h3>
              <p className="text-[var(--text-tertiary)] text-sm leading-relaxed">Admins see every inspection in real time via Supabase Realtime. Heatmap updates the moment an inspector submits.</p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-4 bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2">
              <span className="font-mono text-xs text-[var(--text-tertiary)]">248 inspections</span>
              <span className="font-mono text-xs text-[var(--red)]">37 critical</span>
              <span className="font-mono text-xs text-[var(--text-tertiary)]">Avg score 64</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)] mt-auto">
        <div className="max-w-[1000px] mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="flex flex-col gap-4 max-w-xs">
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <img src="/roadsense.png" alt="RoadSense" className="w-6 h-6 object-contain" />
                <span className="font-bold text-base tracking-tight">RoadSense</span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">Civic intelligence for the modern age. Built for engineers who value data integrity over flashiness.</p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[var(--text-tertiary)] font-mono">Built for WITCHAR-26 Hackathon · Team: Atharva Baodhankar, Esha Chavan, Jay Suryawanshi</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
