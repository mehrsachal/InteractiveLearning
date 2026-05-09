import React, { useState, useMemo } from 'react';
import { Camera, Maximize, MoveVertical, Info, RefreshCw } from 'lucide-react';

const App = () => {
    // State for camera parameters
    const [tilt, setTilt] = useState(15); // degrees
    const [height, setHeight] = useState(100); // meters/units

    // Constants for visualization
    const FOCAL_LENGTH = 60; // Focal length for the geometric side view
    const CAMERA_FOV_Y = 35; // Vertical FOV in degrees
    const CANVAS_SIZE = 400; // Size of the SVG canvases

    // Convert degrees to radians
    const rad = (deg) => (deg * Math.PI) / 180;

    // --- MATHEMATICS & GEOMETRY CALCULATIONS --- //

    // 1. Calculate Side View Geometry
    const sideViewMath = useMemo(() => {
        const cx = 100; // Camera X position (Nadir is directly below)
        const groundY = 350; // Ground plane Y level
        const cy = groundY - height; // Camera Y position
        const theta = rad(tilt);
        const alpha = rad(CAMERA_FOV_Y / 2);

        // Optical Axis Vector
        const vCenter = { x: Math.sin(theta), y: Math.cos(theta) };

        // Sensor Plane calculations
        const sensorCenter = {
            x: cx - FOCAL_LENGTH * vCenter.x,
            y: cy - FOCAL_LENGTH * vCenter.y
        };

        const sensorVector = { x: Math.cos(theta), y: -Math.sin(theta) }; // Perpendicular to optical axis
        const sensorWidthHalf = FOCAL_LENGTH * Math.tan(alpha);

        const sensorTop = { // Actually the edge capturing the 'far' objects
            x: sensorCenter.x + sensorWidthHalf * sensorVector.x,
            y: sensorCenter.y + sensorWidthHalf * sensorVector.y
        };
        const sensorBottom = { // Edge capturing the 'near' objects
            x: sensorCenter.x - sensorWidthHalf * sensorVector.x,
            y: sensorCenter.y - sensorWidthHalf * sensorVector.y
        };

        // Helper function to project a point on the ground onto the sensor plane
        const projectToSensor = (groundX) => {
            const vRay = { x: groundX - cx, y: groundY - cy };
            // Dot product of ray with optical axis
            const dotProduct = vRay.x * vCenter.x + vRay.y * vCenter.y;
            if (dotProduct <= 0) return null; // Behind camera

            const k = FOCAL_LENGTH / dotProduct;
            return {
                x: cx - k * vRay.x,
                y: cy - k * vRay.y
            };
        };

        // Calculate FOV limits on ground
        const rayFarDir = { x: cx - sensorTop.x, y: cy - sensorTop.y };
        const rayNearDir = { x: cx - sensorBottom.x, y: cy - sensorBottom.y };

        const getGroundIntersect = (dir) => {
            if (dir.y <= 0) return cx + 10000; // Points to horizon or sky
            const t = (groundY - cy) / dir.y;
            return cx + t * dir.x;
        };

        const gFarX = getGroundIntersect(rayFarDir);
        const gNearX = getGroundIntersect(rayNearDir);

        // Objects on the ground to track
        const nearObject = { start: cx + 20, end: cx + 40, color: '#ef4444' }; // Red
        const farObject = { start: cx + 120, end: cx + 140, color: '#3b82f6' }; // Blue

        const pNearStart = projectToSensor(nearObject.start);
        const pNearEnd = projectToSensor(nearObject.end);
        const pFarStart = projectToSensor(farObject.start);
        const pFarEnd = projectToSensor(farObject.end);

        // Calculate lengths on sensor to show scale difference
        const getLength = (p1, p2) => p1 && p2 ? Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) : 0;

        return {
            cx, cy, groundY, theta, sensorTop, sensorBottom, gFarX, gNearX,
            vCenter, nearObject, farObject, pNearStart, pNearEnd, pFarStart, pFarEnd,
            lenNear: getLength(pNearStart, pNearEnd),
            lenFar: getLength(pFarStart, pFarEnd)
        };
    }, [tilt, height]);


    // 2. Calculate Camera View 3D Projection
    const cameraViewGrid = useMemo(() => {
        const f_p = 400; // Projection focal length
        const theta = rad(tilt);
        const quads = [];

        // Generate a ground grid
        for (let y = -50; y <= 500; y += 20) {
            for (let x = -210; x <= 190; x += 20) {

                let color = ((x + 210) / 20 + (y + 50) / 20) % 2 === 0 ? '#e5e7eb' : '#ffffff';

                // Highlight our specific marker objects
                let isHighlight = false;
                if (x === -10 && y === 20) { color = '#ef4444'; isHighlight = true; } // Red (Near)
                if (x === -10 && y === 120) { color = '#3b82f6'; isHighlight = true; } // Blue (Far)

                const points3D = [
                    { x: x, y: y },
                    { x: x + 20, y: y },
                    { x: x + 20, y: y + 20 },
                    { x: x, y: y + 20 }
                ];

                // Transform and project
                const projected = points3D.map(p => {
                    // 3D rotation around X axis (pitch/tilt)
                    const y_c = p.y * Math.cos(theta) - height * Math.sin(theta);
                    const z_c = p.y * Math.sin(theta) + height * Math.cos(theta);

                    if (z_c < 1) return null; // Behind or too close to camera

                    return {
                        px: CANVAS_SIZE / 2 + (f_p * p.x) / z_c,
                        py: CANVAS_SIZE / 2 - (f_p * y_c) / z_c, // Canvas Y is inverted
                        z: z_c
                    };
                });

                if (projected.every(p => p !== null)) {
                    // Center Z for Painter's Algorithm sorting
                    const zCenter = projected.reduce((sum, p) => sum + p.z, 0) / 4;
                    quads.push({ points: projected, color, zCenter, isHighlight });
                }
            }
        }

        // Sort descending by Z distance (draw furthest objects first)
        return quads.sort((a, b) => b.zCenter - a.zCenter);
    }, [tilt, height]);


    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">

            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900 mb-2">
                    <Camera className="w-8 h-8 text-blue-600" />
                    Tilt Displacement Explorer
                </h1>
                <p className="text-slate-600 text-lg">
                    Discover how tilting a camera causes scale variation, changing how large objects appear based on their distance.
                </p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Main Visualizations */}
                <div className="lg:col-span-8 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Side View (Geometry) */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 font-semibold flex items-center gap-2">
                                <MoveVertical className="w-5 h-5 text-slate-500" />
                                Side View Geometry
                            </div>
                            <div className="relative aspect-square flex items-center justify-center bg-white p-2">
                                <svg width="100%" height="100%" viewBox="0 0 600 400" className="overflow-hidden">

                                    {/* FOV Cone */}
                                    <polygon
                                        points={`${sideViewMath.cx},${sideViewMath.cy} ${sideViewMath.gFarX},${sideViewMath.groundY} ${sideViewMath.gNearX},${sideViewMath.groundY}`}
                                        fill="#fef08a" opacity="0.3"
                                    />

                                    {/* Ground Line */}
                                    <line x1="0" y1={sideViewMath.groundY} x2="1500" y2={sideViewMath.groundY} stroke="#94a3b8" strokeWidth="4" />

                                    {/* Optical Axis (Center Ray) */}
                                    <line
                                        x1={sideViewMath.cx} y1={sideViewMath.cy}
                                        x2={sideViewMath.cx + (sideViewMath.groundY - sideViewMath.cy) * Math.tan(sideViewMath.theta)} y2={sideViewMath.groundY}
                                        stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6,6"
                                    />

                                    {/* Target Markers on Ground */}
                                    <rect x={sideViewMath.nearObject.start} y={sideViewMath.groundY - 5} width="20" height="10" fill="#ef4444" />
                                    <rect x={sideViewMath.farObject.start} y={sideViewMath.groundY - 5} width="20" height="10" fill="#3b82f6" />

                                    {/* Rays from targets to lens */}
                                    <g opacity="0.4" strokeWidth="1" strokeDasharray="4,4">
                                        <line x1={sideViewMath.nearObject.start} y1={sideViewMath.groundY} x2={sideViewMath.cx} y2={sideViewMath.cy} stroke="#ef4444" />
                                        <line x1={sideViewMath.nearObject.end} y1={sideViewMath.groundY} x2={sideViewMath.cx} y2={sideViewMath.cy} stroke="#ef4444" />
                                        <line x1={sideViewMath.farObject.start} y1={sideViewMath.groundY} x2={sideViewMath.cx} y2={sideViewMath.cy} stroke="#3b82f6" />
                                        <line x1={sideViewMath.farObject.end} y1={sideViewMath.groundY} x2={sideViewMath.cx} y2={sideViewMath.cy} stroke="#3b82f6" />
                                    </g>

                                    {/* The Camera Lens */}
                                    <circle cx={sideViewMath.cx} cy={sideViewMath.cy} r="6" fill="#1e293b" />

                                    {/* The Sensor Plane */}
                                    <line
                                        x1={sideViewMath.sensorTop.x} y1={sideViewMath.sensorTop.y}
                                        x2={sideViewMath.sensorBottom.x} y2={sideViewMath.sensorBottom.y}
                                        stroke="#0f172a" strokeWidth="4" strokeLinecap="round"
                                    />

                                    {/* Projected target footprints on Sensor */}
                                    {sideViewMath.pNearStart && sideViewMath.pNearEnd && (
                                        <line
                                            x1={sideViewMath.pNearStart.x} y1={sideViewMath.pNearStart.y}
                                            x2={sideViewMath.pNearEnd.x} y2={sideViewMath.pNearEnd.y}
                                            stroke="#ef4444" strokeWidth="6" strokeLinecap="round"
                                        />
                                    )}
                                    {sideViewMath.pFarStart && sideViewMath.pFarEnd && (
                                        <line
                                            x1={sideViewMath.pFarStart.x} y1={sideViewMath.pFarStart.y}
                                            x2={sideViewMath.pFarEnd.x} y2={sideViewMath.pFarEnd.y}
                                            stroke="#3b82f6" strokeWidth="6" strokeLinecap="round"
                                        />
                                    )}

                                    {/* Labels */}
                                    <text x={sideViewMath.cx - 15} y={sideViewMath.cy - 10} fontSize="14" fill="#475569" fontWeight="bold">Lens</text>
                                    <text x={sideViewMath.sensorTop.x - 45} y={sideViewMath.sensorTop.y - 10} fontSize="14" fill="#475569" fontWeight="bold">Sensor</text>
                                    <text x={sideViewMath.cx + 5} y={sideViewMath.groundY + 25} fontSize="14" fill="#475569" fontWeight="bold">Nadir</text>

                                    {/* Data overlay in diagram */}
                                    <rect x="360" y="20" width="220" height="90" rx="6" fill="white" stroke="#e2e8f0" />
                                    <text x="375" y="45" fontSize="13" fill="#64748b" fontWeight="600">SENSOR PROJECTION SIZE</text>
                                    <text x="375" y="65" fontSize="14" fill="#ef4444">Near Object (Red): {sideViewMath.lenNear.toFixed(1)} px</text>
                                    <text x="375" y="85" fontSize="14" fill="#3b82f6">Far Object (Blue): {sideViewMath.lenFar.toFixed(1)} px</text>

                                </svg>
                            </div>
                        </div>

                        {/* Camera View (3D Projection) */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 font-semibold flex items-center gap-2">
                                <Maximize className="w-5 h-5 text-slate-500" />
                                Camera View (What the sensor sees)
                            </div>
                            <div className="relative aspect-square bg-[#87CEEB] overflow-hidden">
                                <svg width="100%" height="100%" viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}>
                                    {/* Grid / Ground Quads */}
                                    {cameraViewGrid.map((quad, i) => (
                                        <polygon
                                            key={i}
                                            points={`${quad.points[0].px},${quad.points[0].py} ${quad.points[1].px},${quad.points[1].py} ${quad.points[2].px},${quad.points[2].py} ${quad.points[3].px},${quad.points[3].py}`}
                                            fill={quad.color}
                                            stroke={quad.isHighlight ? quad.color : "#d1d5db"}
                                            strokeWidth={quad.isHighlight ? "2" : "0.5"}
                                        />
                                    ))}

                                    {/* Crosshair / Principal Point */}
                                    <g transform={`translate(${CANVAS_SIZE / 2}, ${CANVAS_SIZE / 2})`}>
                                        <line x1="-10" y1="0" x2="10" y2="0" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                                        <line x1="0" y1="-10" x2="0" y2="10" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                                        <circle cx="0" cy="0" r="12" stroke="rgba(0,0,0,0.5)" strokeWidth="2" fill="none" />
                                    </g>
                                </svg>

                                {/* Visual warning if tilt makes horizon visible */}
                                {tilt > 30 && (
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-md shadow-sm text-xs font-semibold text-slate-600">
                                        Horizon Visible
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Interactive Controls */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-blue-600" /> Controls
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                            {/* Tilt Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="font-semibold text-slate-700">Camera Tilt Angle</label>
                                    <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">{tilt}°</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="45" step="1"
                                    value={tilt}
                                    onChange={(e) => setTilt(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-slate-500 font-medium">
                                    <span>0° (Vertical/Nadir)</span>
                                    <span>45° (High Oblique)</span>
                                </div>
                            </div>

                            {/* Height Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="font-semibold text-slate-700">Camera Height</label>
                                    <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">{height}m</span>
                                </div>
                                <input
                                    type="range"
                                    min="50" max="150" step="5"
                                    value={height}
                                    onChange={(e) => setHeight(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-slate-500 font-medium">
                                    <span>50m (Low Altitude)</span>
                                    <span>150m (High Altitude)</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Educational Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
                        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <Info className="w-6 h-6" /> What's Happening?
                        </h3>

                        <div className="space-y-4 text-blue-800 leading-relaxed">
                            <p>
                                <strong>Tilt Displacement</strong> occurs when a camera's optical axis is not perfectly perpendicular to the ground.
                            </p>

                            <div className="bg-white/60 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-bold mb-2">Try setting Tilt to 0°</h4>
                                <p className="text-sm">
                                    Notice that the <span className="text-red-600 font-bold">Red</span> and <span className="text-blue-600 font-bold">Blue</span> squares (which are identical in size on the ground) take up the <strong>exact same amount of space</strong> on the sensor. The scale is uniform.
                                </p>
                            </div>

                            <div className="bg-white/60 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-bold mb-2">Now, increase the Tilt</h4>
                                <p className="text-sm">
                                    The rays from the <span className="text-blue-600 font-bold">Blue</span> square must travel further to reach the lens. As they travel, they spread out. Because the blue square is further away along the ray path, it is projected much smaller onto the camera sensor.
                                </p>
                            </div>

                            <p className="text-sm border-t border-blue-200 pt-4 mt-2">
                                This causes a "keystone" or trapezoidal distortion, where the grid lines appear to converge towards the top of the image. Scale decreases as you move further from the camera along the tilt direction.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-3">Key Terms</h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li><strong className="text-slate-900">Nadir:</strong> The point on the ground directly underneath the camera lens.</li>
                            <li><strong className="text-slate-900">Principal Point:</strong> The exact center of the photograph (where the crosshairs are).</li>
                            <li><strong className="text-slate-900">Scale (<span className="italic">S</span>):</strong> Calculated as Focal Length (<span className="italic">f</span>) divided by distance (<span className="italic">H'</span>). When tilted, <span className="italic">H'</span> varies across the image, breaking uniform scale.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default App;

export const metadata = {
  id: 'tilt-displacement',
  title: 'Tilt Displacement',
  description: 'Interactive visualization of keystone distortion and scale variation in aerial photogrammetry.',
  iconName: 'Camera',
  category: 'Photogrammetry',
  status: 'Available'
};