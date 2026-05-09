import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { ChevronRight, Code, Search, ExternalLink, User, BookOpen, Download, FileText, Archive } from 'lucide-react';

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
    category: metadata.category || 'General',
    path: '/' + (metadata.id || fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    Component: module.default,
    lastModified: module.__lastModified || 0,
  };
}).sort((a, b) => a.lastModified - b.lastModified); // Sort chronologically (oldest to newest)

// Training Modules Data
const trainingModulesData = [
  {
    id: 'agt-1',
    heading: 'AGT-1: Foundations',
    subModules: [
      { id: 'agt-1-pdf', title: 'Module Syllabus & Guide', type: 'pdf', size: '2.4 MB', icon: FileText, color: 'text-red-400' },
      { id: 'agt-1-zip', title: 'Photogrammetry Datasets', type: 'zip', size: '1.2 GB', icon: Archive, color: 'text-amber-400' }
    ]
  },
  {
    id: 'agt-2',
    heading: 'AGT-2: Advanced Techniques',
    subModules: [
      { id: 'agt-2-pdf', title: 'Advanced Methodology', type: 'pdf', size: '3.1 MB', icon: FileText, color: 'text-red-400' },
      { id: 'agt-2-zip', title: 'Point Cloud Extracts', type: 'zip', size: '4.5 GB', icon: Archive, color: 'text-amber-400' }
    ]
  },
  {
    id: 'agt-3',
    heading: 'AGT-3: Field Applications',
    subModules: [
      { id: 'agt-3-pdf', title: 'Field Operations Manual', type: 'pdf', size: '1.8 MB', icon: FileText, color: 'text-red-400' },
      { id: 'agt-3-zip', title: 'Case Study Assets', type: 'zip', size: '850 MB', icon: Archive, color: 'text-amber-400' }
    ]
  }
];

