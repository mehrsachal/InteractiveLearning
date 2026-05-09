import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { MapPin, ChevronRight, Code } from 'lucide-react';

// Dynamically import all JSX files from the visualizations folder
const visualizationModules = import.meta.glob('./visualizations/*.jsx', { eager: true });

// Parse them into an array of visualisations
const visualisations = Object.entries(visualizationModules).map(([path, module]) => {
  // Try to get metadata exported by the file, or generate defaults based on filename
  const fileName = path.split('/').pop().replace('.jsx', '');
  const metadata = module.metadata || {};
  
  return {
    id: metadata.id || fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: metadata.title || fileName.replace(/([A-Z])/g, ' $1').trim(), // Add spaces before capital letters
    description: metadata.description || 'A new visualization module.',
    iconName: metadata.iconName || 'Layers',
    color: metadata.color || 'from-indigo-500 to-purple-600',
    status: metadata.status || 'Available',
    path: '/' + (metadata.id || fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    Component: module.default,
  };
});

// Premium Landing Page Component
const Home = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
        {/* Header Section */}
        <header className="mb-20 text-center md:text-left flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm font-medium text-slate-300">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>Interactive Learning Hub</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Geospatial Visualisation Gallery
            </h1>
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
              Explore complex photogrammetry and remote sensing concepts through interactive, physics-based simulations.
            </p>
          </div>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-all shadow-xl group self-center md:self-auto">
            <Code className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
            <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">View Repository</span>
          </a>
        </header>

        {/* Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visualisations.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No visualizations found in the src/visualizations folder. Add some JSX files there!
            </div>
          )}
          {visualisations.map((viz) => {
            const IconComponent = Icons[viz.iconName] || Icons.Box;
            
            return (
              <div key={viz.id} className="group relative flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-slate-600 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                {/* Card Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-slate-800 rounded-2xl ring-1 ring-white/5 shadow-inner">
                    <IconComponent className="w-6 h-6 text-indigo-500" />
                  </div>
                  {viz.status === 'Available' ? (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {viz.status}
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {viz.status}
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                  {viz.title}
                </h2>
                <p className="text-slate-400 leading-relaxed mb-8 flex-grow">
                  {viz.description}
                </p>

                {/* Card Action */}
                {viz.status === 'Available' ? (
                  <Link to={viz.path} className="inline-flex items-center gap-2 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group/link mt-auto">
                    <span>Launch Visualisation</span>
                    <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-2 font-semibold text-slate-600 cursor-not-allowed mt-auto">
                    <span>In Development</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Placeholder for rendering when a component export is missing
const MissingComponentError = ({ title }) => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
    <Icons.AlertTriangle className="w-16 h-16 text-rose-500 mb-6" />
    <h1 className="text-3xl font-bold mb-4">{title} Component Missing</h1>
    <p className="text-slate-400 mb-8 max-w-md text-center">This visualization file exists but does not provide a default export for its component.</p>
    <Link to="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-colors">
      Return to Gallery
    </Link>
  </div>
);

// Main App Component
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {visualisations.map((viz) => {
        const Component = viz.Component;
        return (
          <Route 
            key={viz.id} 
            path={viz.path} 
            element={Component ? <Component /> : <MissingComponentError title={viz.title} />} 
          />
        );
      })}
    </Routes>
  );
}

export default App;
