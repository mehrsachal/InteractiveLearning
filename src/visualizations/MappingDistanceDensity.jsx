import React, { useState, useMemo, useEffect } from 'react';
import { MousePointer2, Target, Mountain, CircleDashed, Zap, Compass, Calculator, Info } from 'lucide-react';

const GRID_SIZE = 15;
const CELL_SIZE = 40; // visual size in px

// --- Math Utilities ---
const euclideanDist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

const calculateAzimuth = (sourceX, sourceY, targetX, targetY) => {
    // In screen coords, Y goes down. We want North to be up.
    // dx = targetX - sourceX, dy = sourceY - targetY
    const dx = targetX - sourceX;
    const dy = sourceY - targetY;
    let angle = Math.atan2(dx, dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
};

export default function App() {
    const [activeTab, setActiveTab] = useState('straight-line');
    const [hoveredCell, setHoveredCell] = useState(null);

    // States for Straight Line & Cost
    const [sources, setSources] = useState([{ x: 3, y: 3 }]);
    const [destination, setDestination] = useState({ x: 12, y: 12 });

    // Cost map: 1 is flat, 5 is steep/expensive
    const [costMap, setCostMap] = useState(() => {
        const map = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(1));
        // Add a default "mountain" ridge
        for (let i = 2; i <= 10; i++) {
            map[i][7] = 5;
            map[i][8] = 4;
        }
        return map;
    });

    // State for Density
    const [dataPoints, setDataPoints] = useState([
        { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 7, y: 8 }, { x: 6, y: 6 },
        { x: 12, y: 3 }, { x: 12, y: 4 }, { x: 3, y: 12 }
    ]);
    const [searchRadius, setSearchRadius] = useState(4);
    const [densityMethod, setDensityMethod] = useState('kernel');

    // --- Computations ---

    // 1. Straight Line Calculations
    const straightLineData = useMemo(() => {
        const data = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (sources.length === 0) continue;

                let minDist = Infinity;
                let nearestSource = null;

                sources.forEach(source => {
                    const dist = euclideanDist(x, y, source.x, source.y);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestSource = source;
                    }
                });

                data[y][x] = {
                    dist: minDist,
                    azimuth: nearestSource ? calculateAzimuth(nearestSource.x, nearestSource.y, x, y) : 0,
                    nearest: nearestSource
                };
            }
        }
        return data;
    }, [sources]);

    // 2. Cost Weighted & Least Cost Path (Dijkstra)
    const costWeightedData = useMemo(() => {
        if (sources.length === 0) return { costs: [], path: [] };

        // Initialize distances
        const dist = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(Infinity));
        const prev = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
        const visited = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

        // Start at nearest source to destination (simplified for single destination)
        const startSource = sources[0];
        dist[startSource.y][startSource.x] = 0;

        // Simple unoptimized Dijkstra (fine for 15x15 grid)
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            let minDist = Infinity;
            let u = null;

            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (!visited[y][x] && dist[y][x] < minDist) {
                        minDist = dist[y][x];
                        u = { x, y };
                    }
                }
            }

            if (!u) break;
            visited[u.y][u.x] = true;

            // Check 8 neighbors
            const neighbors = [
                { dx: 0, dy: -1, cost: 1 }, { dx: 1, dy: -1, cost: Math.SQRT2 },
                { dx: 1, dy: 0, cost: 1 }, { dx: 1, dy: 1, cost: Math.SQRT2 },
                { dx: 0, dy: 1, cost: 1 }, { dx: -1, dy: 1, cost: Math.SQRT2 },
                { dx: -1, dy: 0, cost: 1 }, { dx: -1, dy: -1, cost: Math.SQRT2 }
            ];

            neighbors.forEach(({ dx, dy, cost: distCost }) => {
                const nx = u.x + dx;
                const ny = u.y + dy;

                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !visited[ny][nx]) {
                    // Math concept from text: "multiplies the average between each pair by the distance"
                    const avgFriction = (costMap[u.y][u.x] + costMap[ny][nx]) / 2;
                    const travelCost = avgFriction * distCost;
                    const alt = dist[u.y][u.x] + travelCost;

                    if (alt < dist[ny][nx]) {
                        dist[ny][nx] = alt;
                        prev[ny][nx] = u;
                    }
                }
            });
        }

        // Reconstruct path
        const path = [];
        let curr = destination;
        while (curr) {
            path.push(curr);
            curr = prev[curr.y][curr.x];
        }

        return { costs: dist, path };
    }, [sources, costMap, destination]);

    // 3. Density Calculations
    const densityData = useMemo(() => {
        const data = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        const searchArea = Math.PI * Math.pow(searchRadius, 2);
        let maxDensity = 0;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                let densityVal = 0;

                if (densityMethod === 'simple') {
                    // Simple: Count points within radius
                    let count = 0;
                    dataPoints.forEach(p => {
                        if (euclideanDist(x, y, p.x, p.y) <= searchRadius) count++;
                    });
                    densityVal = count / searchArea;
                } else {
                    // Kernel: Math function from 1 at point to 0 at boundary
                    let sumKernel = 0;
                    dataPoints.forEach(p => {
                        const d = euclideanDist(x, y, p.x, p.y);
                        if (d <= searchRadius) {
                            // Linear kernel: 1 - (d/r)
                            const kernelVal = 1 - (d / searchRadius);
                            sumKernel += kernelVal;
                        }
                    });
                    densityVal = sumKernel / searchArea;
                }

                data[y][x] = densityVal;
                if (densityVal > maxDensity) maxDensity = densityVal;
            }
        }
        return { grid: data, max: maxDensity || 1 };
    }, [dataPoints, searchRadius, densityMethod]);


    // --- Event Handlers ---
    const handleCellClick = (x, y) => {
        if (activeTab === 'straight-line') {
            const exists = sources.find(s => s.x === x && s.y === y);
            if (exists) setSources(sources.filter(s => !(s.x === x && s.y === y)));
            else setSources([...sources, { x, y }]);
        } else if (activeTab === 'cost-weighted') {
            // Toggle mountain
            const newCostMap = [...costMap];
            newCostMap[y] = [...newCostMap[y]];
            newCostMap[y][x] = newCostMap[y][x] === 1 ? 5 : 1;
            setCostMap(newCostMap);
        } else if (activeTab === 'density') {
            setDataPoints([...dataPoints, { x, y }]);
        }
    };

    const handleCellRightClick = (e, x, y) => {
        e.preventDefault();
        if (activeTab === 'cost-weighted') {
            setDestination({ x, y });
        }
    };

    // --- Rendering Helpers ---
    const renderMathPanel = () => {
        if (!hoveredCell) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <MousePointer2 className="w-12 h-12 mb-4 opacity-50" />
                    <p>Hover over a cell on the grid to see the mathematical breakdown behind its calculation.</p>
                </div>
            );
        }

        const { x, y } = hoveredCell;

        if (activeTab === 'straight-line') {
            const cellData = straightLineData[y][x];
            if (!cellData || !cellData.nearest) return null;

            const { nearest, dist, azimuth } = cellData;
            const dx = x - nearest.x;
            const dy = nearest.y - y;

            return (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-500" /> Straight Line Distance
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">Calculates the Euclidean distance to the nearest source.</p>

                        <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm border border-slate-100">
                            <div className="text-slate-500 mb-2">Formula:</div>
                            <div className="text-center text-lg text-slate-800 mb-4">
                                D = <span className="text-blue-600">√</span><span className="border-t-2 border-blue-600 inline-block px-1 ml-1">(x₂ - x₁)² + (y₂ - y₁)²</span>
                            </div>

                            <div className="text-slate-500 mb-2 mt-4">Live Calculation:</div>
                            <div className="pl-2 border-l-2 border-blue-200 space-y-1">
                                <div>Source (x₁, y₁): <span className="font-semibold">({nearest.x}, {nearest.y})</span></div>
                                <div>Target (x₂, y₂): <span className="font-semibold">({x}, {y})</span></div>
                                <div>Δx = {x} - {nearest.x} = {dx}</div>
                                <div>Δy = {y} - {nearest.y} = {-dy}</div>
                                <div className="pt-2 border-t border-slate-200 mt-2 text-blue-700 font-bold text-base">
                                    D = √({dx}² + {-dy}²) = {dist.toFixed(2)} units
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Compass className="w-5 h-5 text-indigo-500" /> Direction (Azimuth)
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm border border-slate-100">
                            <div className="text-center text-lg text-slate-800 mb-4">
                                θ = arctan(Δx / Δy)
                            </div>
                            <div className="text-indigo-700 font-bold text-base">
                                Azimuth = {azimuth.toFixed(1)}°
                            </div>
                            <p className="text-xs text-slate-500 mt-2 font-sans leading-relaxed">
                                Represents the angle in degrees measured clockwise from North pointing back to the source.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'cost-weighted') {
            const accumCost = costWeightedData.costs[y]?.[x];
            const friction = costMap[y][x];

            return (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Mountain className="w-5 h-5 text-amber-600" /> Cost Weighted Distance
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">Calculates accumulated cost evaluating neighbors.</p>

                        <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm border border-slate-100">
                            <div className="text-slate-500 mb-2">Step Cost Formula:</div>
                            <div className="text-center text-base text-slate-800 mb-4">
                                Cost = <span className="text-amber-600">D</span> × <span className="inline-block px-1 border-t border-slate-400">(F₁ + F₂) / 2</span>
                            </div>

                            <div className="pl-2 border-l-2 border-amber-200 space-y-1">
                                <div>Cell Terrain Friction (F₂): <span className="font-semibold">{friction}</span></div>
                                <div className="text-xs text-slate-500">(1 = flat, 5 = steep mountain)</div>
                                <div className="pt-2 border-t border-slate-200 mt-2 text-amber-700 font-bold text-base">
                                    Accumulated Cost = {accumCost === Infinity ? 'Unreachable' : accumCost.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 text-slate-100 p-5 rounded-xl shadow-sm">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-400" /> Djikstra's Algorithm
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            The least-cost path analysis evaluates the surface systematically, choosing the lowest accumulated cost at each step, moving orthogonally (distance 1) or diagonally (distance ~1.41).
                        </p>
                    </div>
                </div>
            );
        }

        if (activeTab === 'density') {
            const densityVal = densityData.grid[y][x];
            const searchArea = Math.PI * Math.pow(searchRadius, 2);

            // Find points in radius for calculation breakdown
            const pointsInRadius = dataPoints.map(p => ({
                ...p,
                d: euclideanDist(x, y, p.x, p.y)
            })).filter(p => p.d <= searchRadius);

            return (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <CircleDashed className="w-5 h-5 text-rose-500" /> {densityMethod === 'simple' ? 'Simple' : 'Kernel'} Density
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Calculates quantity per unit of area (search radius = {searchRadius}).
                        </p>

                        <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm border border-slate-100">
                            <div className="text-slate-500 mb-2">Area of Search Neighborhood:</div>
                            <div className="mb-4">
                                A = πr² = π({searchRadius}²) ≈ <span className="font-semibold text-slate-800">{searchArea.toFixed(2)}</span>
                            </div>

                            {densityMethod === 'simple' ? (
                                <>
                                    <div className="text-slate-500 mb-2">Simple Formula:</div>
                                    <div className="text-center text-lg text-slate-800 mb-4 border-b border-slate-300 inline-block px-4 pb-1">
                                        Count / Area
                                    </div>
                                    <div className="pl-2 border-l-2 border-rose-200 space-y-1">
                                        <div>Points in radius: <span className="font-semibold">{pointsInRadius.length}</span></div>
                                        <div className="pt-2 text-rose-700 font-bold text-base">
                                            Density = {(pointsInRadius.length / searchArea).toFixed(4)}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-slate-500 mb-2">Kernel Formula (Linear Approx):</div>
                                    <div className="text-center text-base text-slate-800 mb-4 border-b border-slate-300 inline-block px-4 pb-1">
                                        Σ (1 - dᵢ/r) / Area
                                    </div>
                                    <div className="pl-2 border-l-2 border-rose-200 space-y-2 max-h-48 overflow-y-auto">
                                        {pointsInRadius.length === 0 ? (
                                            <div className="text-slate-400 italic">No points in radius</div>
                                        ) : (
                                            pointsInRadius.map((p, i) => (
                                                <div key={i} className="text-xs bg-white p-2 rounded border border-slate-200">
                                                    Point at ({p.x}, {p.y}): <br />
                                                    Dist(d) = {p.d.toFixed(2)} <br />
                                                    Kernel = 1 - ({p.d.toFixed(1)}/{searchRadius}) = <span className="font-bold">{(1 - (p.d / searchRadius)).toFixed(2)}</span>
                                                </div>
                                            ))
                                        )}
                                        <div className="pt-2 text-rose-700 font-bold text-base border-t border-rose-100">
                                            Density = {densityVal.toFixed(4)}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
    };

    const renderGrid = () => {
        const cells = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {

                let cellContent = null;
                let bgColor = 'bg-slate-50';
                let tooltip = `(${x}, ${y})`;
                let opacity = 1;

                const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

                if (activeTab === 'straight-line') {
                    const data = straightLineData[y][x];
                    const isSource = sources.find(s => s.x === x && s.y === y);

                    if (isSource) {
                        cellContent = <Target className="w-5 h-5 text-white drop-shadow-md" />;
                        bgColor = 'bg-blue-600';
                    } else if (data && data.dist !== Infinity) {
                        // Map distance to a blue color scale
                        const maxDist = GRID_SIZE * 1.414;
                        const intensity = Math.max(0.1, 1 - (data.dist / maxDist));
                        bgColor = 'bg-blue-500';
                        opacity = intensity;
                    }
                }
                else if (activeTab === 'cost-weighted') {
                    const isSource = sources.find(s => s.x === x && s.y === y);
                    const isDest = destination.x === x && destination.y === y;
                    const isPath = costWeightedData.path.find(p => p.x === x && p.y === y);
                    const friction = costMap[y][x];

                    if (isSource) {
                        cellContent = <Target className="w-5 h-5 text-white" />;
                        bgColor = 'bg-blue-600';
                    } else if (isDest) {
                        cellContent = <Target className="w-5 h-5 text-white" />;
                        bgColor = 'bg-rose-600';
                    } else if (isPath) {
                        cellContent = <div className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white shadow-sm" />;
                        bgColor = 'bg-amber-600';
                    } else {
                        // Map friction to terrain colors
                        if (friction === 5) bgColor = 'bg-slate-600'; // High mountain
                        else if (friction === 4) bgColor = 'bg-slate-500'; // Lower mountain
                        else bgColor = 'bg-emerald-100'; // Flat
                    }
                }
                else if (activeTab === 'density') {
                    const isPoint = dataPoints.find(p => p.x === x && p.y === y);
                    const density = densityData.grid[y][x];
                    const intensity = densityData.max > 0 ? (density / densityData.max) : 0;

                    if (intensity > 0) {
                        bgColor = 'bg-rose-600';
                        opacity = Math.max(0.05, intensity);
                    }

                    // Highlight search radius around hovered cell
                    let isSearchRadius = false;
                    if (hoveredCell) {
                        const distToHover = euclideanDist(x, y, hoveredCell.x, hoveredCell.y);
                        if (distToHover <= searchRadius && distToHover >= searchRadius - 1) {
                            isSearchRadius = true;
                        }
                    }

                    if (isPoint) {
                        cellContent = <Zap className="w-4 h-4 text-yellow-400 drop-shadow-md z-10" fill="currentColor" />;
                    }

                    if (isSearchRadius) {
                        cellContent = (
                            <>
                                {cellContent}
                                <div className="absolute inset-0 border border-slate-900 opacity-20 pointer-events-none rounded-full scale-[2.5]" />
                            </>
                        )
                    }
                }

                cells.push(
                    <div
                        key={`${x}-${y}`}
                        className={`relative flex items-center justify-center border border-slate-200/50 cursor-crosshair transition-all duration-75
                       ${isHovered ? 'ring-2 ring-indigo-500 z-20 scale-110 shadow-lg' : 'z-10'}`}
                        style={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            backgroundColor: bgColor !== 'bg-slate-50' ? undefined : '',
                        }}
                        onMouseEnter={() => setHoveredCell({ x, y })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => handleCellClick(x, y)}
                        onContextMenu={(e) => handleCellRightClick(e, x, y)}
                    >
                        {bgColor !== 'bg-slate-50' && bgColor.includes('bg-') && !bgColor.includes('slate-600') && !bgColor.includes('slate-500') && (
                            <div className={`absolute inset-0 ${bgColor} pointer-events-none`} style={{ opacity }} />
                        )}
                        {bgColor.includes('slate-6') && <div className="absolute inset-0 bg-slate-600 pointer-events-none" />}
                        {bgColor.includes('slate-5') && <div className="absolute inset-0 bg-slate-500 pointer-events-none" />}
                        {bgColor.includes('emerald-1') && <div className="absolute inset-0 bg-emerald-50 pointer-events-none" />}

                        {cellContent}
                    </div>
                );
            }
        }
        return cells;
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-6 flex flex-col items-center">

            {/* Header */}
            <div className="w-full max-w-6xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-3">
                        <Calculator className="w-7 h-7 text-indigo-600" />
                        Mapping Distance & Density
                    </h1>
                    <p className="text-slate-500 text-sm">Interactive visualization of GIS math functions.</p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    {[
                        { id: 'straight-line', label: 'Straight Line', icon: Target },
                        { id: 'cost-weighted', label: 'Cost Weighted', icon: Mountain },
                        { id: 'density', label: 'Density Surfaces', icon: CircleDashed },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setHoveredCell(null); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6">

                {/* Left Column: Interactive Grid */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:w-2/3 flex flex-col items-center">

                    <div className="w-full flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            Interactive Grid Space
                        </h2>
                        <div className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full flex items-center gap-2 border border-indigo-100">
                            <Info className="w-4 h-4" />
                            {activeTab === 'straight-line' && "Click to place/remove sources"}
                            {activeTab === 'cost-weighted' && "Click to paint mountains, Right-click to set destination"}
                            {activeTab === 'density' && "Click to add data points (e.g., lightning strikes)"}
                        </div>
                    </div>

                    <div
                        className="border-2 border-slate-800 rounded-lg overflow-hidden bg-white shadow-inner select-none relative"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`
                        }}
                    >
                        {renderGrid()}
                    </div>

                    {/* Controls specific to tabs */}
                    {activeTab === 'density' && (
                        <div className="w-full mt-8 p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-sm text-slate-700">Calculation Method</span>
                                <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                                    <button
                                        onClick={() => setDensityMethod('simple')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md ${densityMethod === 'simple' ? 'bg-rose-100 text-rose-700' : 'text-slate-500'}`}
                                    >
                                        Simple
                                    </button>
                                    <button
                                        onClick={() => setDensityMethod('kernel')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md ${densityMethod === 'kernel' ? 'bg-rose-100 text-rose-700' : 'text-slate-500'}`}
                                    >
                                        Kernel
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-semibold text-sm text-slate-700 whitespace-nowrap">Search Radius (r)</span>
                                <input
                                    type="range"
                                    min="2" max="8" step="1"
                                    value={searchRadius}
                                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                                    className="w-full accent-rose-500"
                                />
                                <span className="font-mono bg-white px-2 py-1 border border-slate-200 rounded text-sm font-bold text-slate-600">{searchRadius}</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'straight-line' && (
                        <div className="w-full mt-6 flex gap-4 text-xs text-slate-500 font-medium justify-center items-center">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-600 rounded"></div> Sources</div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-200 rounded"></div> Distance Gradient</div>
                        </div>
                    )}

                </div>

                {/* Right Column: Math Panel */}
                <div className="lg:w-1/3 flex flex-col gap-6">
                    <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-lg border border-slate-800 flex-1 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Calculator className="w-32 h-32" />
                        </div>

                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-700 pb-3">
                            Mathematical Breakdown
                        </h2>

                        {renderMathPanel()}
                    </div>
                </div>

            </div>
        </div>
    );
}

export const metadata = {
  id: 'mapping-distance-density',
  title: 'Mapping Distance & Density',
  description: 'Visualizing spatial relationships with Euclidean distance, Cost Distance, and Kernel Density Estimation.',
  iconName: 'Activity',
  category: 'GIS Math',
  status: 'Available'
};