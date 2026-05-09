import React, { useState, useEffect } from 'react';
import { Target, Compass, Ruler, Crosshair, Info, Calculator, Mountain, ArrowUpRight } from 'lucide-react';

const App = () => {
    // State for raw measurements (Simulating what the hardware reads)
    const [hAngle, setHAngle] = useState(45); // Horizontal Angle (Azimuth) 0-360
    const [vAngle, setVAngle] = useState(15); // Vertical Angle (Elevation) -40 to 40
    const [slopeDist, setSlopeDist] = useState(30); // Slope Distance 5-50m

    // Derived values (Calculated by the Total Station's microprocessor)
    const [calc, setCalc] = useState({
        hd: 0, // Horizontal Distance
        vd: 0, // Vertical Difference
        easting: 0, // X coordinate
        northing: 0, // Y coordinate
        elevation: 0 // Z coordinate
    });

    // Calculate coordinates whenever raw inputs change
    useEffect(() => {
        // Convert degrees to radians for Math functions
        const hRad = (hAngle * Math.PI) / 180;
        const vRad = (vAngle * Math.PI) / 180;

        // Trigonometry happening inside the instrument
        const hd = slopeDist * Math.cos(vRad);
        const vd = slopeDist * Math.sin(vRad);

        // Convert polar to cartesian coordinates (assuming North is 0 degrees)
        const easting = hd * Math.sin(hRad); // X
        const northing = hd * Math.cos(hRad); // Y

        setCalc({
            hd: hd.toFixed(2),
            vd: vd.toFixed(2),
            easting: easting.toFixed(2),
            northing: northing.toFixed(2),
            elevation: vd.toFixed(2)
        });
    }, [hAngle, vAngle, slopeDist]);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-emerald-400 flex items-center gap-3">
                            <Crosshair className="w-8 h-8" />
                            Total Station Simulator
                        </h1>
                        <p className="text-slate-400 mt-2">Interactive guide to optical surveying and 3D coordinate calculation</p>
                    </div>
                    <div className="mt-4 md:mt-0 bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center gap-4 text-sm">
                        <div className="text-center">
                            <span className="block text-slate-500 text-xs uppercase tracking-wider">Status</span>
                            <span className="text-emerald-400 font-mono flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Tracking</span>
                        </div>
                        <div className="w-px h-8 bg-slate-700"></div>
                        <div className="text-center">
                            <span className="block text-slate-500 text-xs uppercase tracking-wider">Prism</span>
                            <span className="text-slate-200 font-mono">Locked</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Visualizations */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Top View Visualization */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                            <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-sky-400" />
                                <h2 className="font-semibold text-slate-200">Top-Down View (Azimuth & Northing/Easting)</h2>
                            </div>
                            <div className="p-4 flex justify-center relative">
                                <TopViewSVG hAngle={hAngle} hd={calc.hd} />
                                <div className="absolute top-6 left-6 text-xs text-slate-400 font-mono space-y-1">
                                    <p>Scale: 1 grid = 10m</p>
                                    <p>North = 0° / 360°</p>
                                </div>
                            </div>
                        </div>

                        {/* Side View Visualization */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                            <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex items-center gap-2">
                                <Mountain className="w-5 h-5 text-amber-400" />
                                <h2 className="font-semibold text-slate-200">Side-Profile View (Elevation & Distance)</h2>
                            </div>
                            <div className="p-4 flex justify-center relative overflow-hidden">
                                <SideViewSVG vAngle={vAngle} slopeDist={slopeDist} hd={calc.hd} vd={calc.vd} />
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Controls & Data */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Operator Controls */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-emerald-400" />
                                Instrument Controls
                            </h2>

                            <div className="space-y-6">
                                {/* Horizontal Angle Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-slate-300">Horizontal Angle (Azimuth)</label>
                                        <span className="text-emerald-400 font-mono bg-slate-900 px-2 py-1 rounded text-sm">
                                            {hAngle.toFixed(1)}°
                                        </span>
                                    </div>
                                    <input
                                        type="range" min="0" max="360" step="0.5"
                                        value={hAngle} onChange={(e) => setHAngle(parseFloat(e.target.value))}
                                        className="w-full accent-emerald-500"
                                    />
                                    <p className="text-xs text-slate-500">Rotate telescope left/right.</p>
                                </div>

                                {/* Vertical Angle Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-slate-300">Vertical Angle (Elevation)</label>
                                        <span className="text-amber-400 font-mono bg-slate-900 px-2 py-1 rounded text-sm">
                                            {vAngle > 0 ? '+' : ''}{vAngle.toFixed(1)}°
                                        </span>
                                    </div>
                                    <input
                                        type="range" min="-40" max="40" step="0.5"
                                        value={vAngle} onChange={(e) => setVAngle(parseFloat(e.target.value))}
                                        className="w-full accent-amber-500"
                                    />
                                    <p className="text-xs text-slate-500">Tilt telescope up/down.</p>
                                </div>

                                {/* Slope Distance Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-slate-300">Slope Distance (EDM)</label>
                                        <span className="text-sky-400 font-mono bg-slate-900 px-2 py-1 rounded text-sm">
                                            {slopeDist.toFixed(2)} m
                                        </span>
                                    </div>
                                    <input
                                        type="range" min="5" max="50" step="0.1"
                                        value={slopeDist} onChange={(e) => setSlopeDist(parseFloat(e.target.value))}
                                        className="w-full accent-sky-500"
                                    />
                                    <p className="text-xs text-slate-500">Distance from laser to prism.</p>
                                </div>
                            </div>
                        </div>

                        {/* Real-Time Microprocessor Display */}
                        <div className="bg-slate-900 rounded-xl border border-emerald-500/30 p-1 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <div className="bg-slate-800 rounded-lg p-4">
                                <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Calculator className="w-4 h-4" />
                                    On-Board Computer Output
                                </h2>

                                <div className="space-y-3 font-mono text-sm">
                                    <div className="grid grid-cols-2 gap-4 border-b border-slate-700 pb-3">
                                        <div>
                                            <span className="text-slate-500 block text-xs mb-1">Horiz. Dist (HD)</span>
                                            <span className="text-slate-200">{calc.hd} m</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-xs mb-1">Vert. Diff (VD)</span>
                                            <span className="text-slate-200">{calc.vd} m</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                        <span className="text-slate-400 text-xs block mb-2">Calculated 3D Target Coordinates</span>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sky-400">Easting (X):</span>
                                                <span className="text-slate-200">{calc.easting}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sky-400">Northing (Y):</span>
                                                <span className="text-slate-200">{calc.northing}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-amber-400">Elevation (Z):</span>
                                                <span className="text-slate-200">{calc.elevation}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Educational Info */}
                        <div className="bg-indigo-950/40 rounded-xl border border-indigo-500/30 p-5">
                            <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                How It Works
                            </h2>
                            <ul className="text-sm text-indigo-200/80 space-y-3">
                                <li><strong className="text-indigo-300">EDM (Laser):</strong> Shoots an infrared beam to the prism. Measures the "Time of Flight" or phase-shift to calculate the precise <span className="text-white text-xs bg-indigo-900/80 px-1 rounded">Slope Distance</span>.</li>
                                <li><strong className="text-indigo-300">Theodolite:</strong> Uses electronic rotary encoders to measure horizontal and vertical <span className="text-white text-xs bg-indigo-900/80 px-1 rounded">Angles</span> with sub-millimeter precision.</li>
                                <li><strong className="text-indigo-300">Microprocessor:</strong> Applies standard trigonometry instantly to convert these polar measurements into usable Cartesian <span className="text-white text-xs bg-indigo-900/80 px-1 rounded">X, Y, Z</span> coordinates for mapping.</li>
                            </ul>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// SVG COMPONENT: TOP DOWN VIEW
// ==========================================
const TopViewSVG = ({ hAngle, hd }) => {
    const size = 320;
    const center = size / 2;
    const scale = 2.5; // pixels per meter

    // Calculate target position based on azimuth (0 is up/North)
    const angleRad = (hAngle * Math.PI) / 180;
    const targetX = center + hd * scale * Math.sin(angleRad);
    const targetY = center - hd * scale * Math.cos(angleRad); // - because SVG Y goes down

    // Generate grid circles
    const grids = [10, 20, 30, 40, 50];

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-slate-900 rounded-lg">
            {/* Grid */}
            <line x1={center} y1="0" x2={center} y2={size} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1={center} x2={size} y2={center} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

            {grids.map(g => (
                <circle key={g} cx={center} cy={center} r={g * scale} fill="none" stroke="#1e293b" strokeWidth="2" />
            ))}

            {/* North Indicator */}
            <text x={center} y="20" fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="bold">N</text>
            <text x={size - 15} y={center + 4} fill="#94a3b8" fontSize="12">E</text>

            {/* Angle Arc */}
            <path
                d={`M ${center} ${center - 40} A 40 40 0 ${hAngle > 180 ? 1 : 0} 1 ${center + 40 * Math.sin(angleRad)} ${center - 40 * Math.cos(angleRad)}`}
                fill="none" stroke="#10b981" strokeWidth="2" opacity="0.6"
            />
            <text x={center + 20} y={center - 20} fill="#10b981" fontSize="12" fontWeight="bold">{hAngle.toFixed(1)}°</text>

            {/* Laser Line */}
            <line x1={center} y1={center} x2={targetX} y2={targetY} stroke="#38bdf8" strokeWidth="2" />

            {/* Target (Prism) */}
            <circle cx={targetX} cy={targetY} r="6" fill="#ef4444" />
            <circle cx={targetX} cy={targetY} r="3" fill="#fff" />
            <text x={targetX + 10} y={targetY - 10} fill="#f8fafc" fontSize="10" className="font-mono">
                HD: {hd}m
            </text>

            {/* Station */}
            <circle cx={center} cy={center} r="6" fill="#fbbf24" />
            <polygon points={`${center},${center - 4} ${center - 4},${center + 4} ${center + 4},${center + 4}`} fill="#000" />
        </svg>
    );
};

