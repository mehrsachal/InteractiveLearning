import React, { useState } from 'react';
import {
    Calculator,
    Hash,
    ChevronRight,
    Equal,
    Layers,
    Network,
    CopyMinus,
    ListChecks,
    TreePine,
    ArrowRight,
    Info,
    FileDiff
} from 'lucide-react';

// --- Shared UI Components ---

const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
        {children}
    </div>
);

const RasterGrid = ({ title, data, noDataColor = "bg-slate-100", getColor, labels = [] }) => (
    <div className="flex flex-col items-center">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">{title}</h3>
        <div className="grid grid-cols-3 gap-1 bg-slate-300 p-1 rounded-md shadow-inner w-48 h-48">
            {data.map((row, rIdx) =>
                row.map((val, cIdx) => (
                    <div
                        key={`${rIdx}-${cIdx}`}
                        className={`flex items-center justify-center text-sm font-medium rounded-sm ${val === null || val === 'NoData' ? noDataColor + ' text-slate-400 text-xs' : getColor(val)}`}
                        title={labels[val] || val}
                    >
                        {val === null ? 'NoData' : val}
                    </div>
                ))
            )}
        </div>
    </div>
);

const ToolLayout = ({ title, description, scenario, children }) => (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{title}</h1>
            <p className="text-slate-600 mb-4">{description}</p>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                <div className="flex items-start">
                    <TreePine className="text-emerald-600 mr-3 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-semibold text-emerald-800">Waziristan Restoration Scenario:</h4>
                        <p className="text-emerald-700 text-sm">{scenario}</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-8">
            {children}
        </div>
    </div>
);

// --- Individual Tool Components ---

const IntroModule = () => (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="bg-emerald-100 p-6 rounded-full mb-4">
            <TreePine size={64} className="text-emerald-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-800">Waziristan Forest Restoration</h1>
        <p className="text-lg text-slate-600">
            Welcome, "Nature Architect". You will use the language of <strong>Map Algebra</strong> to decode the landscape.
        </p>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 w-full text-left">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                <Layers className="text-blue-500" /> The Mathematical Sandwich
            </h3>
            <p className="text-slate-600 text-sm mb-4">
                Map Algebra allows you to stack different geographic layers (Rasters) on top of each other and perform math on them cell-by-cell.
            </p>
            <div className="flex justify-between items-center px-8 relative">
                {/* Layer Stack Graphic */}
                <div className="relative w-32 h-32 transform -rotate-12 group hover:rotate-0 transition-transform duration-500">
                    <div className="absolute inset-0 bg-blue-200 opacity-80 rounded-md border-2 border-blue-400 transform translate-y-4 translate-x-4 flex items-center justify-center text-xs font-bold text-blue-800 shadow-lg">Elevation</div>
                    <div className="absolute inset-0 bg-orange-200 opacity-80 rounded-md border-2 border-orange-400 transform translate-y-0 translate-x-0 flex items-center justify-center text-xs font-bold text-orange-800 shadow-lg">Ownership</div>
                    <div className="absolute inset-0 bg-green-200 opacity-80 rounded-md border-2 border-green-400 transform -translate-y-4 -translate-x-4 flex items-center justify-center text-xs font-bold text-green-800 shadow-lg">Soil</div>
                </div>
                <ArrowRight size={32} className="text-slate-400" />
                <div className="w-32 h-32 bg-emerald-500 rounded-md shadow-xl flex items-center justify-center text-white font-bold p-2 text-center border-4 border-emerald-600">
                    Perfect Farm Sites
                </div>
            </div>
        </div>
    </div>
);

