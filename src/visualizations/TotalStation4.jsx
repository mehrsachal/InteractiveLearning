import React, { useState, useEffect, useRef } from 'react';
import { Target, MapPin, Compass, Info, ArrowRight, RotateCcw, Power } from 'lucide-react';

export default function App() {
    const [step, setStep] = useState(0);
    const [prism, setPrism] = useState(null);
    const [isShooting, setIsShooting] = useState(false);
    const [beamProgress, setBeamProgress] = useState(0);
    const [measurements, setMeasurements] = useState(null);

    const svgRef = useRef(null);

    // Constants for our surveying grid
    const CENTER = { x: 250, y: 250 }; // Station A
    const BACKSIGHT = { x: 250, y: 50 }; // Station B
    const SCALE = 2; // 1 pixel = 2 mm (just for mock scale)

    // Math Helpers
    const calculateData = (point) => {
        if (!point) return null;

        const dE = point.x - CENTER.x;
        const dN = CENTER.y - point.y; // Y is inverted in SVG

        // Distance in meters (mock scale)
        const distance = Math.sqrt(dE * dE + dN * dN) * SCALE / 10;

        // Azimuth Angle (0 is North/Up)
        let angleRad = Math.atan2(dE, dN);
        if (angleRad < 0) angleRad += 2 * Math.PI;
        const angleDeg = angleRad * (180 / Math.PI);

        return {
            distance: distance.toFixed(2),
            angle: angleDeg.toFixed(2),
            easting: (1000 + dE * SCALE / 10).toFixed(2),
            northing: (1000 + dN * SCALE / 10).toFixed(2),
        };
    };

    const handleSvgClick = (e) => {
        if (step !== 2 || isShooting) return;

        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        setPrism({ x: svgP.x, y: svgP.y });
        setMeasurements(null);
    };

    const shootLaser = (targetPoint, callback) => {
        setIsShooting(true);
        setBeamProgress(0);

        let progress = 0;
        const interval = setInterval(() => {
            progress += 0.05;
            if (progress >= 1) {
                progress = 1;
                clearInterval(interval);
                setTimeout(() => {
                    setIsShooting(false);
                    if (callback) callback();
                }, 500);
            }
            setBeamProgress(progress);
        }, 20);
    };

    const handleShootBacksight = () => {
        shootLaser(BACKSIGHT, () => setStep(2));
    };

    const handleShootForesight = () => {
        shootLaser(prism, () => {
            setMeasurements(calculateData(prism));
            setTimeout(() => setStep(3), 800);
        });
    };

    const reset = () => {
        setStep(0);
        setPrism(null);
        setMeasurements(null);
        setBeamProgress(0);
        setIsShooting(false);
    };

    // SVG Arc Generator for Angle
    const getAngleArc = (target) => {
        if (!target) return "";
        const radius = 40;
        const dE = target.x - CENTER.x;
        const dN = CENTER.y - target.y;

        let angleRad = Math.atan2(dE, dN);
        if (angleRad < 0) angleRad += 2 * Math.PI;

        // SVG Math (0 is right, but our 0 is UP)
        const startX = CENTER.x;
        const startY = CENTER.y - radius; // Up

        // Target arc point
        const endX = CENTER.x + radius * Math.sin(angleRad);
        const endY = CENTER.y - radius * Math.cos(angleRad);

        const largeArcFlag = angleRad > Math.PI ? 1 : 0;

        return `M ${CENTER.x} ${CENTER.y} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Compass className="text-blue-600 h-8 w-8" />
                            Total Station Surveyor
                        </h1>
                        <p className="text-slate-500 mt-1">Interactive guide to land surveying principles</p>
                    </div>
                    <div className="hidden md:flex gap-2 text-sm font-medium text-slate-400">
                        <span className={step >= 0 ? "text-blue-600" : ""}>1. Setup</span> &rarr;
                        <span className={step >= 1 ? "text-blue-600" : ""}>2. Backsight</span> &rarr;
                        <span className={step >= 2 ? "text-blue-600" : ""}>3. Measurement</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Main Visualization Area */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group">
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 shadow flex items-center gap-2 z-10 border border-slate-200">
                            <Compass className="w-4 h-4 text-slate-400" /> TOP-DOWN VIEW
                        </div>

                        <svg
                            ref={svgRef}
                            viewBox="0 0 500 500"
                            className={`w-full h-auto max-h-[600px] bg-slate-50 cursor-${step === 2 && !isShooting ? 'crosshair' : 'default'} touch-none`}
                            onClick={handleSvgClick}
                        >
                            {/* Grid Pattern */}
                            <defs>
                                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                </pattern>
                                <pattern id="grid-large" width="250" height="250" patternUnits="userSpaceOnUse">
                                    <rect width="250" height="250" fill="url(#grid)" />
                                    <path d="M 250 0 L 0 0 0 250" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid-large)" />

                            {/* Angles / Arcs */}
                            {step >= 3 && prism && measurements && (
                                <path d={getAngleArc(prism)} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="1" />
                            )}

                            {/* Backsight Line (Baseline) */}
                            {step >= 1 && (
                                <line
                                    x1={CENTER.x} y1={CENTER.y}
                                    x2={BACKSIGHT.x} y2={BACKSIGHT.y}
                                    stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,6"
                                />
                            )}

                            {/* Laser Beam Animation */}
                            {isShooting && (
                                <line
                                    x1={CENTER.x} y1={CENTER.y}
                                    x2={step === 1 ? BACKSIGHT.x : (prism?.x || CENTER.x)}
                                    y2={step === 1 ? BACKSIGHT.y : (prism?.y || CENTER.y)}
                                    stroke="#ef4444" strokeWidth="3"
                                    strokeDasharray="1000"
                                    strokeDashoffset={1000 - (beamProgress * 1000)}
                                />
                            )}

                            {/* Measurement Line */}
                            {step >= 3 && prism && (
                                <line
                                    x1={CENTER.x} y1={CENTER.y}
                                    x2={prism.x} y2={prism.y}
                                    stroke="#3b82f6" strokeWidth="2"
                                />
                            )}

                            {/* Station A (Total Station) */}
                            <g transform={`translate(${CENTER.x}, ${CENTER.y})`}>
                                <circle r="12" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="2" />
                                <polygon points="0,-6 -6,4 6,4" fill="#1e40af" />
                                <text x="15" y="-10" fontSize="14" fontWeight="bold" fill="#1e293b">Stn A</text>
                                <text x="15" y="6" fontSize="12" fill="#64748b">(1000, 1000)</text>
                            </g>

                            {/* Station B (Backsight) */}
                            {(step >= 1) && (
                                <g transform={`translate(${BACKSIGHT.x}, ${BACKSIGHT.y})`}>
                                    <rect x="-6" y="-6" width="12" height="12" fill="#ef4444" />
                                    <circle r="2" fill="white" />
                                    <text x="15" y="4" fontSize="14" fontWeight="bold" fill="#1e293b">Point B (Backsight)</text>
                                </g>
                            )}

                            {/* Station C (Prism/Foresight) */}
                            {prism && (
                                <g transform={`translate(${prism.x}, ${prism.y})`}>
                                    <circle r="6" fill="#f59e0b" stroke="white" strokeWidth="2" />
                                    <circle r="14" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
                                    <text x="15" y="4" fontSize="14" fontWeight="bold" fill="#1e293b">Point C (Prism)</text>
                                    {measurements && (
                                        <text x="15" y="22" fontSize="12" fill="#3b82f6">{measurements.distance}m @ {measurements.angle}°</text>
                                    )}
                                </g>
                            )}
                        </svg>
                    </div>

                    {/* Side Panel Controls */}
                    <div className="w-full lg:w-96 flex flex-col gap-4">

                        {/* Step 0: Introduction & Setup */}
                        <div className={`transition-all duration-300 ${step === 0 ? 'opacity-100 scale-100' : 'hidden'}`}>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-t-blue-500 border-x border-b border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Power className="w-5 h-5" /></div>
                                    <h2 className="text-xl font-bold">1. The Setup</h2>
                                </div>
                                <p className="text-slate-600 leading-relaxed mb-6">
                                    Surveying starts by placing the <strong>Total Station</strong> over a known coordinate (Station A). The instrument must be perfectly leveled using its internal digital bubbles.
                                </p>
                                <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm text-slate-600 border border-slate-100">
                                    <p><strong>Station A Coordinates:</strong></p>
                                    <p>Easting (X): 1000.00</p>
                                    <p>Northing (Y): 1000.00</p>
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors"
                                >
                                    Set up & Level Instrument <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Step 1: Backsight */}
                        <div className={`transition-all duration-300 ${step === 1 ? 'opacity-100 scale-100' : 'hidden'}`}>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-red-100 text-red-600 p-2 rounded-lg"><Target className="w-5 h-5" /></div>
                                    <h2 className="text-xl font-bold">2. The Backsight</h2>
                                </div>
                                <p className="text-slate-600 leading-relaxed mb-6">
                                    Before we can measure new points, the machine needs to know which way is "North" (or a baseline 0°). We aim it at a second known point (Point B) and set the horizontal angle to 0°00'00".
                                </p>
                                <button
                                    onClick={handleShootBacksight}
                                    disabled={isShooting}
                                    className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors"
                                >
                                    {isShooting ? 'Calibrating Laser...' : 'Shoot Backsight (Set 0°)'}
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Foresight */}
                        <div className={`transition-all duration-300 ${step === 2 ? 'opacity-100 scale-100' : 'hidden'}`}>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-t-amber-500 border-x border-b border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-amber-100 text-amber-600 p-2 rounded-lg"><MapPin className="w-5 h-5" /></div>
                                    <h2 className="text-xl font-bold">3. Measurement</h2>
                                </div>
                                <p className="text-slate-600 leading-relaxed mb-4">
                                    A rodman places a reflective prism on the unknown point (Point C).
                                </p>

                                {!prism ? (
                                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-center border border-amber-200 animate-pulse font-medium">
                                        &larr; Click anywhere on the map to place the prism.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
                                            Prism placed. Ready to measure distance and angle.
                                        </div>
                                        <button
                                            onClick={handleShootForesight}
                                            disabled={isShooting}
                                            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors"
                                        >
                                            {isShooting ? 'Measuring (EDM)...' : 'Measure Point C'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 3: Results */}
                        <div className={`transition-all duration-300 ${step === 3 ? 'opacity-100 scale-100' : 'hidden'}`}>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-t-green-500 border-x border-b border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-green-100 text-green-600 p-2 rounded-lg"><Info className="w-5 h-5" /></div>
                                    <h2 className="text-xl font-bold">4. Data Processed</h2>
                                </div>
                                <p className="text-slate-600 leading-relaxed mb-4 text-sm">
                                    The Total Station fired an infrared beam, measured the time it took to bounce off the prism (Distance), and read the angle from the backsight. It then calculates the exact coordinates using trigonometry.
                                </p>

                                {measurements && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-6">
                                        <div className="px-4 py-2 border-b border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 uppercase">
                                            Raw Measurements
                                        </div>
                                        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-slate-400 mb-1">Azimuth Angle ($\theta$)</div>
                                                <div className="font-mono font-bold text-lg text-slate-800">{measurements.angle}°</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-400 mb-1">Horiz. Distance ($d$)</div>
                                                <div className="font-mono font-bold text-lg text-slate-800">{measurements.distance}m</div>
                                            </div>
                                        </div>

                                        <div className="px-4 py-2 border-y border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 uppercase">
                                            Calculated Coordinates (Point C)
                                        </div>
                                        <div className="p-4 text-sm space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 font-mono text-xs">E = E_A + d * sin($\theta$)</span>
                                                <span className="font-mono font-bold text-slate-800">E: {measurements.easting}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 font-mono text-xs">N = N_A + d * cos($\theta$)</span>
                                                <span className="font-mono font-bold text-slate-800">N: {measurements.northing}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={reset}
                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" /> Start New Survey
                                </button>
                            </div>
                        </div>

                        {/* Educational Glossary */}
                        <div className="bg-slate-100 p-5 rounded-2xl text-sm text-slate-600 mt-auto">
                            <h3 className="font-bold text-slate-800 mb-2">Key Concepts</h3>
                            <ul className="space-y-2">
                                <li><strong className="text-slate-700">EDM:</strong> Electronic Distance Measurement. Uses light waves to measure distance to the prism accurately.</li>
                                <li><strong className="text-slate-700">Prism:</strong> A specialized glass retro-reflector placed on a pole over the point you want to measure.</li>
                                <li><strong className="text-slate-700">Backsight:</strong> Establishing orientation by looking at a point with known coordinates.</li>
                            </ul>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export const metadata = {
  id: 'total-station-4',
  title: 'Total Station 4',
  description: 'A comprehensive interactive guide walking through the entire surveying procedure from setup to data processing.',
  iconName: 'Compass',
  category: 'Surveying',
  status: 'Available'
};