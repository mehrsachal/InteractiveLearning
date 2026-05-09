import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Play,
    RotateCcw,
    Settings2,
    Square,
    ChevronRight,
    Trash2,
    Info,
    Pause,
    FastForward,
    Box
} from 'lucide-react';

// --- Constants & Types ---
const GRID_ROWS = 20;
const GRID_COLS = 35;

const NODE_TYPES = {
    EMPTY: 'empty',
    WALL: 'wall',
    START: 'start',
    END: 'end',
    VISITED: 'visited',
    OPEN: 'open',
    PATH: 'path',
};

const ALGORITHMS = {
    DIJKSTRA: 'Dijkstra',
    ASTAR: 'A* (Manhattan)',
    ASTAR_EUCLIDEAN: 'A* (Euclidean)',
    BFS: 'Breadth First Search',
    DFS: 'Depth First Search'
};

// --- Helper Functions ---
const createNode = (row, col) => ({
    row,
    col,
    isStart: row === 10 && col === 5,
    isEnd: row === 10 && col === 30,
    distance: Infinity,
    totalCost: Infinity, // f = g + h
    heuristic: 0,
    isVisited: false,
    isWall: false,
    previousNode: null,
});

const getInitialGrid = () => {
    const grid = [];
    for (let row = 0; row < GRID_ROWS; row++) {
        const currentRow = [];
        for (let col = 0; col < GRID_COLS; col++) {
            currentRow.push(createNode(row, col));
        }
        grid.push(currentRow);
    }
    return grid;
};

const getHeuristic = (node, endNode, type) => {
    const dx = Math.abs(node.row - endNode.row);
    const dy = Math.abs(node.col - endNode.col);
    if (type === ALGORITHMS.ASTAR_EUCLIDEAN) {
        return Math.sqrt(dx * dx + dy * dy);
    }
    return dx + dy; // Manhattan
};