const RasterCalculatorModule = () => {
    const input = [
        [3200, 3150, 3050],
        [3000, 2950, 2800],
        [2900, 2750, 2600]
    ];

    const output = input.map(row => row.map(val => (val * 0.3048).toFixed(1)));

    return (
        <ToolLayout
            title="Raster Calculator"
            description="Allows you to perform complex mathematical calculations on raster datasets using Map Algebra. It acts like a scientific calculator where inputs are grids."
            scenario="Elevation is recorded in feet. Use the Times (*) operator to multiply the elevation by 0.3048 to convert it to meters."
        >
            <div className="flex items-center gap-6">
                <RasterGrid
                    title="Elevation (Feet)"
                    data={input}
                    getColor={(v) => `bg-slate-${Math.max(1, Math.floor(v / 400)) * 100} text-slate-800`}
                />
                <div className="flex flex-col items-center">
                    <div className="bg-slate-800 text-white font-mono px-4 py-2 rounded-lg mb-2 text-sm shadow-md">
                        "Elevation" * 0.3048
                    </div>
                    <ArrowRight className="text-emerald-500" size={32} />
                </div>
                <RasterGrid
                    title="Elevation (Meters)"
                    data={output}
                    getColor={(v) => `bg-blue-${Math.max(1, Math.floor(v / 100)) * 100} text-blue-900`}
                />
            </div>
        </ToolLayout>
    );
};

const IntModule = () => {
    const input = [
        [975.3, 960.1, 929.6],
        [914.4, 899.1, 853.4],
        [883.9, 838.2, 792.4]
    ];

    const output = input.map(row => row.map(val => Math.trunc(val)));

    return (
        <ToolLayout
            title="Int Tool"
            description="Converts a floating-point raster into an integer raster by truncating the decimal values. Essential for generating a Raster Attribute Table."
            scenario="To keep the data clean for processing, truncate the decimal meter elevations into whole integers."
        >
            <div className="flex items-center gap-6">
                <RasterGrid
                    title="Float_Raster_m"
                    data={input}
                    getColor={(v) => `bg-blue-200 text-blue-900`}
                />
                <div className="flex flex-col items-center">
                    <div className="bg-slate-800 text-white font-mono px-4 py-2 rounded-lg mb-2 text-sm shadow-md">
                        Int("Raster_m")
                    </div>
                    <ArrowRight className="text-emerald-500" size={32} />
                </div>
                <RasterGrid
                    title="Int_Raster_m"
                    data={output}
                    getColor={(v) => `bg-indigo-200 text-indigo-900`}
                />
            </div>
        </ToolLayout>
    );
};