// ==========================================
// SVG COMPONENT: SIDE PROFILE VIEW
// ==========================================
const SideViewSVG = ({ vAngle, slopeDist, hd, vd }) => {
    const width = 600;
    const height = 300;

    // Base coordinates
    const groundY = 250;
    const stationX = 80;
    const instHeight = 100; // pixels
    const instY = groundY - instHeight;

    const scale = 8; // pixels per meter

    // Target calculations
    const targetX = stationX + hd * scale;
    const targetY = instY - vd * scale; // -vd because Y goes up

    const targetGroundY = targetY + instHeight; // Assume prism pole is same height as tripod

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-slate-900 rounded-lg w-full">

            {/* Ground Profile */}
            <path
                d={`M 0 ${groundY} L ${stationX} ${groundY} L ${targetX} ${targetGroundY} L ${width} ${targetGroundY} L ${width} ${height} L 0 ${height} Z`}
                fill="#1e293b"
            />
            <path
                d={`M 0 ${groundY} L ${stationX} ${groundY} L ${targetX} ${targetGroundY} L ${width} ${targetGroundY}`}
                fill="none" stroke="#475569" strokeWidth="3"
            />

            {/* Horizontal Datum Line */}
            <line x1={stationX} y1={instY} x2={targetX + 40} y2={instY} stroke="#334155" strokeWidth="2" strokeDasharray="6 6" />

            {/* Angle Arc */}
            <path
                d={`M ${stationX + 60} ${instY} A 60 60 0 0 ${vAngle < 0 ? 1 : 0} ${stationX + 60 * Math.cos(vAngle * Math.PI / 180)} ${instY - 60 * Math.sin(vAngle * Math.PI / 180)}`}
                fill="none" stroke="#fbbf24" strokeWidth="2"
            />
            <text x={stationX + 70} y={instY + (vAngle > 0 ? -15 : 25)} fill="#fbbf24" fontSize="12" fontWeight="bold">
                {Math.abs(vAngle).toFixed(1)}°
            </text>

            {/* Vertical Difference Line (VD) */}
            <line x1={targetX} y1={instY} x2={targetX} y2={targetY} stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 4" />
            <text x={targetX + 10} y={instY - (vd * scale) / 2} fill="#fbbf24" fontSize="12" className="font-mono">
                VD: {vd}m
            </text>

            {/* Horizontal Distance Line (HD) */}
            <text x={stationX + (hd * scale) / 2 - 20} y={instY + 15} fill="#94a3b8" fontSize="12" className="font-mono">
                HD: {hd}m
            </text>

            {/* Slope Distance Line (Laser) */}
            <line x1={stationX} y1={instY} x2={targetX} y2={targetY} stroke="#38bdf8" strokeWidth="3" />
            {/* Slope distance text (rotated along line) */}
            <text
                x={stationX + (targetX - stationX) / 2}
                y={instY + (targetY - instY) / 2 - 10}
                fill="#38bdf8" fontSize="14" fontWeight="bold" className="font-mono"
                transform={`rotate(${-vAngle}, ${stationX + (targetX - stationX) / 2}, ${instY + (targetY - instY) / 2})`}
                textAnchor="middle"
            >
                S: {slopeDist.toFixed(2)}m
            </text>

            {/* Prism Pole */}
            <line x1={targetX} y1={targetY} x2={targetX} y2={targetGroundY} stroke="#f1f5f9" strokeWidth="4" />
            <line x1={targetX - 1} y1={targetY} x2={targetX - 1} y2={targetGroundY} stroke="#ef4444" strokeWidth="2" strokeDasharray="10 10" />

            {/* Prism Target */}
            <circle cx={targetX} cy={targetY} r="8" fill="#ef4444" stroke="#fff" strokeWidth="2" />
            <polygon points={`${targetX - 4},${targetY} ${targetX},${targetY - 4} ${targetX + 4},${targetY} ${targetX},${targetY + 4}`} fill="#fff" />

            {/* Tripod */}
            <line x1={stationX} y1={instY} x2={stationX - 25} y2={groundY} stroke="#cbd5e1" strokeWidth="4" />
            <line x1={stationX} y1={instY} x2={stationX + 25} y2={groundY} stroke="#94a3b8" strokeWidth="4" />
            <line x1={stationX} y1={instY} x2={stationX} y2={groundY} stroke="#64748b" strokeWidth="4" />

            {/* Instrument Body */}
            <rect x={stationX - 12} y={instY - 15} width="24" height="20" rx="4" fill="#fbbf24" />
            <rect x={stationX - 8} y={instY - 25} width="16" height="10" rx="2" fill="#1e293b" />
            <circle cx={stationX} cy={instY} r="4" fill="#10b981" />

            {/* Telescope barrel (points at target) */}
            <g transform={`rotate(${-vAngle}, ${stationX}, ${instY})`}>
                <rect x={stationX - 10} y={instY - 5} width="30" height="10" rx="2" fill="#334155" />
                <rect x={stationX + 20} y={instY - 6} width="5" height="12" fill="#0f172a" />
            </g>
        </svg>
    );
};

export default App;

export const metadata = {
  id: 'total-station-2',
  title: 'Total Station 2',
  description: 'Interactive guide to optical surveying and 3D coordinate calculation from different angles.',
  iconName: 'Compass',
  category: 'Surveying',
  status: 'Available'
};