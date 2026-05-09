import React, { useState, useRef, useEffect } from 'react';
import { RadioTower, Navigation, CloudCog, Satellite, Zap } from 'lucide-react';

export default function VirtualStationELI5() {
    const [mode, setMode] = useState('traditional'); // 'traditional' or 'vrs'
    const [roverPos, setRoverPos] = useState({ x: 70, y: 70 });
    const containerRef = useRef(null);

    // Network base station positions (percentages)
    const networkStations = [
        { x: 10, y: 10 },
        { x: 90, y: 15 },
        { x: 85, y: 90 },
        { x: 15, y: 85 },
    ];

    // Traditional single base position
    const singleBasePos = { x: 50, y: 50 };

    const handleMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;

        // Constrain to 0-100
        x = Math.max(5, Math.min(95, x));
        y = Math.max(5, Math.min(95, y));

        setRoverPos({ x, y });
    };

    const handleTouch = (e) => {
        if (!containerRef.current || !e.touches[0]) return;
        const rect = containerRef.current.getBoundingClientRect();
        let x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
        let y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;

        x = Math.max(5, Math.min(95, x));
        y = Math.max(5, Math.min(95, y));

        setRoverPos({ x, y });
    };

    // Calculate distance from physical base (Traditional mode)
    const getDistance = (p1, p2) => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const distanceToBase = getDistance(singleBasePos, roverPos);

    // Calculate accuracy "wobble" ring size
    // Traditional gets worse (bigger ring) the further you go. VRS stays perfect.
    const accuracyRingSize = mode === 'traditional'
        ? 20 + (distanceToBase * 1.5)
        : 24;

    const isAccuracyPoor = mode === 'traditional' && distanceToBase > 30;

    // Virtual Station floats slightly offset from the rover
    const vrsPos = { x: roverPos.x - 4, y: roverPos.y - 6 };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-5xl mx-auto font-sans bg-slate-50 text-slate-900 rounded-2xl shadow-xl">

            {/* Controls & Explanation Panel */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">RTK GPS: ELI5</h2>
                    <p className="text-sm text-slate-600 mb-4">
                        Pick a mode and <b>move your mouse/finger over the map</b> to drive the surveyor rover!
                    </p>

                    <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                        <button
                            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-all ${mode === 'traditional' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            onClick={() => setMode('traditional')}
                        >
                            Traditional RTK
                        </button>
                        <button
                            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-all ${mode === 'vrs' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            onClick={() => setMode('vrs')}
                        >
                            Virtual Station (VRS)
                        </button>
                    </div>

                    <div className="min-h-[220px]">
                        {mode === 'traditional' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                                    <RadioTower size={18} /> Single Base Station
                                </h3>
                                <p className="text-sm mb-3">
                                    Imagine your base station is holding a leash attached to your rover. It tells your rover exactly how to fix its GPS errors.
                                </p>
                                <p className="text-sm mb-3">
                                    <b>The Problem:</b> As you drive further away, the atmosphere changes. The base station's corrections don't apply perfectly to where you are anymore. The "leash" gets stretchy!
                                </p>
                                <div className={`p-3 rounded-lg border ${isAccuracyPoor ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                    <p className="text-sm font-semibold flex justify-between">
                                        Current Accuracy:
                                        <span className={isAccuracyPoor ? 'text-red-600' : 'text-green-600'}>
                                            {isAccuracyPoor ? 'Getting Wobbly... (Poor)' : 'Tight! (Good)'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="font-bold text-purple-700 mb-2 flex items-center gap-2">
                                    <Zap size={18} /> Virtual Reference Station
                                </h3>
                                <p className="text-sm mb-3">
                                    Instead of one base, we have permanent towers far away. Your rover tells the <b>Server Cloud</b> where it is.
                                </p>
                                <p className="text-sm mb-3">
                                    <b>The Magic:</b> The server does complicated math to create a <i>fake, holographic base station</i> right next to you! As you move, it follows you.
                                </p>
                                <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                                    <p className="text-sm font-semibold flex justify-between">
                                        Current Accuracy: <span className="text-green-600">Perfect! (Short Leash)</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Interactive Map Area */}
            <div
                ref={containerRef}
                className="w-full lg:w-2/3 h-[450px] sm:h-[500px] bg-slate-900 rounded-xl relative overflow-hidden shadow-inner cursor-crosshair touch-none select-none"
                onMouseMove={handleMove}
                onTouchMove={handleTouch}
            >
                {/* Satellites in the sky */}
                <div className="absolute top-2 left-10 text-slate-500 opacity-50"><Satellite size={32} /></div>
                <div className="absolute top-4 right-20 text-slate-500 opacity-50"><Satellite size={24} /></div>
                <div className="absolute top-1 left-1/2 text-slate-500 opacity-50"><Satellite size={28} /></div>

                {/* SVG Layer for Drawing Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {mode === 'traditional' && (
                        <line
                            x1={`${singleBasePos.x}%`} y1={`${singleBasePos.y}%`}
                            x2={`${roverPos.x}%`} y2={`${roverPos.y}%`}
                            stroke={isAccuracyPoor ? "#ef4444" : "#3b82f6"}
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            className="transition-colors duration-300"
                        />
                    )}

                    {mode === 'vrs' && (
                        <>
                            {/* Lines from Permanent towers to the Server Cloud */}
                            {networkStations.map((station, i) => (
                                <line
                                    key={i}
                                    x1={`${station.x}%`} y1={`${station.y}%`}
                                    x2="50%" y2="50%"
                                    stroke="#475569"
                                    strokeWidth="1.5"
                                    className="opacity-40"
                                />
                            ))}

                            {/* Line from Cloud to Virtual Station */}
                            <line
                                x1="50%" y1="50%"
                                x2={`${vrsPos.x}%`} y2={`${vrsPos.y}%`}
                                stroke="#a855f7"
                                strokeWidth="2"
                                strokeDasharray="4,4"
                                className="animate-pulse"
                            />

                            {/* Ultra-short baseline from VRS to Rover */}
                            <line
                                x1={`${vrsPos.x}%`} y1={`${vrsPos.y}%`}
                                x2={`${roverPos.x}%`} y2={`${roverPos.y}%`}
                                stroke="#22c55e"
                                strokeWidth="3"
                            />
                        </>
                    )}
                </svg>

                {/* --- ELEMENTS --- */}

                {/* Traditional Physical Base Station */}
                {mode === 'traditional' && (
                    <div
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                        style={{ left: `${singleBasePos.x}%`, top: `${singleBasePos.y}%` }}
                    >
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white border-4 border-blue-900 shadow-lg">
                            <RadioTower size={20} />
                        </div>
                        <span className="text-xs text-blue-200 mt-1 font-semibold tracking-wider">BASE</span>
                    </div>
                )}

                {/* VRS Mode Elements */}
                {mode === 'vrs' && (
                    <>
                        {/* Permanent Network Stations */}
                        {networkStations.map((station, i) => (
                            <div
                                key={i}
                                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-60"
                                style={{ left: `${station.x}%`, top: `${station.y}%` }}
                            >
                                <div className="text-slate-400">
                                    <RadioTower size={24} />
                                </div>
                            </div>
                        ))}

                        {/* Processing Server Cloud */}
                        <div
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                            style={{ left: '50%', top: '50%' }}
                        >
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-purple-400 border border-slate-700 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                <CloudCog size={32} />
                            </div>
                            <span className="text-xs text-purple-300 mt-1 font-semibold tracking-wider bg-slate-900/80 px-2 rounded-md">VRS SERVER</span>
                        </div>

                        {/* The Virtual Reference Station (Hologram) */}
                        <div
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-75 ease-out"
                            style={{ left: `${vrsPos.x}%`, top: `${vrsPos.y}%` }}
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500 rounded-full blur-md opacity-60 animate-pulse"></div>
                                <div className="w-8 h-8 bg-purple-900 border-2 border-purple-400 rounded-full flex items-center justify-center text-purple-300 relative z-10 shadow-[0_0_10px_#a855f7]">
                                    <RadioTower size={16} />
                                </div>
                            </div>
                            <span className="text-[10px] text-purple-300 mt-1 font-bold animate-pulse absolute top-full whitespace-nowrap">VIRTUAL BASE</span>
                        </div>
                    </>
                )}

                {/* The Rover (You) */}
                <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-75 ease-out z-20"
                    style={{ left: `${roverPos.x}%`, top: `${roverPos.y}%` }}
                >
                    {/* Accuracy "Wobble" Ring */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-150 ease-out"
                        style={{
                            width: `${accuracyRingSize}px`,
                            height: `${accuracyRingSize}px`,
                            borderColor: mode === 'traditional' && isAccuracyPoor ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)',
                            backgroundColor: mode === 'traditional' && isAccuracyPoor ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'
                        }}
                    />

                    <div className="w-8 h-8 bg-amber-400 rounded-md flex items-center justify-center text-slate-900 border-2 border-slate-900 shadow-xl relative z-10">
                        <Navigation size={18} className="fill-slate-900" />
                    </div>
                    <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded text-amber-400 mt-1 font-bold shadow-sm whitespace-nowrap">ROVER</span>
                </div>

            </div>
        </div>
    );
}

export const metadata = {
  id: 'rtk-gps',
  title: 'RTK GPS: ELI5',
  description: 'A simple interactive explanation of how Traditional RTK GPS and Virtual Reference Stations (VRS) work.',
  iconName: 'RadioTower',
  category: 'Surveying',
  status: 'Available'
};