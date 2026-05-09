import React, { useState } from 'react';
import { Info, Map as MapIcon, Grid, TrendingUp } from 'lucide-react';

export default function App() {
    const [activeTab, setActiveTab] = useState('both');

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900 mb-2">
                        <MapIcon className="text-blue-600" size={32} />
                        Isoline vs. Isopleth Visualizer
                    </h1>
                    <p className="text-slate-600 leading-relaxed">
                        While both lines connect points of equal value, the difference lies in the <strong>underlying data</strong>.
                        Isolines are drawn from specific, measured data points (like temperature stations). Isopleths are drawn from derived data averaged over areas (like population density per county), using the center of those areas as anchor points.
                    </p>

                    {/* Mobile Tab Controls (Visible only on small screens) */}
                    <div className="mt-6 flex bg-slate-100 p-1 rounded-lg md:hidden">
                        <button
                            onClick={() => setActiveTab('isoline')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'isoline' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}
                        >
                            Isoline
                        </button>
                        <button
                            onClick={() => setActiveTab('isopleth')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'isopleth' ? 'bg-white shadow text-orange-700' : 'text-slate-500'}`}
                        >
                            Isopleth
                        </button>
                    </div>
                </div>

                {/* Visualizer Grid */}
                <div className="grid md:grid-cols-2 gap-6">

                    {/* ISOLINE CARD */}
                    <div className={`bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col ${activeTab === 'isopleth' && 'hidden md:flex'}`}>
                        <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-center gap-2">
                            <TrendingUp className="text-blue-600" size={24} />
                            <h2 className="text-lg font-bold text-blue-900">Isoline (Continuous Data)</h2>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <div className="relative w-full aspect-square max-w-[350px] mx-auto bg-blue-50/50 rounded-xl mb-6">
                                <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-sm">
                                    <defs>
                                        <radialGradient id="fieldGradient" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor="#dbeafe" />
                                            <stop offset="100%" stopColor="#f0fdf4" />
                                        </radialGradient>
                                    </defs>

                                    {/* Background Surface */}
                                    <rect width="300" height="300" fill="url(#fieldGradient)" rx="16" />

                                    {/* Contour Lines (Isolines) */}
                                    <path d="M 30,150 C 30,50 270,60 270,150 C 270,240 30,250 30,150 Z" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" className="opacity-70" />
                                    <path d="M 70,140 C 70,80 220,90 220,150 C 220,210 70,210 70,140 Z" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                                    <path d="M 110,135 C 110,105 170,110 170,145 C 170,175 110,175 110,135 Z" fill="none" stroke="#1d4ed8" strokeWidth="3" />

                                    {/* Measurement Points */}
                                    <g className="fill-blue-900 text-xs font-bold font-mono">
                                        <circle cx="110" cy="135" r="4" />
                                        <text x="116" y="131">30°</text>

                                        <circle cx="170" cy="145" r="4" />
                                        <text x="176" y="141">30°</text>

                                        <circle cx="70" cy="140" r="4" />
                                        <text x="76" y="136">20°</text>

                                        <circle cx="220" cy="150" r="4" />
                                        <text x="226" y="146">20°</text>

                                        <circle cx="30" cy="150" r="4" />
                                        <text x="36" y="146">10°</text>

                                        {/* Non-line points to show continuity */}
                                        <circle cx="140" cy="140" r="3" fill="#60a5fa" />
                                        <text x="145" y="138" fill="#60a5fa" fontSize="10">34°</text>

                                        <circle cx="250" cy="80" r="3" fill="#60a5fa" />
                                        <text x="255" y="78" fill="#60a5fa" fontSize="10">14°</text>
                                    </g>
                                </svg>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-3 mt-auto">
                                <p><strong>Example:</strong> A Temperature Map (Isotherm)</p>
                                <ul className="list-disc pl-4 text-slate-600 space-y-1">
                                    <li>Data exists continuously everywhere on the surface.</li>
                                    <li>Blue dots represent exact weather station readings.</li>
                                    <li>Lines connect identical, measured point values.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* ISOPLETH CARD */}
                    <div className={`bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col ${activeTab === 'isoline' && 'hidden md:flex'}`}>
                        <div className="bg-orange-50 border-b border-orange-100 p-4 flex items-center gap-2">
                            <Grid className="text-orange-600" size={24} />
                            <h2 className="text-lg font-bold text-orange-900">Isopleth (Areal/Derived Data)</h2>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <div className="relative w-full aspect-square max-w-[350px] mx-auto bg-orange-50/50 rounded-xl mb-6">
                                <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-sm">

                                    {/* Polygons (e.g. Counties) */}
                                    <rect x="20" y="20" width="125" height="125" fill="#fed7aa" stroke="#ffffff" strokeWidth="3" rx="4" />
                                    <rect x="155" y="20" width="125" height="125" fill="#fb923c" stroke="#ffffff" strokeWidth="3" rx="4" />
                                    <rect x="20" y="155" width="125" height="125" fill="#fdba74" stroke="#ffffff" strokeWidth="3" rx="4" />
                                    <rect x="155" y="155" width="125" height="125" fill="#c2410c" stroke="#ffffff" strokeWidth="3" rx="4" />

                                    {/* Centroids */}
                                    <g className="fill-orange-950 text-xs font-bold font-mono">
                                        <circle cx="82.5" cy="82.5" r="4" />
                                        <text x="90" y="78">10</text>

                                        <circle cx="217.5" cy="82.5" r="4" />
                                        <text x="225" y="78">40</text>

                                        <circle cx="82.5" cy="217.5" r="4" />
                                        <text x="90" y="213">20</text>

                                        <circle cx="217.5" cy="217.5" r="4" />
                                        <text x="225" y="213">60</text>
                                    </g>

                                    {/* Interpolation Guidelines (Conceptual) */}
                                    <line x1="82.5" y1="82.5" x2="217.5" y2="82.5" stroke="#fdba74" strokeWidth="1" strokeDasharray="4 2" />
                                    <line x1="82.5" y1="217.5" x2="217.5" y2="217.5" stroke="#fdba74" strokeWidth="1" strokeDasharray="4 2" />
                                    <line x1="82.5" y1="82.5" x2="82.5" y2="217.5" stroke="#fdba74" strokeWidth="1" strokeDasharray="4 2" />
                                    <line x1="217.5" y1="82.5" x2="217.5" y2="217.5" stroke="#fdba74" strokeWidth="1" strokeDasharray="4 2" />

                                    {/* Isopleth Lines (Calculated between centroids) */}
                                    {/* 30 Isopleth line */}
                                    <path d="M 150,20 C 150,82.5 82.5,150 20,150" fill="none" stroke="#ea580c" strokeWidth="3" />
                                    <text x="50" y="130" fill="#ea580c" fontSize="12" fontWeight="bold">Iso 30</text>

                                    {/* 50 Isopleth line */}
                                    <path d="M 280,150 C 217.5,150 150,217.5 150,280" fill="none" stroke="#9a3412" strokeWidth="3" />
                                    <text x="180" y="260" fill="#9a3412" fontSize="12" fontWeight="bold">Iso 50</text>

                                </svg>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-3 mt-auto">
                                <p><strong>Example:</strong> Population Density</p>
                                <ul className="list-disc pl-4 text-slate-600 space-y-1">
                                    <li>Data is an average for a whole polygon (county).</li>
                                    <li>Values are assigned to the geographic <strong>centroid</strong> (dots).</li>
                                    <li>Lines are drawn <em>between</em> centroids, completely ignoring the hard county borders.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export const metadata = {
  id: 'isoline-isopleth',
  title: 'Isoline vs Isopleth',
  description: 'Visualizer demonstrating the difference between mapping continuous phenomena and polygon-based averages.',
  iconName: 'Map',
  category: 'Cartography',
  status: 'Available'
};