// Premium Landing Page Component
const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [githubData, setGithubData] = useState(null);

  useEffect(() => {
    fetch('https://api.github.com/users/mehrsachal')
      .then(res => res.json())
      .then(data => setGithubData(data))
      .catch(err => console.error("Failed to fetch Github data", err));
  }, []);

  const categories = ['All', ...new Set(visualisations.map(v => v.category))];

  const filteredVisualisations = visualisations.filter(viz => {
    const matchesSearch = viz.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          viz.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || viz.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 pb-20">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-16 flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* Profile & Mission Section */}
        <div className="mb-16 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 bg-slate-900/40 p-8 rounded-3xl border border-slate-800/60 backdrop-blur-sm shadow-xl">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2 mb-6">
              <User className="w-5 h-5 text-indigo-400" />
              About the Creator
            </h2>
            {githubData ? (
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <img 
                  src={githubData.avatar_url || "https://github.com/mehrsachal.png"} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/20"
                />
                <div className="flex flex-col items-center md:items-start gap-2">
                  <a href={githubData.html_url || "https://github.com/mehrsachal"} target="_blank" rel="noreferrer" className="text-2xl font-bold text-slate-100 hover:text-indigo-400 transition-colors flex items-center gap-2 group">
                    {githubData.name || githubData.login || "Mehr Sachal"}
                    <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  </a>
                  <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                    {githubData.bio || "Passionate about interactive learning and geospatial visualizations."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="animate-pulse flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="w-24 h-24 rounded-full bg-slate-800"></div>
                <div className="space-y-3 mt-2 md:mt-0">
                  <div className="w-40 h-6 bg-slate-800 rounded"></div>
                  <div className="w-48 h-4 bg-slate-800 rounded"></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l border-slate-800/60 pt-8 md:pt-0 md:pl-10 text-center md:text-left self-stretch flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 self-center md:self-start">
              Mission Statement
            </div>
            <p className="text-xl md:text-2xl font-medium text-slate-200 leading-relaxed">
              "To make learning <span className="text-indigo-400">fun</span> and more <span className="text-purple-400">accessible</span> using visual interactions."
            </p>
          </div>
        </div>

        {/* Header Section */}
        <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div className="max-w-2xl">

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Sachal's Interactive Library
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Explore complex photogrammetry and remote sensing concepts through interactive, physics-based simulations.
            </p>
          </div>
          <a href="https://github.com/mehrsachal/InteractiveLearning" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-all shadow-xl group self-center md:self-auto whitespace-nowrap">
            <Code className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
            <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">View Repository</span>
          </a>
        </header>

        {/* Search and Filter Section */}
        <div className="mb-12 space-y-6">
          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder="Search by name or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl py-4 pl-12 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all shadow-inner backdrop-blur-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedCategory === category 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500' 
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVisualisations.length === 0 && (
            <div className="col-span-full py-16 text-center bg-slate-900/30 rounded-3xl border border-slate-800/50 border-dashed">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No visualizations found</h3>
              <p className="text-slate-500">
                {visualisations.length === 0 
                  ? "Add some JSX files to the src/visualizations folder!" 
                  : "Try adjusting your search or category filters."}
              </p>
            </div>
          )}
          {filteredVisualisations.map((viz) => {
            const IconComponent = Icons[viz.iconName] || Icons.Box;
            
            return (
              <div key={viz.id} className="group relative flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 hover:border-slate-600 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                {/* Card Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-slate-800 rounded-2xl ring-1 ring-white/5 shadow-inner">
                    <IconComponent className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60">
                      {viz.lastModified ? new Date(viz.lastModified).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}
                    </span>
                    <span className="text-xs font-medium text-slate-500 px-2">
                      {viz.category}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                  {viz.title}
                </h2>
                <p className="text-slate-400 leading-relaxed mb-8 flex-grow">
                  {viz.description}
                </p>

                {/* Card Action */}
                <Link to={viz.path} className="inline-flex items-center gap-2 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group/link mt-auto">
                  <span>Launch Visualisation</span>
                  <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
        </div>

        {/* Sidebar Area: Training Modules */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0 space-y-6">
          <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/60 backdrop-blur-sm shadow-xl sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/60">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <BookOpen className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Training Modules</h2>
                <p className="text-xs text-slate-400 mt-1">Download resources and datasets</p>
              </div>
            </div>

            <div className="space-y-6">
              {trainingModulesData.map((module) => (
                <div key={module.id} className="group">
                  <h3 className="text-sm font-bold text-slate-300 mb-3 px-1 uppercase tracking-wider">
                    {module.heading}
                  </h3>
                  <div className="space-y-2">
                    {module.subModules.map((subMod) => {
                      const Icon = subMod.icon;
                      return (
                        <div 
                          key={subMod.id} 
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-indigo-500/30 hover:bg-slate-800/60 transition-all cursor-pointer group/item"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-slate-900 rounded-lg group-hover/item:shadow-inner shrink-0">
                              <Icon className={`w-4 h-4 ${subMod.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate pr-2">
                                {subMod.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400 uppercase tracking-widest">
                                  {subMod.type}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {subMod.size}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button 
                            className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors shrink-0"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/60">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Archive className="w-16 h-16" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1 relative z-10">Need full access?</h4>
                <p className="text-xs text-slate-400 mb-3 relative z-10 leading-relaxed">
                  Authentication is required to download classified field data and modules.
                </p>
                <button className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-lg shadow-indigo-500/20 relative z-10">
                  Sign In to Access
                </button>
              </div>
            </div>
          </div>
        </aside>

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

// Visualization Layout Component
const VisualizationLayout = ({ viz, children }) => {
  const IconComponent = Icons[viz.iconName] || Icons.Box;
  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-[100] shadow-md font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 rounded-lg">
                <IconComponent className="w-5 h-5 text-indigo-400" />
              </span>
              {viz.title}
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">{viz.description}</p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-xl transition-all text-sm font-semibold shrink-0 group">
            <Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Gallery
          </Link>
        </div>
      </header>
      {children}
    </>
  );
};

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
            element={
              Component ? (
                <VisualizationLayout viz={viz}>
                  <Component />
                </VisualizationLayout>
              ) : (
                <VisualizationLayout viz={viz}>
                  <MissingComponentError title={viz.title} />
                </VisualizationLayout>
              )
            } 
          />
        );
      })}
    </Routes>
  );
}

export default App;

