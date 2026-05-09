import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Info, Settings2, RefreshCw, Hand } from 'lucide-react';

// --- Math & Matrix Utilities ---

// Solves Ax = B using Gauss-Jordan elimination to find the inverse matrix
const invertMatrix = (matrix) => {
    const n = matrix.length;
    let a = matrix.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))]);

    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) maxRow = k;
        }

        let temp = a[i];
        a[i] = a[maxRow];
        a[maxRow] = temp;

        if (Math.abs(a[i][i]) < 1e-10) return null; // Matrix is singular

        let pivot = a[i][i];
        for (let j = 0; j < 2 * n; j++) a[i][j] /= pivot;

        for (let k = 0; k < n; k++) {
            if (k !== i) {
                let factor = a[k][i];
                for (let j = 0; j < 2 * n; j++) a[k][j] -= factor * a[i][j];
            }
        }
    }
    return a.map((row) => row.slice(n, 2 * n));
};

// Computes Natural Cubic Spline for 1D Array
const computeNaturalSpline = (pts, width) => {
    if (pts.length < 2) return [];
    const n = pts.length - 1;
    const x = pts.map((p) => p.x);
    const a = pts.map((p) => p.y);

    const h = [];
    for (let i = 0; i < n; i++) h.push(x[i + 1] - x[i]);

    const alpha = [0];
    for (let i = 1; i < n; i++) {
        alpha.push((3 / h[i]) * (a[i + 1] - a[i]) - (3 / h[i - 1]) * (a[i] - a[i - 1]));
    }

    const l = [1], mu = [0], z = [0];
    for (let i = 1; i < n; i++) {
        l.push(2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1]);
        mu.push(h[i] / l[i]);
        z.push((alpha[i] - h[i - 1] * z[i - 1]) / l[i]);
    }

    l.push(1);
    z.push(0);

    const c = Array(n + 1).fill(0);
    const b = Array(n).fill(0);
    const d = Array(n).fill(0);

    for (let j = n - 1; j >= 0; j--) {
        c[j] = z[j] - mu[j] * c[j + 1];
        b[j] = (a[j + 1] - a[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
        d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    }

    const result = [];
    let currentSegment = 0;

    for (let px = 0; px <= width; px += 2) {
        if (px < x[0]) {
            // Linear extrapolate left
            const slope = b[0];
            result.push({ x: px, y: a[0] + slope * (px - x[0]) });
            continue;
        }
        if (px > x[n]) {
            // Linear extrapolate right
            const slope = b[n - 1] + 2 * c[n - 1] * h[n - 1] + 3 * d[n - 1] * h[n - 1] * h[n - 1];
            result.push({ x: px, y: a[n] + slope * (px - x[n]) });
            continue;
        }

        while (currentSegment < n - 1 && px > x[currentSegment + 1]) {
            currentSegment++;
        }

        const dx = px - x[currentSegment];
        const py = a[currentSegment] + b[currentSegment] * dx + c[currentSegment] * dx * dx + d[currentSegment] * dx * dx * dx;
        result.push({ x: px, y: py });
    }
    return result;
};

// Computes 1D Ordinary Kriging 
const computeKriging = (pts, width, range, nugget, sill) => {
    if (pts.length === 0) return [];
    if (pts.length === 1) return Array.from({ length: width / 2 + 1 }, (_, i) => ({ x: i * 2, y: pts[0].y, var: sill }));

    const N = pts.length;
    const K = [];

    // Gaussian Covariance Function
    const cov = (dist) => dist === 0 ? (sill + nugget) : sill * Math.exp(-Math.pow(dist / range, 2));

    // Build Covariance Matrix
    for (let i = 0; i < N; i++) {
        K[i] = [];
        for (let j = 0; j < N; j++) {
            K[i][j] = cov(Math.abs(pts[i].x - pts[j].x));
        }
        K[i][N] = 1; // Lagrange multiplier
    }
    K[N] = Array(N + 1).fill(1);
    K[N][N] = 0;

    const K_inv = invertMatrix(K);
    if (!K_inv) return []; // Fallback if perfectly singular

    const result = [];
    for (let px = 0; px <= width; px += 2) {
        const k = pts.map(p => cov(Math.abs(p.x - px)));
        k.push(1);

        let w = [];
        for (let i = 0; i <= N; i++) {
            let sum = 0;
            for (let j = 0; j <= N; j++) sum += K_inv[i][j] * k[j];
            w[i] = sum;
        }

        let y = 0;
        for (let i = 0; i < N; i++) y += w[i] * pts[i].y;

        let variance = (sill + nugget) - w.reduce((sum, wi, i) => sum + wi * k[i], 0);
        variance = Math.max(0, variance); // Prevent floating point negatives

        result.push({ x: px, y, var: variance });
    }

    return result;
};


// --- React Component ---

export default function InterpolationApp() {
    const [points, setPoints] = useState([
        { id: 1, x: 80, y: 300 },
        { id: 2, x: 250, y: 150 },
        { id: 3, x: 420, y: 280 },
        { id: 4, x: 550, y: 100 },
    ]);

    const [activeLayers, setActiveLayers] = useState({ spline: true, kriging: true });
    const [krigingParams, setKrigingParams] = useState({ range: 150, nugget: 0, sill: 10000 });
    const [draggingPoint, setDraggingPoint] = useState(null);

    const svgRef = useRef(null);
    const WIDTH = 700;
    const HEIGHT = 400;

    // Prepare points (sorted by x for spline math, deduplicated slightly)
    const sortedPoints = useMemo(() => {
        let sorted = [...points].sort((a, b) => a.x - b.x);
        // Prevent exactly identical X coordinates which break matrices
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].x - sorted[i - 1].x < 2) {
                sorted[i].x = sorted[i - 1].x + 2;
            }
        }
        return sorted;
    }, [points]);

    // Compute Spline Path
    const splineData = useMemo(() => {
        if (!activeLayers.spline) return [];
        return computeNaturalSpline(sortedPoints, WIDTH);
    }, [sortedPoints, activeLayers.spline]);

    // Compute Kriging Path & Uncertainty
    const krigingData = useMemo(() => {
        if (!activeLayers.kriging) return [];
        return computeKriging(sortedPoints, WIDTH, krigingParams.range, krigingParams.nugget, krigingParams.sill);
    }, [sortedPoints, activeLayers.kriging, krigingParams]);


    // Interaction Handlers
    const getMouseCoords = (e) => {
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min(WIDTH, e.clientX - rect.left)),
            y: Math.max(0, Math.min(HEIGHT, e.clientY - rect.top))
        };
    };

    const handlePointerDown = (e, id) => {
        e.stopPropagation();
        setDraggingPoint(id);
    };

    const handlePointerMove = (e) => {
        if (draggingPoint === null) return;
        const coords = getMouseCoords(e);
        setPoints(pts => pts.map(p => p.id === draggingPoint ? { ...p, x: coords.x, y: coords.y } : p));
    };

    const handlePointerUp = () => setDraggingPoint(null);

    const handleSvgClick = (e) => {
        if (draggingPoint !== null) return;
        const coords = getMouseCoords(e);
        setPoints(pts => [...pts, { id: Date.now(), x: coords.x, y: coords.y }]);
    };

    const handlePointDoubleClick = (e, id) => {
        e.stopPropagation();
        if (points.length <= 2) return; // Keep at least 2 points
        setPoints(pts => pts.filter(p => p.id !== id));
    };

    const resetPoints = () => {
        setPoints([
            { id: 1, x: 80, y: 300 },
            { id: 2, x: 250, y: 150 },
            { id: 3, x: 420, y: 280 },
            { id: 4, x: 550, y: 100 },
        ]);
    };

    // SVG Path Generators
    const createLinePath = (data) => {
        if (data.length === 0) return "";
        return `M ${data.map(d => `${d.x},${d.y}`).join(' L ')}`;
    };

    const createAreaPath = (data) => {
        if (data.length === 0) return "";
        const top = data.map(d => `${d.x},${d.y - Math.sqrt(d.var)}`);
        const bottom = [...data].reverse().map(d => `${d.x},${d.y + Math.sqrt(d.var)}`);
        return `M ${top.join(' L ')} L ${bottom.join(' L ')} Z`;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">

            {/* Left Column: Visualization */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M4 12a8 8 0 0 1 16 0z" /><path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
                            Interactive Spatial Interpolation
                        </h2>
                        <button onClick={resetPoints} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                            <RefreshCw size={16} /> Reset Points
                        </button>
                    </div>

                    <div
                        className="relative bg-slate-100 rounded-lg border border-slate-300 overflow-hidden cursor-crosshair select-none touch-none"
                        style={{ width: '100%', maxWidth: '700px', aspectRatio: '7/4' }}
                    >
                        <svg
                            ref={svgRef}
                            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                            className="w-full h-full"
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                            onClick={handleSvgClick}
                        >
                            <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />

                            {/* Kriging Uncertainty Area */}
                            {activeLayers.kriging && (
                                <path
                                    d={createAreaPath(krigingData)}
                                    fill="rgba(239, 68, 68, 0.15)"
                                    className="transition-all duration-300 pointer-events-none"
                                />
                            )}

                            {/* Kriging Estimate Line */}
                            {activeLayers.kriging && (
                                <path
                                    d={createLinePath(krigingData)}
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="3"
                                    strokeDasharray="6 4"
                                    className="pointer-events-none"
                                />
                            )}

                            {/* Spline Line */}
                            {activeLayers.spline && (
                                <path
                                    d={createLinePath(splineData)}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="pointer-events-none"
                                />
                            )}

                            {/* Data Points */}
                            {points.map(p => (
                                <g key={p.id} transform={`translate(${p.x},${p.y})`}>
                                    <circle
                                        r="14"
                                        fill="transparent"
                                        className="cursor-grab hover:fill-slate-300/30"
                                        onPointerDown={(e) => handlePointerDown(e, p.id)}
                                        onDoubleClick={(e) => handlePointDoubleClick(e, p.id)}
                                    />
                                    <circle
                                        r="6"
                                        fill={draggingPoint === p.id ? "#1e293b" : "#475569"}
                                        stroke="white"
                                        strokeWidth="2"
                                        className="pointer-events-none"
                                    />
                                </g>
                            ))}
                        </svg>
                    </div>

                    <div className="flex gap-4 mt-4 text-sm justify-center text-slate-600">
                        <span className="flex items-center gap-1"><Hand size={16} /> Drag points to move</span>
                        <span className="flex items-center gap-1">Click empty space to add</span>
                        <span className="flex items-center gap-1">Double-click point to delete</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Controls & Explanations */}
            <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4">

                {/* Layer Toggles */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                        <Settings2 size={18} /> Algorithms
                    </h3>

                    <label className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 cursor-pointer mb-3 transition-colors hover:bg-blue-100">
                        <input
                            type="checkbox"
                            checked={activeLayers.spline}
                            onChange={e => setActiveLayers(l => ({ ...l, spline: e.target.checked }))}
                            className="w-5 h-5 accent-blue-600"
                        />
                        <div className="flex-1">
                            <span className="font-semibold text-blue-700 block">Spline Interpolation</span>
                            <span className="text-xs text-blue-600/80">Smooth curve passing exactly through points.</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50 cursor-pointer transition-colors hover:bg-red-100">
                        <input
                            type="checkbox"
                            checked={activeLayers.kriging}
                            onChange={e => setActiveLayers(l => ({ ...l, kriging: e.target.checked }))}
                            className="w-5 h-5 accent-red-600"
                        />
                        <div className="flex-1">
                            <span className="font-semibold text-red-700 block">Kriging (Geostatistical)</span>
                            <span className="text-xs text-red-600/80">Estimates value + uncertainty (shaded band).</span>
                        </div>
                    </label>
                </div>

                {/* Kriging Settings */}
                {activeLayers.kriging && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wider">Kriging Parameters</h3>

                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <label className="font-medium">Range (Spatial Influence)</label>
                                    <span className="text-slate-500">{krigingParams.range} px</span>
                                </div>
                                <input
                                    type="range" min="30" max="400" step="10"
                                    value={krigingParams.range}
                                    onChange={(e) => setKrigingParams(p => ({ ...p, range: Number(e.target.value) }))}
                                    className="w-full accent-red-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">How far a point's influence extends.</p>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <label className="font-medium">Nugget (Measurement Error)</label>
                                    <span className="text-slate-500">{krigingParams.nugget}</span>
                                </div>
                                <input
                                    type="range" min="0" max="8000" step="100"
                                    value={krigingParams.nugget}
                                    onChange={(e) => setKrigingParams(p => ({ ...p, nugget: Number(e.target.value) }))}
                                    className="w-full accent-red-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    If &gt; 0, the model assumes data is noisy and won't pass exactly through the points.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Panel */}
                <div className="bg-amber-50 p-5 rounded-xl shadow-sm border border-amber-200 text-sm text-amber-900 leading-relaxed">
                    <h3 className="font-bold flex items-center gap-2 mb-2">
                        <Info size={18} /> What's happening?
                    </h3>
                    <ul className="space-y-3 list-disc pl-4 marker:text-amber-400">
                        <li>
                            <strong>Spline (Blue)</strong> is purely mathematical. It acts like a stiff rubber band trying to minimize its bending energy while hitting every data point perfectly. It doesn't know what the data <i>means</i>.
                        </li>
                        <li>
                            <strong>Kriging (Red)</strong> uses statistics. It calculates a line of "best guess" while showing you a shaded area of <strong>uncertainty</strong>. Notice how the uncertainty (shaded red) gets wider when you move far away from your known data points.
                        </li>
                        <li>
                            Try increasing the <strong>Nugget</strong> slider. The red line will stop snapping perfectly to your points. This is Kriging accounting for "noise" or measurement error in your data!
                        </li>
                    </ul>
                </div>

            </div>
        </div>
    );
}

export const metadata = {
  id: 'spatial-interpolation',
  title: 'Spatial Interpolation',
  description: 'Interactive playground comparing deterministic (Spline) and geostatistical (Kriging) interpolation methods.',
  iconName: 'Activity',
  category: 'GIS Math',
  status: 'Available'
};