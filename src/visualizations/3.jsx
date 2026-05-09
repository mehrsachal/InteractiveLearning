import React, { useState, useEffect, useRef } from 'react';
import { MousePointer2, GitCommit, Info, Map, Eraser, MoveUpRight, Wand2 } from 'lucide-react';

// --- MATH & ALGORITHM HELPERS ---

// Matrix Solver for Spline & Kriging
function solveLinearSystem(A, b) {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);

    for (let i = 0; i < n; i++) {
        // Partial pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
        }
        const temp = M[i]; M[i] = M[maxRow]; M[maxRow] = temp;

        // Singular check fallback
        if (Math.abs(M[i][i]) < 1e-10) continue;

        for (let k = i + 1; k < n; k++) {
            const c = -M[k][i] / M[i][i];
            for (let j = i; j <= n; j++) {
                if (i === j) M[k][j] = 0;
                else M[k][j] += c * M[i][j];
            }
        }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        if (Math.abs(M[i][i]) < 1e-10) {
            x[i] = 0;
            continue;
        }
        let sum = M[i][n];
        for (let k = i + 1; k < n; k++) sum -= M[i][k] * x[k];
        x[i] = sum / M[i][i];
    }
    return x;
}

// Distance helper
const dist = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// Barrier intersection helper (Line segment intersection)
function doIntersect(p1, q1, p2, q2) {
    const orientation = (p, q, r) => {
        const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
        if (val === 0) return 0; // collinear
        return (val > 0) ? 1 : 2; // clock or counterclock wise
    };
    const onSegment = (p, q, r) => (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y));

    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;
    return false;
}

// Map Z value (0-100) to standard GIS Elevation Colors
function getColor(z, isVariance = false) {
    if (isVariance) {
        // Variance mapping: White -> Red (Uncertainty)
        const v = Math.max(0, Math.min(1, z / 100));
        return `rgb(255, ${Math.floor(255 * (1 - v))}, ${Math.floor(255 * (1 - v))})`;
    }

    const clampedZ = Math.max(0, Math.min(100, z));
    // Standard elevation ramp: Green -> Yellow -> Brown -> White
    const stops = [
        { z: 0, r: 56, g: 130, b: 52 },    // Dark Green
        { z: 25, r: 154, g: 205, b: 50 },  // Light Green
        { z: 50, r: 255, g: 236, b: 139 }, // Yellow
        { z: 75, r: 210, g: 150, b: 100 }, // Brown
        { z: 100, r: 255, g: 255, b: 255 } // White
    ];

    let i = 0;
    while (i < stops.length - 1 && clampedZ >= stops[i + 1].z) i++;

    if (i === stops.length - 1) return `rgb(${stops[i].r}, ${stops[i].g}, ${stops[i].b})`;

    const t = (clampedZ - stops[i].z) / (stops[i + 1].z - stops[i].z);
    const r = Math.round(stops[i].r + t * (stops[i + 1].r - stops[i].r));
    const g = Math.round(stops[i].g + t * (stops[i + 1].g - stops[i].g));
    const b = Math.round(stops[i].b + t * (stops[i + 1].b - stops[i].b));
    return `rgb(${r}, ${g}, ${b})`;
}

// Initial points resembling a landscape trend (low bottom-left, high top-right)
const defaultPoints = [
    { x: 50, y: 350, z: 10 }, { x: 120, y: 300, z: 25 }, { x: 80, y: 200, z: 20 },
    { x: 200, y: 250, z: 40 }, { x: 250, y: 320, z: 35 }, { x: 300, y: 150, z: 60 },
    { x: 150, y: 100, z: 50 }, { x: 350, y: 280, z: 55 }, { x: 320, y: 80, z: 80 },
    { x: 400, y: 180, z: 75 }, { x: 450, y: 50, z: 95 }
];