// --- Main Component ---
export default function App() {
    const [grid, setGrid] = useState(getInitialGrid);
    const [algorithm, setAlgorithm] = useState(ALGORITHMS.ASTAR);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState(15);
    const [mouseIsPressed, setMouseIsPressed] = useState(false);
    const [movingNode, setMovingNode] = useState(null); // 'start' | 'end' | 'wall'
    const [stats, setStats] = useState({ visited: 0, length: 0, time: 0 });

    const animationRef = useRef(null);
    const gridRef = useRef(grid);
    gridRef.current = grid;

    // Find start and end nodes
    const getStartEnd = () => {
        let start, end;
        for (const row of gridRef.current) {
            for (const node of row) {
                if (node.isStart) start = node;
                if (node.isEnd) end = node;
            }
        }
        return { start, end };
    };

    // --- Algorithms Logic ---
    const runDijkstra = () => {
        const { start, end } = getStartEnd();
        const visitedNodesInOrder = [];
        start.distance = 0;
        const unvisitedNodes = [];
        for (const row of gridRef.current) {
            for (const node of row) {
                node.distance = Infinity;
                node.previousNode = null;
                node.isVisited = false;
                unvisitedNodes.push(node);
            }
        }
        start.distance = 0;

        const unvisited = [...unvisitedNodes];

        while (unvisited.length) {
            unvisited.sort((a, b) => a.distance - b.distance);
            const closestNode = unvisited.shift();

            if (closestNode.isWall) continue;
            if (closestNode.distance === Infinity) break;

            closestNode.isVisited = true;
            visitedNodesInOrder.push(closestNode);
            if (closestNode === end) return visitedNodesInOrder;

            const neighbors = getNeighbors(closestNode, gridRef.current);
            for (const neighbor of neighbors) {
                const newDist = closestNode.distance + 1;
                if (newDist < neighbor.distance) {
                    neighbor.distance = newDist;
                    neighbor.previousNode = closestNode;
                }
            }
        }
        return visitedNodesInOrder;
    };

    const runAStar = (heuristicType) => {
        const { start, end } = getStartEnd();
        const visitedNodesInOrder = [];

        // Reset grid properties for fresh calculation
        for (const row of gridRef.current) {
            for (const node of row) {
                node.distance = Infinity; // g score
                node.totalCost = Infinity; // f score
                node.previousNode = null;
                node.isVisited = false;
            }
        }

        start.distance = 0;
        start.totalCost = getHeuristic(start, end, heuristicType);

        const openSet = [start];

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.totalCost - b.totalCost);
            const current = openSet.shift();

            if (current.isWall) continue;
            if (current.isVisited) continue;

            current.isVisited = true;
            visitedNodesInOrder.push(current);

            if (current === end) return visitedNodesInOrder;

            const neighbors = getNeighbors(current, gridRef.current);
            for (const neighbor of neighbors) {
                if (neighbor.isWall || neighbor.isVisited) continue;

                const tentativeGScore = current.distance + 1;
                if (tentativeGScore < neighbor.distance) {
                    neighbor.previousNode = current;
                    neighbor.distance = tentativeGScore;
                    neighbor.totalCost = neighbor.distance + getHeuristic(neighbor, end, heuristicType);
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        return visitedNodesInOrder;
    };

    const getNeighbors = (node, grid) => {
        const neighbors = [];
        const { col, row } = node;
        if (row > 0) neighbors.push(grid[row - 1][col]);
        if (row < GRID_ROWS - 1) neighbors.push(grid[row + 1][col]);
        if (col > 0) neighbors.push(grid[row][col - 1]);
        if (col < GRID_COLS - 1) neighbors.push(grid[row][col + 1]);
        return neighbors;
    };

    const getNodesInShortestPathOrder = (finishNode) => {
        const nodesInShortestPathOrder = [];
        let currentNode = finishNode;
        while (currentNode !== null) {
            nodesInShortestPathOrder.unshift(currentNode);
            currentNode = currentNode.previousNode;
        }
        return nodesInShortestPathOrder;
    };

    // --- Animation ---
    const animate = async () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setIsPaused(false);

        // Clear previous visual state
        clearVisuals();

        let visitedInOrder = [];
        if (algorithm === ALGORITHMS.DIJKSTRA) visitedInOrder = runDijkstra();
        else if (algorithm === ALGORITHMS.ASTAR || algorithm === ALGORITHMS.ASTAR_EUCLIDEAN) visitedInOrder = runAStar(algorithm);

        const { end } = getStartEnd();
        const path = getNodesInShortestPathOrder(end);

        // Animation Loop
        for (let i = 0; i <= visitedInOrder.length; i++) {
            if (i === visitedInOrder.length) {
                // Draw path
                for (let j = 0; j < path.length; j++) {
                    const node = path[j];
                    await new Promise(r => setTimeout(r, 20));
                    updateNodeUI(node.row, node.col, 'path');
                }
                setStats({ visited: visitedInOrder.length, length: path.length, time: visitedInOrder.length * (speed / 10) });
                setIsAnimating(false);
                return;
            }

            const node = visitedInOrder[i];
            if (!node.isStart && !node.isEnd) {
                updateNodeUI(node.row, node.col, 'visited');
            }
            await new Promise(r => setTimeout(r, speed));
        }
    };

    const updateNodeUI = (row, col, type) => {
        const el = document.getElementById(`node-${row}-${col}`);
        if (!el) return;

        if (type === 'visited') {
            el.classList.add('bg-cyan-400', 'scale-90', 'rounded-sm', 'animate-pulse');
            el.classList.remove('bg-white');
        } else if (type === 'path') {
            el.classList.add('bg-yellow-400', 'scale-105', 'z-10', 'shadow-md');
            el.classList.remove('bg-cyan-400');
        } else if (type === 'clear') {
            el.className = el.className.split(' ').filter(c => !['bg-cyan-400', 'bg-yellow-400', 'scale-90', 'scale-105', 'animate-pulse', 'z-10', 'shadow-md'].includes(c)).join(' ');
            el.classList.add('bg-white');
        }
    };

    // --- Interaction Handlers ---
    const handleMouseDown = (row, col) => {
        if (isAnimating) return;
        const node = grid[row][col];
        let type = 'wall';
        if (node.isStart) type = 'start';
        else if (node.isEnd) type = 'end';

        setMovingNode(type);
        setMouseIsPressed(true);
        if (type === 'wall') toggleWall(row, col);
    };

    const handleMouseEnter = (row, col) => {
        if (!mouseIsPressed || isAnimating) return;

        if (movingNode === 'start') {
            moveSpecialNode(row, col, 'isStart');
        } else if (movingNode === 'end') {
            moveSpecialNode(row, col, 'isEnd');
        } else {
            toggleWall(row, col);
        }
    };

    const handleMouseUp = () => {
        setMouseIsPressed(false);
        setMovingNode(null);
    };

    const toggleWall = (row, col) => {
        const newGrid = [...grid];
        const node = newGrid[row][col];
        if (node.isStart || node.isEnd) return;
        newGrid[row][col] = { ...node, isWall: !node.isWall };
        setGrid(newGrid);
    };

    const moveSpecialNode = (row, col, property) => {
        const newGrid = grid.map(r => r.map(n => ({ ...n, [property]: false })));
        newGrid[row][col][property] = true;
        newGrid[row][col].isWall = false;
        setGrid(newGrid);
    };

    const clearGrid = () => {
        if (isAnimating) return;
        setGrid(getInitialGrid());
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                updateNodeUI(r, c, 'clear');
            }
        }
        setStats({ visited: 0, length: 0, time: 0 });
    };

    const clearVisuals = () => {
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                updateNodeUI(r, c, 'clear');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
            {/* Header */}
            <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-indigo-600 flex items-center gap-2">
                        <Box className="w-8 h-8" />
                        PATHFINDER<span className="text-slate-400">LAB</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Interactive Algorithm Visualizer</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 px-3 border-r border-slate-200">
                        <Settings2 className="w-4 h-4 text-slate-400" />
                        <select
                            value={algorithm}
                            onChange={(e) => setAlgorithm(e.target.value)}
                            disabled={isAnimating}
                            className="bg-transparent font-bold text-sm focus:outline-none cursor-pointer"
                        >
                            {Object.values(ALGORITHMS).map(alg => (
                                <option key={alg} value={alg}>{alg}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Speed</span>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={101 - speed}
                            onChange={(e) => setSpeed(101 - parseInt(e.target.value))}
                            className="w-24 accent-indigo-500"
                        />
                    </div>

                    <button
                        onClick={animate}
                        disabled={isAnimating}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all ${isAnimating
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95'
                            }`}
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Visualise
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Algorithm Logic
                        </h3>
                        <div className="space-y-4">
                            {algorithm === ALGORITHMS.DIJKSTRA ? (
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    <strong className="text-indigo-600">Dijkstra</strong> is the father of pathfinding. It guarantees the shortest path by exploring all directions equally until the target is hit.
                                </p>
                            ) : (
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    <strong className="text-indigo-600">A* Search</strong> improves on Dijkstra by using a <em className="italic">heuristic</em> (estimated distance) to prioritize nodes that look like they're getting closer to the goal.
                                </p>
                            )}

                            <div className="pt-4 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Nodes Visited</span>
                                    <span className="font-mono font-bold text-indigo-600">{stats.visited}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Path Length</span>
                                    <span className="font-mono font-bold text-emerald-600">{stats.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-900 text-indigo-100 p-6 rounded-3xl shadow-xl">
                        <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4">Legend</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm">
                                <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                Start Node (Drag to move)
                            </li>
                            <li className="flex items-center gap-3 text-sm">
                                <div className="w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                Target Node (Drag to move)
                            </li>
                            <li className="flex items-center gap-3 text-sm">
                                <div className="w-4 h-4 bg-slate-700 rounded-sm" />
                                Wall (Click/Drag to draw)
                            </li>
                            <li className="flex items-center gap-3 text-sm">
                                <div className="w-4 h-4 bg-cyan-400 rounded-sm" />
                                Visited Node
                            </li>
                            <li className="flex items-center gap-3 text-sm">
                                <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
                                Shortest Path
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={clearGrid}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-slate-600 font-bold rounded-2xl border-2 border-slate-200 hover:bg-slate-50 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
                    >
                        <Trash2 className="w-5 h-5" />
                        Clear Everything
                    </button>
                </div>

                {/* Visualisation Grid */}
                <div className="lg:col-span-3">
                    <div
                        className="grid bg-slate-200 p-1 rounded-xl shadow-inner overflow-hidden mx-auto select-none"
                        style={{
                            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                            width: 'fit-content'
                        }}
                        onMouseLeave={handleMouseUp}
                    >
                        {grid.map((row, rowIdx) => (
                            row.map((node, nodeIdx) => {
                                const { isStart, isEnd, isWall } = node;
                                let nodeClass = "bg-white";
                                if (isStart) nodeClass = "bg-emerald-400 rounded-full scale-90 z-20 shadow-lg ring-4 ring-emerald-100";
                                else if (isEnd) nodeClass = "bg-rose-500 rounded-full scale-90 z-20 shadow-lg ring-4 ring-rose-100";
                                else if (isWall) nodeClass = "bg-slate-800 scale-100 z-10 shadow-sm";

                                return (
                                    <div
                                        key={`${rowIdx}-${nodeIdx}`}
                                        id={`node-${rowIdx}-${nodeIdx}`}
                                        onMouseDown={() => handleMouseDown(rowIdx, nodeIdx)}
                                        onMouseEnter={() => handleMouseEnter(rowIdx, nodeIdx)}
                                        onMouseUp={handleMouseUp}
                                        className={`w-6 h-6 md:w-7 md:h-7 border-[0.5px] border-slate-100 transition-all duration-300 cursor-crosshair ${nodeClass}`}
                                    >
                                        {(isStart || isEnd) && (
                                            <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-ping" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-indigo-500" />
                            Click grid to draw walls
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-indigo-500" />
                            Drag icons to move Start/End
                        </div>
                    </div>
                </div>
            </main>

            <footer className="max-w-6xl mx-auto mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
                Built for educational purposes. Dijkstra ensures optimality but expands in all directions. A* uses smart guesses to reach the goal faster.
            </footer>
        </div>
    );
}

export const metadata = {
  id: 'pathfinder-lab',
  title: 'Pathfinder Lab',
  description: 'Interactive sandbox visualizing and comparing Dijkstra\'s Algorithm and A* Search in real-time.',
  iconName: 'Route',
  category: 'Algorithms',
  status: 'Available'
};