const GreaterThanModule = () => {
    const [threshold, setThreshold] = useState(900);
    const input = [
        [975, 960, 929],
        [914, 899, 853],
        [883, 838, 792]
    ];

    const output = input.map(row => row.map(val => val > threshold ? 1 : 0));

    return (
        <ToolLayout
            title="Greater Than (>)"
            description="Performs a logical comparison. Outputs a binary result: cells meeting the condition get 1 (True), others get 0 (False)."
            scenario={`Pine and fir trees grow best at altitudes above ${threshold} meters. Isolate the good elevation terrain.`}
        >
            <div className="flex flex-col items-center gap-8 w-full">
                <div className="flex items-center gap-6">
                    <RasterGrid
                        title="Int_Raster_m"
                        data={input}
                        getColor={(v) => `bg-indigo-200 text-indigo-900`}
                    />
                    <div className="flex flex-col items-center w-48">
                        <div className="bg-slate-800 text-white font-mono px-4 py-2 rounded-lg mb-2 text-sm shadow-md whitespace-nowrap">
                            "Elevation" &gt; {threshold}
                        </div>
                        <input
                            type="range"
                            min="800" max="1000" step="50"
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                            className="w-full my-2 accent-emerald-500"
                        />
                        <span className="text-xs text-slate-500 font-semibold mb-2">Adjust Threshold: {threshold}m</span>
                        <ArrowRight className="text-emerald-500" size={32} />
                    </div>
                    <RasterGrid
                        title="GoodElev (Output)"
                        data={output}
                        getColor={(v) => v === 1 ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400'}
                    />
                </div>

                <div className="flex items-center gap-4 text-sm bg-white px-6 py-3 rounded-full shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-sm"></div> 1 (True)</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-200 rounded-sm"></div> 0 (False)</div>
                </div>
            </div>
        </ToolLayout>
    );
};

const EqualToModule = () => {
    // 1: Pak Forest, 2: KPK Govt, 3: Private
    const input = [
        [1, 1, 2],
        [1, 3, 3],
        [2, 3, 1]
    ];

    const labels = {
        1: 'Pak Forest',
        2: 'KPK Govt',
        3: 'Private'
    };

    const output = input.map(row => row.map(val => val === 1 ? 1 : 0));

    return (
        <ToolLayout
            title="Equal To (==)"
            description="Cell-by-cell comparison. Produces a boolean output where matching cells are 1 (True) and non-matching are 0 (False)."
            scenario="You must ensure the land is owned by the Pakistan Forest Service (Value = 1)."
        >
            <div className="flex flex-col items-center gap-8 w-full">
                <div className="flex items-center gap-6">
                    <RasterGrid
                        title="Ownership"
                        data={input}
                        labels={labels}
                        getColor={(v) => {
                            if (v === 1) return 'bg-emerald-400 text-white';
                            if (v === 2) return 'bg-lime-400 text-slate-800';
                            return 'bg-orange-400 text-white';
                        }}
                    />
                    <div className="flex flex-col items-center">
                        <div className="bg-slate-800 text-white font-mono px-4 py-2 rounded-lg mb-2 text-sm shadow-md">
                            "Ownership" == 1
                        </div>
                        <ArrowRight className="text-emerald-500" size={32} />
                    </div>
                    <RasterGrid
                        title="GoodOwn (Output)"
                        data={output}
                        getColor={(v) => v === 1 ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400'}
                    />
                </div>
                <div className="flex gap-4 text-xs bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="font-bold text-slate-700">Legend:</div>
                    <div><span className="inline-block w-3 h-3 bg-emerald-400 mr-1 rounded-sm"></span>Pak Forest (1)</div>
                    <div><span className="inline-block w-3 h-3 bg-lime-400 mr-1 rounded-sm"></span>KPK Govt (2)</div>
                    <div><span className="inline-block w-3 h-3 bg-orange-400 mr-1 rounded-sm"></span>Private (3)</div>
                </div>
            </div>
        </ToolLayout>
    );
};

const BooleanAndModule = () => {
    const goodOwn = [
        [1, 1, 0],
        [1, 0, 0],
        [0, 0, 1]
    ];

    const goodElev = [
        [1, 1, 1],
        [1, 0, 0],
        [0, 0, 0]
    ];

    const output = goodOwn.map((row, r) => row.map((val, c) => (val === 1 && goodElev[r][c] === 1) ? 1 : 0));

    return (
        <ToolLayout
            title="Boolean AND (&)"
            description="Logical intersection. Output is 1 only if BOTH input rasters are non-zero. If either is 0, output is 0."
            scenario="Find areas where BOTH requirements (Elevation > 900 AND Ownership == Pak Forest) are met simultaneously to find Farm Sites."
        >
            <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex items-center gap-4">
                    <RasterGrid title="GoodOwn" data={goodOwn} getColor={(v) => v ? 'bg-red-500 text-white' : 'bg-slate-200 text-transparent'} />
                    <div className="font-bold text-2xl text-slate-400">&</div>
                    <RasterGrid title="GoodElev" data={goodElev} getColor={(v) => v ? 'bg-red-500 text-white' : 'bg-slate-200 text-transparent'} />
                    <ArrowRight className="text-emerald-500 ml-4" size={32} />
                    <div className="ml-4 p-2 border-4 border-emerald-400 rounded-lg shadow-lg">
                        <RasterGrid title="FarmSites" data={output} getColor={(v) => v ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-300'} />
                    </div>
                </div>
                <div className="text-sm bg-yellow-50 text-yellow-800 p-3 rounded border border-yellow-200 flex items-center gap-2">
                    <Info size={16} /> Note how only the top-left corner cells survived the intersection!
                </div>
            </div>
        </ToolLayout>
    );
};

const CombinatorialAndModule = () => {
    const soil = [
        [201, 204, 303],
        [201, 303, 402],
        [402, 404, 204]
    ];

    const farmSites = [
        [1, 1, 0],
        [1, 0, 0],
        [0, 0, 0]
    ];

    // Logic: generate unique code for combinations. 
    // Combinations present: (201,1)->1, (204,1)->2, (201,0)->0, (303,0)->0, etc. (Simplifying for visualization)
    const output = [
        [1, 2, 0],
        [1, 0, 0],
        [0, 0, 0]
    ];

    return (
        <ToolLayout
            title="Combinatorial AND (CAND)"
            description="Like Boolean AND, but it preserves unique combinations by assigning a unique integer to every distinct overlapping pair. It remembers what was on each map."
            scenario="Now that we have selected Farm Sites (0/1), combine them with the Soil types (201, 204, etc.) without losing the specific soil data."
        >
            <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex items-center gap-4">
                    <RasterGrid
                        title="Soil" data={soil}
                        getColor={(v) => {
                            if (v === 201) return 'bg-amber-300';
                            if (v === 204) return 'bg-orange-400';
                            if (v === 303) return 'bg-lime-400';
                            if (v === 402) return 'bg-blue-400';
                            return 'bg-purple-500';
                        }}
                    />
                    <div className="font-bold border px-2 py-1 bg-slate-100 rounded text-slate-500">CAND</div>
                    <RasterGrid title="FarmSites" data={farmSites} getColor={(v) => v ? 'bg-red-500 text-white' : 'bg-slate-200 text-transparent'} />
                    <ArrowRight className="text-emerald-500 ml-4" size={32} />
                    <div className="ml-4">
                        <RasterGrid
                            title="Sites_with_Soil" data={output}
                            getColor={(v) => {
                                if (v === 1) return 'bg-green-500 text-white';
                                if (v === 2) return 'bg-teal-500 text-white';
                                return 'bg-slate-200 text-slate-400';
                            }}
                        />
                    </div>
                </div>

                {/* Attribute Table Simulator */}
                <div className="bg-white rounded border border-slate-200 shadow-sm w-full max-w-lg mt-4 overflow-hidden">
                    <div className="bg-slate-100 text-xs font-bold text-slate-600 px-4 py-2 border-b">Output Attribute Table</div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b">
                            <tr><th className="px-4 py-1">Value (ID)</th><th className="px-4 py-1">Soil</th><th className="px-4 py-1">FarmSites</th></tr>
                        </thead>
                        <tbody>
                            <tr className="border-b"><td className="px-4 py-1 font-mono text-slate-400">0</td><td className="px-4 py-1">Multiple</td><td className="px-4 py-1">0</td></tr>
                            <tr className="bg-green-50 border-b"><td className="px-4 py-1 font-mono text-green-700 font-bold">1</td><td className="px-4 py-1">201</td><td className="px-4 py-1 text-green-600">1</td></tr>
                            <tr className="bg-teal-50"><td className="px-4 py-1 font-mono text-teal-700 font-bold">2</td><td className="px-4 py-1">204</td><td className="px-4 py-1 text-teal-600">1</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </ToolLayout>
    );
};


const OverModule = () => {
    const farmSites = [
        [1, 1, null],
        [1, null, null],
        [null, null, null]
    ]; // Using null to represent 0 or NoData in top layer

    const landcover = [
        [5, 5, 5],
        [6, 6, 7],
        [7, 7, 7]
    ];

    const output = farmSites.map((row, r) => row.map((val, c) => val !== null ? val : landcover[r][c]));

    return (
        <ToolLayout
            title="Over Tool"
            description="Works like a physical rubber stamp. Layer 1 overwrites Layer 2, but where Layer 1 is 0 or NoData, Layer 2 'shows through'."
            scenario="Update the existing Landcover map with the new Farm Sites data (assigned value 1). Keep underlying landcover everywhere else."
        >
            <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <span className="absolute -top-3 -left-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow">Top (1)</span>
                        <RasterGrid title="FarmSites" data={farmSites} getColor={(v) => v ? 'bg-red-500 text-white' : 'bg-transparent'} />
                    </div>

                    <div className="font-bold border px-2 py-1 bg-slate-100 rounded text-slate-500">OVER</div>

                    <div className="relative">
                        <span className="absolute -top-3 -left-3 bg-slate-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow">Bottom (2)</span>
                        <RasterGrid title="Landcover" data={landcover} getColor={(v) => `bg-purple-${v}00 text-white`} />
                    </div>

                    <ArrowRight className="text-emerald-500 mx-4" size={32} />

                    <div className="p-2 border-2 border-dashed border-emerald-400 rounded-lg">
                        <RasterGrid
                            title="New_Landcover" data={output}
                            getColor={(v) => v === 1 ? 'bg-red-500 text-white font-bold' : `bg-purple-${v}00 text-white opacity-80`}
                        />
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
};

const DiffModule = () => {
    const newLandcover = [
        [1, 1, 5],
        [1, 6, 7],
        [7, 7, 7]
    ];

    const oldLandcover = [
        [5, 5, 5],
        [6, 6, 7],
        [7, 7, 7]
    ];

    // Diff Logic: If cell1 != cell2 output cell1, else output 0 (NoData)
    const output = newLandcover.map((row, r) => row.map((val, c) => val !== oldLandcover[r][c] ? val : 0));

    return (
        <ToolLayout
            title="Diff Tool"
            description="Change detection. Identifies differences. If Raster 1 != Raster 2, outputs Raster 1. If identical, outputs 0."
            scenario="Compare the New Landcover map with the Old Landcover map to isolate exactly where changes occurred."
        >
            <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex items-center gap-4">
                    <RasterGrid
                        title="New_Landcover (1)" data={newLandcover}
                        getColor={(v) => v === 1 ? 'bg-red-500 text-white font-bold' : `bg-purple-${v}00 text-white`}
                    />

                    <div className="font-bold border px-2 py-1 bg-slate-100 rounded text-slate-500">DIFF</div>

                    <RasterGrid title="Old_Landcover (2)" data={oldLandcover} getColor={(v) => `bg-purple-${v}00 text-white`} />

                    <ArrowRight className="text-emerald-500 mx-4" size={32} />

                    <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
                        <RasterGrid
                            title="Changed Areas" data={output}
                            getColor={(v) => v !== 0 ? 'bg-red-500 text-white font-bold animate-pulse' : `bg-slate-200 text-transparent`}
                        />
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
};


const InListModule = () => {
    const [selectedList, setSelectedList] = useState([201, 204]);

    const soil = [
        [201, 204, 303],
        [201, 303, 402],
        [402, 404, 204]
    ];

    const toggleSoil = (val) => {
        if (selectedList.includes(val)) setSelectedList(selectedList.filter(s => s !== val));
        else setSelectedList([...selectedList, val]);
    }

    const output = soil.map((row) => row.map((val) => selectedList.includes(val) ? 1 : null));

    const soilTypes = [
        { val: 201, name: 'Loam', color: 'bg-amber-300' },
        { val: 204, name: 'Loamy Sand', color: 'bg-orange-400' },
        { val: 303, name: 'Clay', color: 'bg-lime-400' },
        { val: 402, name: 'Silt', color: 'bg-blue-400' },
        { val: 404, name: 'Rock', color: 'bg-purple-500' }
    ];

    return (
        <ToolLayout
            title="InList Tool"
            description="Multiple 'Equal To' operations at once. Checks if a cell matches ANY value in a provided list. Outputs 1 (True) or NoData."
            scenario="Certain soils, like Loam (201) and Loamy Sand (204), are preferred. Identify areas with ONLY these soil types."
        >
            <div className="flex flex-col items-center gap-6 w-full">

                {/* Interactive List Selection */}
                <div className="flex gap-2 mb-4">
                    {soilTypes.map(s => (
                        <button
                            key={s.val}
                            onClick={() => toggleSoil(s.val)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${selectedList.includes(s.val) ? `border-slate-800 shadow-md ${s.color}` : `border-slate-200 bg-white text-slate-400 grayscale opacity-60`}`}
                        >
                            {s.name} ({s.val})
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <RasterGrid
                        title="Soil Raster" data={soil}
                        getColor={(v) => soilTypes.find(s => s.val === v)?.color || 'bg-slate-200'}
                    />

                    <div className="flex flex-col items-center">
                        <div className="bg-slate-800 text-white font-mono px-4 py-2 rounded-lg mb-2 text-sm shadow-md whitespace-nowrap">
                            InList("Soil", [{selectedList.join(', ')}])
                        </div>
                        <ArrowRight className="text-emerald-500 mx-4" size={32} />
                    </div>

                    <div className="p-2 border-2 border-emerald-400 rounded-lg">
                        <RasterGrid
                            title="GoodSoil (Output)" data={output}
                            getColor={(v) => v === 1 ? 'bg-red-500 text-white font-bold' : `bg-slate-100 text-slate-400`}
                        />
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
};


// --- Main App ---

export default function App() {
    const [activeTab, setActiveTab] = useState('intro');

    const tabs = [
        { id: 'intro', name: 'Introduction', icon: TreePine },
        { id: 'calc', name: 'Raster Calculator', icon: Calculator },
        { id: 'int', name: 'Int Tool', icon: Hash },
        { id: 'gt', name: 'Greater Than (>)', icon: ChevronRight },
        { id: 'eq', name: 'Equal To (==)', icon: Equal },
        { id: 'and', name: 'Boolean AND (&)', icon: Layers },
        { id: 'cand', name: 'Combinatorial AND', icon: Network },
        { id: 'over', name: 'Over Tool', icon: CopyMinus },
        { id: 'diff', name: 'Diff Tool', icon: FileDiff },
        { id: 'inlist', name: 'InList Tool', icon: ListChecks },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'intro': return <IntroModule />;
            case 'calc': return <RasterCalculatorModule />;
            case 'int': return <IntModule />;
            case 'gt': return <GreaterThanModule />;
            case 'eq': return <EqualToModule />;
            case 'and': return <BooleanAndModule />;
            case 'cand': return <CombinatorialAndModule />;
            case 'over': return <OverModule />;
            case 'diff': return <DiffModule />;
            case 'inlist': return <InListModule />;
            default: return <IntroModule />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
            {/* Sidebar */}
            <div className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500 p-2 rounded-lg shadow-sm">
                            <Layers className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-800">Map Algebra</h1>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Module 2 Companion</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-emerald-500' : 'text-slate-400'} />
                            {tab.name}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <div className="text-xs text-slate-400 text-center">Companion to Training Module 2</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 overflow-y-auto">
                <Card className="h-full p-8 relative flex flex-col bg-white">
                    {renderContent()}
                </Card>
            </div>
        </div>
    );
}

export const metadata = {
  id: 'map-algebra-companion',
  title: 'Map Algebra — Module 2 Companion',
  description: 'An interactive companion to Training Module 2. Explore Map Algebra tools including the Raster Calculator, Boolean operators, and more through a Waziristan Forest Restoration scenario.',
  iconName: 'Layers',
  category: 'GIS Analysis',
  status: 'Available'
};