export default function App() {
    const [points, setPoints] = useState(defaultPoints);
    const [barrier, setBarrier] = useState(null); // { p1: {x,y}, p2: {x,y} }
    const [method, setMethod] = useState('IDW');
    const [drawMode, setDrawMode] = useState('POINT'); // POINT or BARRIER
    const [barrierStart, setBarrierStart] = useState(null);
    const [currentZ, setCurrentZ] = useState(50);
    const [showErrorMap, setShowErrorMap] = useState(false);
    const canvasRef = useRef(null);

    // --- RENDERING ENGINE ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Grid resolution (lower means faster, blockier)
        const res = 5;

        ctx.clearRect(0, 0, width, height);

        // Pre-calculations for advanced methods
        let splineWeights = [];
        let krigingWeights = []; // actually K inverse
        const numPts = points.length;

        if (numPts > 0) {
            if (method.startsWith('Spline')) {
                // Build RBF Matrix
                const A = [];
                const B = [];
                for (let i = 0; i < numPts; i++) {
                    A[i] = [];
                    for (let j = 0; j < numPts; j++) {
                        let d = dist(points[i].x, points[i].y, points[j].x, points[j].y);
                        if (method === 'Spline (Regularized)') {
                            A[i][j] = d === 0 ? 0 : d * d * Math.log(d + 1e-5);
                        } else { // Tension
                            A[i][j] = Math.exp(-0.02 * d);
                        }
                    }
                    A[i][i] += 0.001; // regularization
                    B[i] = points[i].z;
                }
                splineWeights = solveLinearSystem(A, B);
            }
            else if (method === 'Kriging') {
                // Kriging - construct and invert covariance matrix
                // Spherical-like proxy: Covariance drops off with distance
                const range = 200;
                const cov = (d) => Math.exp(-Math.pow(d / range, 2));

                const K = [];
                for (let i = 0; i < numPts; i++) {
                    K[i] = [];
                    for (let j = 0; j < numPts; j++) {
                        K[i][j] = cov(dist(points[i].x, points[i].y, points[j].x, points[j].y));
                    }
                    K[i][numPts] = 1; // Lagrange multiplier for unbiasedness
                    K[i][i] += 0.05; // Nugget effect (smoothing/stability)
                }
                K[numPts] = new Array(numPts).fill(1);
                K[numPts][numPts] = 0;

                // Invert K (we'll just use the solver inside the loop for simplicity in JS, 
                // normally we'd invert once. For <50 points, solving per pixel is actually fine.)
            }
        }

        // Render loop
        for (let x = 0; x < width; x += res) {
            for (let y = 0; y < height; y += res) {
                const cx = x + res / 2;
                const cy = y + res / 2;
                let val = 0;
                let variance = 0;

                if (numPts === 0) {
                    val = 0;
                } else if (method === 'IDW' || method === 'Natural Neighbor') {
                    let num = 0;
                    let den = 0;
                    let power = method === 'IDW' ? 2 : 6; // Proxy for Natural Neighbor localization

                    for (let p of points) {
                        let d = dist(cx, cy, p.x, p.y);
                        if (d < 1) d = 1;

                        // Check Barrier
                        if (barrier && doIntersect({ x: cx, y: cy }, p, barrier.p1, barrier.p2)) {
                            continue; // Barrier blocks influence
                        }

                        let w = 1 / Math.pow(d, power);
                        num += w * p.z;
                        den += w;
                    }
                    val = den === 0 ? 0 : num / den;

                } else if (method.startsWith('Spline') && splineWeights.length) {
                    for (let i = 0; i < numPts; i++) {
                        let d = dist(cx, cy, points[i].x, points[i].y);
                        let phi = method === 'Spline (Regularized)' ?
                            (d === 0 ? 0 : d * d * Math.log(d + 1e-5)) :
                            Math.exp(-0.02 * d);
                        val += splineWeights[i] * phi;
                    }
                } else if (method === 'Kriging') {
                    // Simple Kriging solver per pixel
                    const range = 200;
                    const cov = (d) => Math.exp(-Math.pow(d / range, 2));

                    const K = [];
                    for (let i = 0; i < numPts; i++) {
                        K[i] = [];
                        for (let j = 0; j < numPts; j++) {
                            K[i][j] = cov(dist(points[i].x, points[i].y, points[j].x, points[j].y));
                        }
                        K[i][numPts] = 1;
                        K[i][i] += 0.05;
                    }
                    K[numPts] = new Array(numPts).fill(1);
                    K[numPts][numPts] = 0;

                    const kVec = [];
                    for (let i = 0; i < numPts; i++) {
                        kVec[i] = cov(dist(cx, cy, points[i].x, points[i].y));
                    }
                    kVec[numPts] = 1;

                    const weights = solveLinearSystem(K, kVec);
                    val = 0;
                    let estVar = cov(0); // C(0)
                    for (let i = 0; i < numPts; i++) {
                        val += weights[i] * points[i].z;
                        estVar -= weights[i] * kVec[i];
                    }
                    estVar -= weights[numPts]; // lagrange multiplier part
                    variance = Math.max(0, estVar * 100); // Scale up for visual
                }

                ctx.fillStyle = getColor(val, method === 'Kriging' && showErrorMap);
                if (method === 'Kriging' && showErrorMap) {
                    ctx.fillStyle = getColor(variance, true);
                }
                ctx.fillRect(x, y, res, res);
            }
        }

        // Draw Barrier
        if (barrier) {
            ctx.beginPath();
            ctx.moveTo(barrier.p1.x, barrier.p1.y);
            ctx.lineTo(barrier.p2.x, barrier.p2.y);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.strokeStyle = '#ef4444'; // Red dash inner
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw pending barrier
        if (barrierStart) {
            // visual feedback handled in handlers
        }

        // Draw Points
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.fillText(p.z.toFixed(0), p.x + 8, p.y + 4);
        });

    }, [points, method, barrier, showErrorMap]);

    // --- INTERACTION HANDLERS ---
    const handleCanvasClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (drawMode === 'POINT') {
            setPoints([...points, { x, y, z: currentZ }]);
        } else if (drawMode === 'BARRIER') {
            if (!barrierStart) {
                setBarrierStart({ x, y });
            } else {
                setBarrier({ p1: barrierStart, p2: { x, y } });
                setBarrierStart(null);
                setDrawMode('POINT'); // Switch back to points
            }
        }
    };

    const handleMouseMove = (e) => {
        if (drawMode === 'BARRIER' && barrierStart) {
            // Could draw a temp line, but simplified for performance
        }
    };

    const clearAll = () => {
        setPoints([]);
        setBarrier(null);
    };

    const methodInfo = {
        'IDW': {
            title: "Inverse Distance Weighting (IDW)",
            desc: "Weighted guessing game. The closer a neighbor is, the more you trust their number. Creates a map that never exceeds your highest or lowest points.",
            note: "Notice the 'bulls-eye' patterns around points."
        },
        'Spline (Regularized)': {
            title: "Spline (Regularized)",
            desc: "Like throwing a stretchy rubber sheet over tent poles. Regularized creates the smoothest possible curve, often exceeding the min/max values to create hills and valleys.",
            note: "Great for smoothly changing phenomena like elevation."
        },
        'Spline (Tension)': {
            title: "Spline (Tension)",
            desc: "Acts like a stiffer rubber sheet. The surface is constrained tightly to the data points, flattening out between them without overshooting as wildly.",
            note: "Use when data shouldn't have extreme unexplained peaks."
        },
        'Natural Neighbor': {
            title: "Natural Neighbor (Simplified)",
            desc: "Highly localized smoothing (proxy using high-power IDW here). It focuses heavily on immediate surrounding points, preventing overshooting while smoothing edges.",
            note: "Good for large datasets with varying density."
        },
        'Kriging': {
            title: "Kriging",
            desc: "Powerful statistical tool that analyzes the spatial relationships between points to predict values. It's the only tool that can give you a 'certainty' (error) map.",
            note: "Toggle 'Show Error Map' to see where the algorithm is confident (white) vs uncertain (red)."
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* HEADER */}
                <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center">
                        <Map className="mr-3 text-blue-600" /> GIS Surface Interpolation
                        <span className="ml-3 text-base font-medium text-blue-500 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">Module 3 Companion</span>
                    </h1>
                    <p className="text-slate-600">
                        Interactive companion to Training Module 3. Place points (your "tent poles"), draw physical barriers, and watch how different mathematical tools "guess" the spaces in between.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* SIDEBAR CONTROLS */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <Wand2 className="mr-2 w-5 h-5" /> Interpolation Method
                            </h2>
                            <div className="space-y-2">
                                {Object.keys(methodInfo).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMethod(m)}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${method === m
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>

                            {method === 'Kriging' && (
                                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showErrorMap}
                                            onChange={(e) => setShowErrorMap(e.target.checked)}
                                            className="w-5 h-5 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span className="text-sm font-medium text-orange-900">Show Prediction Error / Variance Map</span>
                                    </label>
                                    <p className="text-xs text-orange-700 mt-2">
                                        Visualizes uncertainty. White = Certain (near points), Red = Uncertain.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <GitCommit className="mr-2 w-5 h-5" /> Map Tools
                            </h2>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    onClick={() => { setDrawMode('POINT'); setBarrierStart(null); }}
                                    className={`flex flex-col items-center p-3 rounded-lg border ${drawMode === 'POINT' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'hover:bg-slate-50 border-slate-200'}`}
                                >
                                    <MousePointer2 className="mb-2" />
                                    <span className="text-sm font-medium">Add Points</span>
                                </button>

                                <button
                                    onClick={() => setDrawMode('BARRIER')}
                                    className={`flex flex-col items-center p-3 rounded-lg border ${drawMode === 'BARRIER' ? 'bg-red-50 border-red-500 text-red-700' : 'hover:bg-slate-50 border-slate-200'}`}
                                >
                                    <MoveUpRight className="mb-2" />
                                    <span className="text-sm font-medium">Draw Barrier</span>
                                </button>
                            </div>

                            {drawMode === 'POINT' && (
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-700">Next Point Z-Value (Elevation): <span className="font-bold text-indigo-600">{currentZ}</span></label>
                                    <input
                                        type="range" min="0" max="100"
                                        value={currentZ}
                                        onChange={e => setCurrentZ(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Low (0)</span><span>High (100)</span>
                                    </div>
                                </div>
                            )}

                            {drawMode === 'BARRIER' && (
                                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                    Click two points on the map to draw a physical barrier (like a fault line). Notice how IDW cannot flow across it.
                                </p>
                            )}

                            <hr className="my-6 border-slate-200" />

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setPoints(defaultPoints)}
                                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Load Scenario
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="flex-1 px-4 py-2 flex justify-center items-center bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Eraser className="w-4 h-4 mr-2" /> Clear Map
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* MAIN CANVAS */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                            <canvas
                                ref={canvasRef}
                                width={700}
                                height={450}
                                onClick={handleCanvasClick}
                                onMouseMove={handleMouseMove}
                                className="w-full h-auto bg-slate-100 rounded-xl cursor-crosshair border border-slate-200"
                                style={{ touchAction: 'none' }}
                            />
                            {/* Legend overlay */}
                            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur p-3 rounded-lg shadow border border-slate-200 pointer-events-none">
                                <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Elevation</div>
                                <div className="h-4 w-32 rounded bg-gradient-to-r from-[#388234] via-[#ffff8b] to-[#ffffff] border border-slate-300"></div>
                                <div className="flex justify-between text-xs text-slate-600 mt-1">
                                    <span>Low</span><span>High</span>
                                </div>
                            </div>
                        </div>

                        {/* EDUCATIONAL PANEL */}
                        <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl text-blue-900">
                            <h3 className="text-xl font-bold mb-2 flex items-center">
                                <Info className="mr-2 text-blue-500" />
                                {methodInfo[method].title}
                            </h3>
                            <p className="text-blue-800 mb-4">{methodInfo[method].desc}</p>
                            <div className="bg-white/60 p-4 rounded-lg text-sm border border-blue-100">
                                <strong>Observation:</strong> {methodInfo[method].note}
                                {barrier && method === 'IDW' && " Notice how the barrier completely halts the interpolation flow on either side of the line!"}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export const metadata = {
  id: 'surface-interpolation-companion',
  title: 'GIS Surface Interpolation — Module 3 Companion',
  description: 'An interactive companion to Training Module 3. Explore IDW, Spline, Natural Neighbor, and Kriging interpolation methods on a live canvas with barriers and error maps.',
  iconName: 'Map',
  category: 'GIS Analysis',
  status: 'Available'
};