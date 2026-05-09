import React, { useState, useEffect, useRef } from 'react';
import { Target, Map, MapPin, Compass, Play, CheckCircle2, RotateCcw, Crosshair, Navigation, Database } from 'lucide-react';

// Utility for formatting angles to Degrees° Minutes' Seconds"
const formatDMS = (decimalDegrees) => {
    const d = Math.floor(decimalDegrees);
    const minFloat = (decimalDegrees - d) * 60;
    const m = Math.floor(minFloat);
    const s = Math.round((minFloat - m) * 60);
    return `${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
};

// Coordinate transformations
const STATION_SVG_X = 300;
const STATION_SVG_Y = 350;
const STATION_EASTING = 1000.000;
const STATION_NORTHING = 1000.000;
const SCALE = 0.2; // 1 pixel = 0.2 meters

const svgToCoords = (x, y) => ({
    easting: STATION_EASTING + (x - STATION_SVG_X) * SCALE,
    northing: STATION_NORTHING + (STATION_SVG_Y - y) * SCALE, // Invert Y
});

export default function App() {
    const [step, setStep] = useState(0);

    // Step 1: Leveling State
    const [pitch, setPitch] = useState(45);
    const [roll, setRoll] = useState(-30);
    const [isLevel, setIsLevel] = useState(false);

    // Step 2 & 3: Measurement State
    const [backsightSet, setBacksightSet] = useState(false);
    const [target, setTarget] = useState(null); // {x, y} in SVG coords
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [measuredPoints, setMeasuredPoints] = useState([]);

    // Check leveling status
    useEffect(() => {
        const dist = Math.sqrt(pitch * pitch + roll * roll);
        if (dist < 10) {
            setIsLevel(true);
        } else {
            setIsLevel(false);
        }
    }, [pitch, roll]);

    const handleMapClick = (e) => {
        if (step !== 3 || isMeasuring) return;

        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();

        // Calculate click coordinates relative to the SVG viewBox
        const scaleX = 600 / rect.width;
        const scaleY = 500 / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setTarget({ x, y });
    };

    const takeMeasurement = () => {
        if (!target) return;
        setIsMeasuring(true);

        setTimeout(() => {
            // Calculate data
            const dx = target.x - STATION_SVG_X;
            const dy = STATION_SVG_Y - target.y; // Positive is up

            const distance = Math.sqrt(dx * dx + dy * dy) * SCALE;

            // Calculate angle clockwise from North (Backsight)
            let angleRad = Math.atan2(dx, dy);
            if (angleRad < 0) angleRad += 2 * Math.PI;
            const angleDeg = angleRad * (180 / Math.PI);

            const coords = svgToCoords(target.x, target.y);

            const newPoint = {
                id: measuredPoints.length + 1,
                easting: coords.easting.toFixed(3),
                northing: coords.northing.toFixed(3),
                distance: distance.toFixed(3),
                angle: angleDeg,
                svgX: target.x,
                svgY: target.y
            };

            setMeasuredPoints([...measuredPoints, newPoint]);
            setIsMeasuring(false);
            setTarget(null);
        }, 1500); // 1.5s measurement delay for effect
    };

    const resetSimulation = () => {
        setStep(0);
        setPitch(45);
        setRoll(-30);
        setBacksightSet(false);
        setTarget(null);
        setMeasuredPoints([]);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
            {/* Header */}
            <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Navigation className="w-8 h-8 text-blue-400" />
                    <h1 className="text-xl font-bold tracking-wide">Total Station Simulator</h1>
                </div>
                <div className="text-sm text-slate-400 hidden sm:block">
                    Interactive Surveying Training
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 gap-6">

                {/* Left Sidebar: Controls & Instructions */}
                <aside className="w-full lg:w-1/3 flex flex-col gap-4">

                    {/* Progress Indicator */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Survey Process</h2>
                        <div className="space-y-3">
                            {[
                                { s: 0, label: 'Introduction', icon: Compass },
                                { s: 1, label: 'Setup & Leveling', icon: Target },
                                { s: 2, label: 'Backsight (Zeroing)', icon: Crosshair },
                                { s: 3, label: 'Foresight & Measuring', icon: MapPin },
                                { s: 4, label: 'Review Data', icon: Database }
                            ].map((item) => (
                                <div key={item.s} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${step === item.s ? 'bg-blue-50 text-blue-700 border border-blue-100' : step > item.s ? 'text-slate-400' : 'text-slate-400'}`}>
                                    {step > item.s ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <item.icon className={`w-5 h-5 ${step === item.s ? 'text-blue-600' : 'text-slate-300'}`} />}
                                    <span className={`font-medium ${step === item.s ? 'text-blue-700' : ''}`}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Instruction Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col">

                        {step === 0 && (
                            <div className="space-y-4 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-slate-800">What is a Total Station?</h2>
                                <p className="text-slate-600 leading-relaxed">
                                    A Total Station is a modern optical and electronic instrument used in surveying and building construction. It is a combination of an electronic theodolite (for measuring angles) and an electronic distance meter (EDM).
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    By measuring the <strong>horizontal angle</strong>, <strong>vertical angle</strong>, and <strong>slope distance</strong> to a target prism, its onboard computer calculates the exact X, Y, and Z coordinates of that target.
                                </p>
                                <button onClick={() => setStep(1)} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                    Start Simulation <Play className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-4 animate-fadeIn flex flex-col h-full">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Step 1: Leveling</h2>
                                    <p className="text-slate-600 text-sm">
                                        Before measuring, the instrument must be perfectly level over the known Station point so that horizontal angles are true to gravity.
                                    </p>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center py-6">
                                    {/* Bubble Level Graphic */}
                                    <div className="relative w-48 h-48 bg-slate-200 rounded-full border-4 border-slate-300 flex items-center justify-center shadow-inner overflow-hidden mb-6">
                                        <div className="absolute w-24 h-24 rounded-full border-2 border-slate-400"></div>
                                        <div className="absolute w-12 h-12 rounded-full border border-slate-400 bg-slate-300/30"></div>
                                        {/* The Bubble */}
                                        <div
                                            className={`absolute w-10 h-10 rounded-full shadow-sm transition-all duration-100 ease-out ${isLevel ? 'bg-emerald-400' : 'bg-green-300/80 backdrop-blur-sm'}`}
                                            style={{ transform: `translate(${pitch}px, ${roll}px)` }}
                                        ></div>
                                        {/* Crosshairs */}
                                        <div className="absolute w-full h-px bg-slate-400/50"></div>
                                        <div className="absolute h-full w-px bg-slate-400/50"></div>
                                    </div>

                                    {/* Sliders */}
                                    <div className="w-full space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase flex justify-between">
                                                <span>X-Axis Screw (Pitch)</span>
                                                <span className="text-slate-400">{pitch}</span>
                                            </label>
                                            <input type="range" min="-70" max="70" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase flex justify-between">
                                                <span>Y-Axis Screw (Roll)</span>
                                                <span className="text-slate-400">{roll}</span>
                                            </label>
                                            <input type="range" min="-70" max="70" value={roll} onChange={(e) => setRoll(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    {isLevel ? (
                                        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-200 text-sm mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5" /> Instrument is level!
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 text-amber-700 p-3 rounded-lg border border-amber-200 text-sm mb-4">
                                            Adjust the sliders to center the bubble in the innermost ring.
                                        </div>
                                    )}
                                    <button
                                        disabled={!isLevel}
                                        onClick={() => setStep(2)}
                                        className={`w-full font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${isLevel ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                    >
                                        Proceed to Backsight
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-fadeIn flex flex-col h-full">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Step 2: Backsight</h2>
                                    <p className="text-slate-600 text-sm">
                                        The total station is level, but it doesn't know which way is "North". We aim it at a known reference point (Backsight) and set the instrument's angle to 0°00'00".
                                    </p>
                                </div>

                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                                        <ul className="text-sm space-y-2 text-slate-700">
                                            <li className="flex justify-between border-b pb-1"><span>Station (Current):</span> <span className="font-mono">E: 1000.000, N: 1000.000</span></li>
                                            <li className="flex justify-between border-b pb-1"><span>Backsight (Target):</span> <span className="font-mono">E: 1000.000, N: 1050.000</span></li>
                                            <li className="flex justify-between text-blue-700 font-semibold pt-1"><span>Current Angle:</span> <span className="font-mono">{backsightSet ? "0° 00' 00\"" : "134° 42' 15\""}</span></li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    {!backsightSet ? (
                                        <button onClick={() => setBacksightSet(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                            <Crosshair className="w-5 h-5" /> Aim at Backsight & Set 0°
                                        </button>
                                    ) : (
                                        <button onClick={() => setStep(3)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors animate-pulse">
                                            Ready. Start Measuring
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4 animate-fadeIn flex flex-col h-full">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Step 3: Measurement</h2>
                                    <p className="text-slate-600 text-sm">
                                        Your assistant is holding a prism reflector. <strong>Click anywhere on the map</strong> to place the prism, then click Measure to shoot the laser.
                                    </p>
                                </div>

                                {target && !isMeasuring && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mt-4 flex items-start gap-2">
                                        <Target className="w-5 h-5 shrink-0 mt-0.5" />
                                        <p>Prism placed. Press "Measure" to shoot the Electronic Distance Meter (EDM).</p>
                                    </div>
                                )}

                                {isMeasuring && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mt-4 flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-red-500 animate-ping"></div>
                                        Measuring distance and angle...
                                    </div>
                                )}

                                <div className="mt-auto">
                                    <button
                                        disabled={!target || isMeasuring}
                                        onClick={takeMeasurement}
                                        className={`w-full font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${(!target || isMeasuring) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/30'}`}
                                    >
                                        <Target className="w-5 h-5" /> {isMeasuring ? 'Measuring...' : 'Measure Point'}
                                    </button>
                                    {measuredPoints.length > 0 && !isMeasuring && (
                                        <button onClick={() => setStep(4)} className="w-full mt-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                                            Review Collected Data ({measuredPoints.length})
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-4 animate-fadeIn flex flex-col h-full">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Step 4: Survey Data</h2>
                                    <p className="text-slate-600 text-sm mb-4">
                                        The onboard computer used Trigonometry <code>(East = East₀ + Dist × sin(Angle))</code> to calculate the coordinates of every point you shot.
                                    </p>
                                </div>

                                <div className="flex-1 overflow-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-100 text-slate-600 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2">Pt</th>
                                                <th className="px-3 py-2">Angle</th>
                                                <th className="px-3 py-2">Dist(m)</th>
                                                <th className="px-3 py-2">Easting</th>
                                                <th className="px-3 py-2">Northing</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-mono text-xs">
                                            {measuredPoints.map(pt => (
                                                <tr key={pt.id} className="hover:bg-slate-50">
                                                    <td className="px-3 py-2 font-bold text-blue-600">P{pt.id}</td>
                                                    <td className="px-3 py-2">{formatDMS(pt.angle)}</td>
                                                    <td className="px-3 py-2">{pt.distance}</td>
                                                    <td className="px-3 py-2">{pt.easting}</td>
                                                    <td className="px-3 py-2">{pt.northing}</td>
                                                </tr>
                                            ))}
                                            {measuredPoints.length === 0 && (
                                                <tr><td colSpan="5" className="text-center py-8 text-slate-400 font-sans">No points measured.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-100">
                                    <button onClick={resetSimulation} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                        <RotateCcw className="w-5 h-5" /> Start New Survey
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </aside>

                {/* Right Area: Interactive Visualization Map */}
                <section className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">

                    {step === 0 && (
                        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center p-8">
                            <div className="text-center max-w-lg">
                                <Compass className="w-24 h-24 text-blue-500 mx-auto mb-6 animate-pulse" strokeWidth={1} />
                                <h3 className="text-3xl font-light text-white mb-4">Total Station Interactive Tool</h3>
                                <p className="text-slate-400">Follow the steps on the left to learn how professionals map the physical world into digital coordinates using lasers and angles.</p>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDQwIEwgNDAgNDAgTCA0MCAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlMmU4ZjAiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]">
                            {/* Isometric representation of a tripod/station */}
                            <div className="relative">
                                <div className="w-32 h-64 relative">
                                    {/* Tripod Legs */}
                                    <div className="absolute top-16 left-1/2 w-1 h-48 bg-slate-400 -translate-x-12 rotate-12 origin-top rounded"></div>
                                    <div className="absolute top-16 left-1/2 w-1 h-48 bg-slate-400 translate-x-12 -rotate-12 origin-top rounded"></div>
                                    <div className="absolute top-16 left-1/2 w-1 h-48 bg-slate-500 origin-top rounded"></div>

                                    {/* Base Plate */}
                                    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-700 rounded-full"></div>

                                    {/* Instrument Body */}
                                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-blue-600 rounded-lg shadow-lg flex items-center justify-center transition-transform duration-300 ${isLevel ? 'rotate-0' : '-rotate-6'}`}>
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                            <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                                        </div>
                                    </div>

                                    {/* Laser Plummet indication */}
                                    <div className="absolute top-16 left-1/2 w-px h-48 bg-red-400/50 dashed"></div>

                                    {/* Ground Mark */}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-red-500 rounded-[100%] shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step >= 2 && (
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 600 500"
                            className={`cursor-${step === 3 ? 'crosshair' : 'default'} bg-slate-50`}
                            onClick={handleMapClick}
                            style={{
                                backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDQwIEwgNDAgNDAgTCA0MCAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlMmU4ZjAiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==")`
                            }}
                        >
                            <defs>
                                {/* Arrowhead marker */}
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626" />
                                </marker>
                            </defs>

                            {/* Map Grid Labels */}
                            <text x="10" y="20" fill="#94a3b8" fontSize="12" fontFamily="monospace">North &uarr;</text>

                            {/* Base Station Point (Known Point A) */}
                            <g transform={`translate(${STATION_SVG_X}, ${STATION_SVG_Y})`}>
                                {/* Range circles for aesthetics */}
                                <circle cx="0" cy="0" r="100" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,5" />
                                <circle cx="0" cy="0" r="200" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,5" />

                                <polygon points="0,-10 10,10 -10,10" fill="#2563eb" />
                                <circle cx="0" cy="0" r="3" fill="#ffffff" />
                                <text x="15" y="5" fill="#1e40af" fontSize="14" fontWeight="bold">STATION (A)</text>
                                <text x="15" y="20" fill="#64748b" fontSize="10" fontFamily="monospace">1000.00, 1000.00</text>
                            </g>

                            {/* Backsight Point (Known Point B) */}
                            <g transform={`translate(${STATION_SVG_X}, ${STATION_SVG_Y - 200})`}>
                                <rect x="-8" y="-8" width="16" height="16" fill="none" stroke="#dc2626" strokeWidth="2" />
                                <line x1="-12" y1="0" x2="12" y2="0" stroke="#dc2626" strokeWidth="2" />
                                <line x1="0" y1="-12" x2="0" y2="12" stroke="#dc2626" strokeWidth="2" />
                                <text x="15" y="5" fill="#991b1b" fontSize="14" fontWeight="bold">BACKSIGHT (B)</text>
                                <text x="15" y="20" fill="#64748b" fontSize="10" fontFamily="monospace">Reference 0°</text>
                            </g>

                            {/* Line to Backsight */}
                            <line
                                x1={STATION_SVG_X} y1={STATION_SVG_Y}
                                x2={STATION_SVG_X} y2={STATION_SVG_Y - 200}
                                stroke={backsightSet ? "#16a34a" : "#cbd5e1"}
                                strokeWidth="2"
                                strokeDasharray="8,4"
                            />

                            {/* Measured Points */}
                            {measuredPoints.map((pt) => (
                                <g key={pt.id}>
                                    <line
                                        x1={STATION_SVG_X} y1={STATION_SVG_Y}
                                        x2={pt.svgX} y2={pt.svgY}
                                        stroke="#94a3b8"
                                        strokeWidth="1"
                                    />
                                    <circle cx={pt.svgX} cy={pt.svgY} r="6" fill="#16a34a" />
                                    <text x={pt.svgX + 10} y={pt.svgY + 5} fill="#166534" fontSize="12" fontWeight="bold">P{pt.id}</text>
                                </g>
                            ))}

                            {/* Current Target Indicator */}
                            {target && (
                                <g transform={`translate(${target.x}, ${target.y})`}>
                                    <circle cx="0" cy="0" r="12" fill="none" stroke="#f59e0b" strokeWidth="2" className="animate-pulse" />
                                    <circle cx="0" cy="0" r="4" fill="#f59e0b" />
                                    <rect x="-4" y="-20" width="8" height="16" fill="#fcd34d" rx="2" /> {/* Little Prism graphic */}
                                </g>
                            )}

                            {/* Active Measurement Animation (Laser) */}
                            {isMeasuring && target && (
                                <g>
                                    <line
                                        x1={STATION_SVG_X} y1={STATION_SVG_Y}
                                        x2={target.x} y2={target.y}
                                        stroke="#ef4444"
                                        strokeWidth="3"
                                        className="animate-pulse"
                                    />
                                    <circle cx={target.x} cy={target.y} r="15" fill="#ef4444" opacity="0.3" className="animate-ping" />
                                </g>
                            )}

                        </svg>
                    )}

                    {/* Map Overlay Badges */}
                    {step >= 2 && (
                        <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                            <div className="bg-white/90 backdrop-blur border border-slate-200 px-3 py-2 rounded-lg shadow-sm text-xs font-mono text-slate-600 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div> Station
                            </div>
                            <div className="bg-white/90 backdrop-blur border border-slate-200 px-3 py-2 rounded-lg shadow-sm text-xs font-mono text-slate-600 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-600"></div> Backsight (0°)
                            </div>
                            {step >= 3 && (
                                <div className="bg-white/90 backdrop-blur border border-slate-200 px-3 py-2 rounded-lg shadow-sm text-xs font-mono text-slate-600 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-600"></div> Measured Points
                                </div>
                            )}
                        </div>
                    )}

                </section>
            </main>
        </div>
    );
}

export const metadata = {
  id: 'total-station-1',
  title: 'Total Station 1',
  description: 'Interactive introduction to the basics of setting up and leveling a Total Station.',
  iconName: 'Navigation',
  category: 'Surveying',
  status: 'Available'
};