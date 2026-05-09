import React, { useState, useEffect, useMemo } from 'react';
import { Settings2, BookOpen, Info, Target, Calculator, ArrowRight } from 'lucide-react';

const ReliefDisplacementExplorer = () => {
  // Application State
  const [activeTab, setActiveTab] = useState('derivation');
  const [hoveredStep, setHoveredStep] = useState(null); // Add state for hovering
  
  // Real-world physical parameters
  const [H, setH] = useState(2000); // Flying Height (m)
  const [h, setH_elev] = useState(200); // Object Elevation (m)
  const [R, setR] = useState(1000); // Ground Radial Distance from Nadir (m)
  const [f, setF] = useState(152.4); // Focal length (mm)

  // Presets based on the slides
  const loadPreset = (preset) => {
    if (preset === 'default') {
      setH(2000); setH_elev(200); setR(1000); setF(152.4);
    } else if (preset === 'example') {
      // Example 1: H=2286m, h=60m, r'=5.4cm (54mm) -> calculated R=788.66m
      setH(2286); setH_elev(60); setR(788.66); setF(152.4); 
    } else if (preset === 'quiz') {
      // Quiz 1: H=875m, r_top=129.8mm, r_bot=125.2mm -> derived h=31.009m, R=718.5m
      setH(875); setH_elev(31.01); setR(718.5); setF(152.4);
    } else if (preset === 'below') {
      // Custom Below Ground Example
      setH(1500); setH_elev(-150); setR(800); setF(152.4);
    }
  };

  // Calculations
  const calculatedValues = useMemo(() => {
    // True radial distance if object was on the datum plane (mm)
    const r = (f * R) / H;
    
    // Erroneous radial distance to the displaced top of the object (mm)
    const r_prime = (f * R) / (H - h);
    
    // Relief displacement (mm)
    let delta_r = r_prime - r;
    
    // Calculate using the slide's formula to verify
    const delta_r_formula = (r_prime * h) / H;

    return {
      r: r.toFixed(2),
      r_prime: r_prime.toFixed(2),
      delta_r: Math.abs(delta_r).toFixed(2),
      delta_r_formula: Math.abs(delta_r_formula).toFixed(2),
      direction: h > 0 ? 'Outward (Away from center)' : (h < 0 ? 'Inward (Towards center)' : 'None'),
      isAboveDatum: h >= 0
    };
  }, [H, h, R, f]);

  // SVG Coordinate mapping for the diagram
  const svgParams = useMemo(() => {
    const width = 600;
    const height = 500; // Increased height to allow below datum visibility
    const centerX = 300;
    
    // Schematic scaling for visual clarity (not to true scale)
    const lensY = 160;
    // Make visual focal length heavily scale with the parameter so it's very noticeable
    const f_vis = 20 + (f / 300) * 120; 
    const photoY = lensY - f_vis;
    
    const H_vis = 180;
    const datumY = lensY + H_vis;
    
    // --- EXAGGERATION LOGIC ---
    // If h is very small relative to H, the diagram becomes unreadable.
    // We enforce a minimum visual height for h just for drawing the diagram.
    const h_ratio = Math.abs(h) / H;
    const isExaggerated = h !== 0 && h_ratio < 0.20;
    
    let safe_h = h;
    if (isExaggerated) {
      safe_h = Math.sign(h) * H * 0.25; // Exaggerate to 25% of H visually
    }
    
    // Clamp max visual elevation so it doesn't break the diagram
    if (safe_h > H * 0.8) safe_h = H * 0.8;
    if (safe_h < -H * 0.8) safe_h = -H * 0.8; 
    
    const h_vis = (safe_h / H) * H_vis;
    const objectY = datumY - h_vis;
    
    // R visualization
    const max_R = 2500;
    const R_vis = (R / max_R) * 200;
    const objectX = centerX + R_vis;
    
    // Intersections on photo plane (Central Projection)
    // CRITICAL FIX: The rays MUST pass through the lens and cross to the opposite side!
    const r_vis = (f_vis * R_vis) / H_vis;
    const photo_true_X = centerX - r_vis; 
    
    const r_prime_vis = (f_vis * R_vis) / (H_vis - h_vis);
    const photo_disp_X = centerX - r_prime_vis;

    // Dynamically expand photo plane width to contain wide rays
    const max_r = Math.max(Math.abs(r_vis), Math.abs(r_prime_vis));
    const photoPlaneWidth = Math.max(140, max_r + 20);

    return {
      width, height, centerX, lensY, photoY, datumY, objectY, objectX,
      photo_true_X, photo_disp_X, f_vis, H_vis, h_vis, R_vis, r_vis, r_prime_vis, photoPlaneWidth,
      isExaggerated
    };
  }, [H, h, R, f]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Relief Displacement Visualizer</h1>
          <p className="text-slate-600">Interactive exploration of photogrammetric relief displacement, based on spatial geometry.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT PANEL: Visualizer & Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Diagram */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2"><Target size={18}/> Optical Geometry</h2>
                <div className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Case: {calculatedValues.isAboveDatum ? 'Above Datum' : 'Below Datum'}
                </div>
              </div>
              
              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 600 500" className="w-full h-auto min-w-[500px] bg-slate-50">
                  {/* Grid / Background */}
                  <rect width="100%" height="100%" fill="#f8fafc" />
                  
                  {/* Exaggeration Warning Badge */}
                  {svgParams.isExaggerated && (
                    <g className="animate-in fade-in">
                      <rect x="390" y="15" width="195" height="26" fill="#fef3c7" stroke="#fde68a" strokeWidth="1" rx="6" />
                      <text x="487" y="32" className="text-[11px] font-bold fill-amber-700" textAnchor="middle">
                        * Diagram scaled for clarity
                      </text>
                    </g>
                  )}

                  {/* Hover Highlight Polygons (Similar Triangles) */}
                  {hoveredStep === 1 && (
                    <g className="animate-in fade-in duration-200">
                      {/* Ground Triangle (R, H, Ray) */}
                      <polygon points={`${svgParams.centerX},${svgParams.lensY} ${svgParams.centerX},${svgParams.datumY} ${svgParams.objectX},${svgParams.datumY}`} fill="#3b82f6" fillOpacity="0.1" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4,4" />
                      {/* Photo Triangle (r, f, Ray) */}
                      <polygon points={`${svgParams.centerX},${svgParams.lensY} ${svgParams.centerX},${svgParams.photoY} ${svgParams.photo_true_X},${svgParams.photoY}`} fill="#3b82f6" fillOpacity="0.1" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4,4" />
                    </g>
                  )}
                  {hoveredStep === 2 && (
                    <g className="animate-in fade-in duration-200">
                      {/* Elevated Ground Triangle (R, H-h, Ray) */}
                      <polygon points={`${svgParams.centerX},${svgParams.lensY} ${svgParams.centerX},${svgParams.objectY} ${svgParams.objectX},${svgParams.objectY}`} fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" />
                      {/* Photo Triangle (r', f, Ray) */}
                      <polygon points={`${svgParams.centerX},${svgParams.lensY} ${svgParams.centerX},${svgParams.photoY} ${svgParams.photo_disp_X},${svgParams.photoY}`} fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" />
                      {/* Draw R at elevated height to close the triangle visually */}
                      <line x1={svgParams.centerX} y1={svgParams.objectY} x2={svgParams.objectX} y2={svgParams.objectY} stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                    </g>
                  )}
                  {hoveredStep === 4 && (
                    <g className="animate-in fade-in duration-200">
                      {/* Highlight delta r */}
                      <rect x={Math.min(svgParams.photo_true_X, svgParams.photo_disp_X) - 10} y={svgParams.photoY - 20} width={Math.abs(svgParams.photo_disp_X - svgParams.photo_true_X) + 20} height={40} fill="#a855f7" fillOpacity="0.15" rx="6" />
                      <line x1={svgParams.photo_true_X} y1={svgParams.photoY} x2={svgParams.photo_disp_X} y2={svgParams.photoY} stroke="#a855f7" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
                    </g>
                  )}

                  {/* Field of View (Optical Cone / Camera) */}
                  <polygon points={`${svgParams.centerX - 120},${svgParams.photoY} ${svgParams.centerX + 120},${svgParams.photoY} ${svgParams.centerX},${svgParams.lensY}`} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
                  <polygon points={`${svgParams.centerX - 120 * (svgParams.H_vis/svgParams.f_vis)},${svgParams.datumY} ${svgParams.centerX + 120 * (svgParams.H_vis/svgParams.f_vis)},${svgParams.datumY} ${svgParams.centerX},${svgParams.lensY}`} fill="transparent" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6,6" />

                  {/* Photo Plane */}
                  <line x1={svgParams.centerX - svgParams.photoPlaneWidth} y1={svgParams.photoY} x2={svgParams.centerX + svgParams.photoPlaneWidth} y2={svgParams.photoY} stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                  <text x={svgParams.centerX - svgParams.photoPlaneWidth - 10} y={svgParams.photoY} className="text-xs fill-slate-600 font-bold" textAnchor="end" dominantBaseline="middle">Photo Plane</text>
                  
                  {/* Datum Plane */}
                  <line x1="50" y1={svgParams.datumY} x2="550" y2={svgParams.datumY} stroke="#334155" strokeWidth="3" />
                  <text x="40" y={svgParams.datumY} className="text-xs fill-slate-600 font-bold" textAnchor="end" dominantBaseline="middle">Datum</text>

                  {/* Central Axis (Nadir line) */}
                  <line x1={svgParams.centerX} y1="20" x2={svgParams.centerX} y2="480" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,6" />
                  
                  {/* Lens */}
                  <ellipse cx={svgParams.centerX} cy={svgParams.lensY} rx="6" ry="3" fill="#0f172a" />
                  <text x={svgParams.centerX + 12} y={svgParams.lensY + 4} className="text-sm font-bold fill-slate-800">L (Lens)</text>
                  <text x={svgParams.centerX + 10} y={svgParams.photoY - 10} className="text-xs fill-slate-600 font-medium" textAnchor="start">p (Principal Point)</text>
                  
                  {/* Object Structure */}
                  {/* Object Base (A') on Datum */}
                  <circle cx={svgParams.objectX} cy={svgParams.datumY} r="4" fill="#2563eb" />
                  <text x={svgParams.objectX + 10} y={svgParams.datumY + (h >= 0 ? 15 : -12)} className="text-xs font-bold fill-blue-700">A' (Base)</text>
                  
                  {/* Object Line */}
                  <line x1={svgParams.objectX} y1={svgParams.datumY} x2={svgParams.objectX} y2={svgParams.objectY} stroke="#475569" strokeWidth="8" strokeLinecap="round" />
                  
                  {/* Object Top (A) */}
                  <circle cx={svgParams.objectX} cy={svgParams.objectY} r="4" fill="#ef4444" />
                  <text x={svgParams.objectX + 10} y={svgParams.objectY + (h >= 0 ? -8 : 18)} className="text-xs font-bold fill-red-600">A ({h >= 0 ? 'Top' : 'Bottom'})</text>

                  {/* Rays */}
                  {/* True Ray (Blue) */}
                  <line x1={svgParams.objectX} y1={svgParams.datumY} x2={svgParams.photo_true_X} y2={svgParams.photoY} stroke="#2563eb" strokeWidth="2" strokeDasharray="4,4" />
                  <circle cx={svgParams.photo_true_X} cy={svgParams.photoY} r="3" fill="#2563eb" />
                  <text x={svgParams.photo_true_X} y={svgParams.photoY - 8} className="text-xs font-bold fill-blue-700" textAnchor="middle">a</text>

                  {/* Displaced Ray (Red) */}
                  <line x1={svgParams.objectX} y1={svgParams.objectY} x2={svgParams.photo_disp_X} y2={svgParams.photoY} stroke="#ef4444" strokeWidth="2" />
                  <circle cx={svgParams.photo_disp_X} cy={svgParams.photoY} r="3" fill="#ef4444" />
                  <text x={svgParams.photo_disp_X} y={svgParams.photoY - 22} className="text-xs font-bold fill-red-600" textAnchor="middle">a'</text>

                  {/* Annotations */}
                  {/* R dimension */}
                  <path d={`M ${svgParams.centerX} ${svgParams.datumY + 20} L ${svgParams.objectX} ${svgParams.datumY + 20}`} stroke="#64748b" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                  <text x={svgParams.centerX + svgParams.R_vis/2} y={svgParams.datumY + 35} className="text-xs fill-slate-600" textAnchor="middle">R</text>

                  {/* h dimension */}
                  <path d={`M ${svgParams.objectX + 25} ${svgParams.datumY} L ${svgParams.objectX + 25} ${svgParams.objectY}`} stroke="#64748b" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                  <text x={svgParams.objectX + 35} y={svgParams.datumY - svgParams.h_vis/2 + 4} className="text-xs fill-slate-600">h = {h}m</text>

                  {/* H dimension */}
                  <path d={`M ${svgParams.centerX - 50} ${svgParams.datumY} L ${svgParams.centerX - 50} ${svgParams.lensY}`} stroke="#64748b" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                  <text x={svgParams.centerX - 60} y={svgParams.lensY + svgParams.H_vis/2} className="text-xs font-bold fill-slate-700" textAnchor="end">H = {H}m</text>

                  {/* f dimension */}
                  <line x1={svgParams.centerX} y1={svgParams.photoY} x2={svgParams.centerX + 180} y2={svgParams.photoY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2"/>
                  <line x1={svgParams.centerX} y1={svgParams.lensY} x2={svgParams.centerX + 180} y2={svgParams.lensY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2"/>
                  <path d={`M ${svgParams.centerX + 160} ${svgParams.lensY} L ${svgParams.centerX + 160} ${svgParams.photoY}`} stroke="#475569" strokeWidth="2" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                  <text x={svgParams.centerX + 170} y={svgParams.lensY - svgParams.f_vis/2 + 4} className="text-sm font-bold fill-slate-800">f</text>

                  {/* Photo dimensions r, r', dr */}
                  <path d={`M ${svgParams.centerX} ${svgParams.photoY - 35} L ${svgParams.photo_true_X} ${svgParams.photoY - 35}`} stroke="#3b82f6" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                  <text x={(svgParams.centerX + svgParams.photo_true_X)/2} y={svgParams.photoY - 40} className="text-xs fill-blue-600" textAnchor="middle">r</text>

                  <path d={`M ${svgParams.centerX} ${svgParams.photoY - 50} L ${svgParams.photo_disp_X} ${svgParams.photoY - 50}`} stroke="#ef4444" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                  <text x={(svgParams.centerX + svgParams.photo_disp_X)/2} y={svgParams.photoY - 55} className="text-xs fill-red-600" textAnchor="middle">r'</text>

                  <path d={`M ${svgParams.photo_true_X} ${svgParams.photoY + 15} L ${svgParams.photo_disp_X} ${svgParams.photoY + 15}`} stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                  <text x={(svgParams.photo_true_X + svgParams.photo_disp_X)/2} y={svgParams.photoY + 28} className="text-xs font-bold fill-purple-600" textAnchor="middle">Δr</text>

                  {/* SVG Definitions */}
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                    </marker>
                  </defs>
                </svg>
              </div>
              
              {/* Calculated Results Block */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium mb-1">True r (Datum)</div>
                  <div className="text-lg font-bold text-blue-600">{calculatedValues.r} mm</div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium mb-1">Displaced r' (Image)</div>
                  <div className="text-lg font-bold text-red-600">{calculatedValues.r_prime} mm</div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-200 ring-1 ring-purple-100">
                  <div className="text-xs text-purple-600 font-semibold mb-1">Relief Disp. (Δr)</div>
                  <div className="text-lg font-bold text-purple-700">{calculatedValues.delta_r} mm</div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium mb-1">Direction</div>
                  <div className="text-sm font-semibold text-slate-700 pt-1">{calculatedValues.direction}</div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <Settings2 size={20} className="text-slate-600"/>
                <h3 className="font-bold text-slate-800">Flight & Terrain Parameters</h3>
              </div>
              
              {/* Add Above/Below Datum Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
                <button 
                  onClick={() => setH_elev(Math.max(10, Math.abs(h)))}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${h >= 0 ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                  Above Datum (Hill/Building)
                </button>
                <button 
                  onClick={() => setH_elev(-Math.max(10, Math.abs(h)))}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${h < 0 ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                  Below Datum (Crater/Valley)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                    <span>Flying Height (H)</span>
                    <span className="text-blue-600">{H} m</span>
                  </label>
                  <input type="range" min="500" max="5000" step="1" value={H} onChange={(e)=>setH(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>

                <div>
                  <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                    <span>Object Elevation (h)</span>
                    <span className={h >= 0 ? "text-red-600" : "text-emerald-600"}>{h} m</span>
                  </label>
                  <input type="range" min="-500" max={H * 0.9} step="1" value={h} onChange={(e)=>setH_elev(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Below Datum (-)</span>
                    <span>Above Datum (+)</span>
                  </div>
                </div>

                <div>
                  <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                    <span>Ground Distance from Nadir (R)</span>
                    <span className="text-slate-600">{R} m</span>
                  </label>
                  <input type="range" min="10" max="2500" step="10" value={R} onChange={(e)=>setR(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600" />
                </div>

                <div>
                  <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                    <span>Camera Focal Length (f)</span>
                    <span className="text-slate-600">{f} mm</span>
                  </label>
                  <input type="range" min="50" max="300" step="0.1" value={f} onChange={(e)=>setF(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600" />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Info & Derivations */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[850px]">
            <div className="flex bg-slate-100 p-2 gap-1 border-b border-slate-200">
              <button onClick={() => setActiveTab('derivation')} className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'derivation' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>Derivation</button>
              <button onClick={() => setActiveTab('quirks')} className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'quirks' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>Rules & Quirks</button>
              <button onClick={() => setActiveTab('examples')} className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'examples' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>Examples</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              
              {/* TAB 1: Derivation */}
              {activeTab === 'derivation' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-blue-800 border-b pb-2">
                    <Calculator size={20} />
                    <h3 className="font-bold text-lg">ELI5: Step-by-Step Derivation</h3>
                  </div>
                  
                  <div className="space-y-4 text-slate-700 text-sm">
                    <p>Think of relief displacement like looking at shadows cast by a flashlight. We use <strong>Similar Triangles</strong> to easily figure out the math!</p>
                    
                    <div 
                      className={`p-4 rounded-lg border transition-all duration-300 ${hoveredStep === 1 ? 'bg-blue-50/70 border-blue-300 shadow-md ring-1 ring-blue-200' : 'bg-slate-50 border-slate-100 hover:border-blue-200 cursor-default'}`}
                      onMouseEnter={() => setHoveredStep(1)}
                      onMouseLeave={() => setHoveredStep(null)}
                    >
                      <h4 className="font-bold text-slate-800 mb-2 text-base">Step 1: The Flat World 🌍</h4>
                      <p className="mb-2">Imagine a flat ground (the Datum). There is a dot painted on the ground at distance <span className="font-bold text-slate-800">R</span> from the center. The camera is at height <span className="font-bold text-slate-800">H</span>.</p>
                      <p>In the camera, this dot shows up on the photo at a tiny distance <span className="font-bold text-blue-600">r</span> from the center. The camera's focal length is <span className="font-bold text-slate-800">f</span>.</p>
                      <p className="mt-2">Because light travels in a straight line, the ratio of the "photo sizes" exactly matches the "real world sizes":</p>
                      <div className="font-mono text-center my-3 bg-white py-2 rounded shadow-sm border border-slate-100 text-base">
                        <span className="text-blue-600">r</span> / f = R / H
                      </div>
                    </div>

                    <div 
                      className={`p-4 rounded-lg border transition-all duration-300 ${hoveredStep === 2 ? 'bg-red-50/70 border-red-300 shadow-md ring-1 ring-red-200' : 'bg-slate-50 border-slate-100 hover:border-red-200 cursor-default'}`}
                      onMouseEnter={() => setHoveredStep(2)}
                      onMouseLeave={() => setHoveredStep(null)}
                    >
                      <h4 className="font-bold text-slate-800 mb-2 text-base">Step 2: The Tall Building 🏢</h4>
                      <p className="mb-2">Now imagine a tall building of height <span className="font-bold text-red-600">h</span> standing right on that dot. The top of the building is <em>closer</em> to the camera lens!</p>
                      <p>The new distance from the lens to the top of the building is <span className="font-bold text-slate-800">(H - h)</span>. Because it's closer to the lens, the top of the building shifts outward on the photo to a new position, <span className="font-bold text-red-600">r'</span>.</p>
                      <p className="mt-2">Using our exact same triangle rule, but with the shorter distance:</p>
                      <div className="font-mono text-center my-3 bg-white py-2 rounded shadow-sm border border-slate-100 text-base">
                        <span className="text-red-600">r'</span> / f = R / (H - h)
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <h4 className="font-bold text-slate-800 mb-2 text-base">Step 3: Putting it Together 🧩</h4>
                      <p className="mb-2">Notice that the ground distance <strong>R</strong> and focal length <strong>f</strong> are the same in both scenarios. Let's isolate <strong>R</strong> from Step 2:</p>
                      <div className="font-mono text-center my-2 text-slate-600">R = [ r' × (H - h) ] / f</div>
                      <p className="mt-3 mb-2">Now, substitute that <strong>R</strong> into our Step 1 equation (<code className="text-blue-600">r</code> = f × R / H):</p>
                      <div className="font-mono text-center my-2 text-slate-600">r = f × [ r'(H-h)/f ] / H</div>
                      <p className="mt-2 text-center text-xs text-slate-500">(The f's cancel out!)</p>
                      <div className="font-mono text-center my-2 font-semibold">r = r'(H-h) / H</div>
                    </div>

                    <div 
                      className={`p-4 rounded-lg border transition-all duration-300 ${hoveredStep === 4 ? 'bg-purple-50/80 border-purple-300 shadow-md ring-1 ring-purple-300' : 'bg-blue-50 border-blue-200 hover:border-purple-300 cursor-default'}`}
                      onMouseEnter={() => setHoveredStep(4)}
                      onMouseLeave={() => setHoveredStep(null)}
                    >
                      <h4 className="font-bold text-blue-800 mb-2 text-base">Step 4: The Final Shift 📏</h4>
                      <p className="mb-2">The relief displacement (<span className="font-serif font-bold text-purple-700">Δr</span>) is simply the distance between the displaced top (<span className="text-red-600 font-bold">r'</span>) and the true base (<span className="text-blue-600 font-bold">r</span>).</p>
                      <div className="font-mono text-center my-2 font-bold text-lg text-purple-700">
                        Δr = r' - r
                      </div>
                      <p className="mt-3 mb-2">Substitute the <code className="text-blue-600">r</code> we found in Step 3:</p>
                      <div className="font-mono text-center my-2">
                        Δr = r' - [ r' - (r'h)/H ]
                      </div>
                      <div className="font-mono text-center mt-4 mb-2 text-xl font-bold text-blue-800 bg-white py-3 rounded-lg shadow border border-blue-100">
                        Δr = (r' × h) / H
                      </div>
                      <p className="text-center text-xs text-blue-600 mt-2">"Displacement equals the displaced photo distance times elevation, divided by flying height."</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Rules & Quirks */}
              {activeTab === 'quirks' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-emerald-800 border-b pb-2">
                    <Info size={20} />
                    <h3 className="font-bold text-lg">Displacement Rules & Quirks</h3>
                  </div>

                  <div className="space-y-5 text-slate-700 text-sm">
                    
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
                      <h4 className="font-bold text-emerald-900 mb-3 text-base">Rule 1: Direction of Shift</h4>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="bg-emerald-100 text-emerald-700 p-2 rounded shrink-0 h-fit"><ArrowRight size={16} /></div>
                          <div>
                            <strong className="block text-emerald-900">Above Datum (h &gt; 0)</strong>
                            <p>Displacement is <span className="font-bold text-red-600">OUTWARD</span> (radial from nadir). The top of an object appears further from the center than its base.</p>
                            <p className="mt-1 font-mono text-xs bg-white px-2 py-1 rounded w-fit border">Corrected r = r' - Δr</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="bg-emerald-100 text-emerald-700 p-2 rounded shrink-0 h-fit"><ArrowRight size={16} className="rotate-180" /></div>
                          <div>
                            <strong className="block text-emerald-900">Below Datum (h &lt; 0)</strong>
                            <p>Displacement is <span className="font-bold text-blue-600">INWARD</span>. The bottom of a depression appears closer to the center than its top rim.</p>
                            <p className="mt-1 font-mono text-xs bg-white px-2 py-1 rounded w-fit border">Corrected r = r' + |Δr|</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
                      <h4 className="font-bold text-amber-900 mb-2 text-base">General Conclusions</h4>
                      <ul className="list-disc pl-5 space-y-2 text-amber-900/80">
                        <li>The <strong>higher</strong> the point above datum (or lower below), the <strong>greater</strong> the relief displacement.</li>
                        <li>The <strong>higher</strong> the flying height (H), the <strong>lesser</strong> the relief displacement.</li>
                      </ul>
                    </div>

                    <div className="border border-slate-200 p-4 rounded-lg">
                      <h4 className="font-bold text-slate-800 mb-3 text-base">How to Minimize Δr?</h4>
                      <p className="mb-3">Based on the formula <code className="bg-slate-100 px-1 rounded">Δr = r'h / H</code>, we can reduce errors in precise mapping by:</p>
                      
                      <ol className="list-decimal pl-5 space-y-3">
                        <li>
                          <strong>Use the central part of the photo:</strong> Discard the edges where <code className="bg-slate-100 px-1 rounded">r'</code> is largest. Displacement is zero at the nadir (center).
                        </li>
                        <li>
                          <strong>Fly higher:</strong> Increasing <code className="bg-slate-100 px-1 rounded">H</code> directly reduces <code className="bg-slate-100 px-1 rounded">Δr</code>.
                        </li>
                        <li>
                          <strong>Use a larger focal length:</strong> Flying higher yields a smaller photo scale. To compensate and maintain the desired scale, use a camera with a larger focal length (<code className="bg-slate-100 px-1 rounded">f</code>), e.g., a normal-angle instead of a wide-angle lens.
                        </li>
                      </ol>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: Solved Examples */}
              {activeTab === 'examples' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-purple-800 border-b pb-2">
                    <BookOpen size={20} />
                    <h3 className="font-bold text-lg">Interactive Solved Examples</h3>
                  </div>

                  <p className="text-sm text-slate-600 mb-4">Click a preset below to load the parameters from the class slides into the interactive visualizer.</p>

                  <div className="space-y-5">
                    {/* Example 1 */}
                    <div className="relative border border-slate-200 border-l-4 border-l-purple-500 p-5 rounded-xl shadow-sm hover:shadow-md transition-all bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-lg text-slate-800">Example 1</h4>
                        <button onClick={() => loadPreset('example')} className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg shadow hover:bg-purple-700 transition-colors active:scale-95">
                          Load Preset
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mb-4 italic bg-slate-50 p-3 rounded border border-slate-100">"A 1:15000 photo using a wide-angle camera. Measured r' = 5.4cm. Point is 60m above datum. Find Δr and corrected r."</p>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-sm font-mono space-y-2">
                        <div className="text-slate-700">Scale = 1:15000, f = 6 inches (0.1524m)</div>
                        <div className="text-slate-700">H = 15000 × 0.1524 = 2286 m</div>
                        <div className="text-purple-800 font-bold mt-2 pt-2 border-t border-purple-200">Δr = (0.054 × 60) / 2286 = <span className="bg-white px-1 rounded">0.001417 m</span> = <span className="bg-white px-1 rounded">0.1417 cm</span></div>
                        <div className="text-blue-800 font-bold">r = 5.4 - 0.1417 = <span className="bg-white px-1 rounded">5.258 cm</span></div>
                      </div>
                    </div>

                    {/* Quiz 1 */}
                    <div className="relative border border-slate-200 border-l-4 border-l-blue-500 p-5 rounded-xl shadow-sm hover:shadow-md transition-all bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-lg text-slate-800">Quiz 1 (Utility Pole)</h4>
                        <button onClick={() => loadPreset('quiz')} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow hover:bg-blue-700 transition-colors active:scale-95">
                          Load Preset
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mb-4 italic bg-slate-50 p-3 rounded border border-slate-100">"Top and bottom of pole are 129.8mm and 125.2mm from principal point. What is height if H above base is 875m?"</p>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm font-mono space-y-2">
                        <div className="text-slate-700">r' (top) = 129.8 mm</div>
                        <div className="text-slate-700">r (bottom) = 125.2 mm (Base is datum)</div>
                        <div className="text-slate-700">Δr = 129.8 - 125.2 = 4.6 mm</div>
                        <div className="text-blue-800 font-bold mt-2 pt-2 border-t border-blue-200">h = (Δr × H) / r'</div>
                        <div className="text-blue-800 font-bold">h = (4.6 × 875) / 129.8 = <span className="bg-white px-1 rounded">31.009 m</span></div>
                      </div>
                    </div>
                    
                    <button onClick={() => loadPreset('default')} className="w-full py-3 mt-4 bg-slate-800 text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-700 transition-colors active:scale-95">
                      Reset to Default Values
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReliefDisplacementExplorer;
