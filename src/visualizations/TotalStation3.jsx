import React, { useState, useEffect, useRef } from 'react';
import { Crosshair, MapPin, List, Info, Navigation, Play, RotateCcw, Activity } from 'lucide-react';

const TotalStationApp = () => {
    const [step, setStep] = useState(0); // 0: Setup, 1: Backsight, 2: Measure
    const [instrumentSetup, setInstrumentSetup] = useState(false);
    const [backsightSet, setBacksightSet] = useState(false);
    const [prismPos, setPrismPos] = useState({ x: 450, y: 150 });
    const [measurements, setMeasurements] = useState([]);
    const [laserActive, setLaserActive] = useState(false);
    const [displayData, setDisplayData] = useState({ ha: "000° 00' 00\"", hd: "0.000 m" });

    // Map configuration
    const PIXEL_SCALE = 0.1; // 1 pixel = 0.1 meters
    const BASE_EASTING = 1000.0;
    const BASE_NORTHING = 1000.0;

    const STATION_POS = { x: 300, y: 350 };
    const BACKSIGHT_POS = { x: 300, y: 50 }; // Straight North for simplicity

    // Helper to calculate surveying data
    const calculateData = (targetPos) => {
        const dx = targetPos.x - STATION_POS.x;
        const dy = STATION_POS.y - targetPos.y; // Invert Y because SVG Y goes down, Northing goes up

        // Distance
        const pxDistance = Math.hypot(dx, dy);
        const mDistance = pxDistance * PIXEL_SCALE;

        // Angle (Azimuth from North/Backsight)
        let angleRad = Math.atan2(dx, dy);
        let angleDeg = angleRad * (180 / Math.PI);
        if (angleDeg < 0) angleDeg += 360;

        // Format Angle (DD MM SS)
        const d = Math.floor(angleDeg);
        const minFloat = (angleDeg - d) * 60;
        const m = Math.floor(minFloat);
        const s = Math.floor((minFloat - m) * 60);
        const formattedAngle = `${d.toString().padStart(3, '0')}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;

        // Coordinates
        const easting = BASE_EASTING + (dx * PIXEL_SCALE);
        const northing = BASE_NORTHING + (dy * PIXEL_SCALE);

        return {
            distance: mDistance.toFixed(3),
            angle: formattedAngle,
            rawAngle: angleDeg,
            easting: easting.toFixed(3),
            northing: northing.toFixed(3)
        };
    };

    // Update real-time display when prism moves
    useEffect(() => {
        if (instrumentSetup && backsightSet) {
            const data = calculateData(prismPos);
            setDisplayData({
                ha: data.angle,
                hd: "---.--- m" // Distance only shows when measured
            });
        }
    }, [prismPos, instrumentSetup, backsightSet]);

    const handleMapClick = (e) => {
        if (step !== 2) return;

        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        // Boundary checks
        const x = Math.max(20, Math.min(580, svgP.x));
        const y = Math.max(20, Math.min(480, svgP.y));

        setPrismPos({ x, y });
    };

    const handleSetup = () => {
        setInstrumentSetup(true);
        setStep(1);
    };

    const handleBacksight = () => {
        setBacksightSet(true);
        setStep(2);
    };

    const takeMeasurement = () => {
        if (!instrumentSetup || !backsightSet) return;

        setLaserActive(true);
        const data = calculateData(prismPos);

        setDisplayData({
            ha: data.angle,
            hd: `${data.distance} m`
        });

        setTimeout(() => {
            setLaserActive(false);
            setMeasurements(prev => [...prev, {
                id: `PT-${prev.length + 1}`,
                ...data
            }]);
        }, 600); // Laser flash duration
    };

    const resetSurvey = () => {
        setStep(0);
        setInstrumentSetup(false);
        setBacksightSet(false);
        setMeasurements([]);
        setPrismPos({ x: 450, y: 150 });
        setDisplayData({ ha: "000° 00' 00\"", hd: "0.000 m" });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 md:p-8">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Crosshair className="text-yellow-500" size={32} />
                            Total Station Field Survey
                        </h1>
                        <p className="text-slate-400 mt-2">Interactive simulation of optical coordinate measurement.</p>
                    </div>
                    <button
                        onClick={resetSurvey}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                    >
                        <RotateCcw size={16} /> Reset
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Panel: Controls & Steps */}
                    <div className="lg:col-span-1 space-y-4">

                        {/* Step Wizard */}
                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Navigation size={20} className="text-blue-400" />
                                Procedure
                            </h2>

                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">

                                {/* Step 1 */}
                                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active ${step === 0 ? 'opacity-100' : 'opacity-50'}`}>
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow flex-shrink-0 ${step >= 0 ? 'bg-yellow-500' : 'bg-slate-700'}`}>
                                        <span className="text-slate-900 font-bold">1</span>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-slate-700 bg-slate-800/50 shadow-sm">
                                        <h3 className="font-bold text-white mb-1">Setup & Level</h3>
                                        <p className="text-xs text-slate-400 mb-3">Place the instrument precisely over a known control point.</p>
                                        {step === 0 && (
                                            <button onClick={handleSetup} className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded text-sm transition-colors shadow-[0_0_15px_rgba(202,138,4,0.4)]">
                                                Setup Instrument
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active ${step === 1 ? 'opacity-100' : 'opacity-50'}`}>
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow flex-shrink-0 ${step >= 1 ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                        <span className="text-white font-bold">2</span>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-slate-700 bg-slate-800/50 shadow-sm">
                                        <h3 className="font-bold text-white mb-1">Backsight</h3>
                                        <p className="text-xs text-slate-400 mb-3">Aim at a second known point to establish the 0° reference azimuth.</p>
                                        {step === 1 && (
                                            <button onClick={handleBacksight} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded text-sm transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                                Set 0° to Backsight
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active ${step === 2 ? 'opacity-100' : 'opacity-50'}`}>
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow flex-shrink-0 ${step >= 2 ? 'bg-red-500' : 'bg-slate-700'}`}>
                                        <span className="text-white font-bold">3</span>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-slate-700 bg-slate-800/50 shadow-sm">
                                        <h3 className="font-bold text-white mb-1">Foresight</h3>
                                        <p className="text-xs text-slate-400 mb-3">Place the prism target on the map and trigger the EDM laser.</p>
                                        {step === 2 && (
                                            <button onClick={takeMeasurement} className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                                                <Play size={16} fill="currentColor" /> Measure Point
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instrument Display Simulator */}
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-xl font-mono relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500"></div>
                            <h3 className="text-xs text-slate-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                                <span>Leica TS-16 Display</span>
                                <Activity size={14} className={laserActive ? "text-red-500 animate-pulse" : "text-slate-600"} />
                            </h3>

                            <div className="bg-emerald-900/40 border border-emerald-800/50 rounded p-3 mb-2 shadow-inner">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-emerald-500/70 text-xs">HA (Angle):</span>
                                    <span className={`text-xl text-emerald-400 font-bold ${!backsightSet && 'opacity-30'}`}>{displayData.ha}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-emerald-500/70 text-xs">HD (Dist):</span>
                                    <span className={`text-xl text-emerald-400 font-bold ${!backsightSet && 'opacity-30'}`}>{displayData.hd}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3">
                                <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                                    <span className="block text-[10px] text-slate-500">Easting (X)</span>
                                    <span className="text-sm text-slate-300">{instrumentSetup ? BASE_EASTING.toFixed(3) : "----.---"}</span>
                                </div>
                                <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                                    <span className="block text-[10px] text-slate-500">Northing (Y)</span>
                                    <span className="text-sm text-slate-300">{instrumentSetup ? BASE_NORTHING.toFixed(3) : "----.---"}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Panel: Map & Data */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Field Map Canvas */}
                        <div className="bg-[#1a2e25] rounded-xl border-2 border-slate-700 relative overflow-hidden shadow-2xl touch-none">
                            {step === 2 && (
                                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 border border-slate-700 flex items-center gap-2 pointer-events-none z-10">
                                    <MapPin size={14} className="text-red-400" /> Click anywhere on grid to move prism
                                </div>
                            )}

                            <svg
                                viewBox="0 0 600 500"
                                className="w-full h-auto cursor-crosshair"
                                onClick={handleMapClick}
                            >
                                {/* Grid */}
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                    </pattern>
                                    <filter id="glow">
                                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <rect width="600" height="500" fill="url(#grid)" />

                                {/* Topography details (decorative) */}
                                <path d="M 100 500 Q 150 300 0 200" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="40" />
                                <path d="M 400 0 Q 500 200 600 150" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="60" />

                                {/* Known Control Points */}
                                {/* Point A (Station) */}
                                <g transform={`translate(${STATION_POS.x}, ${STATION_POS.y})`}>
                                    <polygon points="-8,8 8,8 0,-8" fill="rgba(59, 130, 246, 0.4)" stroke="#3b82f6" strokeWidth="2" />
                                    <text x="12" y="4" fill="#60a5fa" fontSize="12" fontFamily="sans-serif">Control A</text>
                                </g>

                                {/* Point B (Backsight) */}
                                <g transform={`translate(${BACKSIGHT_POS.x}, ${BACKSIGHT_POS.y})`}>
                                    <polygon points="-8,8 8,8 0,-8" fill="rgba(59, 130, 246, 0.4)" stroke="#3b82f6" strokeWidth="2" />
                                    <text x="12" y="4" fill="#60a5fa" fontSize="12" fontFamily="sans-serif">Control B (North)</text>
                                </g>

                                {/* Base Line (Azimuth 0) */}
                                {backsightSet && (
                                    <line
                                        x1={STATION_POS.x} y1={STATION_POS.y}
                                        x2={BACKSIGHT_POS.x} y2={BACKSIGHT_POS.y}
                                        stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="5,5"
                                    />
                                )}

                                {/* Laser EDM Beam */}
                                {laserActive && (
                                    <line
                                        x1={STATION_POS.x} y1={STATION_POS.y}
                                        x2={prismPos.x} y2={prismPos.y}
                                        stroke="#ef4444" strokeWidth="3" filter="url(#glow)"
                                    />
                                )}

                                {/* Angle Arc Visualization */}
                                {backsightSet && step === 2 && (
                                    <path
                                        d={`M ${STATION_POS.x} ${STATION_POS.y - 40} A 40 40 0 ${prismPos.x < STATION_POS.x ? 1 : 0} 1 ${STATION_POS.x + (prismPos.x - STATION_POS.x) * (40 / Math.hypot(prismPos.x - STATION_POS.x, STATION_POS.y - prismPos.y))} ${STATION_POS.y - (STATION_POS.y - prismPos.y) * (40 / Math.hypot(prismPos.x - STATION_POS.x, STATION_POS.y - prismPos.y))}`}
                                        fill="none" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="20"
                                    />
                                )}

                                {/* Measured Points History */}
                                {measurements.map((m, idx) => {
                                    // Reverse calculate screen pos from coords for plotting
                                    const px = STATION_POS.x + ((m.easting - BASE_EASTING) / PIXEL_SCALE);
                                    const py = STATION_POS.y - ((m.northing - BASE_NORTHING) / PIXEL_SCALE);
                                    return (
                                        <g key={idx} transform={`translate(${px}, ${py})`}>
                                            <circle cx="0" cy="0" r="3" fill="#10b981" />
                                            <text x="6" y="-6" fill="#10b981" fontSize="10">{m.id}</text>
                                        </g>
                                    )
                                })}

                                {/* Instrument Model */}
                                {instrumentSetup && (
                                    <g transform={`translate(${STATION_POS.x}, ${STATION_POS.y})`}>
                                        {/* Tripod legs */}
                                        <line x1="0" y1="-5" x2="-15" y2="20" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                                        <line x1="0" y1="-5" x2="15" y2="20" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                                        <line x1="0" y1="-5" x2="0" y2="25" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
                                        {/* TS Body */}
                                        <rect x="-8" y="-12" width="16" height="12" fill="#f59e0b" rx="2" />
                                        <circle cx="0" cy="-6" r="4" fill="#334155" />
                                        {/* Dynamic Lens pointing at prism */}
                                        <g transform={`rotate(${backsightSet && step === 2 ? calculateData(prismPos).rawAngle : 0})`}>
                                            <line x1="0" y1="-6" x2="0" y2="-18" stroke="#f1f5f9" strokeWidth="4" strokeLinecap="round" />
                                        </g>
                                    </g>
                                )}

                                {/* Prism Target Model */}
                                {step === 2 && (
                                    <g
                                        transform={`translate(${prismPos.x}, ${prismPos.y})`}
                                        style={{ transition: laserActive ? 'none' : 'transform 0.2s ease-out' }}
                                    >
                                        {/* Pole */}
                                        <line x1="0" y1="0" x2="0" y2="30" stroke="#94a3b8" strokeWidth="2" />
                                        {/* Target Plate */}
                                        <rect x="-8" y="-8" width="16" height="16" fill="#ef4444" rx="1" />
                                        <circle cx="0" cy="0" r="5" fill="#fef08a" />
                                        <circle cx="0" cy="0" r="2" fill="#000" />
                                    </g>
                                )}
                            </svg>
                        </div>

                        {/* Recorded Data Table */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                            <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex items-center gap-2">
                                <List size={18} className="text-emerald-400" />
                                <h3 className="font-semibold text-white">Recorded Coordinates (Point Data)</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-400 bg-slate-900/50 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Point ID</th>
                                            <th className="px-4 py-3">Horiz. Angle</th>
                                            <th className="px-4 py-3">Dist. (m)</th>
                                            <th className="px-4 py-3 text-emerald-400">Easting (X)</th>
                                            <th className="px-4 py-3 text-emerald-400">Northing (Y)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {measurements.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-slate-500 italic">
                                                    No points recorded yet. Complete setup and measure targets.
                                                </td>
                                            </tr>
                                        ) : (
                                            measurements.map((m) => (
                                                <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                                                    <td className="px-4 py-2 font-medium text-slate-200">{m.id}</td>
                                                    <td className="px-4 py-2 font-mono text-slate-300">{m.angle}</td>
                                                    <td className="px-4 py-2 font-mono text-slate-300">{m.distance}</td>
                                                    <td className="px-4 py-2 font-mono text-emerald-400 font-bold">{m.easting}</td>
                                                    <td className="px-4 py-2 font-mono text-emerald-400 font-bold">{m.northing}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Educational Info Footer */}
                <div className="mt-8 bg-blue-900/20 border border-blue-800/50 rounded-xl p-5 flex gap-4">
                    <Info size={24} className="text-blue-400 shrink-0 mt-1" />
                    <div className="text-sm text-slate-300 space-y-2">
                        <p><strong className="text-slate-100">How this works:</strong> A Total Station combines an electronic theodolite (measures angles) and an Electronic Distance Meter or EDM (measures distance using a laser/infrared beam). By setting it up on a known point (Easting, Northing, Elevation) and referencing another known point (Backsight), it creates a local coordinate grid.</p>
                        <p>Using Trigonometry (<code className="text-blue-300 bg-blue-950/50 px-1 rounded">X = Distance × sin(Angle)</code> and <code className="text-blue-300 bg-blue-950/50 px-1 rounded">Y = Distance × cos(Angle)</code>), the instrument's onboard computer instantly calculates the exact coordinates of any point the prism target is placed on.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TotalStationApp;

export const metadata = {
  id: 'total-station-3',
  title: 'Total Station 3',
  description: 'Interactive simulation of optical coordinate measurement and data recording.',
  iconName: 'Target',
  category: 'Surveying',
  status: 'Available'
};