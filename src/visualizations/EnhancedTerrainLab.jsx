import React, { useState, useEffect, useRef } from 'react';
import { Sun, Compass, Info, AlertTriangle, Layers, Maximize } from 'lucide-react';

const App = () => {
    const [azimuth, setAzimuth] = useState(315); // Default NW
    const [altitude, setAltitude] = useState(45);
    const [useColor, setUseColor] = useState(true);
    const [exaggeration, setExaggeration] = useState(25);
    const canvasRef = useRef(null);

    // Generate a dramatic terrain (Center peak + some ridges)
    const size = 400;
    const terrain = useRef([]);

    useEffect(() => {
        const data = new Float32Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = (x - size / 2) / (size / 5);
                const dy = (y - size / 2) / (size / 5);
                const distSq = dx * dx + dy * dy;

                // Base Mountain
                let h = Math.exp(-distSq * 0.8) * 1.0;

                // Add some smaller "ridges" for texture
                h += Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.05 * Math.exp(-distSq * 0.1);

                data[y * size + x] = h;
            }
        }
        terrain.current = data;
        renderHillshade();
    }, [azimuth, altitude, useColor, exaggeration]);

    const getTerrainColor = (height) => {
        // Basic hypsometric tinting (Low = Green, Mid = Brown, High = White)
        if (height < 0.2) return [46, 125, 50];   // Grass Green
        if (height < 0.5) return [139, 115, 85];  // Dirt Brown
        if (height < 0.8) return [100, 100, 100]; // Rock Gray
        return [255, 255, 255];                   // Snow Cap
    };

    const renderHillshade = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        const azRad = (azimuth - 90) * (Math.PI / 180);
        const altRad = altitude * (Math.PI / 180);

        // Light vector
        const lx = Math.cos(altRad) * Math.cos(azRad);
        const ly = Math.cos(altRad) * Math.sin(azRad);
        const lz = Math.sin(altRad);

        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                const idx = y * size + x;

                // Gradients (slopes) - Vertical exaggeration applied here
                const dzdx = (terrain.current[idx + 1] - terrain.current[idx - 1]) * exaggeration;
                const dzdy = (terrain.current[idx + size] - terrain.current[idx - size]) * exaggeration;

                // Surface normal
                const nx = -dzdx;
                const ny = -dzdy;
                const nz = 1;
                const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);

                // Shading = Ambient (0.3) + Diffuse (0.7 * Dot Product)
                const dot = (nx / mag) * lx + (ny / mag) * ly + (nz / mag) * lz;
                const shade = 0.3 + 0.7 * Math.max(0, dot);

                const outIdx = (y * size + x) * 4;

                if (useColor) {
                    const baseColor = getTerrainColor(terrain.current[idx]);
                    data[outIdx] = baseColor[0] * shade;
                    data[outIdx + 1] = baseColor[1] * shade;
                    data[outIdx + 2] = baseColor[2] * shade;
                } else {
                    const gray = shade * 255;
                    data[outIdx] = gray;
                    data[outIdx + 1] = gray;
                    data[outIdx + 2] = gray;
                }
                data[outIdx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    };

    const isInverse = azimuth > 90 && azimuth < 225;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
            <div className="max-w-5xl w-full bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Compass className="text-blue-400" />
                            </div>
                            Enhanced Terrain Lab
                        </h1>
                    </div>
                    <div className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border transition-colors ${isInverse ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                        {isInverse ? <AlertTriangle size={16} /> : <Sun size={16} />}
                        {isInverse ? 'INVERSION RISK (SE LIGHT)' : 'NATURAL DEPTH (NW LIGHT)'}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

                    {/* Main Display */}
                    <div className="lg:col-span-7 p-8 bg-black/20 flex flex-col items-center justify-center border-r border-slate-800">
                        <div className="relative">
                            <canvas
                                ref={canvasRef}
                                width={size}
                                height={size}
                                className="rounded-xl shadow-2xl bg-black border border-slate-700"
                            />
                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-[10px] font-mono text-slate-400">
                                {size}x{size} DEM RESOLUTION
                            </div>
                        </div>

                        <div className="mt-6 flex gap-4 w-full max-w-md">
                            <button
                                onClick={() => setUseColor(!useColor)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${useColor ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                            >
                                <Layers size={18} />
                                {useColor ? 'Terrain Colors' : 'Grayscale Only'}
                            </button>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="lg:col-span-5 p-8 space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Sun Azimuth</label>
                                <span className="text-xl font-mono text-blue-400">{azimuth}°</span>
                            </div>
                            <input
                                type="range" min="0" max="360" value={azimuth}
                                onChange={(e) => setAzimuth(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="grid grid-cols-4 gap-2">
                                {[315, 45, 135, 225].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => setAzimuth(val)}
                                        className={`py-2 text-xs rounded border transition-colors ${azimuth === val ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                                    >
                                        {val === 315 ? 'NW (Std)' : val === 45 ? 'NE' : val === 135 ? 'SE' : 'SW'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Vertical Exaggeration</label>
                                <span className="text-xl font-mono text-blue-400">{exaggeration}x</span>
                            </div>
                            <input
                                type="range" min="5" max="60" value={exaggeration}
                                onChange={(e) => setExaggeration(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <Info size={16} className="text-blue-400" />
                                The Perception Test
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                1. Set to <span className="text-white">NW (315°)</span>. The center should look like a mountain peak.<br /><br />
                                2. Switch to <span className="text-white">SE (135°)</span>. Notice how the green area now looks like it's at the bottom of a deep pit.
                            </p>
                            <div className="pt-2">
                                <div className="text-[10px] uppercase text-slate-500 mb-1">Current Brain Interpretation</div>
                                <div className={`text-sm font-bold ${isInverse ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {isInverse ? 'Hole / Crater / Basin' : 'Mountain / Peak / Ridge'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-950 p-4 border-t border-slate-800 text-center text-[10px] text-slate-600 tracking-widest uppercase">
                    Interactive Cartography Simulation &bull; Hillshade Analysis
                </div>
            </div>
        </div>
    );
};

export default App;

export const metadata = {
  id: 'hillshade-analysis',
  title: 'Enhanced Terrain Lab',
  description: 'Interactive Cartography Simulation & Hillshade Analysis demonstrating terrain perception.',
  iconName: 'Mountain',
  category: 'Cartography',
  status: 'Available'
};